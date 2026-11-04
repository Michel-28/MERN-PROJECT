const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/sendEmail');

// Helper to sanitize safe user object (never leak password)
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  avatar: user.avatar || '',
  authProvider: user.authProvider || 'local',
  isEmailVerified: user.isEmailVerified !== false,
  createdAt: user.createdAt,
});

// @desc    Register a new user and dispatch 6-digit email OTP
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email format',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirmation password do not match',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    let existingUser = await User.findOne({ email: cleanEmail }).select('+otp.lastSentAt +otp.code +otp.expiresAt');

    // If an account exists and is already verified, reject registration
    if (existingUser && existingUser.isEmailVerified !== false) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // Generate real 6-digit cryptographic OTP
    const rawOtp = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(rawOtp, salt);

    let user;
    if (existingUser && existingUser.isEmailVerified === false) {
      // Reuse existing unverified record so user can re-register or update credentials
      existingUser.name = name.trim();
      existingUser.password = password;
      existingUser.phone = phone ? phone.trim() : '';
      existingUser.otp = {
        code: hashedOtp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
        lastSentAt: new Date(),
        attempts: 0,
      };
      await existingUser.save();
      user = existingUser;
    } else {
      // Create new unverified account
      user = new User({
        name: name.trim(),
        email: cleanEmail,
        password,
        role: 'user',
        phone: phone ? phone.trim() : '',
        isEmailVerified: false,
        otp: {
          code: hashedOtp,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
          lastSentAt: new Date(),
          attempts: 0,
        },
      });
      await user.save();
    }

    // Send real OTP email via Nodemailer
    try {
      await sendVerificationEmail({
        to: cleanEmail,
        name: user.name,
        otp: rawOtp,
      });
    } catch (mailError) {
      // If email sending failed and this was a newly registered unverified user, rollback record
      if (!existingUser) {
        await User.deleteOne({ _id: user._id });
      }
      return res.status(400).json({
        success: false,
        message: `Failed to deliver verification email to ${cleanEmail}. Please ensure the email address is valid and accessible. (${mailError.message})`,
      });
    }

    res.status(201).json({
      success: true,
      requiresOtp: true,
      email: cleanEmail,
      message: 'Registration successful! A 6-digit verification code has been sent to your email. It expires in 5 minutes.',
      user: sanitizeUser(user),
      // In automated test environment, expose test OTP for validation
      ...(process.env.NODE_ENV === 'test' && { testOtp: rawOtp }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 6-digit email OTP and activate account
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit OTP code are required',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code must be exactly 6 digits',
      });
    }

    const user = await User.findOne({ email: cleanEmail }).select('+otp.code +otp.expiresAt +otp.attempts +otp.lastSentAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address',
      });
    }

    if (user.isEmailVerified === true) {
      const token = user.getSignedJwtToken();
      return res.json({
        success: true,
        token,
        user: sanitizeUser(user),
        message: 'Account is already verified. You are now signed in.',
      });
    }

    // Rate limiting: Maximum 5 failed attempts per OTP
    if ((user.otp?.attempts || 0) >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Maximum verification attempts exceeded (5). Please request a new OTP.',
      });
    }

    // Expiry check: 5 minutes limit
    if (!user.otp?.expiresAt || new Date() > new Date(user.otp.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired (5-minute limit). Please request a new OTP.',
      });
    }

    // Check code match
    if (!user.otp?.code) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP found. Please request a new code.',
      });
    }

    const isMatch = await bcrypt.compare(cleanOtp, user.otp.code);
    if (!isMatch) {
      user.otp.attempts = (user.otp.attempts || 0) + 1;
      await user.save();
      const remainingAttempts = 5 - user.otp.attempts;
      return res.status(400).json({
        success: false,
        message: remainingAttempts > 0
          ? `Incorrect verification code. ${remainingAttempts} attempts remaining.`
          : 'Incorrect code. Maximum attempts exceeded. Please request a new OTP.',
      });
    }

    // Successfully verified: activate account and clear OTP
    user.isEmailVerified = true;
    user.otp = undefined;
    await user.save();

    const token = user.getSignedJwtToken();

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      message: 'Email verified successfully! Welcome to TravelEase.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend 6-digit email OTP with 60-second cooldown
// @route   POST /api/v1/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+otp.lastSentAt +otp.code +otp.expiresAt +otp.attempts');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address',
      });
    }

    if (user.isEmailVerified === true) {
      return res.status(400).json({
        success: false,
        message: 'This account is already verified. Please sign in.',
      });
    }

    // Enforce 60-second cooldown
    const now = Date.now();
    if (user.otp?.lastSentAt) {
      const elapsed = now - new Date(user.otp.lastSentAt).getTime();
      const COOLDOWN_MS = 60 * 1000;
      if (elapsed < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          remainingSeconds,
          message: `Please wait ${remainingSeconds} seconds before requesting another verification code.`,
        });
      }
    }

    // Generate new OTP
    const rawOtp = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(rawOtp, salt);

    user.otp = {
      code: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      lastSentAt: new Date(),
      attempts: 0,
    };
    await user.save();

    // Send real email via Nodemailer
    await sendVerificationEmail({
      to: cleanEmail,
      name: user.name,
      otp: rawOtp,
    });

    res.json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
      ...(process.env.NODE_ENV === 'test' && { testOtp: rawOtp }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Verification check:
    // Existing users, admins, and Google users continue logging in without OTP.
    // Only local users with an unverified account (isEmailVerified: false) are gated.
    if (user.role !== 'admin' && user.authProvider !== 'google') {
      if (user.isEmailVerified === false) {
        return res.status(403).json({
          success: false,
          isEmailVerified: false,
          email: user.email,
          message: 'Your email address is not yet verified. Please enter the OTP code sent to your email to activate your account.',
        });
      }
    }

    const token = user.getSignedJwtToken();

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      message: 'Signed in successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Administrator login
// @route   POST /api/v1/auth/admin-login
// @access  Public
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter administrator email and password',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials',
      });
    }

    // Critical security check: verify database stored role
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: This portal is reserved for TravelEase administrators only.',
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Administrator account is deactivated.',
      });
    }

    const token = user.getSignedJwtToken();

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      message: 'Administrator authenticated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();

    res.json({
      success: true,
      user: sanitizeUser(user),
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth login / registration for users and administrators
// @route   POST /api/v1/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential, accessToken, code, role = 'user' } = req.body;

    if (!credential && !accessToken && !code) {
      return res.status(400).json({
        success: false,
        message: 'Real Google authentication credential is required',
      });
    }

    const configuredClientId = process.env.GOOGLE_CLIENT_ID;
    const configuredClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const client = new OAuth2Client(configuredClientId, configuredClientSecret, 'postmessage');
    let googleProfile = null;

    if (code) {
      // Exchange authorization code for tokens using client ID and client secret
      try {
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);
        const ticket = await client.verifyIdToken({
          idToken: tokens.id_token,
          audience: configuredClientId || undefined,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          googleProfile = {
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            avatar: payload.picture || '',
            googleId: payload.sub,
          };
        }
      } catch (codeErr) {
        return res.status(401).json({
          success: false,
          message: 'Failed to exchange Google authorization code: ' + codeErr.message,
        });
      }
    } else if (credential) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: configuredClientId || undefined,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          googleProfile = {
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            avatar: payload.picture || '',
            googleId: payload.sub,
          };
        }
      } catch (verifyErr) {
        // In local automated test runner environment, support decoding test tokens
        if (process.env.NODE_ENV === 'test') {
          const decoded = jwt.decode(credential);
          if (decoded && decoded.email) {
            googleProfile = {
              email: decoded.email,
              name: decoded.name || decoded.email.split('@')[0],
              avatar: decoded.picture || '',
              googleId: decoded.sub || 'test_google_sub',
            };
          }
        }
        if (!googleProfile) {
          return res.status(401).json({
            success: false,
            message: 'Invalid Google authentication token: ' + verifyErr.message,
          });
        }
      }
    } else if (accessToken) {
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          throw new Error('Failed to retrieve user profile from Google');
        }
        const userInfo = await response.json();
        if (userInfo && userInfo.email) {
          googleProfile = {
            email: userInfo.email,
            name: userInfo.name || userInfo.email.split('@')[0],
            avatar: userInfo.picture || '',
            googleId: userInfo.sub,
          };
        }
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Google access token: ' + err.message,
        });
      }
    }

    if (!googleProfile || !googleProfile.email) {
      return res.status(401).json({
        success: false,
        message: 'Unable to verify real Google profile credentials',
      });
    }

    const cleanEmail = googleProfile.email.toLowerCase().trim();
    const isAdminRequested = role === 'admin';

    let user = await User.findOne({ email: cleanEmail });

    // Handle Admin Google Sign-In
    if (isAdminRequested) {
      const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'admin@travelease.com').toLowerCase().trim();

      // If user does not exist in DB but their email matches ADMIN_EMAIL from environment, provision admin account
      if (!user && cleanEmail === configuredAdminEmail) {
        user = await User.create({
          name: googleProfile.name || process.env.ADMIN_NAME || 'System Administrator',
          email: cleanEmail,
          password: crypto.randomBytes(32).toString('hex'),
          role: 'admin',
          avatar: googleProfile.avatar || '',
          googleId: googleProfile.googleId || '',
          authProvider: 'google',
        });
      }

      // Check if user has admin privileges
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: This Google account is not registered as an administrator. Administrator accounts cannot be created publicly.',
        });
      }

      if (user.accountStatus !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Administrator account has been deactivated.',
        });
      }

      // Sync avatar or googleId if present
      let changed = false;
      if (googleProfile.avatar && !user.avatar) {
        user.avatar = googleProfile.avatar;
        changed = true;
      }
      if (googleProfile.googleId && !user.googleId) {
        user.googleId = googleProfile.googleId;
        changed = true;
      }
      if (changed) {
        await user.save();
      }

      const token = user.getSignedJwtToken();
      return res.json({
        success: true,
        token,
        user: sanitizeUser(user),
        message: `Welcome, Administrator ${user.name}!`,
      });
    }

    // Handle Traveler / Normal User Google Sign-In
    if (!user) {
      // Create new user account automatically via Google Auth
      user = await User.create({
        name: googleProfile.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: crypto.randomBytes(32).toString('hex'),
        role: 'user',
        avatar: googleProfile.avatar || '',
        googleId: googleProfile.googleId || '',
        authProvider: 'google',
        isEmailVerified: true,
      });
    } else {
      if (user.accountStatus !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        });
      }

      let changed = false;
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        changed = true;
      }
      if (googleProfile.avatar && !user.avatar) {
        user.avatar = googleProfile.avatar;
        changed = true;
      }
      if (googleProfile.googleId && !user.googleId) {
        user.googleId = googleProfile.googleId;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    const token = user.getSignedJwtToken();
    return res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      message: `Signed in successfully with Google! Welcome, ${user.name}.`,
    });
  } catch (error) {
    next(error);
  }
};
