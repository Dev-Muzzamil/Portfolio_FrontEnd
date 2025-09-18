import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useFormOperations } from '../../hooks/useFormOperations';
import { useModal } from '../../hooks/useFormOperations';
import { useDocumentManagement } from '../../hooks/useDocumentManagement';
import { useFormManagement } from '../../hooks/useFormManagement';
import { useApiManagement } from '../../hooks/useApiManagement';
import { processStringArray, arrayToString, getDefaultFormValues } from '../../utils/formHelpers';
import UnifiedList from '../UnifiedList';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import Button from '../common/Button';
import AnimatedSection from '../common/AnimatedSection';
import InstitutionSelector from '../common/InstitutionSelector';
import ProjectReportsManager from './ProjectReportsManager';
import FileUploadProgress from '../common/FileUploadProgress';
import { ValidatedInput, ValidatedTextarea } from '../common/FormValidation';
import { LoadingButton } from '../common/LoadingStates';
import toast from 'react-hot-toast';

const ProjectsManagementUnified = () => {
  const { projects, certificates, about, createProject, updateProject, deleteProject, loading, refreshData } = useData();
  const { register, handleSubmit, formState: { errors }, reset, control, watch, setValue, trigger } = useForm();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use custom hook for form operations
  const {
    isCreating,
    isEditing,
    editingItem,
    handleSubmit: handleFormSubmit,
    handleDelete,
    handleEdit,
    handleCancelEdit,
    handleStartCreating
  } = useFormOperations(
    {
      submit: async (data) => {
        const projectData = {
          ...data,
          technologies: processStringArray(data.technologies),
          visible: data.visible === 'true',
          liveUrls: data.liveUrls || [],
          githubUrls: data.githubUrls || []
        };

        const result = editingItem 
          ? await updateProject(editingItem._id, projectData)
          : await createProject(projectData);
          
        return result;
      },
      delete: deleteProject,
      toggleVisibility: async (projectId, visible) => {
        return await updateProject(projectId, { visible });
      }
    },
    {
      successMessages: {
        submit: 'Project saved successfully!',
        delete: 'Project deleted successfully!'
      },
      errorMessages: {
        submit: 'Failed to save project',
        delete: 'Failed to delete project'
      }
    }
  );

  // Use modal hook for confirmation dialog
  const confirmDialog = useModal();
  
  // Use new optimized hooks
  const documentManagement = useDocumentManagement();
  const formManagement = useFormManagement();
  const apiManagement = useApiManagement();
  
  const { fields: liveUrlFields, append: appendLiveUrl, remove: removeLiveUrl } = useFieldArray({
    control,
    name: "liveUrls"
  });
  
  const { fields: githubUrlFields, append: appendGithubUrl, remove: removeGithubUrl } = useFieldArray({
    control,
    name: "githubUrls"
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await handleFormSubmit(data, () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }, reset);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkCertificates = async (projectId, certificateIds) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/link-certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ certificateIds })
      });

      if (response.ok) {
        toast.success('Certificates linked successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to link certificates');
      }
    } catch (error) {
      console.error('Link certificates error:', error);
      toast.error('Failed to link certificates');
    }
  };

  const handleEditProject = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    if (project) {
      reset({
        ...project,
        technologies: arrayToString(project.technologies),
        visible: project.visible.toString(),
        liveUrls: project.liveUrls || [],
        githubUrls: project.githubUrls || [],
        completedAtInstitution: project.completedAtInstitution || ''
      });
      handleEdit(project);
    }
  };

  const handleDeleteProject = async (projectId) => {
    const result = await handleDelete(projectId);
    if (result.success) {
      confirmDialog.closeModal();
    }
  };

  const handleToggleVisibility = async (projectId, visible) => {
    const result = await updateProject(projectId, { visible });
    if (!result.success) {
      toast.error(result.message);
    }
  };

  const handleExpand = (projectId) => {
    // Not used in admin mode
  };

  const handleLink = (projectId, linkedIds) => {
    handleLinkCertificates(projectId, linkedIds);
  };

  const handleAddProject = () => {
    reset(getDefaultFormValues('project'));
    handleStartCreating();
  };

  const handleCancel = () => {
    handleCancelEdit();
    reset(getDefaultFormValues('project'));
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
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Project saved successfully!</span>
        </div>
      )}

      {/* Create/Edit Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingItem ? 'Edit Project' : 'Add New Project'}
          </h2>
          
          <form 
            key={editingItem ? `edit-${editingItem._id}` : 'create-new'}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput
                {...register('title', { required: 'Title is required' })}
                placeholder="Project name"
                rules={{ required: true, minLength: 3 }}
                showValidation={true}
                label="Project Title *"
              />

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
                  Completed at Institution
                </label>
                <input
                  {...register('completedAtInstitution')}
                  type="hidden"
                />
                <InstitutionSelector
                  value={watch('completedAtInstitution') || ''}
                  onChange={async (value) => {
                    setValue('completedAtInstitution', value);
                    await trigger('completedAtInstitution');
                  }}
                  placeholder="Select or enter institution..."
                  disabled={!isEditing}
                  educationData={about?.education || []}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Institution where this project was completed
                </p>
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

              <ValidatedTextarea
                {...register('shortDescription', { required: 'Short description is required' })}
                rows={3}
                placeholder="Brief description for project cards"
                rules={{ required: true, minLength: 10 }}
                showValidation={true}
                label="Short Description *"
              />

            <ValidatedTextarea
              {...register('description', { required: 'Description is required' })}
              rows={6}
              placeholder="Detailed project description"
              rules={{ required: true, minLength: 20 }}
              showValidation={true}
              label="Full Description *"
            />

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

            {/* Reports Section - Only show when editing existing project */}
            {editingItem && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Project Reports</h3>
                <p className="text-sm text-gray-600">
                  Upload project reports, documentation, or add links to external resources
                </p>
                
                <ProjectReportsManager 
                  projectId={editingItem._id}
                  reports={editingItem.reports || []}
                  onUpdate={async () => {
                    // Refresh the project data from the server
                    try {
                      await refreshData();
                      // Re-edit the project to show updated data
                      setTimeout(() => {
                        handleEditProject(editingItem._id);
                      }, 500);
                    } catch (error) {
                      console.error('Failed to refresh project data:', error);
                    }
                  }}
                />
              </div>
            )}

            {/* Certificate Linking Section - Only show when editing existing project */}
            {editingItem && (
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
                          checked={editingItem.linkedCertificates?.some(linked => 
                            typeof linked === 'string' ? linked === certificate._id : linked._id === certificate._id
                          ) || false}
                          onChange={(e) => {
                            const currentLinked = editingItem.linkedCertificates || [];
                            const newLinked = e.target.checked
                              ? [...currentLinked, certificate._id]
                              : currentLinked.filter(linked => 
                                  typeof linked === 'string' ? linked !== certificate._id : linked._id !== certificate._id
                                );
                            
                            handleLinkCertificates(editingItem._id, newLinked);
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
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <LoadingButton
                type="submit"
                loading={isLoading}
                loadingText="Saving..."
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingItem ? 'Update Project' : 'Create Project'}
              </LoadingButton>
            </div>
          </form>
        </motion.div>
      )}

      {/* Projects List using UnifiedList */}
      {projects.length === 0 ? (
        <EmptyState
          type="project"
          onAction={handleAddProject}
          className="bg-white rounded-lg border border-gray-200"
        />
      ) : (
        <UnifiedList
          items={projects}
          type="project"
          mode="admin"
          loading={loading}
          onEdit={handleEditProject}
          onDelete={(project) => {
            confirmDialog.setIsOpen(true);
            confirmDialog.projectToDelete = project._id;
          }}
          onToggleVisibility={handleToggleVisibility}
          onExpand={handleExpand}
          onLink={handleLink}
          onAdd={handleAddProject}
          linkedItems={certificates}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.closeModal}
        onConfirm={() => handleDeleteProject(confirmDialog.projectToDelete)}
        type="delete"
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
      />
    </div>
  );
};

export default ProjectsManagementUnified;
