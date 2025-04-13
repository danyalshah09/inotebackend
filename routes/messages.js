const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Message = require("../models/Message");
const fetchuser = require("../middleware/fetchuser");
const User = require("../models/User");

// Route 1: Get all messages - GET /api/messages/all
router.get("/all", async (req, res) => {
  try {
    const messages = await Message.find().sort({ date: -1 });
    res.json(messages);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Route 2: Add a new message - POST /api/messages/add
router.post(
  "/add",
  fetchuser,
  [body("content").notEmpty().withMessage("Message content cannot be empty")],
  async (req, res) => {
    try {
      console.log("POST /api/messages/add route hit");
      console.log("Request body:", req.body);
      console.log("User ID from token:", req.user.id);
      
      // Check if Message model exists
      const mongoose = require('mongoose');
      console.log("Available models:", Object.keys(mongoose.models));
      if (!mongoose.models.Message) {
        console.error("Message model is not registered!");
        return res.status(500).json({ error: "Message model not found" });
      }
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        console.log("User not found with ID:", req.user.id);
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log("User found:", user.name);

      const { content } = req.body;
      try {
        const message = new Message({
          content,
          user: req.user.id,
          userName: user.name,
        });

        console.log("Message object created:", message);
        const savedMessage = await message.save();
        console.log("Message saved successfully:", savedMessage._id);
        res.json(savedMessage);
      } catch (modelError) {
        console.error("Error creating or saving message:", modelError);
        return res.status(500).json({ error: "Error saving message", details: modelError.message });
      }
    } catch (error) {
      console.error("Error in add message route:", error.message);
      console.error("Full error:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Route 3: Update a message - PUT /api/messages/update/:id
router.put(
  "/update/:id",
  fetchuser,
  [body("content").notEmpty().withMessage("Message content cannot be empty")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content } = req.body;
      const newMessage = {};
      if (content) {
        newMessage.content = content;
      }

      // Find the message to be updated
      let message = await Message.findById(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Check if user owns this message
      if (message.user.toString() !== req.user.id) {
        return res.status(401).json({ error: "Not authorized" });
      }

      message = await Message.findByIdAndUpdate(
        req.params.id,
        { $set: newMessage },
        { new: true }
      );
      res.json(message);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Route 4: Delete a message - DELETE /api/messages/delete/:id
router.delete("/delete/:id", fetchuser, async (req, res) => {
  try {
    // Find the message to be deleted
    let message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user owns this message
    if (message.user.toString() !== req.user.id) {
      return res.status(401).json({ error: "Not authorized" });
    }

    message = await Message.findByIdAndDelete(req.params.id);
    res.json({ success: "Message deleted", message });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Route 5: Add a reply to a message - POST /api/messages/reply/:id
router.post(
  "/reply/:id",
  fetchuser,
  [body("content").notEmpty().withMessage("Reply content cannot be empty")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { content } = req.body;
      const reply = {
        content,
        user: req.user.id,
        userName: user.name,
        date: Date.now()
      };

      // Find the message to add reply to
      let message = await Message.findById(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      message = await Message.findByIdAndUpdate(
        req.params.id,
        { $push: { replies: reply } },
        { new: true }
      );
      res.json(message);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Route 6: Like a message - PUT /api/messages/like/:id
router.put("/like/:id", fetchuser, async (req, res) => {
  try {
    console.log("Like message request received for message ID:", req.params.id);
    console.log("User ID:", req.user.id);
    
    // Find the message to be liked
    let message = await Message.findById(req.params.id);
    if (!message) {
      console.log("Message not found");
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user has already liked this message
    const userIndex = message.likedBy.findIndex(userId => 
      userId.toString() === req.user.id
    );
    
    if (userIndex >= 0) {
      console.log("User has already liked this message");
      return res.status(400).json({ 
        error: "You have already liked this message",
        alreadyLiked: true
      });
    }

    // Add user to likedBy array and increment likes count
    message = await Message.findByIdAndUpdate(
      req.params.id,
      { 
        $inc: { likes: 1 },
        $push: { likedBy: req.user.id }
      },
      { new: true }
    );
    
    console.log("Message liked successfully");
    res.json(message);
  } catch (error) {
    console.error("Error liking message:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Route 7: Unlike a message - PUT /api/messages/unlike/:id
router.put("/unlike/:id", fetchuser, async (req, res) => {
  try {
    console.log("Unlike message request received for message ID:", req.params.id);
    console.log("User ID:", req.user.id);
    
    // Find the message to be unliked
    let message = await Message.findById(req.params.id);
    if (!message) {
      console.log("Message not found");
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user has liked this message
    const userIndex = message.likedBy.findIndex(userId => 
      userId.toString() === req.user.id
    );
    
    if (userIndex === -1) {
      console.log("User has not liked this message");
      return res.status(400).json({ 
        error: "You have not liked this message",
        notLiked: true
      });
    }

    // Remove user from likedBy array and decrement likes count
    message = await Message.findByIdAndUpdate(
      req.params.id,
      { 
        $inc: { likes: -1 },
        $pull: { likedBy: req.user.id }
      },
      { new: true }
    );
    
    console.log("Message unliked successfully");
    res.json(message);
  } catch (error) {
    console.error("Error unliking message:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router; 