import React from 'react';
import { AudioEntry } from './AudioLibrary';

interface ProgramListProps {
  audioEntries: AudioEntry[];
}

const ProgramList: React.FC<ProgramListProps> = ({ audioEntries }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Program List</h2>
      <ul className="space-y-2">
        {audioEntries.map((entry) => (
          <li key={entry.id} className="p-2 bg-gray-100 rounded">
            <h3 className="font-semibold">{entry.program_name}</h3>
            <p className="text-sm text-gray-600">{entry.category}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProgramList;
