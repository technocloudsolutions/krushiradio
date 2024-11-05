'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { AudioEntry } from '@/components/AudioLibrary';

export default function ProgramPage() {
  const params = useParams();
  const [program, setProgram] = useState<AudioEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const response = await fetch(`/api/audio/${params.id}`);
        if (!response.ok) {
          throw new Error('Program not found');
        }
        const data = await response.json();
        setProgram(data);
      } catch (err) {
        setError('Failed to load program');
        console.error('Error loading program:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProgram();
    }
  }, [params.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !program) {
    return <div>Error: {error || 'Program not found'}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{program.program_name}</h1>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <p className="text-gray-600">Category: {program.category}</p>
          <p className="text-gray-600">Date: {new Date(program.date).toLocaleDateString()}</p>
        </div>
        <p className="mb-4">{program.description}</p>
        <audio controls className="w-full" src={program.audio_url}>
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
} 