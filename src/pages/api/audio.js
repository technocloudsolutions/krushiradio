import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import pool from '../../lib/db';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new IncomingForm();
    form.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    form.keepExtensions = true;

    try {
      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      });

      const { programName, date, category, description } = fields;
      const audioFile = files.audioFile;

      if (!audioFile || !audioFile[0]) {
        console.error('No audio file uploaded');
        return res.status(400).json({ error: 'No audio file uploaded' });
      }

      // Ensure the uploads directory exists
      await fs.mkdir(form.uploadDir, { recursive: true });

      // Generate a unique filename
      const uniqueFilename = `${Date.now()}-${audioFile[0].originalFilename}`;
      const newFilePath = path.join(form.uploadDir, uniqueFilename);

      // Move the uploaded file to the uploads directory
      await fs.rename(audioFile[0].filepath, newFilePath);

      console.log('Audio file saved at:', newFilePath);

      const audioUrl = `/uploads/${uniqueFilename}`;
      console.log('Audio URL:', audioUrl);

      const [result] = await pool.query(
        'INSERT INTO audio_entries (program_name, date, category, description, audio_url) VALUES (?, ?, ?, ?, ?)',
        [programName[0], date[0], category[0], description[0], audioUrl]
      );

      // Check if the file exists after moving
      const fileExists = await fs.access(newFilePath).then(() => true).catch(() => false);
      console.log('File exists after moving:', fileExists);

      res.status(201).json({ 
        message: 'Audio entry added successfully', 
        id: result.insertId, 
        audioUrl,
        fileExists,
        fullPath: newFilePath
      });
    } catch (error) {
      console.error('Error adding audio entry:', error);
      res.status(500).json({ error: 'Error adding audio entry: ' + error.message });
    }
  } else if (req.method === 'GET') {
    try {
      const [rows] = await pool.query('SELECT * FROM audio_entries ORDER BY date DESC');
      const entriesWithFileCheck = await Promise.all(rows.map(async (row) => {
        const filePath = path.join(process.cwd(), 'public', row.audio_url);
        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        return { 
          ...row, 
          fileExists,
          audio_url: row.audio_url.startsWith('/') ? row.audio_url : `/${row.audio_url}`
        };
      }));
      console.log('Entries with file check:', entriesWithFileCheck);
      res.status(200).json(entriesWithFileCheck);
    } catch (error) {
      console.error('Error fetching audio entries:', error);
      res.status(500).json({ error: 'Error fetching audio entries: ' + error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
