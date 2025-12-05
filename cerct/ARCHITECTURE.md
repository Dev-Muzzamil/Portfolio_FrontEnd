# Certificate Management System - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React)                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CertificatesManagementUnified Component               │  │
│  │  - Form management (create, edit)                      │  │
│  │  - File upload UI                                      │  │
│  │  - File preview & management                           │  │
│  │  - Report editor                                       │  │
│  │  - Project linking                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CertificateService (API Client)                       │  │
│  │  - API calls                                           │  │
│  │  - Response handling                                   │  │
│  │  - Error management                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Node.js)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routes (certificates.js)                              │  │
│  │  - Request routing                                     │  │
│  │  - Parameter validation                                │  │
│  │  - Authentication middleware                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CertificateController                                 │  │
│  │  - Request handling                                    │  │
│  │  - Response formatting                                 │  │
│  │  - Error handling                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Services Layer                                        │  │
│  │  ┌────────────────┐ ┌──────────────┐ ┌──────────────┐ │  │
│  │  │ PDFService     │ │ FileService  │ │ ReportService│ │  │
│  │  ├────────────────┤ ├──────────────┤ ├──────────────┤ │  │
│  │  │ • OCR          │ │ • Upload     │ │ • Create     │ │  │
│  │  │ • PDF Parse    │ │ • Delete     │ │ • Update     │ │  │
│  │  │ • Text Extract │ │ • Validate   │ │ • Delete     │ │  │
│  │  │ • Convert      │ │ • Thumbnail  │ │ • Query      │ │  │
│  │  └────────────────┘ └──────────────┘ └──────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Data Access Layer                                     │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Certificate Model (Mongoose)                   │  │  │
│  │  │  - Schema definition                            │  │  │
│  │  │  - Validation rules                             │  │  │
│  │  │  - Virtual fields                               │  │  │
│  │  │  - Instance methods                             │  │  │
│  │  │  - Static methods                               │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     External Services                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  MongoDB         │    │  Cloudinary      │                  │
│  │  - Data Storage  │    │  - File Hosting  │                  │
│  │  - Indexing      │    │  - Image CDN     │                  │
│  │  - Persistence   │    │  - Thumbnails    │                  │
│  └──────────────────┘    └──────────────────┘                  │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  Tesseract.js    │    │  pdf-parse       │                  │
│  │  - OCR Engine    │    │  - PDF Parsing   │                  │
│  │  - Text Extract  │    │  - Text Extract  │                  │
│  └──────────────────┘    └──────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Certificate Creation Flow

```
User Upload PDF/Image
        ↓
    File Validation
        ↓
PDFService.processCertificateFile()
        ↓
    ┌───────────────────────────┐
    │ Is PDF?                   │
    └────┬────────────────┬─────┘
         │ Yes            │ No (Image)
         ↓                ↓
    extractTextFromPDF    performOCR
         │                │
         └────────┬───────┘
                  ↓
         parseCertificateText()
                  ↓
      Extracted Data Structure
      ├── title
      ├── issuer
      ├── issueDate
      ├── credentialId
      ├── credentialUrl
      └── skills
                  ↓
      Auto-fill Form Fields
                  ↓
      User Review & Edit
                  ↓
      Form Submission
                  ↓
      FileService.uploadCertificateFiles()
                  ↓
      Upload to Cloudinary
                  ↓
      Create Certificate Document
                  ↓
      Save to MongoDB
                  ↓
      Return Certificate Object
```

### File Upload & Processing

