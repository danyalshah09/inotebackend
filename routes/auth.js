const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");

require("dotenv").config();
const secretKey = process.env.SECRET_KEY;



//User Creation Route
router.post(
  "/createuser",
  [
    body("email").isEmail().withMessage("Enter a valid email").escape(),
    body("name")
      .isLength({ min: 5 })
      .withMessage("Name must be at least 5 characters long"),
    body("password")
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if the user already exists
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }
      const salt = await bcrypt.genSalt(10);
      const secPassword = await bcrypt.hash(req.body.password, salt);

      // Create a new user
      user = await User.create({
        name: req.body.name,
        password: secPassword, // Corrected assignment
        email: req.body.email,
      });

      const data = {
        user: {
          id: user.id,
        },
      };
      const token = jwt.sign(data, secretKey, { expiresIn: "1h" });
      console.log("Generated Token:", token); // Logs the generated token
      return res
        .status(201)
        .json({ message: "User created successfully", user });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Internal Server Error", message: err.message });
    }
  }
);

// User login route
// User login route
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Enter a valid email").escape(),
    body("password")
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if the user exists
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ error: "Invalid email or password" });
      }

      // Compare passwords
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res
          .status(400)
          .json({ error: "Invalid email or password" });
      }

      // Generate token
      const data = {
        user: {
          id: user.id,
        },
      };

      const token = jwt.sign(data, secretKey, { expiresIn: "24h" });
      
      console.log("Login successful for user:", user.name);

      // Return token and user name
      return res.status(200).json({ 
        authToken: token,
        name: user.name 
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Get User Details route
router.post("/getuser", fetchuser, async (req, res) => {
    try {
        const userId = req.user.id; // Corrected variable name
        const user = await User.findById(userId).select("-password"); // Corrected chain
        console.log("User data being sent:", user);
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res
            .status(500)
            .json({ error: "Internal Server Error", message: err.message });
    }
});

// Test Token route - GET /api/auth/verify-token
router.get("/verify-token", fetchuser, async (req, res) => {
    try {
        return res.json({ 
            success: true, 
            message: "Token is valid", 
            userId: req.user.id 
        });
    } catch (err) {
        console.error(err.message);
        res
            .status(500)
            .json({ error: "Internal Server Error", message: err.message });
    }
});


module.exports = router;
