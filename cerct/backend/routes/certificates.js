/**
 * Certificate Routes
 * Comprehensive routing for certificate management operations
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, requirePermission } = require('../../middleware/auth/roleAuth');
const { PERMISSIONS } = require('../../constants/roles');
const { validateInput } = require('../../middleware/security/security');
const { body, param, query } = require('express-validator');
const CertificateController = require('../../controllers/CertificateController');
const FileService = require('../../services/FileService');

// Configure multer for file uploads
const upload = FileService.getUploadMiddleware('files', 10);

// Validation schemas
const createCertificateSchema = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('issuer').trim().notEmpty().withMessage('Issuer is required').isLength({ min: 2, max: 100 }).withMessage('Issuer must be between 2 and 100 characters'),
  body('issueDate').isISO8601().withMessage('Issue date must be a valid date'),
  body('expiryDate').optional().isISO8601().withMessage('Expiry date must be a valid date'),
  body('credentialId').optional().isString().withMessage('Credential ID must be a string'),
  body('credentialUrl').optional().isURL().withMessage('Credential URL must be a valid URL'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  body('visible').optional().isBoolean().withMessage('Visible must be a boolean'),
  body('featured').optional().isBoolean().withMessage('Featured must be a boolean')
];

const updateCertificateSchema = [
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('issuer').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Issuer must be between 2 and 100 characters'),
  body('issueDate').optional().isISO8601().withMessage('Issue date must be a valid date'),
  body('expiryDate').optional().isISO8601().withMessage('Expiry date must be a valid date'),
  body('credentialId').optional().isString().withMessage('Credential ID must be a string'),
  body('credentialUrl').optional().isURL().withMessage('Credential URL must be a valid URL'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  body('visible').optional().isBoolean().withMessage('Visible must be a boolean'),
  body('featured').optional().isBoolean().withMessage('Featured must be a boolean')
];

const idParamSchema = [
  param('id').isMongoId().withMessage('Invalid certificate ID')
];

const listQuerySchema = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isString().withMessage('Sort must be a string'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  query('visible').optional().isBoolean().withMessage('Visible must be a boolean'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean')
];

// CRUD Routes
router.get('/', 
  authenticate, 
  requirePermission(PERMISSIONS.READ_CONTENT), 
  validateInput(listQuerySchema),
  CertificateController.getAllCertificates
);

router.post('/', 
  authenticate, 
  requirePermission(PERMISSIONS.CREATE_CONTENT), 
  validateInput(createCertificateSchema),
  CertificateController.createCertificate
);

router.get('/statistics', 
  authenticate, 
  requirePermission(PERMISSIONS.READ_CONTENT), 
  CertificateController.getStatistics
);

router.get('/:id', 
  authenticate, 
  requirePermission(PERMISSIONS.READ_CONTENT), 
  validateInput(idParamSchema),
  CertificateController.getCertificateById
);

router.put('/:id', 
  authenticate, 
  requirePermission(PERMISSIONS.UPDATE_CONTENT), 
  validateInput([...idParamSchema, ...updateCertificateSchema]),
  CertificateController.updateCertificate
);

router.delete('/:id', 
  authenticate, 
  requirePermission(PERMISSIONS.DELETE_CONTENT), 
  validateInput(idParamSchema),
  CertificateController.deleteCertificate
);

router.patch('/:id/visibility', 
  authenticate, 
  requirePermission(PERMISSIONS.UPDATE_CONTENT), 
  validateInput([
    ...idParamSchema,
    body('visible').isBoolean().withMessage('Visible must be a boolean')
  ]),
  CertificateController.toggleVisibility
);

router.patch('/:id/featured', 
  authenticate, 
  requirePermission(PERMISSIONS.UPDATE_CONTENT), 
  validateInput([
    ...idParamSchema,
    body('featured').isBoolean().withMessage('Featured must be a boolean')
  ]),
  CertificateController.toggleFeatured
);

// File Management Routes
router.post('/:id/files', 
  authenticate, 
  requirePermission(PERMISSIONS.UPDATE_CONTENT), 
  validateInput(idParamSchema),
  upload,
  CertificateController.uploadFiles
);

router.delete('/:id/files/:fileId', 
  authenticate, 
  requirePermission(PERMISSIONS.DELETE_CONTENT), 
  validateInput([
    ...idParamSchema,
    param('fileId').isMongoId().withMessage('Invalid file ID')
  ]),
  CertificateController.deleteFile
);

// Data Extraction Route
router.post('/extract-details', 
  authenticate, 
  requirePermission(PERMISSIONS.UPDATE_CONTENT),
  FileService.getSingleUploadMiddleware('file'),
  CertificateController.extractDetails
);

// Report Management Routes
router.post('/:id/reports', 
  authenticate, 
  requirePermission(PERMISSIONS.UPDATE_CONTENT), 
  validateInput([
    ...idParamSchema,
    body('title').trim().notEmpty().withMessage('Report title is required'),
    body('type').optional().isIn(['text', 'file', 'link']).withMessage('Invalid report type'),
    body('content').optional().isString().withMessage('Content must be a string')
  ]),
  CertificateController.createReport
);

router.get('/:id/reports', 
  authenticate, 
  requirePermission(PERMISSIONS.READ_CONTENT), 
  validateInput([
    ...idParamSchema,
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ]),
  CertificateController.getReports
);

// With-Files Creation Route (combines upload, extraction, and creation)
router.post('/with-files', 
  authenticate, 
  requirePermission(PERMISSIONS.CREATE_CONTENT),
  upload,
  validateInput(createCertificateSchema),
  CertificateController.createCertificateWithFiles
);

module.exports = router;
