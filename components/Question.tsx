import React, { useState } from 'react';
import { Question, QuestionType, Answer, CheckboxOption } from '../types';
import { StarIcon } from './Icons';

interface QuestionProps {
  question: Question;
  answer: Answer;
  onChange: (answer: Answer) => void;
  isValid: boolean;
}

const StarRatingInput: React.FC<{ value: number; onChange: (value: number) => void }> = ({ value, onChange }) => {
  return (
    <div className="flex space-x-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => onChange(star)} type="button">
          <StarIcon className={`w-10 h-10 transition-colors ${star <= value ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-400'}`} />
        </button>
      ))}
    </div>
  );
};

const CheckboxInput: React.FC<{ options: CheckboxOption[]; value: CheckboxOption[]; onChange: (value: CheckboxOption[]) => void }> = ({ options, value, onChange }) => {
  const handleChange = (option: CheckboxOption, checked: boolean) => {
    // This implementation assumes single choice for checkboxes for scoring simplicity
    onChange(checked ? [option] : []);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {options.map((option) => (
        <label key={option.value} className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${value.some(v => v.value === option.value) ? 'bg-blue-500/20 border-blue-500' : 'bg-white/5 border-white/20 hover:border-white/40'}`}>
          <input
            type="checkbox"
            checked={value.some(v => v.value === option.value)}
            onChange={(e) => handleChange(option, e.target.checked)}
            className="h-5 w-5 rounded-sm bg-transparent border-gray-400 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-white">{option.label}</span>
        </label>
      ))}
    </div>
  );
};


const SliderInput: React.FC<{ min: number; max: number; step: number; labels?: string[]; value: number; onChange: (value: number) => void }> = ({ min, max, step, labels, value, onChange }) => {
  return (
    <div className="w-full">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        {labels ? labels.map((label, index) => <span key={index}>{label}</span>) : <><span>{min}</span><span>{max}</span></>}
      </div>
    </div>
  );
};

const NumberInput: React.FC<{ value: string; placeholder?: string; onChange: (value: string) => void; isValid: boolean; }> = ({ value, placeholder, onChange, isValid }) => {
  return (
    <input 
      type="number"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full max-w-xs p-3 bg-white/5 border rounded-lg text-white text-center text-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${isValid ? 'border-white/20' : 'border-red-500/70'}`}
      placeholder={placeholder}
    />
  );
};


const QuestionComponent: React.FC<QuestionProps> = ({ question, answer, onChange, isValid }) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleValueChange = (newValue: any) => {
    onChange({ ...answer, value: newValue });
  };

  const handleDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...answer, details: e.target.value });
  };
  
  const renderInput = () => {
    switch (question.type) {
      case QuestionType.Stars:
        return <StarRatingInput value={answer.value || 0} onChange={handleValueChange} />;
      case QuestionType.Checkboxes:
        return <CheckboxInput options={question.options!} value={answer.value || []} onChange={handleValueChange} />;
      case QuestionType.Slider:
        return <SliderInput min={question.min!} max={question.max!} step={question.step!} labels={question.labels} value={answer.value ?? question.min!} onChange={handleValueChange} />;
      case QuestionType.Text:
        return <textarea value={answer.value || ''} onChange={(e) => handleValueChange(e.target.value)} className="w-full h-32 p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Your thoughts..."></textarea>;
      case QuestionType.Number:
        return <NumberInput value={answer.value || ''} placeholder={question.placeholder} onChange={handleValueChange} isValid={isValid} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="w-full space-y-6 flex flex-col items-center">
      <div className="flex justify-between items-start w-full">
        <h3 className="text-xl md:text-2xl font-light text-white leading-tight">{question.text}</h3>
        <button onClick={() => setShowDetails(!showDetails)} className="text-sm bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition-colors whitespace-nowrap">
          {showDetails ? 'Hide Details' : 'Add Details'}
        </button>
      </div>

      <div className="min-h-[6rem] w-full flex flex-col items-center justify-center">
        {renderInput()}
        {!isValid && question.validationMessage && (
            <p className="text-red-400 text-sm mt-2">{question.validationMessage}</p>
        )}
      </div>

      {showDetails && (
        <div className="w-full">
          <textarea
            value={answer.details || ''}
            onChange={handleDetailsChange}
            className="w-full h-24 p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Add any extra details here..."
          />
        </div>
      )}
    </div>
  );
};

export default QuestionComponent;