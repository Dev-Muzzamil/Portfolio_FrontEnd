# Certificate Management System - Complete Code Index

## Quick Navigation Guide

This directory contains a complete, production-ready certificate management system with PDF extraction, autofill, file management, and comprehensive documentation.

## 📁 Directory Structure

### Backend (`/backend`)
- **`models/Certificate.js`** - Complete Mongoose schema with methods and statics
- **`controllers/CertificateController.js`** - Request handlers for all operations
- **`services/`**
  - `PDFService.js` - PDF/OCR processing and data extraction
  - `FileService.js` - File upload/download/management
  - `ReportService.js` - Report creation and management
- **`routes/certificates.js`** - API routing with validation
- **`validators/`** - Input validation schemas

### Frontend (`/frontend`)
- **`components/CertificatesManagementUnified.js`** - Main admin interface
- **`services/CertificateService.js`** - API client
- **`hooks/useCertificates.js`** - Custom React hooks
- **`utils/certificateHelpers.js`** - Utility functions
- **`contexts/CertificateContext.js`** - State management

### Documentation
- **`README.md`** - Complete user and developer guide
- **`ARCHITECTURE.md`** - System architecture and diagrams
- **`INDEX.md`** - This file

## 🚀 Key Features

### Data Extraction
```
PDF/Image Upload
    ↓
OCR Processing (Tesseract.js)
    ↓
Text Extraction (pdf-parse)
    ↓
Data Parsing & Pattern Matching
    ↓
Auto-fill Form Fields
```

### End-to-End Certificate Management
1. **Upload** - PDF, images, documents
2. **Extract** - Automatic data extraction
3. **Fill** - Auto-populate form fields
4. **Edit** - User review and modifications
5. **Save** - Store in database
6. **Manage** - Edit, delete, link, report
7. **Share** - Control visibility and access

### File Management
- Upload multiple certificate files
- Automatic thumbnail generation
- Set primary certificate file
- Download certificates
- Delete files
- Track file metadata

### Advanced Features
- PDF to image conversion
- Skill tracking and proficiency levels
- Certificate expiration monitoring
- Verification status tracking
- Report attachment and management
- Project linking
- Featured certificate marking

## 📊 API Endpoints Overview

### Certificate CRUD
```
GET    /api/v1/admin/certificates              List all
POST   /api/v1/admin/certificates              Create
GET    /api/v1/admin/certificates/:id          Get one
PUT    /api/v1/admin/certificates/:id          Update
DELETE /api/v1/admin/certificates/:id          Delete
```

### Data Extraction
```
POST   /api/v1/admin/certificates/extract-details  Extract from file
```

### File Management
```
POST   /api/v1/admin/certificates/:id/files              Upload
DELETE /api/v1/admin/certificates/:id/files/:fileId     Delete
```

### Reports
```
POST   /api/v1/admin/certificates/:id/reports           Create
GET    /api/v1/admin/certificates/:id/reports           List
```

### Status Management
```
PATCH  /api/v1/admin/certificates/:id/visibility   Toggle visibility
PATCH  /api/v1/admin/certificates/:id/featured     Toggle featured
GET    /api/v1/admin/certificates/statistics       Get stats
```

## 🔑 Core Components

### Backend Models & Controllers

**Certificate.js**
- Complete MongoDB schema
- Instance methods: addSkill, removeSkill, addFile, verify, renew
- Static methods: findByIssuer, findBySkill, findExpiring, findVerified
- Virtuals: primaryFile, isValid, ageInDays, daysUntilExpiry

**CertificateController.js**
- getAllCertificates() - List with filters
- getCertificateById() - Get single
- createCertificate() - Create without files
- createCertificateWithFiles() - Create with files and extraction
- updateCertificate() - Update
- deleteCertificate() - Delete
- extractDetails() - Extract from PDF/image
- uploadFiles() - Add files to existing
- deleteFile() - Remove file
- createReport() - Create report
- toggleVisibility() - Show/hide
- toggleFeatured() - Mark featured

### Backend Services

**PDFService.js**
- extractTextFromPDF() - Extract text from PDF
- performOCR() - Run OCR on image
- convertPDFToImage() - Convert PDF page to image
- generatePDFThumbnail() - Create thumbnail
- processCertificateFile() - End-to-end processing
- parseCertificateText() - Parse extracted text
- parseFilename() - Extract from filename
- formatDate() - Standardize dates

**FileService.js**
- uploadFile() - Upload single file
- uploadMultipleFiles() - Batch upload
- uploadCertificateFiles() - Certificate-specific upload
- deleteFile() - Delete from Cloudinary
- deleteMultipleFiles() - Batch delete
- getFileInfo() - Get metadata
- listFiles() - List by folder
- categorizeFile() - Determine file category

**ReportService.js**
- createReport() - Create report
- uploadReportFiles() - Upload report files
- updateReport() - Modify report
- deleteReport() - Remove report
- getReports() - Query reports
- toggleReportVisibility() - Show/hide report
- getReportStatistics() - Get report stats

### Frontend Components

**CertificatesManagementUnified.js** (Main Component)
- Form management for CRUD operations
- File upload with progress tracking
- Automatic data extraction and form filling
- File management interface
- Report editor
- Project linking
- Visibility and featured controls

## 🎯 Usage Examples

