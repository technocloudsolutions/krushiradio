import { storage } from "../../lib/firebase";
import { ref, getDownloadURL } from "firebase/storage";
import fetch from 'node-fetch';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, fileName } = req.body;

    // Fetch the file from Firebase
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch file from storage');
    }

    // Get the file content
    const fileBuffer = await response.buffer();

    // Set appropriate headers for download
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    // Send the file
    res.send(fileBuffer);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
} 