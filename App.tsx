import React, { useState, useCallback, useMemo } from 'react';
import { GameState, Answer, HealthStats } from './types';
import PhotoCapture from './components/PhotoCapture';
import Quiz from './components/Quiz';
import Timeline from './components/Timeline';
import Header from './components/Header';
import { generateSingleFutureImage, calculateFutureHealthStats, generateCustomFutureImage } from './services/geminiService';
import { ageIntervals, BASIC_INFO_QUESTIONS, INITIAL_QUESTIONS, playSound } from './constants';

const apiKey = process.env.API_KEY;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Start);
  const [userImage, setUserImage] = useState<{ data: string; type: string } | null>(null);
  const [basicInfoAnswers, setBasicInfoAnswers] = useState<Record<string, Answer>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, Answer>>({});
  const [lifeExpectancy, setLifeExpectancy] = useState<number>(80);
  
  const [generatedImages, setGeneratedImages] = useState<(string | 'gravestone' | 'error' | 'generating' | null)[]>(
    Array(ageIntervals.length).fill(null)
  );
  const [healthStats, setHealthStats] = useState<(HealthStats | null)[]>(
    Array(ageIntervals.length).fill(null)
  );
  
  const [error, setError] = useState<string | null>(null);

  if (!apiKey) {
    return (
      <main className="relative min-h-screen w-full flex flex-col items-center justify-center font-sans text-white overflow-hidden bg-gray-900">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 opacity-80"></div>
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-teal-500 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-[30%] right-[15%] w-72 h-72 bg-purple-500 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 w-full min-h-screen flex items-center justify-center p-4">
            <div className="w-full h-[95vh] max-h-[900px] max-w-7xl bg-black/30 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl flex flex-col items-center justify-start">
                 <Header text="Configuration Error" />
                 <div className="w-full flex-grow flex items-center justify-center overflow-hidden">
                    <div className="text-center text-red-400 p-4 bg-red-900/50 rounded-lg max-w-md">
                        <p className="font-bold text-lg mb-2">API Key Not Found</p>
                        <p>This application requires a Google AI API key to function. Please ensure the <code>API_KEY</code> environment variable is set correctly in your project setup.</p>
                        <p className="text-xs text-gray-400 mt-4">The application will not be able to connect to the AI service until this is resolved.</p>
                      </div>
                 </div>
            </div>
        </div>
        <style>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}</style>
      </main>
    );
  }

  const handlePhotoTaken = useCallback((imageData: { data: string; type: string }) => {
    setUserImage(imageData);
    setGameState(GameState.BasicInfo);
  }, []);
  
  const handleBasicInfoSubmit = useCallback((answers: Record<string, Answer>) => {
    setBasicInfoAnswers(answers);
    setGameState(GameState.Quiz);
  }, []);

  const handleQuizSubmit = useCallback((answers: Record<string, Answer>) => {
    if (!userImage) {
      setError("User image is missing. Please start over.");
      setGameState(GameState.Start);
      return;
    }
    setQuizAnswers(answers);
    const baseHealthStats = calculateFutureHealthStats(basicInfoAnswers, answers, 0);
    setLifeExpectancy(baseHealthStats.lifeExpectancy);
    setGameState(GameState.Results);
  }, [userImage, basicInfoAnswers]);

  const handleGenerateDataForIndex = useCallback(async (index: number) => {
    if (!userImage || Object.keys(quizAnswers).length === 0 || generatedImages[index] !== null) {
        return;
    }

    setGeneratedImages(prev => {
        const next = [...prev];
        next[index] = 'generating';
        return next;
    });

    try {
        const years = ageIntervals[index];
        const calculatedStats = calculateFutureHealthStats(basicInfoAnswers, quizAnswers, years);
        setHealthStats(prev => {
            const next = [...prev];
            next[index] = calculatedStats;
            return next;
        });

        const result = await generateSingleFutureImage(userImage.data, userImage.type, basicInfoAnswers, quizAnswers, years, calculatedStats);
        
        if (result === 'error' || result === 'gravestone') {
            playSound('warning');
        } else {
            playSound('success');
        }
        
        setGeneratedImages(prev => {
            const next = [...prev];
            next[index] = result;
            return next;
        });
    } catch (err) {
        console.error(err);
        playSound('warning');
        setGeneratedImages(prev => {
            const next = [...prev];
            next[index] = 'error';
            return next;
        });
    }
  }, [userImage, basicInfoAnswers, quizAnswers, generatedImages]);

  const handleGenerateCustomPhotoForIndex = useCallback(async (index: number, prompt: string, age: number) => {
      if (!userImage || Object.keys(quizAnswers).length === 0) {
        return;
      }
      
      setGeneratedImages(prev => {
          const next = [...prev];
          next[index] = 'generating';
          return next;
      });

      try {
        const years = age - Number(basicInfoAnswers.age.value);
        const calculatedStats = calculateFutureHealthStats(basicInfoAnswers, quizAnswers, years);
        
        const result = await generateCustomFutureImage(userImage.data, userImage.type, basicInfoAnswers, quizAnswers, years, age, calculatedStats, prompt);
        
        if (result === 'error' || result === 'gravestone') {
            playSound('warning');
        } else {
            playSound('success');
        }

        setGeneratedImages(prev => {
            const next = [...prev];
            next[index] = result;
            return next;
        });

      } catch (err) {
        console.error(err);
        playSound('warning');
        setGeneratedImages(prev => {
            const next = [...prev];
            next[index] = 'error';
            return next;
        });
      }

  }, [userImage, basicInfoAnswers, quizAnswers]);
  
  const handleSliderChange = useCallback((index: number) => {
    // Pre-calculate health stats for the new index if they don't exist
    if (healthStats[index] === null && Object.keys(basicInfoAnswers).length > 0) {
        const years = ageIntervals[index];
        const calculatedStats = calculateFutureHealthStats(basicInfoAnswers, quizAnswers, years);
        setHealthStats(prev => {
            const next = [...prev];
            next[index] = calculatedStats;
            return next;
        });
    }
  }, [healthStats, basicInfoAnswers, quizAnswers]);
  
  const handleBackToStart = useCallback(() => {
    setGameState(GameState.Start);
  }, []);

  const handleBackToBasicInfo = useCallback(() => {
    setGameState(GameState.BasicInfo);
  }, []);

  const handleRestart = () => {
    setGameState(GameState.Start);
    setUserImage(null);
    setBasicInfoAnswers({});
    setQuizAnswers({});
    setGeneratedImages(Array(ageIntervals.length).fill(null));
    setHealthStats(Array(ageIntervals.length).fill(null));
    setError(null);
  }
  
  const headerText = useMemo(() => {
    switch(gameState) {
      case GameState.Start: return "SECTION 1: UPLOAD";
      case GameState.BasicInfo: return "SECTION 2: BASIC INFO";
      case GameState.Quiz: return "SECTION 3: WELLNESS QUIZ";
      case GameState.Results: return "SECTION 4: RESULTS";
      default: return "";
    }
  }, [gameState]);

  const renderContent = () => {
    switch (gameState) {
      case GameState.Start:
        return <PhotoCapture onPhotoTaken={handlePhotoTaken} />;
      case GameState.BasicInfo:
        return <Quiz key="basic-info" title="Your Basic Info" initialQuestions={BASIC_INFO_QUESTIONS} onSubmit={handleBasicInfoSubmit} showAddQuestionsButton={false} onBack={handleBackToStart} />;
      case GameState.Quiz:
        return <Quiz key="wellness-quiz" title="Your Wellness Snapshot" initialQuestions={INITIAL_QUESTIONS} onSubmit={handleQuizSubmit} showAddQuestionsButton={true} onBack={handleBackToBasicInfo} />;
      case GameState.Results:
        return <Timeline 
                  images={generatedImages} 
                  healthStats={healthStats} 
                  onDataNeeded={handleGenerateDataForIndex} 
                  onCustomPhotoNeeded={handleGenerateCustomPhotoForIndex}
                  onSliderChange={handleSliderChange} 
                  onRestart={handleRestart} 
                  lifeExpectancy={lifeExpectancy}
                  currentAge={Number(basicInfoAnswers.age?.value || 0)}
                />;
      default:
        return null;
    }
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center font-sans text-white overflow-hidden bg-gray-900">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 opacity-80"></div>
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-teal-500 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-[30%] right-[15%] w-72 h-72 bg-purple-500 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>


        <div className="relative z-10 w-full min-h-screen flex items-center justify-center p-4">
            <div className="w-full h-[95vh] max-h-[900px] max-w-7xl bg-black/30 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl flex flex-col items-center justify-start">
                 <Header text={headerText} />
                 <div className="w-full flex-grow flex items-center justify-center overflow-hidden">
                    {error && <div className="text-center text-red-400 p-4 bg-red-900/50 rounded-lg">
                        <p className="font-bold">An Error Occurred</p>
                        <p>{error}</p>
                        <button onClick={handleRestart} className="mt-4 px-4 py-2 bg-white/20 rounded-md hover:bg-white/30">Start Over</button>
                      </div>}
                    {!error && renderContent()}
                 </div>
            </div>
        </div>
        <style>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
          
          @keyframes tilt {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(1deg); }
          }
          .animate-tilt { animation: tilt 10s infinite linear; }
        `}</style>
    </main>
  );
};

export default App;