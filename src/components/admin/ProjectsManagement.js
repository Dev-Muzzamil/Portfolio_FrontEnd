import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Edit, Trash2, ExternalLink, Github, Eye, EyeOff, X, Upload, FileText, Link, Download, File } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import TechnologyIcon from '../TechnologyIcon';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const ProjectsManagement = () => {
  const { projects, certificates, createProject, updateProject, deleteProject, loading } = useData();
  const { resetInactivityForUpload } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadingReports, setUploadingReports] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const fileInputRef = useRef(null);
  const reportFileInputRef = useRef(null);
  const { register, handleSubmit, formState: { errors }, reset, control } = useForm();
  
  const { fields: liveUrlFields, append: appendLiveUrl, remove: removeLiveUrl } = useFieldArray({
    control,
    name: "liveUrls"
  });
  
  const { fields: githubUrlFields, append: appendGithubUrl, remove: removeGithubUrl } = useFieldArray({
    control,
    name: "githubUrls"
  });

  const onSubmit = async (data) => {
    const projectData = {
      ...data,
      technologies: data.technologies ? data.technologies.split(',').map(tech => tech.trim()) : [],
      visible: data.visible === 'true',
      liveUrls: data.liveUrls || [],
      githubUrls: data.githubUrls || []
    };

    const result = editingProject 
      ? await updateProject(editingProject._id, projectData)
      : await createProject(projectData);

    if (result.success) {
      toast.success(editingProject ? 'Project updated successfully!' : 'Project created successfully!');
      reset();
      setIsCreating(false);
      setEditingProject(null);
    } else {
      toast.error(result.message);
    }
  };

  const handleLinkCertificates = async (projectId, certificateIds) => {
    console.log('🔗 DEBUG: handleLinkCertificates called');
    console.log('🔗 DEBUG: projectId:', projectId);
    console.log('🔗 DEBUG: certificateIds:', certificateIds);
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔗 DEBUG: token exists:', !!token);
      
      const requestBody = { certificateIds };
      console.log('🔗 DEBUG: request body:', requestBody);
      
      const response = await fetch(`/api/projects/${projectId}/link-certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🔗 DEBUG: response status:', response.status);
      console.log('🔗 DEBUG: response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('🔗 DEBUG: success response:', result);
        toast.success('Certificates linked successfully');
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const error = await response.json();
        console.log('🔗 DEBUG: error response:', error);
        toast.error(error.message || 'Failed to link certificates');
      }
    } catch (error) {
      console.error('🔗 DEBUG: Link certificates error:', error);
      toast.error('Failed to link certificates');
    }
  };

  const handleEdit = (project) => {
    console.log('🔗 DEBUG: handleEdit called with project:', project);
    console.log('🔗 DEBUG: project.linkedCertificates:', project.linkedCertificates);
    setEditingProject(project);
    setIsCreating(true);
    reset({
      ...project,
      technologies: project.technologies.join(', '),
      visible: project.visible.toString(),
      liveUrls: project.liveUrls || [],
      githubUrls: project.githubUrls || []
    });
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const result = await deleteProject(projectId);
      if (result.success) {
        toast.success('Project deleted successfully!');
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingProject(null);
    reset();
  };

  const handleToggleVisibility = async (projectId, visible) => {
    const result = await updateProject(projectId, { visible });
    if (result.success) {
      toast.success(visible ? 'Project is now visible' : 'Project is now hidden');
    } else {
      toast.error(result.message);
    }
  };

  // File upload functions
  const handleFileUpload = async (projectId, files) => {
    setUploadingFiles(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      // Reset inactivity timer before upload
      resetInactivityForUpload();

      const response = await axios.post(`/api/projects/${projectId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes timeout
        onUploadProgress: (progressEvent) => {
          // Reset inactivity timer during upload progress
          resetInactivityForUpload();
          
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`Project Files Upload Progress: ${percentCompleted}%`);
          }
        },
      });

      toast.success('Files uploaded successfully!');
      window.location.reload(); // Refresh to show new files
    } catch (error) {
      console.error('File upload error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please refresh the page and try again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to upload files');
      }
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteFile = async (projectId, fileId) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('File deleted successfully!');
        window.location.reload();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('File delete error:', error);
      toast.error('Failed to delete file');
    }
  };

  // Report management functions
  const handleAddReport = async (projectId, reportData) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reportData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Report added successfully!');
        window.location.reload();
      } else {
        toast.error(data.message || 'Failed to add report');
      }
    } catch (error) {
      console.error('Report add error:', error);
      toast.error('Failed to add report');
    }
  };

  const handleUploadReportFiles = async (projectId, files, title, description) => {
    setUploadingReports(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('title', title);
      formData.append('description', description);

      // Reset inactivity timer before upload
      resetInactivityForUpload();

      const response = await axios.post(`/api/projects/${projectId}/reports/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes timeout
        onUploadProgress: (progressEvent) => {
          // Reset inactivity timer during upload progress
          resetInactivityForUpload();
          
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`Report Upload Progress: ${percentCompleted}%`);
          }
        },
      });

      toast.success('Report files uploaded successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Report upload error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please refresh the page and try again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to upload report files');
      }
    } finally {
      setUploadingReports(false);
    }
  };

  const handleDeleteReport = async (projectId, reportId) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Report deleted successfully!');
        window.location.reload();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete report');
      }
    } catch (error) {
      console.error('Report delete error:', error);
      toast.error('Failed to delete report');
    }
  };

  const openReportsModal = (project) => {
    setSelectedProject(project);
    setShowReportsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your portfolio projects and showcase your work
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </motion.div>

      {/* Create/Edit Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingProject ? 'Edit Project' : 'Add New Project'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  className="input-field"
                  placeholder="Project name"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  {...register('category')}
                  className="input-field"
                >
                  <option value="web">Web</option>
                  <option value="mobile">Mobile</option>
                  <option value="ai-ml-dl">AI/ML/DL</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="input-field"
                >
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="planned">Planned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  {...register('visible')}
                  className="input-field"
                >
                  <option value="true">Visible</option>
                  <option value="false">Hidden</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Live URLs
                </label>
                <div className="space-y-2">
                  {liveUrlFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <input
                        {...register(`liveUrls.${index}`)}
                        type="url"
                        className="input-field flex-1"
                        placeholder="https://yourproject.com"
                      />
                      <button
                        type="button"
                        onClick={() => removeLiveUrl(index)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Remove URL"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendLiveUrl('')}
                    className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Live URL</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub URLs
                </label>
                <div className="space-y-2">
                  {githubUrlFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <input
                        {...register(`githubUrls.${index}`)}
                        type="url"
                        className="input-field flex-1"
                        placeholder="https://github.com/username/project"
                      />
                      <button
                        type="button"
                        onClick={() => removeGithubUrl(index)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Remove URL"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendGithubUrl('')}
                    className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add GitHub URL</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <textarea
                {...register('shortDescription', { required: 'Short description is required' })}
                rows={3}
                className="input-field"
                placeholder="Brief description for project cards"
              />
              {errors.shortDescription && (
                <p className="mt-1 text-sm text-red-600">{errors.shortDescription.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={6}
                className="input-field"
                placeholder="Detailed project description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technologies
              </label>
              <input
                {...register('technologies')}
                className="input-field"
                placeholder="React, Node.js, MongoDB (comma separated)"
              />
              <p className="mt-1 text-sm text-gray-500">
                Separate multiple technologies with commas
              </p>
            </div>

            {/* Certificate Linking Section - Only show when editing existing project */}
            {editingProject && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Linked Certificates</h3>
                <p className="text-sm text-gray-600">
                  Link this project to relevant certificates to show the skills and knowledge applied
                </p>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Certificates to Link:
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {certificates.map((certificate) => (
                      <label key={certificate._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={editingProject.linkedCertificates?.some(linked => 
                            typeof linked === 'string' ? linked === certificate._id : linked._id === certificate._id
                          ) || false}
                          onChange={(e) => {
                            console.log('🔗 DEBUG: Certificate checkbox changed');
                            console.log('🔗 DEBUG: certificate._id:', certificate._id);
                            console.log('🔗 DEBUG: e.target.checked:', e.target.checked);
                            console.log('🔗 DEBUG: editingProject.linkedCertificates:', editingProject.linkedCertificates);
                            
                            const currentLinked = editingProject.linkedCertificates || [];
                            console.log('🔗 DEBUG: currentLinked:', currentLinked);
                            
                            const newLinked = e.target.checked
                              ? [...currentLinked, certificate._id]
                              : currentLinked.filter(linked => 
                                  typeof linked === 'string' ? linked !== certificate._id : linked._id !== certificate._id
                                );
                            
                            console.log('🔗 DEBUG: newLinked:', newLinked);
                            console.log('🔗 DEBUG: editingProject._id:', editingProject._id);
                            
                            handleLinkCertificates(editingProject._id, newLinked);
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{certificate.title}</div>
                          <div className="text-xs text-gray-500">{certificate.issuer}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {certificates.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No certificates available. Add certificates first to link them to projects.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingProject ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Projects List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {projects.map((project) => (
          <div key={project._id} className="card hover:shadow-lg transition-shadow duration-200">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                  <p className="text-sm text-gray-500 capitalize">{project.category}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleVisibility(project._id, !project.visible)}
                    className={`p-1 rounded ${project.visible ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                    title={project.visible ? 'Hide project' : 'Show project'}
                  >
                    {project.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(project)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm line-clamp-3">
                {project.shortDescription}
              </p>

              {project.technologies && project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.technologies.slice(0, 3).map((tech, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center space-x-1"
                    >
                      <TechnologyIcon technology={tech} className="w-3 h-3" />
                      <span>{tech}</span>
                    </span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      +{project.technologies.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'completed' 
                      ? 'bg-green-100 text-green-700'
                      : project.status === 'in-progress'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {project.status.replace('-', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.visible 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {project.visible ? 'Visible' : 'Hidden'}
                  </span>
                </div>

              </div>

              <div className="flex items-center space-x-4">
                {project.liveUrls && project.liveUrls.length > 0 && project.liveUrls.map((url, index) => (
                  url && (
                    <a
                      key={`live-${index}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-primary-600 transition-colors duration-200"
                      title={`Live URL ${index + 1}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )
                ))}
                {project.githubUrls && project.githubUrls.length > 0 && project.githubUrls.map((url, index) => (
                  url && (
                    <a
                      key={`github-${index}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-primary-600 transition-colors duration-200"
                      title={`GitHub URL ${index + 1}`}
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )
                ))}
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {projects.length === 0 && !isCreating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">
            Start building your portfolio by adding your first project
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Project</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ProjectsManagement;


