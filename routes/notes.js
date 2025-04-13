const mongoose = require("mongoose");

const express = require('express');
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const Note = require("../models/Notes");
const { body, validationResult } = require("express-validator");

// Get All the notes route
router.get('/fetchallnotes', fetchuser, async (req, res) => {
  try {
      console.log("Fetching notes for user:", req.user.id);
      const notes = await Note.find({ user: req.user.id });
      console.log("Fetched notes:", notes);
      res.json(notes);
  } catch (error) {
      console.error("Error fetching notes:", error.message);
      res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// Add a new note using post
router.post('/addnote', fetchuser, [
    body('title', 'Enter a valid title').isLength({ min: 3 }),
    body('description', 'Description must be atleast 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    try {
        const { title, description, tag } = req.body;

        // If there are errors, return Bad request and the errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const note = new Note({
            title, description, tag, user: req.user.id
        });
        const savedNote = await note.save()

        res.json(savedNote)

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Update a note using PUT
router.put('/updatenote/:id', fetchuser, async (req, res) => {
    const { title, description, tag } = req.body;
    try {
        // Create a newNote object
        const newNote = {};
        if (title) { newNote.title = title };
        if (description) { newNote.description = description };
        if (tag) { newNote.tag = tag };

        // Find the note to be updated and update it
        let note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).send("Not Found") }

        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }
        note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true })
        res.json({ note });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Route to Delete a note 
router.delete('/deletenote/:id', async (req, res) => {
  try {
      const noteId = req.params.id;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(noteId)) {
          return res.status(400).json({ error: "Invalid note ID" });
      }

      // Find and delete the note
      const note = await Note.findByIdAndDelete(noteId);

      if (!note) {
          return res.status(404).json({ error: "Note not found" });
      }

      res.json({ success: "Note deleted successfully", note });
  } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
  }
});

module.exports = router;