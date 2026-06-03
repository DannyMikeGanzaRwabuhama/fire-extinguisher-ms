const express = require('express');
const { query } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticateToken } = require('../../middleware/auth');
const notificationController = require('./notification.controller');

const router = express.Router();

router.get('/', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], notificationController.getMyNotifications);

router.put('/:id/read', [
  authenticateToken
], notificationController.markAsRead);

module.exports = router;
