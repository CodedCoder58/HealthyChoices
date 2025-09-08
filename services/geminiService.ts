import { GoogleGenAI, Modality, GenerateContentResponse } from '@google/genai';
import { Answer, HealthStats } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

function getLifestyleFactors(answers: Record<string, Answer>): { positive: string[], negative: string[], mood: string } {
  const positive: string[] = [];
  const negative: string[] = [];
  let moodScore = 0;

  // Diet
  if (answers.diet?.value >= 4) { positive.push("Maintains a very healthy and balanced diet."); moodScore += 1; }
  else if (answers.diet?.value <= 2) { negative.push("Has a poor diet, likely high in processed foods."); moodScore -= 1; }

  // Exercise
  if (answers.exercise?.value >= 5) { positive.push("Exercises frequently and consistently."); moodScore += 2; }
  else if (answers.exercise?.value <= 1) { negative.push("Leads a sedentary lifestyle with little to no exercise."); moodScore -= 1; }

  // Sleep
  if (answers.sleep?.value >= 4) { positive.push("Gets consistent, high-quality sleep."); moodScore += 1; }
  else if (answers.sleep?.value <= 2) { negative.push("Suffers from poor sleep quality or insomnia."); moodScore -= 2; }

  // Smoking
  if (answers.smoking?.value[0]?.value === 'yes') negative.push("Is a regular smoker.");
  if (answers.smoking?.value[0]?.value === 'occasionally') negative.push("Is an occasional smoker.");

  // Alcohol
  if (answers.alcohol?.value[0]?.value === 'heavily') negative.push("Consumes alcohol heavily.");
  else if (answers.alcohol?.value[0]?.value === 'moderately') negative.push("Consumes alcohol moderately.");

  // Hydration
  if (answers.hydration?.value <= 2) negative.push("Is often dehydrated.");

  // Stress
  if (answers.stress?.value >= 4) { negative.push("Experiences high levels of chronic stress."); moodScore -= 2; }
  else if (answers.stress?.value <= 2) { positive.push("Manages stress effectively."); moodScore += 1; }
  
  // Social
  if (answers.social?.value >= 4) { moodScore += 2; }
  else if (answers.social?.value <= 2) { moodScore -= 1; }

  // Sunscreen
  if (answers.sunscreen?.value[0]?.value === 'never') negative.push("Never wears sunscreen, leading to significant sun damage.");

  let mood = "a neutral expression";
  if (moodScore >= 3) mood = "a happy and content expression";
  else if (moodScore <= -2) mood = "a sad, tired, or stressed expression";
  
  return { positive, negative, mood };
}


