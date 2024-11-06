'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Radio, Settings, BarChart, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    siteTitle: 'Krushi Radio',
    maxFileSize: '300'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/');
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
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
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 rounded-lg transition-colors bg-green-50"
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Title
                  </label>
                  <Input
                    type="text"
                    value={settings.siteTitle}
                    onChange={(e) => setSettings(prev => ({ ...prev, siteTitle: e.target.value }))}
                    className="max-w-md"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum File Size (MB)
                  </label>
                  <Input
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxFileSize: e.target.value }))}
                    className="max-w-md"
                  />
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 