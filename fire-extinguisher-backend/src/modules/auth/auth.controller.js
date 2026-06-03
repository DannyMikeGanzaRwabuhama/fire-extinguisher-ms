const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const { generateToken } = require('../../config/jwt');

const register = async (req, res, next) => {
  const { firstName, lastName, email, password, role, phone } = req.body;
  const userRole = role || 'ROLE_USER';

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
      `INSERT INTO users (first_name, last_name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, first_name, last_name, email, role, phone`,
      [firstName, lastName, email, hashedPassword, userRole, phone || null]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.role);

    res.status(201).json({
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

module.exports = {
  register,
  login,
  updateProfile,
  changePassword,
};
