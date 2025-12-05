const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function makeFilesPublic() {
  try {
    console.log('🔧 Making Cloudinary files publicly accessible...');
    
    // Get all resources in the resume folder (including raw files)
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'portfolio/resume/',
      max_results: 100
    });
    
    // Also check raw resources
    const rawResult = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'raw',
      prefix: 'portfolio/resume/',
      max_results: 100
    });

    console.log(`📁 Found ${result.resources.length} files in resume folder (upload)`);
    console.log(`📁 Found ${rawResult.resources.length} files in resume folder (raw)`);
    
    // Combine both results
    const allResumeFiles = [...result.resources, ...rawResult.resources];
    console.log(`📄 Total resume files found: ${allResumeFiles.length}`);
    
    // If no files found, try getting all resources
    if (allResumeFiles.length === 0) {
      console.log('🔍 Searching for all resources...');
      const allResources = await cloudinary.api.resources({
        type: 'upload',
        max_results: 100
      });
      console.log(`📁 Total resources found: ${allResources.resources.length}`);
      
      // Filter for resume-related files
      const resumeFiles = allResources.resources.filter(r => 
        r.public_id.includes('resume') || r.public_id.includes('portfolio/resume')
      );
      console.log(`📄 Resume files found: ${resumeFiles.length}`);
      
      if (resumeFiles.length > 0) {
        result.resources = resumeFiles;
      }
    } else {
      result.resources = allResumeFiles;
    }

    for (const resource of result.resources) {
      try {
        console.log(`🔓 Making public: ${resource.public_id}`);
        
        // For raw files, we need to use the api.update method with resource_type
        const updateOptions = {
          access_mode: 'public',
          invalidate: true
        };
        
        if (resource.resource_type === 'raw') {
          await cloudinary.api.update(resource.public_id, updateOptions, { resource_type: 'raw' });
        } else {
          await cloudinary.api.update(resource.public_id, updateOptions);
        }
        
        console.log(`✅ Made public: ${resource.public_id}`);
      } catch (error) {
        console.error(`❌ Failed to make public ${resource.public_id}:`, error.message || error);
      }
    }

    console.log('🎉 All files made publicly accessible!');
  } catch (error) {
    console.error('❌ Error making files public:', error);
  }
}

makeFilesPublic();
