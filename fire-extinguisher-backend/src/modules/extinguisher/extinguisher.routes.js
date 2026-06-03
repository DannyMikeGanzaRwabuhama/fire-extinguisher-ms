const express = require('express');
const { body, query } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const extinguisherController = require('./extinguisher.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Extinguishers
 *   description: Fire extinguisher inventory management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Extinguisher:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         serialNumber:
 *           type: string
 *           example: "EXT-001"
 *         location:
 *           type: string
 *           example: "Main Hall A"
 *         type:
 *           type: string
 *           enum: [WATER, CO2, FOAM, DRY_CHEMICAL]
 *           example: "CO2"
 *         size:
 *           type: string
 *           enum: [2.5LBS, 5LBS, 9LBS, 12LBS]
 *           example: "5LBS"
 *         installationDate:
 *           type: string
 *           format: date
 *           example: "2025-01-15"
 *         expiryDate:
 *           type: string
 *           format: date
 *           example: "2028-01-15"
 *         status:
 *           type: string
 *           enum: [OPERATIONAL, EXPIRED, DECOMMISSIONED]
 *           example: "OPERATIONAL"
 *     ExtinguisherListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Extinguisher'
 *         total:
 *           type: integer
 *           example: 5
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
 * /api/extinguishers:
 *   post:
 *     summary: Create a new fire extinguisher (Admin/Inspector)
 *     tags: [Extinguishers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serialNumber
 *               - location
 *               - type
 *               - size
 *               - installationDate
 *               - expiryDate
 *             properties:
 *               serialNumber:
 *                 type: string
 *               location:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [WATER, CO2, FOAM, DRY_CHEMICAL]
 *               size:
 *                 type: string
 *                 enum: [2.5LBS, 5LBS, 9LBS, 12LBS]
 *               installationDate:
 *                 type: string
 *                 format: date
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [OPERATIONAL, EXPIRED, DECOMMISSIONED]
 *     responses:
 *       201:
 *         description: Extinguisher created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Extinguisher'
 *       409:
 *         description: Extinguisher with this serial number already exists
 */
router.post('/', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN', 'ROLE_INSPECTOR'),
  body('serialNumber').trim().notEmpty().withMessage('Serial number is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('type').isIn(['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL']).withMessage('Invalid extinguisher type'),
  body('size').isIn(['2.5LBS', '5LBS', '9LBS', '12LBS']).withMessage('Invalid extinguisher size'),
  body('installationDate').isISO8601().withMessage('Installation date must be a valid date'),
  body('expiryDate').isISO8601().withMessage('Expiry date must be a valid date'),
  body('status').optional().isIn(['OPERATIONAL', 'EXPIRED', 'DECOMMISSIONED']).withMessage('Invalid status'),
  validate
], extinguisherController.createExtinguisher);

/**
 * @swagger
 * /api/extinguishers:
 *   get:
 *     summary: Retrieve a paginated list of extinguishers (All Users)
 *     tags: [Extinguishers]
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
 *               $ref: '#/components/schemas/ExtinguisherListResponse'
 */
router.get('/', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], extinguisherController.getAllExtinguishers);

/**
 * @swagger
 * /api/extinguishers/{id}:
 *   get:
 *     summary: Retrieve extinguisher by ID (All Users)
 *     tags: [Extinguishers]
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
 *               $ref: '#/components/schemas/Extinguisher'
 *       404:
 *         description: Extinguisher not found
 */
router.get('/:id', [
  authenticateToken,
  validate
], extinguisherController.getExtinguisherById);

/**
 * @swagger
 * /api/extinguishers/{id}:
 *   put:
 *     summary: Update an extinguisher (Admin/Inspector)
 *     tags: [Extinguishers]
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
 *             properties:
 *               serialNumber:
 *                 type: string
 *               location:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [WATER, CO2, FOAM, DRY_CHEMICAL]
 *               size:
 *                 type: string
 *                 enum: [2.5LBS, 5LBS, 9LBS, 12LBS]
 *               installationDate:
 *                 type: string
 *                 format: date
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [OPERATIONAL, EXPIRED, DECOMMISSIONED]
 *     responses:
 *       200:
 *         description: Extinguisher updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Extinguisher'
 *       404:
 *         description: Extinguisher not found
 */
router.put('/:id', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN', 'ROLE_INSPECTOR'),
  body('serialNumber').optional().trim().notEmpty().withMessage('Serial number cannot be empty'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('type').optional().isIn(['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL']).withMessage('Invalid extinguisher type'),
  body('size').optional().isIn(['2.5LBS', '5LBS', '9LBS', '12LBS']).withMessage('Invalid extinguisher size'),
  body('installationDate').optional().isISO8601().withMessage('Installation date must be a valid date'),
  body('expiryDate').optional().isISO8601().withMessage('Expiry date must be a valid date'),
  body('status').optional().isIn(['OPERATIONAL', 'EXPIRED', 'DECOMMISSIONED']).withMessage('Invalid status'),
  validate
], extinguisherController.updateExtinguisher);

/**
 * @swagger
 * /api/extinguishers/{id}:
 *   delete:
 *     summary: Delete an extinguisher (Admin only)
 *     tags: [Extinguishers]
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
 *         description: Extinguisher deleted successfully
 *       404:
 *         description: Extinguisher not found
 */
router.delete('/:id', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN')
], extinguisherController.deleteExtinguisher);

module.exports = router;
