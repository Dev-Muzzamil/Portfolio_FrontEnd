/**
 * Report Service - Certificate Reports Management
 * Handles report creation, updates, and management for certificates
 */

const Certificate = require('../../models/content/Certificate');
const FileService = require('./FileService');
const AuditLog = require('../../models/system/AuditLog');

class ReportService {
  /**
   * Create a new report for certificate
   */
  static async createReport(contentType, contentId, reportData, userId) {
    try {
      const certificate = await Certificate.findById(contentId);
      
      if (!certificate) {
        throw new Error('Certificate not found');
      }

      const report = {
        title: reportData.title,
        description: reportData.description || '',
        type: reportData.type || 'text',
        content: reportData.content || '',
        file: reportData.file || null,
        visible: reportData.visible !== false,
        createdAt: new Date(),
        createdBy: userId
      };

      certificate.reports.push(report);
      await certificate.save();

      await AuditLog.create({
        userId,
        action: 'CREATE_REPORT',
        entityType: 'certificate',
        entityId: contentId,
        newValue: report,
        ipAddress: '127.0.0.1',
        userAgent: 'System'
      });

      return {
        success: true,
        report: certificate.reports[certificate.reports.length - 1]
      };
    } catch (error) {
      console.error('Create report error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload report files
   */
  static async uploadReportFiles(contentType, contentId, files, userId) {
    try {
      const certificate = await Certificate.findById(contentId);
      
      if (!certificate) {
        throw new Error('Certificate not found');
      }

      const uploadResult = await FileService.uploadCertificateFiles(files, contentId);
      
      if (uploadResult.success) {
        const reports = uploadResult.files.map(file => ({
          title: file.originalName,
          description: '',
          type: 'file',
          file: {
            url: file.url,
            publicId: file.publicId,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size
          },
          visible: true,
          createdAt: new Date(),
          createdBy: userId
        }));

        certificate.reports.push(...reports);
        await certificate.save();

        await AuditLog.create({
          userId,
          action: 'UPLOAD_REPORT_FILES',
          entityType: 'certificate',
          entityId: contentId,
          newValue: reports,
          ipAddress: '127.0.0.1',
          userAgent: 'System'
        });

        return {
          success: true,
          reports: certificate.reports.slice(-reports.length)
        };
      } else {
        throw new Error(uploadResult.error);
      }
    } catch (error) {
      console.error('Upload report files error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update report
   */
  static async updateReport(contentType, contentId, reportId, updateData, userId) {
    try {
      const certificate = await Certificate.findById(contentId);
      
      if (!certificate) {
        throw new Error('Certificate not found');
      }

      const report = certificate.reports.id(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      Object.assign(report, updateData);
      await certificate.save();

      await AuditLog.create({
        userId,
        action: 'UPDATE_REPORT',
        entityType: 'certificate',
        entityId: contentId,
        newValue: report,
        ipAddress: '127.0.0.1',
        userAgent: 'System'
      });

      return {
        success: true,
        report
      };
    } catch (error) {
      console.error('Update report error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete report
   */
  static async deleteReport(contentType, contentId, reportId, userId) {
    try {
      const certificate = await Certificate.findById(contentId);
      
      if (!certificate) {
        throw new Error('Certificate not found');
      }

      const report = certificate.reports.id(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Delete file from Cloudinary if exists
      if (report.file && report.file.publicId) {
        await FileService.deleteFile(report.file.publicId);
      }

      certificate.reports.pull(reportId);
      await certificate.save();

      await AuditLog.create({
        userId,
        action: 'DELETE_REPORT',
        entityType: 'certificate',
        entityId: contentId,
        newValue: { reportId },
        ipAddress: '127.0.0.1',
        userAgent: 'System'
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('Delete report error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get reports
   */
  static async getReports(contentType, contentId, queryOptions = {}) {
    try {
      const certificate = await Certificate.findById(contentId);
      
      if (!certificate) {
        throw new Error('Certificate not found');
      }

      let reports = certificate.reports;

      if (queryOptions.visible !== undefined) {
        reports = reports.filter(r => r.visible === queryOptions.visible);
      }

      const page = queryOptions.page || 1;
      const limit = queryOptions.limit || 10;
      const skip = (page - 1) * limit;

      const paginatedReports = reports.slice(skip, skip + limit);

      return {
        success: true,
        reports: paginatedReports,
        pagination: {
          total: reports.length,
          page,
          limit,
          pages: Math.ceil(reports.length / limit)
        }
      };
    } catch (error) {
      console.error('Get reports error:', error);
      return {
        success: false,
        error: error.message,
        reports: []
      };
    }
  }

  /**
   * Toggle report visibility
   */
  static async toggleReportVisibility(contentType, contentId, reportId, visible, userId) {
    try {
      const certificate = await Certificate.findById(contentId);
      
      if (!certificate) {
        throw new Error('Certificate not found');
      }

      const report = certificate.reports.id(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      report.visible = visible;
      await certificate.save();

      await AuditLog.create({
        userId,
        action: 'TOGGLE_REPORT_VISIBILITY',
        entityType: 'certificate',
        entityId: contentId,
        newValue: { reportId, visible },
        ipAddress: '127.0.0.1',
        userAgent: 'System'
      });

      return {
        success: true,
        report
      };
    } catch (error) {
      console.error('Toggle report visibility error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get report statistics
   */
  static async getReportStatistics(contentType, contentId) {
    try {
      const certificate = await Certificate.findById(contentId);
      
      if (!certificate) {
        throw new Error('Certificate not found');
      }

      const stats = {
        total: certificate.reports.length,
        visible: certificate.reports.filter(r => r.visible).length,
        hidden: certificate.reports.filter(r => !r.visible).length,
        byType: {}
      };

      certificate.reports.forEach(report => {
        stats.byType[report.type] = (stats.byType[report.type] || 0) + 1;
      });

      return {
        success: true,
        statistics: stats
      };
    } catch (error) {
      console.error('Get report statistics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ReportService;
