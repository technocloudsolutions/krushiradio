import React, { useEffect, useRef } from 'react';

interface AudioSeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

const AudioSeekBar = ({ currentTime, duration, onSeek }: AudioSeekBarProps) => {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    onSeek(newTime);
  };

  return (
    <div className="w-full space-y-3">
      <div
        ref={progressBarRef}
        className="h-3 bg-gray-200 rounded-full cursor-pointer relative group"
        onClick={handleClick}
      >
        {/* Background fill with animated gradient */}
        <div
          className="absolute h-full rounded-full transition-all duration-150 bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-size-200 animate-gradient"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        
        {/* Hover effect with ripple */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute w-full h-full bg-green-100/30 rounded-full animate-pulse" />
        </div>
        
        {/* Enhanced seek handle */}
        <div 
          className="absolute h-5 w-5 bg-white border-2 border-green-500 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
          style={{ 
            left: `${(currentTime / duration) * 100}%`,
            boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.2)'
          }}
        />
      </div>
      
      {/* Enhanced time display */}
      <div className="flex justify-between items-center text-sm font-medium">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-green-700">{formatTime(currentTime)}</span>
        </div>
        <span className="text-gray-500">{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default AudioSeekBar; 