"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Share2,
  Download,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { getStorage, ref, getBlob, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";
import SearchBar from './SearchBar';
import CategoryFilters from './CategoryFilters';
import AudioSeekBar from './AudioSeekBar';
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon
} from 'react-share';
import { updateAnalytics } from '../lib/analytics';

export interface AudioEntry {
  id: number;
  program_name: string;
  date: string;
  category: string;
  description: string;
  audio_url: string;
  file_name: string;
  fileExists: boolean;
}

const ITEMS_PER_PAGE = 9; // 3 columns * 3 rows

const AudioLibrary: React.FC = () => {
  const [audioEntries, setAudioEntries] = useState<AudioEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AudioEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<number[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const categories = Array.from(new Set(audioEntries.map(entry => entry.category)));
  const [audioStates, setAudioStates] = useState<{
    [key: number]: { currentTime: number; duration: number };
  }>({});
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState<{ url: string; title: string } | null>(null);

  const filterEntries = useCallback(() => {
    const filtered = audioEntries.filter((entry) => {
      const matchesSearch =
        entry.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase());

      const entryDate = new Date(entry.date);
      const isAfterStartDate = startDate
        ? entryDate >= new Date(startDate)
        : true;
      const isBeforeEndDate = endDate ? entryDate <= new Date(endDate) : true;
      
      const matchesCategory = selectedCategory ? entry.category === selectedCategory : true;

      return matchesSearch && isAfterStartDate && isBeforeEndDate && matchesCategory;
    });
    setFilteredEntries(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [audioEntries, searchTerm, startDate, endDate, selectedCategory]);

  useEffect(() => {
    filterEntries();
  }, [filterEntries, searchTerm, startDate, endDate, selectedCategory]);

  useEffect(() => {
    fetchAudioEntries();
  }, []);

  const fetchAudioEntries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/audio");
      if (!response.ok) {
        throw new Error("Failed to fetch audio entries");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setAudioEntries(data);
        setFilteredEntries(data);
      } else {
        throw new Error("Received invalid data format");
      }
    } catch (error) {
      console.error("Error fetching audio entries:", error);
      setError("Failed to load audio entries. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handlePlay = (id: number, audioUrl: string) => {
    if (currentlyPlaying === id) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        updateAnalytics('play', id);
      }
      setCurrentlyPlaying(id);
    }
  };

  const handleShare = (entry: AudioEntry) => {
    const shareUrl = `${window.location.origin}/program/${entry.id}`;
    const shareTitle = `Listen to ${entry.program_name} on Krushi Radio`;
    
    console.log('Share URL:', shareUrl);
    
    setShareData({ 
      url: shareUrl, 
      title: shareTitle 
    });
    setIsShareModalOpen(true);
  };

  const handleDownload = async (url: string, fileName: string, programId: number) => {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, fileName }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'audio.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      updateAnalytics('download', programId);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const toggleDescription = (id: number) => {
    setExpandedDescriptions((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const pageCount = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const filterPrograms = (programs: AudioEntry[]) => {
    return programs.filter(program => 
      !selectedCategory || program.category === selectedCategory
    );
  };

  const updateAudioState = (id: number, currentTime: number, duration: number) => {
    setAudioStates(prev => ({
      ...prev,
      [id]: { currentTime, duration }
    }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 min-h-screen bg-gradient-to-b from-green-50/50 to-white">
      {/* Enhanced Hero Section with Consistent Title */}
      <div className="mb-12 text-center bg-gradient-to-br from-green-100 via-green-50 to-white rounded-3xl p-12 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Main Title */}
          <h1 className="text-4xl font-bold text-green-800 leading-tight tracking-tight font-sinhala">
            <span className="inline-block transform hover:scale-105 transition-transform duration-300 bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-green-900">
              ගහකොල අතරේ හුස්ම හොයනා
            </span>
            <br />
            <span className="inline-block mt-2 transform hover:scale-105 transition-transform duration-300 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-800">
              රේඩියෝ යාත්‍රිකයා
            </span>
          </h1>

          {/* Dotted Line Separator */}
          <div className="my-6 flex items-center justify-center gap-4">
            <div className="h-px flex-1 border-t-2 border-dotted border-green-300"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="h-px flex-1 border-t-2 border-dotted border-green-300"></div>
          </div>

          {/* Subtitle */}
          <p className="text-xl text-green-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Discover and listen to our curated collection of agricultural radio programs
          </p>
        </div>
      </div>

      {/* Enhanced Search and Filter Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-12 border border-green-100">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-grow relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="search"
              placeholder="Search Krushiradio programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 pl-12 text-lg border-2 focus:ring-2 focus:ring-green-500 rounded-xl"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <label className="absolute -top-6 left-0 text-sm text-green-600">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full md:w-44 h-14 rounded-xl"
              />
            </div>
            <div className="relative">
              <label className="absolute -top-6 left-0 text-sm text-green-600">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full md:w-44 h-14 rounded-xl"
              />
            </div>
          </div>
        </div>
        <CategoryFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
      </div>

      {/* Enhanced Content Section */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-green-600 animate-pulse">Loading programs...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md" role="alert">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-bold text-lg">Error</p>
          </div>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {paginatedEntries.map((entry) => (
              <Card
                key={entry.id}
                className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-green-100 h-[250px] flex flex-col"
              >
                <CardContent className="p-4 flex flex-col flex-1">
                  {/* Enhanced Date Badge and Title - More Compact */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex flex-col items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <span className="text-xl font-bold">
                        {new Date(entry.date).getDate()}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider">
                        {new Date(entry.date).toLocaleString('si-LK', { month: 'short' })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800 group-hover:text-green-600 transition-colors mb-1 line-clamp-2 font-sinhala">
                        {entry.program_name}
                      </h3>
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                          {entry.category}
                        </span>
                        {/* Full Date Display with Dotted Line */}
                        <div className="relative">
                          <div className="text-xs text-gray-600 mb-1">
                            {new Date(entry.date).toLocaleDateString('si-LK', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long'
                            })}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-[2px] flex-1 border-t-2 border-dotted border-green-300"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                            <div className="h-[2px] flex-1 border-t-2 border-dotted border-green-300"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Section - More Compact */}
                  <div className="flex-1 overflow-hidden mb-2">
                    <p className={`text-xs text-gray-600 leading-relaxed ${
                      !expandedDescriptions.includes(entry.id) ? "line-clamp-2" : "overflow-y-auto max-h-16"
                    }`}>
                      {entry.description}
                    </p>
                    {entry.description.length > 100 && (
                      <button
                        onClick={() => toggleDescription(entry.id)}
                        className="mt-0.5 text-green-600 hover:text-green-700 text-xs font-medium flex items-center gap-1 group/btn"
                      >
                        {expandedDescriptions.includes(entry.id) ? (
                          <>
                            Read Less 
                            <ChevronUp className="w-3 h-3 group-hover/btn:-translate-y-0.5 transition-transform" />
                          </>
                        ) : (
                          <>
                            Read More 
                            <ChevronDown className="w-3 h-3 group-hover/btn:translate-y-0.5 transition-transform" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Controls Section - More Compact */}
                  <div className="mt-auto">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePlay(entry.id, entry.audio_url)}
                        className={`flex-1 ${
                          currentlyPlaying === entry.id
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-green-500 hover:bg-green-600'
                        } text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-lg h-8 text-xs`}
                      >
                        {currentlyPlaying === entry.id ? (
                          <><Pause className="w-3.5 h-3.5 mr-1.5" /> Pause</>
                        ) : (
                          <><Play className="w-3.5 h-3.5 mr-1.5" /> Play</>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleShare(entry)}
                        className="w-8 h-8 border hover:border-green-500 hover:text-green-500 rounded-lg"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(entry.audio_url, entry.file_name, entry.id)}
                        className="w-8 h-8 border hover:border-green-500 hover:text-green-500 rounded-lg"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Audio Progress - More Compact */}
                    {currentlyPlaying === entry.id && audioStates[entry.id] && (
                      <div className="mt-2">
                        <AudioSeekBar
                          currentTime={audioStates[entry.id].currentTime}
                          duration={audioStates[entry.id].duration}
                          onSeek={(time) => {
                            if (audioRef.current) {
                              audioRef.current.currentTime = time;
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Pagination */}
          <div className="mt-16 flex justify-center items-center space-x-8">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="border-2 border-green-500 text-green-600 hover:bg-green-50 h-14 px-6 rounded-xl disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-gray-700">Page</span>
              <span className="w-12 h-12 flex items-center justify-center bg-green-100 text-green-700 rounded-lg font-bold">
                {currentPage}
              </span>
              <span className="text-lg font-medium text-gray-700">of {pageCount}</span>
            </div>
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
              variant="outline"
              className="border-2 border-green-500 text-green-600 hover:bg-green-50 h-14 px-6 rounded-xl disabled:opacity-40"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </>
      )}

      {/* Share Modal */}
      {isShareModalOpen && shareData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">Share Program</h3>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex justify-center space-x-6 mb-8">
              <FacebookShareButton url={shareData.url}>
                <FacebookIcon size={48} round className="hover:scale-110 transition-transform" />
              </FacebookShareButton>
              
              <TwitterShareButton url={shareData.url} title={shareData.title}>
                <TwitterIcon size={48} round className="hover:scale-110 transition-transform" />
              </TwitterShareButton>
              
              <WhatsappShareButton url={shareData.url} title={shareData.title}>
                <WhatsappIcon size={48} round className="hover:scale-110 transition-transform" />
              </WhatsappShareButton>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Or copy link:</p>
              <div className="flex">
                <input
                  type="text"
                  value={shareData.url}
                  readOnly
                  className="flex-1 p-3 border-2 rounded-l-lg text-sm bg-gray-50"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareData.url);
                    // Show copy notification
                    const notification = document.createElement('div');
                    notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 ease-out';
                    notification.textContent = 'Link copied to clipboard!';
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                      notification.style.opacity = '0';
                      setTimeout(() => document.body.removeChild(notification), 500);
                    }, 2000);
                  }}
                  className="px-6 bg-green-500 text-white rounded-r-lg hover:bg-green-600 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current && currentlyPlaying) {
            updateAudioState(
              currentlyPlaying,
              audioRef.current.currentTime,
              audioRef.current.duration
            );
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && currentlyPlaying) {
            updateAudioState(
              currentlyPlaying,
              audioRef.current.currentTime,
              audioRef.current.duration
            );
          }
        }}
      />
    </div>
  );
};

export default AudioLibrary;
