const connectToMongo = require('./db');
const express = require('express')
const cors = require('cors');
// Load models to ensure they're registered
require('./models/User');
require('./models/Notes');
require('./models/Message');
require('dotenv').config();

// Connect to MongoDB
connectToMongo();
const app = express();
const PORT = process.env.PORT || 5000;

// Log registered models
const mongoose = require('mongoose');
console.log("Registered MongoDB models:", Object.keys(mongoose.models));

// Configure CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://inotecloud-6kn9.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173' // Vite's default port
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("Blocked origin:", origin);
      callback(null, true); // Still allow all origins for now
    }
  },
  credentials: true
}));

app.use(express.json());  // This is important to parse incoming JSON data

app.get('/',(req,res)=>
    res.send('Hello Danny!')
)
//avialbale routes
// app.use('/api/notes',require("./routes/notes"))
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/messages', require('./routes/messages'));

// Function to start the server on an available port
const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  }).on('error', (err) => {
    console.error('Server error:', err);
  });
};

// Start the server
startServer();
