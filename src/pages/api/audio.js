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
    const form = new IncomingForm();
    form.keepExtensions = true;

    try {
      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      });

      const { id, programName, date, category, description } = fields;

      let url = null;
      let uniqueFilename = null;
      const audioFile = files.audioFile;

      if (audioFile) {
        const filePath = audioFile[0].filepath;
        uniqueFilename = `${Date.now()}-${audioFile[0].originalFilename}`;
        const storageRef = ref(storage, "audio/" + uniqueFilename);

        const fileBuffer = fs.readFileSync(filePath);

        url = await uploadBytes(storageRef, fileBuffer, {
          contentType: audioFile[0].mimetype,
        })
          .then((snapshot) => {
            console.log("File uploaded to:", snapshot.ref.fullPath);
            return getDownloadURL(storageRef);
          })
          .catch((error) => {
            console.error("Error uploading file:", error);
            throw error;
          });
      }

      if (req.method === "POST") {
        const [result] = await pool.query(
          "INSERT INTO audio_entries (program_name, date, category, description, audio_url, file_name) VALUES (?, ?, ?, ?, ?, ?)",
          [
            programName[0],
            date[0],
            category[0],
            description[0],
            url,
            uniqueFilename,
          ]
        );
        res.status(201).json({
          message: "Audio entry added successfully",
          id: result.insertId,
        });
      } else if (req.method === "PUT") {
        if (url) {
          deleteFileById(id[0]);
        }

        const updateQuery = url
          ? "UPDATE audio_entries SET program_name = ?, date = ?, category = ?, description = ?, audio_url = ?, file_name = ? WHERE id = ?"
          : "UPDATE audio_entries SET program_name = ?, date = ?, category = ?, description = ? WHERE id = ?";

        const updateParams = url
          ? [
              programName[0],
              date[0],
              category[0],
              description[0],
              url,
              uniqueFilename,
              id[0],
            ]
          : [programName[0], date[0], category[0], description[0], id[0]];

        await pool.query(updateQuery, updateParams);
        res.status(200).json({ message: "Audio entry updated successfully" });
      }

      fs.unlinkSync(filePath);
    } catch (error) {
      console.error("Error processing audio entry:", error);
      res
        .status(500)
        .json({ error: "Error processing audio entry: " + error.message });
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
  const [rows] = await pool.query(
    "SELECT file_name FROM audio_entries WHERE id = ?",
    [id]
  );

  if (rows.length > 0) {
    const fileName = rows[0].file_name;
    if (fileName) {
      const storageRef = ref(storage, "audio/" + fileName);
      await deleteObject(storageRef);
    }
  }
}
