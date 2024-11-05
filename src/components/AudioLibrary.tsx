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

  const handleDownload = async (url: string, fileName: string) => {
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
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-green-800 mb-2">
        ගහකොල අතරේ හුස්ම හොයනා රේඩියෝ යාත්‍රිකයා 
        </h2>
        <p className="text-green-600">
          Discover and listen to our curated agricultural radio programs
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          type="search"
          placeholder="Search Krushiradio programs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Input
          type="date"
          placeholder="Start Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full md:w-auto"
        />
        <Input
          type="date"
          placeholder="End Date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full md:w-auto"
        />
      </div>
      <div className="mb-6">
        <CategoryFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {paginatedEntries.map((entry) => (
              <Card
                key={entry.id}
                className="overflow-hidden transition-shadow duration-300 ease-in-out hover:shadow-lg bg-gradient-to-br from-green-50 to-green-100"
              >
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-green-700 font-bold text-lg">
                      {getInitials(entry.program_name)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {entry.program_name}
                      </CardTitle>
                      <p className="text-sm opacity-75">
                        {entry.category} •{" "}
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <p
                      className={`text-green-800 ${
                        !expandedDescriptions.includes(entry.id) &&
                        "line-clamp-2"
                      }`}
                    >
                      {entry.description}
                    </p>
                    {entry.description.length > 100 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleDescription(entry.id)}
                        className="mt-1 p-0 h-auto font-normal text-black hover:text-gray-700"
                      >
                        {expandedDescriptions.includes(entry.id) ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Read Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Read More
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {currentlyPlaying === entry.id && audioStates[entry.id] && (
                    <div className="mb-4">
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
                  <div className="flex items-center justify-between gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePlay(entry.id, entry.audio_url)} 
                      className="flex-1 bg-white text-black border-black hover:bg-gray-100"
                    >
                      {currentlyPlaying === entry.id ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {currentlyPlaying === entry.id ? 'Pause' : 'Play'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleShare(entry)} 
                      className="bg-white text-black border-black hover:bg-gray-100 w-10 h-10 p-0"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => handleDownload(entry.audio_url, entry.file_name || `${entry.program_name}.mp3`)}
                      className="bg-white text-black border-black hover:bg-gray-100 w-10 h-10 p-0"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 flex justify-center items-center space-x-4">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="border-green-500 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-green-700 font-medium">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, pageCount))
              }
              disabled={currentPage === pageCount}
              variant="outline"
              className="border-green-500 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {isShareModalOpen && shareData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Share Program</h3>
                  <button 
                    onClick={() => setIsShareModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex justify-center space-x-4 mb-4">
                  <FacebookShareButton url={shareData.url}>
                    <FacebookIcon size={32} round />
                  </FacebookShareButton>
                  
                  <TwitterShareButton url={shareData.url} title={shareData.title}>
                    <TwitterIcon size={32} round />
                  </TwitterShareButton>
                  
                  <WhatsappShareButton url={shareData.url} title={shareData.title}>
                    <WhatsappIcon size={32} round />
                  </WhatsappShareButton>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Or copy link:</p>
                  <div className="flex">
                    <input
                      type="text"
                      value={shareData.url}
                      readOnly
                      className="flex-1 p-2 border rounded-l text-sm"
                    />
                    <button
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(shareData.url).then(() => {
                            const notification = document.createElement('div');
                            notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg';
                            notification.textContent = 'Link copied to clipboard!';
                            document.body.appendChild(notification);
                            
                            setTimeout(() => {
                              document.body.removeChild(notification);
                            }, 2000);
                          });
                        } catch (error) {
                          console.error('Failed to copy:', error);
                          alert('Failed to copy link. Please try again.');
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-r hover:bg-green-700 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
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
