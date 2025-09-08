import React, { useState } from 'react';
import { playSound } from '../constants';

interface ChatbotProps {
  onClose: () => void;
  onSubmit: (prompt: string, age: number) => void;
  lifeExpectancy: number;
  currentAge: number;
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose, onSubmit, lifeExpectancy, currentAge }) => {
  const [prompt, setPrompt] = useState('');
  const [warning, setWarning] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWarning(null);

    const ageMatch = prompt.match(/age (\d+)/i);
    const age = ageMatch ? parseInt(ageMatch[1], 10) : 0;
    
    if (!age) {
        playSound('warning');
        setWarning("Please specify an age in your request, for example: '...at age 60'.");
        return;
    }
    
    if (age <= currentAge) {
        playSound('warning');
        setWarning(`Please enter an age older than your current age of ${currentAge}.`);
        return;
    }

    if (age > lifeExpectancy) {
        playSound('warning');
        setWarning(`Based on your quiz answers, your life expectancy is ${lifeExpectancy}. We cannot generate an image beyond this age.`);
        return;
    }
    
    if (age > 110) { // A reasonable human lifespan limit
        playSound('warning');
        setWarning("That's very optimistic! Please choose an age of 110 or younger.");
        return;
    }

    const actionMatch = prompt.replace(/show me at age \d+/i, '').replace(/at age \d+/i, '').trim();
    if (!actionMatch) {
      playSound('warning');
      setWarning("Please specify an activity, for example: 'playing soccer at age 60'.");
      return;
    }
    
    playSound('success');
    onSubmit(actionMatch, age);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 border border-white/20 rounded-xl shadow-2xl w-full max-w-lg p-6 text-white" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Create a Custom Photo</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <p className="text-gray-400 mb-4">
          Tell the AI what you want to see. The photo will use your projected health data for the age you specify.
        </p>
        <form onSubmit={handleSubmit}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-24 p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none mb-2"
            placeholder="e.g., Playing soccer at age 50"
          />
          {warning && (
            <p className="text-red-400 text-sm mb-4">{warning}</p>
          )}
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            Generate Photo
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;