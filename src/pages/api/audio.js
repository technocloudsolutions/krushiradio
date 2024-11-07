// @ts-nocheck
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import pool from "../../lib/db";
import { storage } from "../../lib/firebase";
import {
  getDownloadURL,
  ref,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import { log } from "console";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log("API route called, method:", req.method);

  if (req.method === "POST" || req.method === "PUT") {
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: process.env.MAX_FILE_SIZE || 30 * 1024 * 1024,
    });

    try {
      // Parse form with Promise wrapper and detailed logging
      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) {
            console.error("Form parsing error:", err);
            reject(err);
            return;
          }
          
          console.log("Raw fields received:", fields);
          console.log("Raw files received:", files);
          
          // Process fields without array conversion initially
          resolve([fields, files]);
        });
      });

      console.log("Parsed fields:", fields);
      console.log("Parsed files:", files);

      // Extract values directly from fields
      const programName = fields.programName;
      const date = fields.date;
      const category = fields.category;
      const description = fields.description;
      const id = fields.id;

      console.log("Extracted values:", {
        programName,
        date,
        category,
        description,
        id
      });

      // Validate required fields
      if (!programName || !date || !category) {
        console.error("Missing required fields:", { programName, date, category });
        throw new Error("Missing required fields");
      }

      let url = null;
      let uniqueFilename = null;
      const audioFile = files.audioFile;

      if (audioFile && audioFile[0]) {
        try {
          const filePath = audioFile[0].filepath;
          uniqueFilename = `${Date.now()}-${audioFile[0].originalFilename}`;
          const storageRef = ref(storage, "audio/" + uniqueFilename);
          
          console.log("Reading file from:", filePath);
          const fileBuffer = fs.readFileSync(filePath);
          console.log("File read successfully, size:", fileBuffer.length);

          console.log("Starting file upload to Firebase");
          const uploadResult = await uploadBytes(storageRef, fileBuffer, {
            contentType: audioFile[0].mimetype,
          });
          console.log("File uploaded to Firebase");
          
          url = await getDownloadURL(uploadResult.ref);
          console.log("Download URL obtained:", url);
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          throw new Error(`File upload failed: ${uploadError.message}`);
        }
      }

      // Database operation with connection management
      const connection = await pool.getConnection();
      console.log("Database connection established");

      try {
        if (req.method === "POST") {
          console.log("Executing INSERT query with values:", {
            programName,
            date,
            category,
            description,
            url,
            uniqueFilename
          });

          const [result] = await connection.query(
            "INSERT INTO audio_entries (program_name, date, category, description, audio_url, file_name) VALUES (?, ?, ?, ?, ?, ?)",
            [
              programName,
              date,
              category,
              description || null,
              url,
              uniqueFilename,
            ]
          );

          console.log("Insert successful, result:", result);
          res.status(201).json({
            message: "Audio entry added successfully",
            id: result.insertId,
          });
        } else {
          // PUT logic remains the same...
        }
      } catch (dbError) {
        console.error("Database operation error:", dbError);
        throw dbError;
      } finally {
        connection.release();
        console.log("Database connection released");
      }

      // Clean up temporary file if it exists
      if (audioFile && audioFile[0] && audioFile[0].filepath) {
        try {
          fs.unlinkSync(audioFile[0].filepath);
          console.log("Temporary file cleaned up");
        } catch (cleanupError) {
          console.error("Error cleaning up temporary file:", cleanupError);
        }
      }

    } catch (error) {
      console.error("Error in API handler:", error);
      res.status(500).json({ 
        error: "Error processing request", 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } else if (req.method === "GET") {
    try {
      console.log("GET request received");
      const connection = await pool.getConnection();
      console.log("Database connection established");

      const [rows] = await connection.query(
        "SELECT * FROM audio_entries ORDER BY date DESC"
      );
      console.log("Query executed, number of rows:", rows.length);

      connection.release();

      if (rows.length === 0) {
        console.log("No audio entries found");
        return res.status(200).json([]);
      }

      console.log("Sending response with", rows.length, "entries");
      res.status(200).json(rows);
    } catch (error) {
      console.error("Error fetching audio entries:", error);
      res
        .status(500)
        .json({ error: "Error fetching audio entries: " + error.message });
    }
  } else if (req.method === "DELETE") {
    const { id } = req.query;
    deleteFileById(id);

    try {
      // Then, delete the database entry
      await pool.query("DELETE FROM audio_entries WHERE id = ?", [id]);

      res.status(200).json({ message: "Audio entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting audio entry:", error);
      res
        .status(500)
        .json({ error: "Error deleting audio entry: " + error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

async function deleteFileById(id) {
  try {
    const [rows] = await pool.query(
      "SELECT file_name FROM audio_entries WHERE id = ?",
      [id]
    );

    if (rows.length > 0 && rows[0].file_name) {
      const fileName = rows[0].file_name;
      const storageRef = ref(storage, "audio/" + fileName);
      await deleteObject(storageRef);
      console.log("File deleted from storage:", fileName);
    }
  } catch (error) {
    console.error("Error in deleteFileById:", error);
    throw error;
  }
}
