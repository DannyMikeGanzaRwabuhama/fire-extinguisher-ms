const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const { generateToken } = require('../../config/jwt');
const { generateOTP } = require('../../utils/otp');
const { sendOTPEmail } = require('../../config/email');

const register = async (req, res, next) => {
  const { firstName, lastName, email, password, phone } = req.body;
  const userRole = 'ROLE_USER';

  try {
    // Check if email already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        status: 409,
        message: 'Conflict: Email already registered.',
        timestamp: new Date().toISOString(),
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (first_name, last_name, email, password, role, phone, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, first_name, last_name, email, role, phone`,
      [firstName, lastName, email, hashedPassword, userRole, phone || null, false]
    );

    const user = result.rows[0];
    const otp = generateOTP();

    await db.query(
      `INSERT INTO otp_tokens (user_id, email, otp, type, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '10 minutes')`,
      [user.id, email, otp, 'EMAIL_VERIFICATION']
    );

    await sendOTPEmail(email, otp, 'EMAIL_VERIFICATION');

    res.status(200).json({
      message: "OTP sent to your email. Please verify.",
      email: email
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: 401,
        message: 'Unauthorized: Invalid email or password.',
        timestamp: new Date().toISOString(),
      });
    }

    if (user.is_verified === false) {
      return res.status(403).json({
        status: 403,
        message: "Email not verified. Please check your email for the OTP.",
        timestamp: new Date().toISOString(),
      });
    }

    const token = generateToken(user.id, user.role);

    res.status(200).json({
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  const { firstName, lastName, phone } = req.body;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, phone = $3 
       WHERE id = $4 
       RETURNING id, first_name, last_name, email, role, phone`,
      [firstName, lastName, phone || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'User not found.',
        timestamp: new Date().toISOString(),
      });
    }

    const user = result.rows[0];
    res.status(200).json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  try {
    const userResult = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({
        status: 401,
        message: 'Unauthorized: Invalid current password.',
        timestamp: new Date().toISOString(),
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, userId]);

    res.status(200).json({
      status: 200,
      message: 'Password changed successfully.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    const otpResult = await db.query(
      `SELECT * FROM otp_tokens 
       WHERE email = $1 AND type = $2 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, 'EMAIL_VERIFICATION']
    );

    const token = otpResult.rows[0];

    if (!token) {
      return res.status(400).json({
        status: 400,
        message: "Invalid or expired OTP",
        timestamp: new Date().toISOString(),
      });
    }

    if (token.otp !== otp) {
      return res.status(400).json({
        status: 400,
        message: "Incorrect OTP",
        timestamp: new Date().toISOString(),
      });
    }

    await db.query('UPDATE users SET is_verified = true WHERE email = $1', [email]);
    await db.query('UPDATE otp_tokens SET used = true WHERE id = $1', [token.id]);

    const userResult = await db.query(
      'SELECT id, first_name, last_name, email, role, phone FROM users WHERE email = $1',
      [email]
    );
    const user = userResult.rows[0];
    const jwtToken = generateToken(user.id, user.role);

    res.status(200).json({
      token: jwtToken,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "No account with that email",
        timestamp: new Date().toISOString(),
      });
    }

    const otp = generateOTP();

    await db.query(
      `INSERT INTO otp_tokens (user_id, email, otp, type, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '10 minutes')`,
      [user.id, email, otp, 'PASSWORD_RESET']
    );

    await sendOTPEmail(email, otp, 'PASSWORD_RESET');

    res.status(200).json({
      message: "Password reset OTP sent to your email.",
      email: email,
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  try {
    const otpResult = await db.query(
      `SELECT * FROM otp_tokens 
       WHERE email = $1 AND type = $2 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, 'PASSWORD_RESET']
    );

    const token = otpResult.rows[0];

    if (!token || token.otp !== otp) {
      return res.status(400).json({
        status: 400,
        message: "Invalid or expired OTP",
        timestamp: new Date().toISOString(),
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1 WHERE email = $2', [hashed, email]);
    await db.query('UPDATE otp_tokens SET used = true WHERE id = $1', [token.id]);

    res.status(200).json({
      message: "Password reset successful. Please login.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  updateProfile,
  changePassword,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
