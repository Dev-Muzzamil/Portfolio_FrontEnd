import { getApiBaseUrl } from '../../utils/helpers';

export const ProjectAdapter = {
  // Get image source for projects
  getImageSource: (project, websitePreviews = {}) => {
    const preview = websitePreviews[project._id];

    // Priority: Custom uploaded image > Website preview state > Live website screenshot > Fallback
    if (project.images && project.images.length > 0) {
      return {
        type: 'custom',
        url: project.images[0].url,
        alt: project.images[0].alt || project.title
      };
    }

    if (preview && preview.url) {
      return {
        type: 'screenshot',
        url: preview.url,
        alt: `${project.title} website preview`
      };
    }

    if (project.liveUrls && project.liveUrls.length > 0) {
      const apiBase = getApiBaseUrl();
      const screenshotUrl = `${apiBase}/api/projects/screenshot?url=${encodeURIComponent(project.liveUrls[0])}&t=${Date.now()}`;
      return {
        type: 'screenshot',
        url: screenshotUrl,
        alt: `${project.title} website preview`
      };
    }

    return {
      type: 'fallback',
      url: null,
      alt: 'No preview available'
    };
  },

  // Get technologies array
  getTechnologies: (project) => {
    return project.technologies || [];
  },

  // Get linked certificates
  getLinkedItems: (project, certificates = []) => {
    return project.linkedCertificates?.map(certId => 
      certificates.find(cert => cert._id === certId)
    ).filter(Boolean) || [];
  },

  // Get status badge configuration
  getStatusBadge: (project) => {
    return {
      text: project.status?.replace('-', ' ') || 'Unknown',
      color: project.status === 'completed' 
        ? 'bg-green-100 text-green-700'
        : project.status === 'in-progress'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-blue-100 text-blue-700'
    };
  },

  // Get subtitle (category for projects)
  getSubtitle: (project) => {
    return project.category || 'Unknown';
  },

  // Get description (short description for projects)
  getDescription: (project) => {
    return project.shortDescription || '';
  },

  // Get full description
  getFullDescription: (project) => {
    return project.description || '';
  },

  // Get external links
  getExternalLinks: (project) => {
    const links = [];
    
    if (project.liveUrls) {
      project.liveUrls.forEach((url, index) => {
        if (url) {
          links.push({
            type: 'live',
            url,
            label: `Live Demo ${index + 1}`,
            icon: 'ExternalLink'
          });
        }
      });
    }

    if (project.githubUrls) {
      project.githubUrls.forEach((url, index) => {
        if (url) {
          links.push({
            type: 'github',
            url,
            label: `GitHub ${index + 1}`,
            icon: 'Github'
          });
        }
      });
    }

    return links;
  },

  // Get date for display
  getDate: (project) => {
    return new Date(project.createdAt).toLocaleDateString();
  },

  // Get visibility status
  getVisibility: (project) => {
    return {
      visible: project.visible,
      text: project.visible ? 'Visible' : 'Hidden',
      color: project.visible 
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-700'
    };
  },

  // Load website preview (for projects)
  loadWebsitePreview: async (projectId, liveUrl, setWebsitePreviews) => {
    if (!liveUrl || setWebsitePreviews[projectId]?.url) return;

    try {
      setWebsitePreviews(prev => ({
        ...prev,
        [projectId]: { url: null, loading: true, error: false }
      }));

      const apiBase = getApiBaseUrl();

      // First, check if we have existing screenshots for this project
      try {
        const existingScreenshotsResponse = await fetch(`${apiBase}/api/projects/screenshots/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (existingScreenshotsResponse.ok) {
          const existingScreenshots = await existingScreenshotsResponse.json();
          
          if (existingScreenshots.length > 0) {
            // Check if the most recent screenshot is less than 12 hours old
            const mostRecent = existingScreenshots[0];
            const screenshotAge = Date.now() - new Date(mostRecent.createdAt).getTime();
            const twelveHoursInMs = 12 * 60 * 60 * 1000;

            if (screenshotAge < twelveHoursInMs) {
              setWebsitePreviews(prev => ({
                ...prev,
                [projectId]: { url: mostRecent.url, loading: false, error: false }
              }));
              return;
            }
          }
        }
      } catch (existingError) {
        console.log('Could not fetch existing screenshots, will generate new one:', existingError.message);
      }

      // If no recent screenshots exist, generate a new one
      const screenshotUrl = `${apiBase}/api/projects/screenshot?url=${encodeURIComponent(liveUrl)}`;

      setWebsitePreviews(prev => ({
        ...prev,
        [projectId]: { url: screenshotUrl, loading: false, error: false }
      }));

    } catch (error) {
      console.error('Error loading website preview:', error);
      setWebsitePreviews(prev => ({
        ...prev,
        [projectId]: { url: null, loading: false, error: true }
      }));
    }
  },

  // Auto-load website previews for projects without custom images
  autoLoadPreviews: (projects, setWebsitePreviews, loadWebsitePreview) => {
    const toLoad = projects.filter(p => 
      (!p.images || p.images.length === 0) && 
      p.liveUrls && 
      p.liveUrls.length > 0
    );

    toLoad.forEach((project, i) => {
      // Small stagger to be polite to the screenshot API
      setTimeout(() => {
        loadWebsitePreview(project._id, project.liveUrls[0]);
      }, i * 500);
    });
  },

  // Get filter categories
  getFilterCategories: () => {
    return ['all', 'web', 'mobile', 'ai-ml-dl', 'other'];
  },

  // Get empty state configuration
  getEmptyState: (mode) => {
    return {
      home: {
        icon: '🔍',
        title: 'No projects found',
        message: 'No projects match the selected category. Try selecting a different filter.'
      },
      admin: {
        icon: '📁',
        title: 'No projects yet',
        message: 'Start building your portfolio by adding your first project'
      }
    }[mode];
  }
};

export default ProjectAdapter;