```
User Selects File(s)
        ↓
Client-side Validation
├─ File size check (max 50MB)
├─ MIME type check
└─ File count check
        ↓
FileUploadProgress Component
├─ Display selected files
├─ Show upload progress
└─ Allow file removal
        ↓
handleFileUpload()
        ↓
Create FormData
├─ Append certificate data
└─ Append file(s)
        ↓
POST /api/v1/admin/certificates/with-files
        ↓
Backend Validation
├─ Auth check
├─ Input validation
└─ File validation
        ↓
FileService.uploadMultipleFiles()
        ↓
For each file:
├─ Determine resource type
├─ Create upload options
└─ Stream to Cloudinary
        ↓
Generate Thumbnails
├─ For PDF: convertPDFToImage()
└─ For Images: skip
        ↓
Create Certificate
├─ Save file metadata
├─ Create document
└─ Index for search
        ↓
Extract Details (async)
├─ OCR/Text extraction
├─ Data parsing
└─ Return extracted data
        ↓
Return Response
├─ Certificate object
└─ Extracted data
        ↓
Auto-fill Form
├─ Title
├─ Issuer
├─ Date
└─ Skills
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│         CertificatesManagementUnified                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Form Area                                          │   │
│  │ ├─ Certificate Title Input                        │   │
│  │ ├─ Issuer Input                                   │   │
│  │ ├─ Date Inputs (Issue & Expiry)                   │   │
│  │ ├─ Credential ID Input                            │   │
│  │ ├─ URL Input                                      │   │
│  │ ├─ Skills Input                                   │   │
│  │ └─ Submit/Cancel Buttons                          │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ File Upload Area                                  │   │
│  │ ├─ FileUploadProgress Component                  │   │
│  │ │  ├─ Drag & drop zone                          │   │
│  │ │  ├─ File browser button                       │   │
│  │ │  └─ Selected files list                       │   │
│  │ ├─ Current Files (if editing)                   │   │
│  │ │  ├─ File name                                 │   │
│  │ │  ├─ File type                                 │   │
│  │ │  ├─ Download button                           │   │
│  │ │  ├─ Set primary button                        │   │
│  │ │  └─ Delete button                             │   │
│  │ └─ Upload Progress Indicator                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Reports Area (when editing)                       │   │
│  │ └─ CertificateReportsManager Component           │   │
│  │    ├─ Add Report Button                          │   │
│  │    ├─ Reports List                               │   │
│  │    │  ├─ Report title                            │   │
│  │    │  ├─ Report type (file/link)                 │   │
│  │    │  ├─ Edit button                             │   │
│  │    │  └─ Delete button                           │   │
│  │    └─ Report Upload Progress                     │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Project Linking Area (when editing)               │   │
│  │ └─ Projects List with Checkboxes                 │   │
│  │    ├─ Project name                               │   │
│  │    ├─ Project category                           │   │
│  │    └─ Checkbox for linking                       │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## State Management Flow

```
useFormOperations Hook
├─ isCreating: boolean
├─ isEditing: boolean
├─ editingItem: Certificate | null
└─ Methods:
   ├─ handleStartCreating()
   ├─ handleEdit(item)
   ├─ handleCancelEdit()
   ├─ handleSubmit(data, callbacks)
   └─ handleDelete(id)

useFileUpload Hook
├─ uploadedFiles: File[]
├─ Methods:
   ├─ handleFileSelect(files)
   ├─ handleFileRemove(file)
   └─ clearUploadedFiles()

useData Context
├─ certificates: Certificate[]
├─ loading: boolean
├─ Methods:
   ├─ createCertificate(data)
   ├─ updateCertificate(id, data)
   ├─ deleteCertificate(id)
   └─ refreshData()

useModal Hook
├─ isOpen: boolean
├─ Methods:
   ├─ openModal()
   ├─ closeModal()
   └─ toggle()
```

## Database Indexes

```
Certificate Indexes:
├─ { issuer: 1, status: 1 }
│  Purpose: Filter by issuer and publication status
│
├─ { issueDate: -1 }
│  Purpose: Sort certificates by issue date
│
├─ { expiryDate: 1 }
│  Purpose: Find expiring certificates
│
├─ { certificateType: 1, status: 1 }
│  Purpose: Filter by type and status
│
├─ { level: 1 }
│  Purpose: Filter by skill level
│
├─ { "skills.name": 1 }
│  Purpose: Search by skill name
│
├─ { credentialId: 1 }
│  Purpose: Unique credential lookup
│
├─ { educationId: 1 }
│  Purpose: Find certificates linked to education
│
└─ { "verification.isVerified": 1 }
   Purpose: Filter verified certificates
```

## Error Handling Architecture

```
Client Error Handling
├─ Input Validation
│  └─ react-hook-form validation
├─ Upload Error Handling
│  ├─ File size exceeded
│  ├─ Invalid file type
│  └─ Network error
└─ API Error Handling
   ├─ 401 Unauthorized
   ├─ 403 Forbidden
   ├─ 404 Not Found
   └─ 500 Server Error

Server Error Handling
├─ Validation Error (400)
├─ Authentication Error (401)
├─ Authorization Error (403)
├─ Not Found Error (404)
├─ Extraction Error (500)
└─ Database Error (500)

OCR Error Fallback Chain
├─ Try PDF text extraction
├─ Fall back to Tesseract OCR
├─ Fall back to filename parsing
└─ Fall back to empty (manual entry)
```

## Performance Considerations

### Client-side Optimization
- React component memoization
- Lazy loading of file previews
- Debounced search inputs
- Code splitting for large components

### Server-side Optimization
- Database query indexing
- Async file processing
- Connection pooling
- Caching strategies

### File Processing Optimization
- Stream-based file upload
- Chunked file uploads for large files
- Async thumbnail generation
- Background OCR processing

## Security Architecture

```
Authentication Layer
├─ JWT token validation
├─ Session management
└─ Token refresh logic

Authorization Layer
├─ Role-based access control
├─ Resource ownership verification
└─ Permission checking middleware

Data Protection
├─ Input sanitization
├─ SQL injection prevention (MongoDB)
├─ XSS protection
└─ CSRF token handling

File Security
├─ MIME type validation
├─ File size limits
├─ Virus scanning (recommended)
└─ Secure Cloudinary integration
```

---

**Architecture Version:** 1.0
**Last Updated:** November 2025
