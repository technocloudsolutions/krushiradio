'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Radio, Settings, BarChart, LogOut, Download, Play, Calendar, TrendingUp, Users, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAnalytics } from '../../../lib/analytics';

interface Program {
  id: number;
  program_name: string;
  date: string;
  category: string;
  description: string;
  audio_url: string;
}

interface AnalyticsData {
  totalPrograms: number;
  totalDownloads: number;
  totalPlays: number;
  recentUploads: {
    date: string;
    count: number;
  }[];
  categoryDistribution: {
    category: string;
    count: number;
    percentage: number;
  }[];
  mostPlayed: {
    program_name: string;
    plays: number;
  }[];
  mostDownloaded: {
    program_name: string;
    downloads: number;
  }[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalPrograms: 0,
    totalDownloads: 0,
    totalPlays: 0,
    recentUploads: [],
    categoryDistribution: [],
    mostPlayed: [],
    mostDownloaded: []
  });

  useEffect(() => {
    fetchAnalytics();
    // Refresh analytics every 5 minutes
    const interval = setInterval(fetchAnalytics, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/audio');
      const programs: Program[] = await response.json();

      // Get analytics data
      const analytics = getAnalytics();

      const totalPrograms = programs.length;
      const totalDownloads = Object.values(analytics.downloads).reduce((a, b) => a + b, 0);
      const totalPlays = Object.values(analytics.plays).reduce((a, b) => a + b, 0);

      // Calculate category distribution with percentages
      const categoryDistribution = Array.from(
        programs.reduce((acc: Map<string, number>, program: Program) => {
          acc.set(program.category, (acc.get(program.category) || 0) + 1);
          return acc;
        }, new Map()),
        ([category, count]) => ({
          category,
          count,
          percentage: (count / totalPrograms) * 100
        })
      ).sort((a, b) => b.count - a.count);

      // Get recent uploads for the last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7));
      
      const recentUploads = Array.from(
        programs
          .filter(program => new Date(program.date) >= sevenDaysAgo)
          .reduce((acc: Map<string, number>, program: Program) => {
            const date = program.date.split('T')[0];
            acc.set(date, (acc.get(date) || 0) + 1);
            return acc;
          }, new Map()),
        ([date, count]) => ({ date, count })
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Get most played and downloaded programs
      const mostPlayed = programs
        .map(program => ({
          program_name: program.program_name,
          plays: analytics.plays[program.id] || 0
        }))
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 5);

      const mostDownloaded = programs
        .map(program => ({
          program_name: program.program_name,
          downloads: analytics.downloads[program.id] || 0
        }))
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, 5);

      setAnalyticsData({
        totalPrograms,
        totalDownloads,
        totalPlays,
        recentUploads,
        categoryDistribution,
        mostPlayed,
        mostDownloaded
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-green-800 mb-8">Admin Panel</h2>
          <nav className="space-y-2">
            <Link 
              href="/admin"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 rounded-lg transition-colors"
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
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 rounded-lg transition-colors bg-green-50"
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
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <BarChart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-base text-gray-600 mt-1">Track your program statistics and performance</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-green-600">Loading analytics...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="transform hover:scale-105 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Radio className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                        Programs
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {analyticsData.totalPrograms}
                    </h3>
                    <p className="text-base font-medium text-gray-600">Total Programs</p>
                  </CardContent>
                </Card>

                <Card className="transform hover:scale-105 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Download className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                        Downloads
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {analyticsData.totalDownloads.toLocaleString()}
                    </h3>
                    <p className="text-base font-medium text-gray-600">Total Downloads</p>
                  </CardContent>
                </Card>

                <Card className="transform hover:scale-105 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full">
                        Plays
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {analyticsData.totalPlays.toLocaleString()}
                    </h3>
                    <p className="text-base font-medium text-gray-600">Total Plays</p>
                  </CardContent>
                </Card>
              </div>

              {/* Most Popular Programs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="border-b border-gray-100 bg-gray-50">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                      <Play className="w-5 h-5 text-purple-600" />
                      Most Played Programs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {analyticsData.mostPlayed.map((program, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <span className="text-gray-700 font-medium truncate flex-1">
                            {program.program_name}
                          </span>
                          <span className="text-purple-600 font-semibold bg-purple-50 px-3 py-1 rounded-full ml-2">
                            {program.plays} plays
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="border-b border-gray-100 bg-gray-50">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                      <Download className="w-5 h-5 text-blue-600" />
                      Most Downloaded Programs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {analyticsData.mostDownloaded.map((program, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <span className="text-gray-700 font-medium truncate flex-1">
                            {program.program_name}
                          </span>
                          <span className="text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full ml-2">
                            {program.downloads} downloads
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Distribution */}
              <Card>
                <CardHeader className="border-b border-gray-100 bg-gray-50">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Category Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {analyticsData.categoryDistribution.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-medium text-gray-800">
                            {category.category}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-base font-bold text-green-600 bg-green-50 px-4 py-1.5 rounded-full">
                              {category.count} programs
                            </span>
                            <span className="text-sm font-medium text-gray-500 w-16 text-right">
                              {category.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-gray-100">
                            <div
                              className="bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out rounded-full"
                              style={{ width: `${category.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 