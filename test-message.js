const mongoose = require('mongoose');
const connectToMongo = require('./db');

// Load models
require('./models/User');
require('./models/Message');

async function testMessageCreation() {
  // Connect to MongoDB
  await connectToMongo();
  
  console.log("Connected to MongoDB");
  console.log("Registered models:", Object.keys(mongoose.models));
  
  const Message = mongoose.model('Message');
  
  try {
    // Create a test message
    const message = new Message({
      content: "Test message from script",
      user: "67ede9a830aa53c1cf7d33b5", // Use an existing user ID from your database
      userName: "Test User",
    });
    
    console.log("Message object created:", message);
    
    // Save the message
    const savedMessage = await message.save();
    console.log("Message saved successfully:", savedMessage);
    
    // Verify message was saved by fetching it
    const messages = await Message.find().sort({ date: -1 }).limit(5);
    console.log("Recent messages:", messages);
  } catch (error) {
    console.error("Error creating message:", error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the test
testMessageCreation(); 