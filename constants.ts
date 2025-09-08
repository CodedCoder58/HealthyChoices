import { Question, QuestionType } from './types';

export const playSound = (soundId: 'click' | 'navigate' | 'success' | 'warning') => {
  try {
    const audio = document.getElementById(`audio-${soundId}`) as HTMLAudioElement;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => {
        // This can happen if the user hasn't interacted with the page yet.
        // It's safe to ignore this error.
      });
    }
  } catch (error) {
    console.error(`Sound playback failed for ${soundId}:`, error);
  }
};

export const ageIntervals = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70];

export const BASIC_INFO_QUESTIONS: Question[] = [
  {
    id: 'age',
    text: "What is your current age?",
    type: QuestionType.Number,
    placeholder: "e.g., 30",
    min: 13,
    max: 100,
    validationMessage: "Please enter an age between 13 and 100."
  },
  {
    id: 'height',
    text: "What is your height in inches?",
    type: QuestionType.Number,
    placeholder: "e.g., 68",
    min: 24,
    max: 96,
    validationMessage: "Please enter a height between 24 and 96 inches."
  },
  {
    id: 'weight',
    text: "What is your weight in pounds (lbs)?",
    type: QuestionType.Number,
    placeholder: "e.g., 150",
    min: 50,
    max: 700,
    validationMessage: "Please enter a weight between 50 and 700 lbs."
  }
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'diet',
    text: 'How would you rate the typical healthiness of your diet?',
    type: QuestionType.Stars,
  },
  {
    id: 'exercise',
    text: 'On average, how many hours per week do you engage in moderate to intense exercise?',
    type: QuestionType.Slider,
    min: 0,
    max: 10,
    step: 1,
    labels: ['0 hours', '5 hours', '10+ hours'],
  },
  {
    id: 'sleep',
    text: 'How would you rate your average sleep quality and duration?',
    type: QuestionType.Stars,
  },
  {
    id: 'outdoor',
    text: 'How often do you engage in outdoor activities (e.g. walking, hiking, sports)?',
    type: QuestionType.Checkboxes,
    options: [
      { label: 'Daily', value: 'daily', score: 5 },
      { label: 'A few times a week', value: 'weekly', score: 3 },
      { label: 'Rarely', value: 'rarely', score: 1 },
      { label: 'Never', value: 'never', score: 0 },
    ],
  },
  {
    id: 'stress',
    text: 'How would you describe your typical stress levels?',
    type: QuestionType.Slider,
    min: 1,
    max: 5,
    step: 1,
    labels: ['Very Low', 'Moderate', 'Very High'],
  },
  {
    id: 'hydration',
    text: 'How well do you stay hydrated throughout the day?',
    type: QuestionType.Stars,
  },
  {
    id: 'smoking',
    text: 'Do you smoke tobacco products?',
    type: QuestionType.Checkboxes,
    options: [
        { label: 'Never', value: 'no', score: 5 },
        { label: 'Occasionally', value: 'occasionally', score: 1 },
        { label: 'Regularly', value: 'yes', score: 0 },
    ]
  },
  {
    id: 'alcohol',
    text: 'How often do you consume alcohol?',
    type: QuestionType.Checkboxes,
    options: [
        { label: 'Never', value: 'no', score: 5 },
        { label: '1-2 drinks/week', value: 'rarely', score: 3 },
        { label: '3-5 drinks/week', value: 'moderately', score: 2 },
        { label: '5+ drinks/week', value: 'heavily', score: 0 },
    ]
  },
  {
    id: 'social',
    text: 'How strong is your social connection with friends and family?',
    type: QuestionType.Stars,
  },
  {
    id: 'summary',
    text: 'In a few sentences, describe your general outlook on life and your future.',
    type: QuestionType.Text,
    isOptional: true,
  },
];

export const ADDITIONAL_QUESTIONS: Question[] = [
  {
    id: 'sunscreen',
    text: 'How consistently do you use sunscreen on exposed skin?',
    type: QuestionType.Checkboxes,
    options: [
        { label: 'Always', value: 'always', score: 5 },
        { label: 'Sometimes', value: 'sometimes', score: 2 },
        { label: 'Never', value: 'never', score: 0 },
    ]
  },
  {
    id: 'processed_food',
    text: 'How much of your diet consists of processed foods?',
    type: QuestionType.Slider,
    min: 1,
    max: 5,
    step: 1,
    labels: ['Very Little', 'Moderate', 'A Lot'],
  },
  {
    id: 'mental_health',
    text: 'How do you prioritize your mental health?',
    type: QuestionType.Stars,
  },
  {
    id: 'checkups',
    text: 'How regularly do you attend preventative health checkups?',
    type: QuestionType.Checkboxes,
    options: [
      { label: 'Yearly', value: 'yearly', score: 5 },
      { label: 'Every few years', value: 'sometimes', score: 3 },
      { label: 'Only when sick', value: 'rarely', score: 1 },
      { label: 'Never', value: 'never', score: 0 },
    ],
  },
  {
    id: 'hobbies',
    text: 'Do you actively engage in hobbies that you enjoy?',
    type: QuestionType.Stars,
  },
  {
    id: 'caffeine',
    text: 'How many caffeinated beverages (coffee, tea, soda) do you consume daily?',
    type: QuestionType.Slider,
    min: 0,
    max: 10,
    step: 1,
    labels: ['0', '5', '10+'],
  },
  {
    id: 'screen_time',
    text: 'How many hours a day do you spend in front of screens (work and leisure)?',
    type: QuestionType.Slider,
    min: 0,
    max: 16,
    step: 1,
    labels: ['0-2', '8', '16+'],
  },
  {
    id: 'relationships',
    text: 'How would you rate the quality of your close relationships?',
    type: QuestionType.Stars,
  },
  {
    id: 'mindfulness',
    text: 'Do you practice mindfulness or meditation?',
    type: QuestionType.Checkboxes,
    options: [
      { label: 'Regularly', value: 'regularly', score: 5 },
      { label: 'Occasionally', value: 'occasionally', score: 3 },
      { label: 'Never', value: 'never', score: 1 },
    ],
  },
  {
    id: 'learning',
    text: 'Do you regularly engage in activities that challenge your mind (e.g., learning, puzzles)?',
    type: QuestionType.Stars,
  }
];