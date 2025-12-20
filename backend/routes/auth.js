const express = require('express');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const azureAdConfig = require('../config/azureAd');
const { getConnection } = require('../config/database');

const router = express.Router();

// Configure Passport to use Azure AD
passport.use(new OIDCStrategy(azureAdConfig, async (iss, sub, profile, accessToken, refreshToken, done) => {
  if (!profile.oid) {
    return done(new Error('No OID found in user profile.'));
  }

  try {
    // Create user object
    const user = {
      id: profile.oid,
      email: profile._json.email || profile._json.preferred_username,
      name: profile.displayName,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName
    };

    // Save user to database
    const pool = await getConnection();
    
    // Check if user exists
    const existingUser = await pool.request()
      .input('azureId', user.id)
      .query('SELECT * FROM Users WHERE azureId = @azureId');
    
    if (existingUser.recordset.length > 0) {
      // Update last login
      await pool.request()
        .input('azureId', user.id)
        .query('UPDATE Users SET lastLogin = GETDATE(), updatedAt = GETDATE() WHERE azureId = @azureId');
    } else {
      // Insert new user
      await pool.request()
        .input('azureId', user.id)
        .input('email', user.email)
        .input('name', user.name)
        .input('firstName', user.firstName)
        .input('lastName', user.lastName)
        .query(`
          INSERT INTO Users (azureId, email, name, firstName, lastName, role, lastLogin)
          VALUES (@azureId, @email, @name, @firstName, @lastName, 'Recruiter', GETDATE())
        `);
    }

    return done(null, user);
  } catch (error) {
    console.error('Error saving user to database:', error);
    return done(null, user); // Continue even if DB save fails
  }
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
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}?authenticated=true`);
  }
);

// Get current user
router.get('/user', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('azureId', req.user.id)
        .query('SELECT azureId, email, name, firstName, lastName, role, lastLogin FROM Users WHERE azureId = @azureId');
      
      if (result.recordset.length > 0) {
        const dbUser = result.recordset[0];
        res.json({
          authenticated: true,
          user: {
            id: dbUser.azureId,
            email: dbUser.email,
            name: dbUser.name,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            role: dbUser.role,
            lastLogin: dbUser.lastLogin
          }
        });
      } else {
        res.json({
          authenticated: true,
          user: req.user
        });
      }
    } catch (error) {
      console.error('Error fetching user from database:', error);
      res.json({
        authenticated: true,
        user: req.user
      });
    }
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
