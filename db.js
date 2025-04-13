const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection URI - will use Atlas connection string from environment variables
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inotecloud';

const connectToMongo = () => {
  mongoose
    .connect(mongoURI, {
      // Atlas connection sometimes needs these options
      serverSelectionTimeoutMS: 5000
    })
    .then(() => {
      console.log('Connected to MongoDB Atlas successfully');
    })
    .catch((error) => {
      console.error('Error connecting to MongoDB:', error.message);
    });
};

module.exports = connectToMongo;
