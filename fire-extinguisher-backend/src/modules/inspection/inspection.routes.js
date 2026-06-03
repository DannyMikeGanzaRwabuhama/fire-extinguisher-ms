const express = require('express');
const { body, query } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const inspectionController = require('./inspection.controller');

const router = express.Router();

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

router.get('/', [
  authenticateToken,
  query('status').optional().isIn(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status filter'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], inspectionController.getAllInspections);

router.get('/:id', [
  authenticateToken
], inspectionController.getInspectionById);

router.put('/:id', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN', 'ROLE_INSPECTOR'),
  body('status').isIn(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']).withMessage('Status must be SCHEDULED, ONGOING, COMPLETED, or CANCELLED'),
  validate
], inspectionController.updateInspectionStatus);

module.exports = router;
