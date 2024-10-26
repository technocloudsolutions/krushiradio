'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface AudioFormProps {
  onAddAudio: (formData: FormData) => Promise<Response>;
}

const AudioForm: React.FC<AudioFormProps> = ({ onAddAudio }) => {
  const [formData, setFormData] = useState({
    programName: '',
    date: '',
    category: '',
    description: '',
    audioFile: null as File | null,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prevData) => ({ ...prevData, audioFile: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        formDataToSend.append(key, value);
      }
    });
    try {
      const response = await onAddAudio(formDataToSend);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add audio entry');
      }
      alert('Audio entry added successfully!');
      // Reset the form after successful submission
      setFormData({
        programName: '',
        date: '',
        category: '',
        description: '',
        audioFile: null,
      });
    } catch (error: unknown) {
      console.error('Error adding audio entry:', error);
      alert(`Failed to add audio entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
        <CardTitle className="text-2xl font-bold">Add New Audio Program</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="programName" className="text-white">Program Name</Label>
            <Input
              id="programName"
              name="programName"
              value={formData.programName}
              onChange={handleChange}
              required
              className="bg-gray-700 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-white">Date</Label>
            <Input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="bg-gray-700 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category" className="text-white">Category</Label>
            <Input
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="bg-gray-700 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="bg-gray-700 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audioFile" className="text-white">Audio File</Label>
            <Input
              type="file"
              id="audioFile"
              name="audioFile"
              onChange={handleFileChange}
              required
              accept="audio/*"
              className="bg-gray-700 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-600 file:text-white
                hover:file:bg-indigo-700"
            />
          </div>
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
            Add Audio
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AudioForm;
