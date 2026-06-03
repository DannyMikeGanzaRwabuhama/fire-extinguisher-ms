const express = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticateToken } = require('../../middleware/auth');
const authController = require('./auth.controller');

const router = express.Router();

router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['ROLE_USER', 'ROLE_INSPECTOR', 'ROLE_ADMIN']).withMessage('Invalid role specified'),
  body('phone').optional().trim(),
  validate
], authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], authController.login);

router.put('/profile', [
  authenticateToken,
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('phone').optional().trim(),
  validate
], authController.updateProfile);

router.put('/change-password', [
  authenticateToken,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  validate
], authController.changePassword);

module.exports = router;
