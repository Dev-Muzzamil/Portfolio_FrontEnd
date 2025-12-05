import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { Save, User, Plus, Trash2, Camera, X, Edit3, Link, Code, Award, BookOpen } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import PhotoEditor from './PhotoEditor';
import EducationLinking from './EducationLinking';
// import FormField from '../common/FormField';
// import FormSection from '../common/FormSection';
import Button from '../common/Button';
import AnimatedSection from '../common/AnimatedSection';
// import { ValidatedInput, ValidatedTextarea } from '../common/FormValidation';
// import { LoadingButton } from '../common/LoadingStates';
import { useDocumentManagement } from '../../hooks/useDocumentManagement';
import { useFormManagement } from '../../hooks/useFormManagement';
import { useApiManagement } from '../../hooks/useApiManagement';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const AboutManagement = () => {
  const { about, updateAbout, loading, projects, certificates, skills } = useData();
  const { resetInactivityForUpload } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoEditorImageUrl, setPhotoEditorImageUrl] = useState(null);
  const [showEducationLinking, setShowEducationLinking] = useState(false);
  const [selectedEducationIndex, setSelectedEducationIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Use new optimized hooks (commented out for now)
  // const documentManagement = useDocumentManagement();
  // const formManagement = useFormManagement();
  // const apiManagement = useApiManagement();
  const { register, handleSubmit, formState: { errors }, reset, watch, control, setValue } = useForm({
    defaultValues: about || {}
  });

  // Field arrays for dynamic bio paragraphs
  const { fields: bioFields, append: appendBio, remove: removeBio } = useFieldArray({
    control,
    name: "bio"
  });

  const { fields: shortBioFields, append: appendShortBio, remove: removeShortBio } = useFieldArray({
    control,
    name: "shortBio"
  });

  // Reset form when about data changes
  useEffect(() => {
    if (about) {
      // Ensure bio and shortBio are arrays
      const aboutData = {
        ...about,
        bio: Array.isArray(about.bio) ? about.bio : [about.bio || ''],
        shortBio: Array.isArray(about.shortBio) ? about.shortBio : [about.shortBio || '']
      };
      reset(aboutData);
    }
  }, [about, reset]);

  // Helper functions for bio management
  const addBioParagraph = () => {
    appendBio('');
  };

  const removeBioParagraph = (index) => {
    if (bioFields.length > 1) {
      removeBio(index);
    } else {
      toast.error('At least one bio paragraph is required');
    }
  };

  const addShortBioParagraph = () => {
    appendShortBio('');
  };

  const removeShortBioParagraph = (index) => {
    if (shortBioFields.length > 1) {
      removeShortBio(index);
    } else {
      toast.error('At least one short bio paragraph is required');
    }
  };

  const onSubmit = async (data) => {
    const result = await updateAbout(data);
    if (result.success) {
      toast.success('About information updated successfully!');
      setIsEditing(false);
    } else {
      toast.error(result.message);
    }
  };

  const addExperience = () => {
    const currentExperience = watch('experience') || [];
    reset({
      ...watch(),
      experience: [...currentExperience, { company: '', position: '', duration: '', description: '', current: false }]
    });
  };

  const removeExperience = (index) => {
    const currentExperience = watch('experience') || [];
    reset({
      ...watch(),
      experience: currentExperience.filter((_, i) => i !== index)
    });
  };

  const addEducation = () => {
    const currentEducation = watch('education') || [];
    reset({
      ...watch(),
      education: [...currentEducation, { institution: '', degree: '', field: '', duration: '', description: '' }]
    });
  };

  const removeEducation = (index) => {
    const currentEducation = watch('education') || [];
    reset({
      ...watch(),
      education: currentEducation.filter((_, i) => i !== index)
    });
  };

  const handleEducationLinking = (index) => {
    setSelectedEducationIndex(index);
    setShowEducationLinking(true);
  };

  const handleEducationUpdate = (index, updatedEducation) => {
    const currentEducation = watch('education') || [];
    const newEducation = [...currentEducation];
    newEducation[index] = updatedEducation;
    setValue('education', newEducation);
  };

  const getLinkedItemsCount = (education) => {
    const projectsCount = education?.linkedProjects?.length || 0;
    const certificatesCount = education?.linkedCertificates?.length || 0;
    const skillsCount = education?.linkedSkills?.length || 0;
    return projectsCount + certificatesCount + skillsCount;
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Create object URL for the photo editor
    const imageUrl = URL.createObjectURL(file);
    
    // Store the file for later use
    setSelectedPhotoFile(file);
    setPhotoEditorImageUrl(imageUrl);
    setShowPhotoEditor(true);
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Are you sure you want to delete your profile photo?')) {
      return;
    }

    try {
      const response = await fetch('/api/about/photo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Profile photo deleted successfully!');
        // Refresh the about data
        // Data will be updated automatically via DataContext
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete photo');
      }
    } catch (error) {
      console.error('Photo delete error:', error);
      toast.error('Failed to delete photo');
    }
  };

  const handleEditPhoto = () => {
    if (about?.photo?.url) {
      setPhotoEditorImageUrl(about.photo.url);
      setSelectedPhotoFile(null);
      setShowPhotoEditor(true);
    }
  };

  const handlePhotoEditorSave = async (croppedFile) => {
    setUploadingPhoto(true);
    setShowPhotoEditor(false);

    try {
      const formData = new FormData();
      formData.append('action', 'upload-photo');
      formData.append('photo', croppedFile);

      // Reset inactivity timer before upload
      resetInactivityForUpload();

      await axios.post('/api/v1/admin/content/about/actions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout
        onUploadProgress: (progressEvent) => {
          // Reset inactivity timer during upload progress
          resetInactivityForUpload();
          
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`Upload Progress: ${percentCompleted}%`);
          }
        },
      });

      toast.success('Profile photo updated successfully!');
      // Data will be updated automatically via DataContext
    } catch (error) {
      console.error('Photo update error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please refresh the page and try again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update photo');
      }
    } finally {
      setUploadingPhoto(false);
    }
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
      <AnimatedSection
        direction="up"
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">About Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your personal information and professional details
          </p>
        </div>
        <Button
          variant="primary"
          icon={User}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </AnimatedSection>

      {/* Profile Photo Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Photo</h2>
        
        <div className="flex items-center space-x-6">
          <div className="relative">
            {about?.photo?.url ? (
              <div className="relative">
                <img
                  src={about.photo.url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <button
                  onClick={handleEditPhoto}
                  className="absolute -top-2 -left-2 bg-blue-600 text-white rounded-full p-1 hover:bg-blue-700 transition-colors"
                  title="Edit photo"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeletePhoto}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                  title="Delete photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingPhoto ? (
                <>
                  <div className="loading-spinner w-4 h-4"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>{about?.photo?.url ? 'Change Photo' : 'Upload Photo'}</span>
                </>
              )}
            </button>
            
            <p className="text-sm text-gray-500 mt-2">
              Recommended: Square image, at least 400x400px. Max size: 5MB
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100"
                  placeholder="Your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Title *
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100"
                  placeholder="e.g., Full Stack Developer"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  {...register('email')}
                  disabled={!isEditing}
                  type="email"
                  className="input-field disabled:bg-gray-100"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  {...register('phone')}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  {...register('location')}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100"
                  placeholder="City, Country"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Bio</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Short Bio *
                  </label>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={addShortBioParagraph}
                      className="btn-secondary text-xs py-1 px-2 flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+1</span>
                    </button>
                  )}
                </div>
                
                {shortBioFields.map((field, index) => (
                  <div key={field.id} className="mb-3">
                    <div className="flex items-start space-x-2">
                      <textarea
                        {...register(`shortBio.${index}`, { 
                          required: 'Short bio paragraph is required',
                          maxLength: { value: 200, message: 'Paragraph must be less than 200 characters' }
                        })}
                        disabled={!isEditing}
                        rows={3}
                        className="input-field disabled:bg-gray-100 flex-1"
                        placeholder={`Short bio paragraph ${index + 1}`}
                      />
                      {isEditing && shortBioFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeShortBioParagraph(index)}
                          className="mt-2 text-red-600 hover:text-red-700 transition-colors"
                          title="Remove paragraph"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {errors.shortBio?.[index] && (
                      <p className="mt-1 text-sm text-red-600">{errors.shortBio[index].message}</p>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Bio *
                  </label>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={addBioParagraph}
                      className="btn-secondary text-xs py-1 px-2 flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+1</span>
                    </button>
                  )}
                </div>
                
                {bioFields.map((field, index) => (
                  <div key={field.id} className="mb-3">
                    <div className="flex items-start space-x-2">
                      <textarea
                        {...register(`bio.${index}`, { 
                          required: 'Bio paragraph is required'
                        })}
                        disabled={!isEditing}
                        rows={6}
                        className="input-field disabled:bg-gray-100 flex-1"
                        placeholder={`Bio paragraph ${index + 1}`}
                      />
                      {isEditing && bioFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBioParagraph(index)}
                          className="mt-2 text-red-600 hover:text-red-700 transition-colors"
                          title="Remove paragraph"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {errors.bio?.[index] && (
                      <p className="mt-1 text-sm text-red-600">{errors.bio[index].message}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social Links - Moved to dedicated section */}

          {/* Experience */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Experience</h2>
              {isEditing && (
                <button
                  type="button"
                  onClick={addExperience}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Experience</span>
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {(watch('experience') || []).map((exp, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Experience {index + 1}</h3>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        {...register(`experience.${index}.company`)}
                        disabled={!isEditing}
                        className="input-field disabled:bg-gray-100"
                        placeholder="Company name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position
                      </label>
                      <input
                        {...register(`experience.${index}.position`)}
                        disabled={!isEditing}
                        className="input-field disabled:bg-gray-100"
                        placeholder="Job title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <input
                        {...register(`experience.${index}.duration`)}
                        disabled={!isEditing}
                        className="input-field disabled:bg-gray-100"
                        placeholder="e.g., 2020 - 2023"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          {...register(`experience.${index}.current`)}
                          disabled={!isEditing}
                          type="checkbox"
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Current position</span>
                      </label>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        {...register(`experience.${index}.description`)}
                        disabled={!isEditing}
                        rows={3}
                        className="input-field disabled:bg-gray-100"
                        placeholder="Describe your role and achievements"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Education</h2>
              {isEditing && (
                <button
                  type="button"
                  onClick={addEducation}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Education</span>
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {(watch('education') || []).map((edu, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">Education {index + 1}</h3>
                      {getLinkedItemsCount(edu) > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {getLinkedItemsCount(edu)} linked
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleEducationLinking(index)}
                          className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Link to projects, certificates, and skills"
                        >
                          <Link className="w-4 h-4" />
                          <span className="text-sm">Link</span>
                        </button>
                      )}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Institution
                      </label>
                      <input
                        {...register(`education.${index}.institution`)}
                        disabled={!isEditing}
                        className="input-field disabled:bg-gray-100"
                        placeholder="University/School name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Degree
                      </label>
                      <input
                        {...register(`education.${index}.degree`)}
                        disabled={!isEditing}
                        className="input-field disabled:bg-gray-100"
                        placeholder="e.g., Bachelor of Science"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field of Study
                      </label>
                      <input
                        {...register(`education.${index}.field`)}
                        disabled={!isEditing}
                        className="input-field disabled:bg-gray-100"
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <input
                        {...register(`education.${index}.duration`)}
                        disabled={!isEditing}
                        className="input-field disabled:bg-gray-100"
                        placeholder="e.g., 2018 - 2022"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        {...register(`education.${index}.description`)}
                        disabled={!isEditing}
                        rows={3}
                        className="input-field disabled:bg-gray-100"
                        placeholder="Additional details about your education"
                      />
                    </div>

                    {/* Linked Items Display */}
                    {getLinkedItemsCount(edu) > 0 && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Linked Items
                        </label>
                        <div className="space-y-3">
                          {/* Linked Projects */}
                          {edu.linkedProjects && edu.linkedProjects.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                                <Code className="w-4 h-4 mr-1" />
                                Projects ({edu.linkedProjects.length})
                              </h4>
                              <div className="space-y-2">
                                {edu.linkedProjects.map((projectId) => {
                                  const project = projects.find(p => p._id === projectId);
                                  return project ? (
                                    <div key={projectId} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                      <div className="flex-1">
                                        <span className="font-medium text-blue-900">{project.title}</span>
                                        {project.completedAtInstitution && (
                                          <p className="text-xs text-blue-600 mt-1">
                                            Completed at: {project.completedAtInstitution}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}

                          {/* Linked Certificates */}
                          {edu.linkedCertificates && edu.linkedCertificates.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                                <Award className="w-4 h-4 mr-1" />
                                Certificates ({edu.linkedCertificates.length})
                              </h4>
                              <div className="space-y-2">
                                {edu.linkedCertificates.map((certId) => {
                                  const cert = certificates.find(c => c._id === certId);
                                  return cert ? (
                                    <div key={certId} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                      <div className="flex-1">
                                        <span className="font-medium text-green-900">{cert.title}</span>
                                        <p className="text-xs text-green-700">{cert.issuer}</p>
                                        {cert.completedAtInstitution && (
                                          <p className="text-xs text-green-600 mt-1">
                                            Completed at: {cert.completedAtInstitution}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}

                          {/* Linked Skills */}
                          {edu.linkedSkills && edu.linkedSkills.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                                <BookOpen className="w-4 h-4 mr-1" />
                                Skills ({edu.linkedSkills.length})
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {edu.linkedSkills.map((skillId) => {
                                  const skill = skills.find(s => s._id === skillId);
                                  return skill ? (
                                    <span
                                      key={skillId}
                                      className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                                    >
                                      <BookOpen className="w-3 h-3" />
                                      <span>{skill.name}</span>
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          {isEditing && (
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </form>
      </motion.div>

      {/* Photo Editor Modal */}
      {showPhotoEditor && photoEditorImageUrl && (
        <PhotoEditor
          imageUrl={photoEditorImageUrl}
          onSave={handlePhotoEditorSave}
          onClose={() => {
            setShowPhotoEditor(false);
            setPhotoEditorImageUrl(null);
            setSelectedPhotoFile(null);
            // Clean up object URL if it was created for a new file
            if (selectedPhotoFile) {
              URL.revokeObjectURL(photoEditorImageUrl);
            }
          }}
        />
      )}

      {/* Education Linking Modal */}
      {showEducationLinking && selectedEducationIndex !== null && (
        <EducationLinking
          educationIndex={selectedEducationIndex}
          education={(watch('education') || [])[selectedEducationIndex]}
          onUpdate={handleEducationUpdate}
          isOpen={showEducationLinking}
          onClose={() => {
            setShowEducationLinking(false);
            setSelectedEducationIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default AboutManagement;