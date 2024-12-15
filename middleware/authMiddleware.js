import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

// Middleware to protect routes by verifying the JWT token.
const protect = async (req, res, next) => {
  try {
    // First, check if the token is passed in the Authorization header (Bearer scheme)
    let token = req.headers.authorization?.split(' ')[1] || req.cookies.jwt;

    // If no token is provided, return an error (401 Unauthorized)
    if (!token) {
      res.status(401);
      throw new Error('Authentication failed: Token not provided.');
    }

    // Verify the JWT token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // If the token is invalid or expired, clear the cookie and throw an error
    if (!decodedToken) {
      res.clearCookie('jwt'); // Clear the JWT cookie
      res.status(401);
      throw new Error('Authentication failed: Invalid token.');
    }

    // Find the user from the database using the userId from the decoded token
    req.user = await User.findById(decodedToken.userId).select('-password');
    
    // If the user is not found, clear the cookie and throw an error
    if (!req.user) {
      res.clearCookie('jwt'); // Clear the JWT cookie if the user is not found
      res.status(401);
      throw new Error('Authentication failed: User not found.');
    }

    // Continue to the next middleware
    next();
  } catch (error) {
    // Handle different JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      res.clearCookie('jwt'); // Clear the JWT cookie on token error
      res.status(401).json({ message: 'Authentication failed: Invalid token.' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.clearCookie('jwt'); // Clear the JWT cookie if the token has expired
      res.status(401).json({ message: 'Authentication failed: Token expired.' });
    } else {
      res.status(401).json({ message: error.message || 'Authentication failed' });
    }
  }
};

// Middleware to check if the user is an admin.
const admin = (req, res, next) => {
  try {
    // Check if the user is an admin
    if (!req.user || !req.user.isAdmin) {
      res.status(401);
      throw new Error('Authorization failed: Not authorized as an admin.');
    }
    next();
  } catch (error) {
    res.status(401).json({ message: error.message || 'Authorization failed' });
  }
};

export { protect, admin };
