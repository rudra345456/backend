const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Simple JWT secret for testing
const JWT_SECRET = process.env.JWT_SECRET;

// Debug middleware
router.use((req, res, next) => {
  console.log('Google Auth Route:', req.method, req.path);
  next();
});

passport.use(new GoogleStrategy({
  clientID: "671075165204-a276lberq6udpq7idobtdsou5crkc99g.apps.googleusercontent.com",
  clientSecret: "YOUR_GOOGLE_CLIENT_SECRET", // Replace with your actual client secret
  callbackURL: "http://localhost:5000/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google profile received:', {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName
    });

    // Always create or update user
    const user = await User.findOneAndUpdate(
      { googleId: profile.id },
      {
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName
      },
      { upsert: true, new: true }
    );

    console.log('User created/updated:', user);
    return done(null, user);
  } catch (error) {
    console.error('Error in Google strategy:', error);
    return done(error, null);
  }
}));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google login route
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Google callback route
router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { 
      failureRedirect: '/login',
      session: false 
    })(req, res, next);
  },
  (req, res) => {
    try {
      if (!req.user) {
        throw new Error('No user found after authentication');
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: req.user._id,
          email: req.user.email
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      const frontendUrl = 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?token=${token}`);
    } catch (error) {
      console.error('Error in callback:', error);
      res.redirect('http://localhost:3000/login?error=Authentication failed');
    }
  }
);

module.exports = router; 