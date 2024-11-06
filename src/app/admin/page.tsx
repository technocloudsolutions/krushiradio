'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AudioForm from '../../components/AudioForm';
import ProgramList from '../../components/ProgramList';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useRouter } from 'next/navigation';
import { Search, Plus, LogOut, Radio, Settings, BarChart, Calendar, Filter, X, ChevronDown } from 'lucide-react';

interface Program {
  id: number;
  program_name: string;
  date: string;
  category: string;
  description: string;
  audio_url: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      setIsLoading(false);
      fetchPrograms();
    }
  }, [router]);

  useEffect(() => {
    filterPrograms();
  }, [searchTerm, selectedCategory, dateRange, programs]);

  const filterPrograms = () => {
    let filtered = [...programs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(program => 
        program.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(program => program.category === selectedCategory);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(program => program.date >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter(program => program.date <= dateRange.end);
    }

    setFilteredPrograms(filtered);
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/audio');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      } else {
        setError('Failed to fetch programs');
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError('Error fetching programs');
    }
  };

  const handleAddOrUpdateAudio = async (formData: FormData): Promise<Response> => {
    const method = formData.get('id') ? 'PUT' : 'POST';
    try {
      const response = await fetch('/api/audio', {
        method,
        body: formData,
      });
      if (response.ok) {
        setEditingProgram(null);
        setIsAdding(false);
        fetchPrograms();
      }
      return response;
    } catch (error) {
      console.error('Error adding/updating audio entry:', error);
      throw error;
    }
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setIsAdding(true);
  };

  const handleDeleteProgram = async (id: number) => {
    if (confirm('Are you sure you want to delete this program?')) {
      try {
        const response = await fetch(`/api/audio?id=${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchPrograms();
        }
      } catch (error) {
        console.error('Error deleting program:', error);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/');
  };

  const categories = Array.from(new Set(programs.map(program => program.category))).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-green-800 mb-8">Admin Panel</h2>
          <nav className="space-y-2">
            <Link 
              href="/admin"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 rounded-lg transition-colors bg-green-50"
            >
              <Radio className="w-5 h-5" />
              <span>Programs</span>
            </Link>
            <Link 
              href="/admin/settings"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
            <Link 
              href="/admin/analytics"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 rounded-lg transition-colors"
            >
              <BarChart className="w-5 h-5" />
              <span>Analytics</span>
            </Link>
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {isAdding ? (editingProgram ? 'Edit Program' : 'Add New Program') : 'Program Management'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isAdding 
                    ? 'Fill in the program details below'
                    : 'Manage and organize your radio programs'
                  }
                </p>
              </div>
              {!isAdding && (
                <Button 
                  onClick={() => setIsAdding(true)}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 h-11 px-6"
                >
                  <Plus className="w-5 h-5" />
                  Add New Program
                </Button>
              )}
            </div>

            {!isAdding && (
              <div className="space-y-6">
                {/* Enhanced Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Search Box */}
                  <div className="col-span-1">
                    <label className="block text-base font-semibold text-gray-700 mb-2">
                      Search Programs
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        placeholder="Search by name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 text-base border-2 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="col-span-1">
                    <label className="block text-base font-semibold text-gray-900 mb-2">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full h-12 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-green-500 text-base pl-3 pr-10 appearance-none bg-white text-gray-900"
                      >
                        <option value="" className="text-gray-900">All Categories</option>
                        {categories.map(category => (
                          <option key={category} value={category} className="text-gray-900 py-2">
                            {category}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      </div>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="col-span-1">
                    <label className="block text-base font-semibold text-gray-700 mb-2">
                      Date Range
                    </label>
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <label className="absolute -top-5 left-0 text-sm text-gray-500">
                          From
                        </label>
                        <Input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg text-base"
                        />
                      </div>
                      <div className="flex-1 relative">
                        <label className="absolute -top-5 left-0 text-sm text-gray-500">
                          To
                        </label>
                        <Input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg text-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(searchTerm || selectedCategory || dateRange.start || dateRange.end) && (
                  <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-100">
                    <div className="text-sm font-medium text-gray-500 mr-2 pt-1">
                      Active Filters:
                    </div>
                    {searchTerm && (
                      <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-green-50 text-green-700 border border-green-200">
                        <span className="mr-1 font-medium">Search:</span>
                        <span>{searchTerm}</span>
                        <button
                          onClick={() => setSearchTerm('')}
                          className="ml-2 hover:text-green-800 focus:outline-none"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {selectedCategory && (
                      <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
                        <span className="mr-1 font-medium">Category:</span>
                        <span>{selectedCategory}</span>
                        <button
                          onClick={() => setSelectedCategory('')}
                          className="ml-2 hover:text-blue-800 focus:outline-none"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {(dateRange.start || dateRange.end) && (
                      <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-purple-50 text-purple-700 border border-purple-200">
                        <span className="mr-1 font-medium">Date:</span>
                        <span>
                          {dateRange.start ? new Date(dateRange.start).toLocaleDateString() : 'Any'} 
                          {' to '} 
                          {dateRange.end ? new Date(dateRange.end).toLocaleDateString() : 'Any'}
                        </span>
                        <button
                          onClick={() => setDateRange({ start: '', end: '' })}
                          className="ml-2 hover:text-purple-800 focus:outline-none"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('');
                        setDateRange({ start: '', end: '' });
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 underline pt-1"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-xl shadow-sm">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-64 gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-green-600">Loading programs...</p>
              </div>
            ) : isAdding ? (
              <div className="p-6">
                <AudioForm 
                  onAddAudio={handleAddOrUpdateAudio}
                  onCancel={() => {
                    setIsAdding(false);
                    setEditingProgram(null);
                  }}
                  editingProgram={editingProgram}
                />
              </div>
            ) : (
              <div className="p-6">
                <ProgramList 
                  programs={filteredPrograms}
                  onEdit={handleEditProgram}
                  onDelete={handleDeleteProgram}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