export const calculateFutureHealthStats = (
    basicInfo: Record<string, Answer>,
    quizAnswers: Record<string, Answer>,
    yearsInFuture: number
): HealthStats => {
    const currentAge = Number(basicInfo.age?.value);
    const currentHeight = Number(basicInfo.height?.value); // inches
    const currentWeight = Number(basicInfo.weight?.value); // lbs

    let lifeExpectancy = 80; // Base
    // Major factors
    if (quizAnswers.smoking?.value[0]?.value === 'yes') lifeExpectancy -= 10;
    if (quizAnswers.smoking?.value[0]?.value === 'occasionally') lifeExpectancy -= 4;
    if (quizAnswers.alcohol?.value[0]?.value === 'heavily') lifeExpectancy -= 5;
    if ((quizAnswers.diet?.value || 3) <= 2) lifeExpectancy -= 3;
    if ((quizAnswers.exercise?.value || 0) <= 1) lifeExpectancy -= 4;
    if ((quizAnswers.exercise?.value || 0) >= 5) lifeExpectancy += 4;
    if ((quizAnswers.diet?.value || 3) >= 4) lifeExpectancy += 3;
    if ((quizAnswers.stress?.value || 3) >= 4) lifeExpectancy -= 2;

    // Weight projection
    const dietScore = (quizAnswers.diet?.value || 3) - 3; // -2 to 2
    const exerciseScore = (quizAnswers.exercise?.value || 3) - 3; // -3 to 7 -> normalize it
    const metabolismSlowdown = (yearsInFuture / 10) * 2; // ~2 lbs gain per decade from slowing metabolism
    const weightChangePerYear = (dietScore * -1) + (exerciseScore * -0.5);
    let projectedWeight = currentWeight + (weightChangePerYear * yearsInFuture) + metabolismSlowdown;
    projectedWeight = Math.round(Math.max(80, projectedWeight)); // Clamp at a minimum realistic weight

    // Height projection
    let projectedHeightInches = currentHeight;
    if (currentAge + yearsInFuture > 40) {
        projectedHeightInches -= Math.floor((currentAge + yearsInFuture - 40) / 10) * 0.5; // Lose 0.5 inch per decade after 40
    }
    const feet = Math.floor(projectedHeightInches / 12);
    const inches = Math.round(projectedHeightInches % 12);
    const projectedHeight = `${feet}' ${inches}"`;

    // BMI
    const bmi = Math.round((projectedWeight / (projectedHeightInches * projectedHeightInches)) * 703 * 10) / 10;
    
    // Calorie Intake
    const bmr = 10 * (projectedWeight / 2.2) + 6.25 * (projectedHeightInches * 2.54) - 5 * (currentAge + yearsInFuture) + 5;
    const activityLevel = 1.2 + ((quizAnswers.exercise?.value || 0) * 0.05);
    const calorieIntake = Math.round(Math.max(1200, bmr * activityLevel));

    return { projectedWeight, projectedHeight, bmi, calorieIntake, lifeExpectancy: Math.round(lifeExpectancy) };
};

export const generateSingleFutureImage = async (
  base64Image: string,
  mimeType: string,
  basicInfo: Record<string, Answer>,
  quizAnswers: Record<string, Answer>,
  years: number,
  healthStats: HealthStats,
  maxRetries: number = 3,
): Promise<string> => {
    const currentAge = Number(basicInfo.age?.value);
    
    if (currentAge + years > healthStats.lifeExpectancy) {
        return 'gravestone';
    }

    const { positive, negative } = getLifestyleFactors(quizAnswers);
    
    const prompt = `
      **Objective:** Generate a hyper-realistic, full-body photograph of the person in the provided image, but ${years} years in the future (at age ${currentAge + years}). The depiction must be a direct and accurate reflection of the provided lifestyle data.

      **Subject's Profile:**
      - Current Age: ${currentAge}
      - Future Age: ${currentAge + years}
      - Projected Weight: Approximately ${healthStats.projectedWeight} lbs.

      **Lifestyle Analysis & Visual Directives:**

      **Positive Factors (leading to healthier aging):**
      ${positive.length > 0 ? positive.map(p => `- ${p}`).join('\n') : "- None specified."}

      **Negative Factors (leading to accelerated aging):**
      ${negative.length > 0 ? negative.map(n => `- ${n}`).join('\n') : "- None specified."}

      **Visual Translation Guide (Strictly Adhere):**
      - **Body Shape:** The subject's body composition must reflect a weight of ~${healthStats.projectedWeight} lbs. If negative factors like poor diet or a sedentary lifestyle are present, depict a higher body fat percentage and less muscle tone. If positive factors like regular exercise are present, depict a healthier, toned physique appropriate for their age.
      - **Skin:** If smoking, high alcohol intake, or poor sun protection are noted, depict corresponding sallow skin, premature wrinkles, and sunspots. If hydration and a good diet are noted, show healthier, more vibrant skin for their age.
      - **Face:** If sleep is poor, add visible dark circles and tired eyes. If stress is high, show it in facial tension and expression lines.
      - **Posture:** A sedentary lifestyle should be reflected in poorer, more slumped posture.

      **Final Instructions:** The background must be a neutral gray studio setting. The final image must be a full-body shot. Do not create any violent, graphic, or disturbing content. The result should be a plausible, neutral, and data-driven prediction.
    `;


    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview', // This is the "Nano Banana" model
                contents: {
                    parts: [
                        { inlineData: { data: base64Image, mimeType: mimeType } },
                        { text: prompt },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });
            
            const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            if (imagePart && imagePart.inlineData) {
                return imagePart.inlineData.data; // Success
            } else {
                 const textPart = response.candidates?.[0]?.content?.parts?.find(part => part.text);
                 console.error("Gemini response did not include an image. Text response:", textPart?.text);
                 if (attempt === maxRetries) {
                   return 'error';
                 }
            }
        } catch (error) {
            console.error(`Error generating image for +${years} years (Attempt ${attempt}/${maxRetries}):`, error);
            if (attempt === maxRetries) {
                return 'error'; // Failed after all retries
            }
            // Wait before retrying
            await new Promise(res => setTimeout(res, 1000 * attempt));
        }
    }

    return 'error'; // Should not be reached
};

