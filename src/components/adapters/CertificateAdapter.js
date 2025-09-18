export const CertificateAdapter = {
  // Get image source for certificates
  getImageSource: (certificate) => {
    // Certificate logic: Primary file > Image > Fallback
    if (certificate.files && certificate.files.length > 0) {
      const primaryFile = certificate.files.find(f => f.isPrimary) || certificate.files[0];
      
      if (primaryFile.mimeType?.startsWith('image/')) {
        return {
          type: 'image',
          url: primaryFile.url,
          alt: primaryFile.originalName
        };
      } else if (primaryFile.mimeType?.includes('pdf')) {
        return {
          type: 'pdf',
          url: primaryFile.thumbnailUrl || null,
          alt: primaryFile.originalName,
          file: primaryFile
        };
      }
    }

    if (certificate.image?.url) {
      return {
        type: 'image',
        url: certificate.image.url,
        alt: certificate.image.alt || certificate.title
      };
    }

    return {
      type: 'fallback',
      url: null,
      alt: 'No preview available'
    };
  },

  // Parse skills array (similar to original certificate component)
  parseSkills: (skills) => {
    if (!skills || !Array.isArray(skills)) return [];
    
    return skills.map(skill => {
      // If skill is a string that looks like JSON, parse it
      if (typeof skill === 'string' && skill.startsWith('[')) {
        try {
          const parsed = JSON.parse(skill);
          return Array.isArray(parsed) ? parsed : [skill];
        } catch (e) {
          return [skill];
        }
      }
      return skill;
    }).flat().filter(skill => skill && skill.trim().length > 0);
  },

  // Get technologies/skills array
  getTechnologies: (certificate) => {
    return CertificateAdapter.parseSkills(certificate.skills);
  },

  // Get linked projects
  getLinkedItems: (certificate, projects = []) => {
    return certificate.linkedProjects?.map(projectId => 
      projects.find(project => project._id === projectId)
    ).filter(Boolean) || [];
  },

  // Get status badge configuration (category for certificates)
  getStatusBadge: (certificate) => {
    return {
      text: certificate.category || 'certificate',
      color: certificate.category === 'workshop' 
        ? 'bg-purple-100 text-purple-700'
        : certificate.category === 'course'
        ? 'bg-blue-100 text-blue-700'
        : certificate.category === 'certification'
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-700'
    };
  },

  // Get subtitle (issuer for certificates)
  getSubtitle: (certificate) => {
    return certificate.issuer || 'Unknown';
  },

  // Get description
  getDescription: (certificate) => {
    return certificate.description || '';
  },

  // Get full description (same as description for certificates)
  getFullDescription: (certificate) => {
    return certificate.description || '';
  },

  // Get external links
  getExternalLinks: (certificate) => {
    const links = [];
    
    if (certificate.credentialUrl) {
      links.push({
        type: 'credential',
        url: certificate.credentialUrl,
        label: 'Verify Certificate',
        icon: 'ExternalLink'
      });
    }

    return links;
  },

  // Get date for display
  getDate: (certificate) => {
    return new Date(certificate.issueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  },

  // Get visibility status
  getVisibility: (certificate) => {
    return {
      visible: certificate.visible,
      text: certificate.visible ? 'Visible' : 'Hidden',
      color: certificate.visible 
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-700'
    };
  },

  // Get credential details
  getCredentialDetails: (certificate) => {
    return {
      id: certificate.credentialId,
      url: certificate.credentialUrl,
      issueDate: certificate.issueDate,
      expiryDate: certificate.expiryDate
    };
  },

  // Get files information
  getFiles: (certificate) => {
    return certificate.files || [];
  },

  // Get primary file
  getPrimaryFile: (certificate) => {
    if (!certificate.files || certificate.files.length === 0) return null;
    return certificate.files.find(f => f.isPrimary) || certificate.files[0];
  },

  // Get thumbnail URL for files
  getThumbnailUrl: (file) => {
    // If file has a thumbnail URL (for PDFs), use it
    if (file.thumbnailUrl) {
      return file.thumbnailUrl;
    }
    
    // For images, use the original URL
    if (file.mimeType?.startsWith('image/')) {
      return file.url;
    }
    
    // For PDFs without thumbnail, return null to show fallback
    if (file.mimeType?.includes('pdf')) {
      return null;
    }
    
    // For other files, return original URL
    return file.url;
  },

  // Get file icon based on mime type
  getFileIcon: (file) => {
    if (file.mimeType?.startsWith('image/')) {
      return 'Image';
    } else if (file.mimeType?.includes('pdf')) {
      return 'FileText';
    } else {
      return 'File';
    }
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get filter categories
  getFilterCategories: () => {
    return ['all', 'course', 'workshop', 'certification', 'award', 'other'];
  },

  // Get empty state configuration
  getEmptyState: (mode) => {
    return {
      home: {
        icon: '🏆',
        title: 'No certificates added yet',
        message: 'Certificates will be displayed here once they are added to the admin panel.'
      },
      admin: {
        icon: '🏆',
        title: 'No certificates yet',
        message: 'Add your professional certificates and achievements'
      }
    }[mode];
  },

  // Check if certificate has PDF files
  hasPDFFiles: (certificate) => {
    return certificate.files?.some(file => file.mimeType?.includes('pdf')) || false;
  },

  // Check if certificate has image files
  hasImageFiles: (certificate) => {
    return certificate.files?.some(file => file.mimeType?.startsWith('image/')) || false;
  },

  // Get certificate type for display
  getCertificateType: (certificate) => {
    const category = certificate.category || 'certificate';
    return category.charAt(0).toUpperCase() + category.slice(1);
  },

  // Get expiry information
  getExpiryInfo: (certificate) => {
    if (!certificate.expiryDate) return null;
    
    const expiryDate = new Date(certificate.expiryDate);
    const now = new Date();
    const isExpired = expiryDate < now;
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    return {
      date: expiryDate,
      isExpired,
      daysUntilExpiry,
      formattedDate: expiryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    };
  }
};

export default CertificateAdapter;
