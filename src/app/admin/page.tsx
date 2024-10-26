'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AudioForm from '../../components/AudioForm';

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

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

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Public View
              </Link>
              <button
                onClick={handleLogout}
                className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <AudioForm onAddAudio={handleAddAudio} />
        </div>
      </main>
    </div>
  );
}
