'use client';

import React, { useState, FormEvent, useRef } from 'react';
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Upload, X } from 'lucide-react';

interface Program {
  id: number;
  program_name: string;
  date: string;
  category: string;
  description: string;
  audio_url: string;
}

interface AudioFormProps {
  onAddAudio: (formData: FormData) => Promise<Response>;
  onCancel: () => void;
  editingProgram?: Program | null;
}

export default function AudioForm({ onAddAudio, onCancel, editingProgram }: AudioFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    programName: editingProgram?.program_name || '',
    date: editingProgram?.date || '',
    category: editingProgram?.category || '',
    description: editingProgram?.description || ''
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select an audio file');
        setSelectedFile(null);
        e.target.value = '';
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Add the file manually to ensure it's properly attached
      if (selectedFile) {
        formData.set('audioFile', selectedFile);
      }

      if (editingProgram) {
        formData.append('id', editingProgram.id.toString());
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await onAddAudio(formData);
      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to submit form');
      }

      setUploadProgress(100);
      if (formRef.current) {
        formRef.current.reset();
      }
      setSelectedFile(null);
      onCancel();
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-bold text-gray-900">
          {editingProgram ? 'Edit Program' : 'Add New Program'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="programName" className="text-sm font-medium text-gray-700">
              Program Name
            </Label>
            <Input
              id="programName"
              name="programName"
              value={formData.programName}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-gray-900"
              placeholder="Enter program name"
            />
          </div>

          <div>
            <Label htmlFor="date" className="text-sm font-medium text-gray-700">
              Date
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-gray-900"
            />
          </div>

          <div>
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">
              Category
            </Label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="text-gray-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-gray-900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audioFile" className="text-sm font-medium text-gray-700">
              Audio File
            </Label>
            <div className="mt-1">
              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label
                        htmlFor="audioFile"
                        className="cursor-pointer text-sm text-gray-600 hover:text-gray-500"
                      >
                        <span className="text-green-600 hover:text-green-500 font-medium">
                          Upload an audio file
                        </span>
                        <Input
                          id="audioFile"
                          name="audioFile"
                          type="file"
                          ref={fileInputRef}
                          accept="audio/*"
                          onChange={handleFileChange}
                          required={!editingProgram}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      MP3, WAV up to 300MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                  <span className="text-sm text-gray-900 truncate">{selectedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeSelectedFile}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                {uploadProgress === 100 ? 'Upload complete!' : `Uploading... ${uploadProgress}%`}
              </p>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md border border-red-200">
              Error: {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || (!editingProgram && !selectedFile)}
              className="bg-green-600 hover:bg-green-700 text-white disabled:bg-green-300"
            >
              {isSubmitting ? 'Uploading...' : editingProgram ? 'Update' : 'Add Program'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const categories = [
  "Randiyawara (Rangiri Sri Lanka)",
  "Aswenna (SLBC Kandurata)",
  "Boradiya Mankada (Rangiri Sri Lanka)",
  "Krushi Charika (SLBC Kandurata)",
  "முகடுகள் - Muhaduhal (SLBC Kandurata)",
  "குறிஞ்சிமலர்கள் - Kurinji Malarhal (SLBC Kandurata)",
  "Sarusaara Udesana (Krushi Radio)",
  "Haritha Mansala (Krushi Radio)",
  "Awarjana (Krushi Radio)",
  "Krushi News (Krushi Radio)",
  "Lunch Time Radio (Krushi Radio)",
  "Crop Clinic (Krushi Radio)",
  "Hathara Athe (Krushi Radio)",
  "Sannasa Krushi Puwath",
  "Kadhamalla",
  "Aswedduma",
  "Thirasara",
  "Kethmini Dam",
  "Ruhunu Gewaththa",
  "Krushi Palasa",
  "Krushi Adisi",
  "Koratuwa",
  "Govisara",
  "வயலும் வளமும்",
  "உழவர் இல்லம்",
  "வண்ணமகுதம்",
  "வீட்டுத்தோட்டம்",
  "Short massages",
  "Govithenata Payak (SLBC Colombo)",
  "Govi Gedara (SLBC Colombo)",
  "Sannasa",
  "Ranketha Addara",
  "Seilama",
  "Rasogaya",
  "Rajaratai Govi Bimai",
  "Saarabhoomi",
  "Saruketha",
  "Liyasaraniya",
  "Govijana Madala",
  "Thuneththa",
  "Kalavita",
  "Govi Dathata ape saviya"
].sort();
