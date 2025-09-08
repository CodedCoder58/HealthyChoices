import React, { useState, useCallback, useMemo } from 'react';
import { Question, Answer, QuestionType } from '../types';
import QuestionComponent from './Question';
import { INITIAL_QUESTIONS, ADDITIONAL_QUESTIONS } from '../constants';
import { playSound } from '../constants';

interface QuizProps {
  title: string;
  initialQuestions: Question[];
  onSubmit: (answers: Record<string, Answer>) => void;
  showAddQuestionsButton?: boolean;
  onBack?: () => void;
}

const getValidationState = (question: Question, answer?: Answer): boolean => {
  if (question.isOptional) return true;
  if (!answer || answer.value === null || answer.value === undefined || answer.value === '') return false;

  const value = answer.value;

  switch (question.type) {
    case QuestionType.Stars:
      return Number(value) > 0;
    case QuestionType.Number:
      const numValue = Number(value);
      if (isNaN(numValue)) return false;
      if (question.min !== undefined && numValue < question.min) return false;
      if (question.max !== undefined && numValue > question.max) return false;
      return true;
    case QuestionType.Checkboxes:
      return Array.isArray(value) && value.length > 0;
    case QuestionType.Text:
      return typeof value === 'string' && value.trim() !== '';
    case QuestionType.Slider:
      return true; // Sliders always have a value
    default:
      return false;
  }
};

const Quiz: React.FC<QuizProps> = ({ title, initialQuestions, onSubmit, showAddQuestionsButton = false, onBack }) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [additionalQuestionsAdded, setAdditionalQuestionsAdded] = useState(0);

  const handleAnswerChange = useCallback((questionId: string, answer: Answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      playSound('navigate');
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    playSound('navigate');
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (onBack) {
      onBack();
    }
  };
  
  const handleAddQuestions = () => {
      playSound('click');
      const questionsToAdd = ADDITIONAL_QUESTIONS.slice(additionalQuestionsAdded, additionalQuestionsAdded + 5);
      if(questionsToAdd.length > 0) {
          setQuestions([...questions, ...questionsToAdd]);
          setAdditionalQuestionsAdded(additionalQuestionsAdded + questionsToAdd.length);
      }
  };

  const handleSubmit = () => {
    playSound('success');
    onSubmit(answers);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  const isCurrentAnswerValid = useMemo(() => 
    getValidationState(currentQuestion, answers[currentQuestion.id]),
    [currentQuestion, answers]
  );
  
  const isNextButtonDisabled = !isCurrentAnswerValid;

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canAddMore = additionalQuestionsAdded < ADDITIONAL_QUESTIONS.length;
  const isFirstAdd = additionalQuestionsAdded === 0;


  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-300">Question {currentQuestionIndex + 1} of {questions.length}</p>
        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
          <div className="bg-gradient-to-r from-teal-400 to-blue-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="flex-grow flex items-center">
        <QuestionComponent
          question={currentQuestion}
          answer={answers[currentQuestion.id] || { value: null }}
          onChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
          isValid={isCurrentAnswerValid || !answers[currentQuestion.id]?.value} // Show valid style until user types something invalid
        />
      </div>

      <div className="mt-8 pt-6 border-t border-white/20 space-y-4">
         {showAddQuestionsButton && isLastQuestion && canAddMore && (
            <div className={`relative group text-center ${!isFirstAdd ? 'opacity-90' : ''}`}>
                {isFirstAdd && (
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                )}
                <button 
                    onClick={handleAddQuestions} 
                    className={`relative w-full text-center text-white py-3 px-4 font-semibold transition-colors bg-gray-800 rounded-lg ${
                        isFirstAdd 
                        ? 'hover:text-yellow-200' 
                        : 'border border-white/20 hover:bg-white/10'
                    }`}
                >
                    + Add More Questions 
                    {isFirstAdd && (
                        <span className="text-yellow-400 font-bold ml-2">(Highly Recommended)</span>
                    )}
                </button>
            </div>
        )}
        <div className="flex justify-between items-center">
          <button onClick={handlePrevious} disabled={currentQuestionIndex === 0 && !onBack} className="px-8 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-semibold hover:bg-white/20 transition-colors disabled:opacity-50">
            Previous
          </button>
          {!isLastQuestion ? (
            <button onClick={handleNext} disabled={isNextButtonDisabled} className="px-8 py-3 bg-white/20 rounded-lg text-white font-semibold hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isNextButtonDisabled} className="px-8 py-3 bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              {showAddQuestionsButton ? 'Submit & See Future' : 'Next Section'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;