export const generateCustomFutureImage = async (
  base64Image: string,
  mimeType: string,
  basicInfo: Record<string, Answer>,
  quizAnswers: Record<string, Answer>,
  years: number,
  age: number,
  healthStats: HealthStats,
  customPrompt: string,
  maxRetries: number = 3,
): Promise<string> => {
    
    if (age > healthStats.lifeExpectancy) {
        return 'gravestone';
    }

    const { positive, negative, mood } = getLifestyleFactors(quizAnswers);
    
    const prompt = `
      **Objective:** Generate a hyper-realistic, full-body photograph of the person in the provided image, but at age ${age}. The depiction must be a direct and accurate reflection of the provided lifestyle data, and show them performing the requested action.

      **Action:** The person should be depicted **${customPrompt}**.

      **Subject's Profile:**
      - Current Age: ${basicInfo.age?.value}
      - Future Age: ${age}
      - Projected Weight: Approximately ${healthStats.projectedWeight} lbs.
      - General Mood/Expression: ${mood}

      **Lifestyle Analysis & Visual Directives:**

      **Positive Factors (leading to healthier aging):**
      ${positive.length > 0 ? positive.map(p => `- ${p}`).join('\n') : "- None specified."}

      **Negative Factors (leading to accelerated aging):**
      ${negative.length > 0 ? negative.map(n => `- ${n}`).join('\n') : "- None specified."}

      **Visual Translation Guide (Strictly Adhere):**
      - **Body Shape:** The subject's body composition must reflect a weight of ~${healthStats.projectedWeight} lbs and be appropriate for someone performing the action "${customPrompt}". If negative factors like poor diet or a sedentary lifestyle are present, depict a higher body fat percentage and less muscle tone. If positive factors like regular exercise are present, depict a healthier, toned physique appropriate for their age.
      - **Skin:** If smoking, high alcohol intake, or poor sun protection are noted, depict corresponding sallow skin, premature wrinkles, and sunspots. If hydration and a good diet are noted, show healthier, more vibrant skin for their age.
      - **Face:** The expression should reflect the general mood (${mood}). If sleep is poor, add visible dark circles and tired eyes. If stress is high, show it in facial tension and expression lines.
      - **Posture:** A sedentary lifestyle should be reflected in poorer, more slumped posture, unless overridden by the requested action.

      **Final Instructions:** The background should be a setting that makes sense for the action "${customPrompt}". The final image must be a full-body shot. Do not create any violent, graphic, or disturbing content. The result should be a plausible, neutral, and data-driven prediction.
    `;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        { inlineData: { data: base64Image, mimeType: mimeType } },
                        { text: prompt },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });
            
            const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            if (imagePart && imagePart.inlineData) {
                return imagePart.inlineData.data; // Success
            } else {
                 const textPart = response.candidates?.[0]?.content?.parts?.find(part => part.text);
                 console.error("Gemini response did not include an image. Text response:", textPart?.text);
                 if (attempt === maxRetries) {
                   return 'error';
                 }
            }
        } catch (error) {
            console.error(`Error generating custom image for age ${age} (Attempt ${attempt}/${maxRetries}):`, error);
            if (attempt === maxRetries) {
                return 'error'; // Failed after all retries
            }
            await new Promise(res => setTimeout(res, 1000 * attempt));
        }
    }

    return 'error';
};