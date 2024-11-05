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
    <div className="w-full flex items-center gap-2 px-4">
      <span className="text-sm">{formatTime(currentTime)}</span>
      <div
        ref={progressBarRef}
        className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer"
        onClick={handleClick}
      >
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>
      <span className="text-sm">{formatTime(duration)}</span>
    </div>
  );
};

export default AudioSeekBar; 