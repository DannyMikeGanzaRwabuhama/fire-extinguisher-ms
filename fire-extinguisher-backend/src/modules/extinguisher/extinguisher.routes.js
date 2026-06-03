const express = require('express');
const { body, query } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const extinguisherController = require('./extinguisher.controller');

const router = express.Router();

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

router.get('/', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  validate
], extinguisherController.getAllExtinguishers);

router.get('/:id', [
  authenticateToken,
  validate
], extinguisherController.getExtinguisherById);

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

router.delete('/:id', [
  authenticateToken,
  authorizeRoles('ROLE_ADMIN')
], extinguisherController.deleteExtinguisher);

module.exports = router;
