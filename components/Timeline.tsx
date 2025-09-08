import React, { useState, useRef } from 'react';
import { DownloadIcon, FullscreenIcon, GravestoneIcon, ChatIcon } from './Icons';
import { ageIntervals, playSound } from '../constants';
import { HealthStats } from '../types';
import Chatbot from './Chatbot';

interface TimelineProps {
  images: (string | 'gravestone' | 'error' | 'generating' | null)[];
  healthStats: (HealthStats | null)[];
  onDataNeeded: (index: number) => void;
  onCustomPhotoNeeded: (index: number, prompt: string, age: number) => void;
  onRestart: () => void;
  onSliderChange: (index: number) => void;
  lifeExpectancy: number;
  currentAge: number;
}

const Timeline: React.FC<TimelineProps> = ({ images, healthStats, onDataNeeded, onCustomPhotoNeeded, onRestart, onSliderChange, lifeExpectancy, currentAge }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(event.target.value, 10);
    setCurrentIndex(newIndex);
    onSliderChange(newIndex);
  };
  
  const handleCustomPhotoSubmit = (prompt: string, age: number) => {
    // Find the closest interval in our timeline to the user's requested age
    const futureYears = age - currentAge;
    const closestIndex = ageIntervals.reduce((prev, curr, index) => {
        return (Math.abs(curr - futureYears) < Math.abs(ageIntervals[prev] - futureYears) ? index : prev);
    }, 0);
    
    setCurrentIndex(closestIndex);
    onSliderChange(closestIndex);
    onCustomPhotoNeeded(closestIndex, prompt, age);
    setIsChatOpen(false);
  }

  const currentAssetState = images[currentIndex];
  const currentHealthStats = healthStats[currentIndex];
  const isDownloadable = typeof currentAssetState === 'string' && !['gravestone', 'error', 'generating'].includes(currentAssetState);
  
  const handleDownload = () => {
    if (isDownloadable) {
      playSound('click');
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${currentAssetState}`;
      link.download = `future-self-${ageIntervals[currentIndex]}-years.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFullscreen = () => {
    if (timelineRef.current) {
      playSound('click');
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        timelineRef.current.requestFullscreen().catch(err => {
          alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
      }
    }
  };
  
  const renderMediaContent = () => {
    if (currentAssetState === 'generating') {
      return (
        <div className="flex flex-col items-center justify-center text-white text-center p-4">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-teal-400 mx-auto mb-4"></div>
          <h3 className="text-xl font-bold">Generating Your Future Photo...</h3>
          <p className="text-gray-400">This may take a moment.</p>
        </div>
      );
    }
    if (currentAssetState === 'gravestone') {
      return (
        <div className="text-center text-gray-300 p-4">
          <GravestoneIcon className="w-24 h-24 mx-auto text-gray-500" />
          <p className="mt-4 font-semibold text-lg">According to the data, if you continue these choices, you may pass away by age {currentHealthStats?.lifeExpectancy}.</p>
        </div>
       );
    }
    if (currentAssetState === 'error') {
      return (
        <div className="text-center text-red-400 p-4">
          <p className="text-lg font-semibold">Image generation failed.</p>
          <p>There was an issue creating this image. Please try again later.</p>
           <button 
            onClick={() => onDataNeeded(currentIndex)} 
            className="mt-4 px-6 py-2 bg-white/20 rounded-md hover:bg-white/30"
          >
            Retry
          </button>
        </div>
      );
    }
    if (isDownloadable) {
      return <img src={`data:image/jpeg;base64,${currentAssetState}`} alt={`You in ${ageIntervals[currentIndex]} years`} className="w-full h-full object-contain" />;
    }
    return (
        <div className="flex flex-col items-center justify-center text-white text-center p-4">
          <h3 className="text-xl font-bold mb-4">Ready to see +{ageIntervals[currentIndex]} years?</h3>
          <p className="text-gray-400 mb-6 max-w-sm">Click the button below to generate a data-driven image of yourself at this point in the future.</p>
          <button 
            onClick={() => { playSound('click'); onDataNeeded(currentIndex); }}
            className="px-8 py-3 bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity"
          >
            Generate Photo
          </button>
        </div>
    );
  };
  
  return (
    <div ref={timelineRef} className="w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col h-full bg-transparent overflow-y-auto">
        <div className="text-center mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wide">Your Future Self Timeline</h1>
            <p className="text-gray-300 mt-2 text-lg">Your wellness choices shape your future. Here's one possibility.</p>
        </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-2/3">
           <div className="w-full aspect-[4/5] bg-black/50 rounded-lg overflow-hidden flex items-center justify-center mb-6 border-2 border-white/20 relative">
              {renderMediaContent()}
             <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-full font-bold text-lg">
                  +{ageIntervals[currentIndex]} Years
              </div>
          </div>
        </div>

        <div className="w-full lg:w-1/3 space-y-4">
          <div className="bg-white/5 border border-white/20 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Timeline Control</h3>
            <input
              type="range"
              min="0"
              max={images.length - 1}
              value={currentIndex}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
              {ageIntervals.map((age, index) => <span key={age}>{ (index === 0 || index === ageIntervals.length - 1 || age % 10 === 0) ? `+${age}` : ''}</span>)}
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Projected Health</h3>
            {currentHealthStats ? (
               <div className="grid grid-cols-2 gap-4 text-center">
                 <div className="bg-black/20 p-3 rounded-md">
                    <p className="text-2xl font-bold text-teal-300">{currentHealthStats.projectedWeight}<span className="text-sm font-normal text-gray-400"> lbs</span></p>
                    <p className="text-xs text-gray-300">Weight</p>
                 </div>
                 <div className="bg-black/20 p-3 rounded-md">
                    <p className="text-2xl font-bold text-teal-300">{currentHealthStats.projectedHeight}</p>
                    <p className="text-xs text-gray-300">Height</p>
                 </div>
                 <div className="bg-black/20 p-3 rounded-md">
                    <p className="text-2xl font-bold text-teal-300">{currentHealthStats.bmi}</p>
                    <p className="text-xs text-gray-300">BMI</p>
                 </div>
                 <div className="bg-black/20 p-3 rounded-md">
                    <p className="text-2xl font-bold text-teal-300">{currentHealthStats.calorieIntake}</p>
                    <p className="text-xs text-gray-300">Daily Calories</p>
                 </div>
               </div>
            ) : (
              <p className="text-gray-400">Slide to see health stats.</p>
            )}
          </div>

        </div>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
          <button onClick={() => { playSound('click'); setIsChatOpen(true); }} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-semibold hover:bg-white/20 transition-colors">
              <ChatIcon className="w-5 h-5" /> Ask AI For Custom Photo
          </button>
          <button onClick={handleDownload} disabled={!isDownloadable} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-semibold hover:bg-white/20 transition-colors disabled:opacity-50">
              <DownloadIcon className="w-5 h-5" /> Download Image
          </button>
           <button onClick={() => { playSound('click'); onRestart(); }} className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity">
              Start Over
            </button>
      </div>

      {isChatOpen && <Chatbot onSubmit={handleCustomPhotoSubmit} onClose={() => setIsChatOpen(false)} lifeExpectancy={lifeExpectancy} currentAge={currentAge} />}
    </div>
  );
};

export default Timeline;
