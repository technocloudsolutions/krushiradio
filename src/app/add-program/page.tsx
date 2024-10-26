'use client';

import React from 'react';
import Link from 'next/link';
import AudioForm from '../../components/AudioForm';

export default function AddProgramPage() {
  const handleAddAudio = async (formData: FormData): Promise<Response> => {
    try {
      const response = await fetch('/api/audio', {
        method: 'POST',
        body: formData,
      });
      return response;
    } catch (error) {
      console.error('Error adding audio entry:', error);
      throw error;
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Add New Audio Program</h1>
      <div className="mb-4">
        <Link href="/programs" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200">
          Back to Programs
        </Link>
      </div>
      <AudioForm onAddAudio={handleAddAudio} />
    </main>
  );
}
