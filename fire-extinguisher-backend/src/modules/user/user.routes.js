const express = require('express');
const { query } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const userController = require('./user.controller');

const router = express.Router();

router.get('/', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], userController.getAllUsers);

router.put('/:id/promote', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN'),
  validate
], userController.promoteUser);

module.exports = router;
