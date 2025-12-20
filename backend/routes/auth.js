const express = require('express');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const azureAdConfig = require('../config/azureAd');

const router = express.Router();

// Configure Passport to use Azure AD
passport.use(new OIDCStrategy(azureAdConfig, (iss, sub, profile, accessToken, refreshToken, done) => {
  if (!profile.oid) {
    return done(new Error('No OID found in user profile.'));
  }

  // Here you can save user to database or session
  const user = {
    id: profile.oid,
    email: profile._json.email || profile._json.preferred_username,
    name: profile.displayName,
    firstName: profile.name?.givenName,
    lastName: profile.name?.familyName
  };

  return done(null, user);
}));

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Login route - initiates Azure AD authentication
router.get('/login', 
  passport.authenticate('azuread-openidconnect', { 
    failureRedirect: '/auth/error',
    session: true
  })
);

// Callback route - Azure AD redirects here after authentication
router.post('/callback',
  passport.authenticate('azuread-openidconnect', { 
    failureRedirect: '/auth/error',
    session: true
  }),
  (req, res) => {
    // Successful authentication, redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?authenticated=true`);
  }
);

// Get current user
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: req.user
    });
  } else {
    res.json({
      authenticated: false,
      user: null
    });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session destruction failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
});

// Error route
router.get('/error', (req, res) => {
  res.status(401).json({ 
    error: 'Authentication failed',
    message: 'Unable to authenticate with Azure AD'
  });
});

module.exports = router;
