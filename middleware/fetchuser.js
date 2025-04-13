const jwt = require("jsonwebtoken");
require("dotenv").config();
const secretKey = process.env.SECRET_KEY; // Use the same secret key

const fetchuser = (req, res, next) => {
    // Get User from JWT token and add id to the req object
    const token = req.header("auth-token");
    console.log("Received token:", token ? token.substring(0, 15) + "..." : "None");
    console.log("Secret key:", secretKey ? "Present" : "Missing");
    
    if (!token) {
        console.log("Authentication failed: No token provided");
        return res
            .status(401)
            .send({ error: "Please authenticate using a valid token", errorType: "no_token" });
    }

    try {
        const data = jwt.verify(token, secretKey); // Use consistent key
        console.log("Token verified successfully. Decoded data:", data);
        
        // Check if token is near expiration (less than 10 minutes remaining)
        const expirationTime = data.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeRemaining = expirationTime - currentTime;
        
        if (timeRemaining < 600000) { // Less than 10 minutes
            console.log("Token is about to expire in", Math.round(timeRemaining/60000), "minutes");
            // Add a flag to the response headers to inform the client
            res.set('X-Token-Expiring-Soon', 'true');
            res.set('X-Token-Expires-In', Math.round(timeRemaining/1000));
        }
        
        req.user = data.user;
        console.log("Middleware - User ID:", req.user.id);

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log("Token has expired");
            return res
                .status(401)
                .send({ 
                    error: "Your session has expired. Please log in again.", 
                    errorType: "token_expired" 
                });
        } else {
            console.log("Token verification failed:", error.message);
            return res
                .status(401)
                .send({ 
                    error: "Please authenticate using a valid token", 
                    errorType: "invalid_token"
                });
        }
    }
};

module.exports = fetchuser;
