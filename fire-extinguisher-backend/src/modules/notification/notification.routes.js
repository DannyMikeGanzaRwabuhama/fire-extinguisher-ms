const express = require('express');
const { query } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticateToken } = require('../../middleware/auth');
const notificationController = require('./notification.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Personal user notifications
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         userId:
 *           type: integer
 *           example: 4
 *         message:
 *           type: string
 *           example: "Dear Regular, an inspection for extinguisher EXT-002 at Kitchen Area has been scheduled."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-06-03T10:12:00.000Z"
 *         isRead:
 *           type: boolean
 *           example: false
 *     NotificationListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notification'
 *         total:
 *           type: integer
 *           example: 1
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         totalPages:
 *           type: integer
 *           example: 1
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Retrieve personal notifications (Authenticated users sees own only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationListResponse'
 */
router.get('/', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], notificationController.getMyNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read (Owner only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       404:
 *         description: Notification not found or access denied
 */
router.put('/:id/read', [
  authenticateToken
], notificationController.markAsRead);

module.exports = router;