### Extract Certificate from PDF
```javascript
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('/api/v1/admin/certificates/extract-details', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const result = await response.json();
console.log(result.extractedData);
// Output:
// {
//   title: "Machine Learning Specialization",
//   issuer: "Coursera",
//   issueDate: "2023-05-15",
//   skills: ["Python", "Machine Learning", "TensorFlow"]
// }
```

### Create Certificate with Files
```javascript
const formData = new FormData();
formData.append('title', 'AWS Certified Solutions Architect');
formData.append('issuer', 'Amazon Web Services');
formData.append('issueDate', '2023-01-15');
formData.append('files', certificateFile);

const response = await fetch('/api/v1/admin/certificates/with-files', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const certificate = await response.json();
```

### Upload Additional Files
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

const response = await fetch(`/api/v1/admin/certificates/${certificateId}/files`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

## 📝 Data Structures

### Certificate Document
```javascript
{
  _id: ObjectId,
  title: String,              // "AWS Certified Solutions Architect"
  issuer: String,             // "Amazon Web Services"
  issueDate: Date,            // 2023-01-15
  expiryDate: Date,           // null (permanent)
  credentialId: String,       // "AWS-SA-2023-001"
  credentialUrl: String,      // Verification link
  certificateType: String,    // "certification"
  level: String,              // "professional"
  description: String,        // Description text
  status: String,             // "published"
  visible: Boolean,           // true
  featured: Boolean,          // true
  
  skills: [{
    name: String,             // "AWS"
    proficiency: String,      // "expert"
    verified: Boolean
  }],
  
  files: [{
    url: String,              // Cloudinary URL
    publicId: String,         // Cloudinary ID
    originalName: String,     // "certificate.pdf"
    mimeType: String,         // "application/pdf"
    size: Number,             // 2458624
    isPrimary: Boolean,       // true
    thumbnailUrl: String,     // Image thumbnail
    category: String,         // "certificate"
    uploadedAt: Date
  }],
  
  reports: [{
    title: String,            // "Training Report"
    description: String,
    type: String,             // "file" or "link"
    file: Object,             // If type is file
    link: Object,             // If type is link
    visible: Boolean,
    createdAt: Date
  }],
  
  verification: {
    isVerified: Boolean,      // false
    verifiedAt: Date,         // null
    verifiedBy: String,       // null
    verificationMethod: String,  // "manual"
    verificationNotes: String
  },
  
  validity: {
    isPermanent: Boolean,     // true
    renewalRequired: Boolean, // false
    renewalPeriod: Number,    // 12 (months)
    lastRenewed: Date,        // null
    nextRenewal: Date         // null
  },
  
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}
```

### Extracted Data Object
```javascript
{
  title: String,              // "Machine Learning Specialization"
  issuer: String,             // "Coursera"
  issueDate: String,          // "2023-05-15"
  credentialId: String,       // "ABC123XYZ"
  credentialUrl: String,      // "https://coursera.org/verify/..."
  description: String,        // Extracted description
  skills: Array,              // ["Python", "Machine Learning", ...]
  category: String            // "certification"
}
```

## 🔒 Security Features

1. **Authentication** - JWT token validation on all endpoints
2. **Authorization** - Role-based access control
3. **Input Validation** - Express-validator on all inputs
4. **File Validation** - MIME type and size checks
5. **CORS** - Cross-origin resource sharing configured
6. **Rate Limiting** - Recommended on file upload endpoints
7. **Sanitization** - XSS protection and input cleaning

## ⚙️ Configuration

### Environment Variables
```env
# Database
MONGODB_URI=mongodb+srv://...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

### Multer Configuration
```javascript
const upload = multer({
  storage: memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,  // 50MB
    files: 10                      // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
  }
});
```

## 📈 Performance Tips

1. **Database** - Use indexed queries for common filters
2. **File Upload** - Use streaming for large files
3. **Frontend** - Implement lazy loading for file previews
4. **Caching** - Cache frequently accessed certificates
5. **OCR** - Run in background for large PDFs
6. **Thumbnails** - Generate on upload, not on request

## 🐛 Troubleshooting

### Issue: Extraction Not Working
- Ensure PDF has text layer (not image-based)
- Try uploading a higher resolution image
- Check OCR language setting (currently English)

### Issue: File Upload Failing
- Check file size (max 50MB)
- Verify MIME type is supported
- Check Cloudinary credentials
- Verify network connection

### Issue: Form Not Auto-filling
- Check browser console for errors
- Verify extracted data is valid JSON
- Try manual entry if extraction fails

## 📚 Dependencies

### Backend
```json
{
  "mongoose": "^6.x",
  "pdf-parse": "^1.x",
  "tesseract.js": "^4.x",
  "cloudinary": "^1.x",
  "multer": "^1.x",
  "express-validator": "^7.x"
}
```

### Frontend
```json
{
  "react": "^18.x",
  "react-hook-form": "^7.x",
  "framer-motion": "^10.x",
  "lucide-react": "^0.x",
  "axios": "^1.x",
  "react-hot-toast": "^2.x"
}
```

## 📞 Support

For issues, questions, or contributions:
1. Check the README.md for detailed documentation
2. Review ARCHITECTURE.md for system design
3. Examine existing code examples
4. Check error logs and console output

## 📄 License

This project is part of the Portfolio Management System. All rights reserved.

---

**Quick Links:**
- [Complete README](./README.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Backend Models](./backend/models/)
- [Backend Services](./backend/services/)
- [Frontend Components](./frontend/components/)

**Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Production Ready ✅
