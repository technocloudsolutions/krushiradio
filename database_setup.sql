-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS audio_library;

-- Use the audio_library database
USE audio_library;

-- Drop the existing table if you want to recreate it
DROP TABLE IF EXISTS audio_entries;

-- Create the audio_entries table with the file_name column
CREATE TABLE IF NOT EXISTS audio_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  program_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  audio_url VARCHAR(1024) NOT NULL,  -- Increased length for long URLs
  file_name VARCHAR(255) NOT NULL,    -- Added file_name column
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes to improve query performance
CREATE INDEX idx_date ON audio_entries (date);
CREATE INDEX idx_category ON audio_entries (category);
CREATE INDEX idx_file_name ON audio_entries (file_name);

-- Optional: Add some sample data
INSERT INTO audio_entries (program_name, date, category, description, audio_url, file_name) VALUES
('Sample Program 1', '2023-04-15', 'Music', 'A sample music program', '/uploads/sample1.mp3', 'sample1.mp3'),
('Sample Program 2', '2023-04-16', 'Talk Show', 'A sample talk show', '/uploads/sample2.mp3', 'sample2.mp3');
