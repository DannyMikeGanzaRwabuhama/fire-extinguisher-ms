const express = require('express');
const { body, query } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const inspectionController = require('./inspection.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Inspections
 *   description: Maintenance inspections logging and scheduling
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Inspection:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         userId:
 *           type: integer
 *           example: 4
 *         extinguisherId:
 *           type: integer
 *           example: 2
 *         inspectorId:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         inspectionDate:
 *           type: string
 *           format: date
 *           example: "2026-07-15"
 *         inspectionTime:
 *           type: string
 *           example: "10:00:00"
 *         status:
 *           type: string
 *           enum: [SCHEDULED, ONGOING, COMPLETED, CANCELLED]
 *           example: "SCHEDULED"
 *     InspectionListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Inspection'
 *         total:
 *           type: integer
 *           example: 3
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
 * /api/inspections:
 *   post:
 *     summary: Schedule a new extinguisher inspection (Admin/Inspector/User)
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - extinguisherId
 *               - inspectionDate
 *               - inspectionTime
 *             properties:
 *               extinguisherId:
 *                 type: integer
 *               inspectorId:
 *                 type: integer
 *                 nullable: true
 *               inspectionDate:
 *                 type: string
 *                 format: date
 *               inspectionTime:
 *                 type: string
 *                 example: "10:00"
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, ONGOING, COMPLETED, CANCELLED]
 *     responses:
 *       201:
 *         description: Inspection scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inspection'
 *       409:
 *         description: Conflict - already scheduled at the specified date/time
 */
router.post('/', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN', 'ROLE_INSPECTOR', 'ROLE_USER'),
  body('extinguisherId').isInt().withMessage('Extinguisher ID must be an integer'),
  body('inspectorId').optional({ nullable: true }).isInt().withMessage('Inspector ID must be an integer'),
  body('inspectionDate').isISO8601().withMessage('Inspection date must be a valid date'),
  body('inspectionTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Inspection time must be in HH:MM or HH:MM:SS format'),
  body('status').optional().isIn(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
  validate
], inspectionController.createInspection);

/**
 * @swagger
 * /api/inspections:
 *   get:
 *     summary: Retrieve a list of inspections (All Users)
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, ONGOING, COMPLETED, CANCELLED]
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
 *               $ref: '#/components/schemas/InspectionListResponse'
 */
router.get('/', [
  authenticateToken,
  query('status').optional().isIn(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status filter'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], inspectionController.getAllInspections);

/**
 * @swagger
 * /api/inspections/{id}:
 *   get:
 *     summary: Retrieve inspection by ID (All Users)
 *     tags: [Inspections]
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
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inspection'
 *       404:
 *         description: Inspection not found
 */
router.get('/:id', [
  authenticateToken
], inspectionController.getInspectionById);

/**
 * @swagger
 * /api/inspections/{id}:
 *   put:
 *     summary: Update inspection status (Admin/Inspector only)
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, ONGOING, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Inspection status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inspection'
 *       404:
 *         description: Inspection not found
 */
router.put('/:id', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN', 'ROLE_INSPECTOR'),
  body('status').isIn(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']).withMessage('Status must be SCHEDULED, ONGOING, COMPLETED, or CANCELLED'),
  validate
], inspectionController.updateInspectionStatus);

module.exports = router;
