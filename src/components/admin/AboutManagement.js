import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Save, User, Plus, Trash2, Camera, X, Edit3 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import PhotoEditor from './PhotoEditor';
import toast from 'react-hot-toast';

const AboutManagement = () => {
  const { about, updateAbout, loading } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const fileInputRef = useRef(null);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: about || {}
  });

  // Reset form when about data changes
  useEffect(() => {
    if (about) {
      reset(about);
    }
  }, [about, reset]);

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

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/about/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile photo uploaded successfully!');
        // Refresh the about data
        window.location.reload();
      } else {
        toast.error(data.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
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
        window.location.reload();
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
      setShowPhotoEditor(true);
    }
  };

  const handlePhotoEditorSave = async (croppedFile) => {
    setUploadingPhoto(true);
    setShowPhotoEditor(false);

    try {
      const formData = new FormData();
      formData.append('photo', croppedFile);

      const response = await fetch('/api/about/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile photo updated successfully!');
        window.location.reload();
      } else {
        toast.error(data.message || 'Failed to update photo');
      }
    } catch (error) {
      console.error('Photo update error:', error);
      toast.error('Failed to update photo');
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">About Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your personal information and professional details
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn-primary flex items-center space-x-2"
        >
          <User className="w-4 h-4" />
          <span>{isEditing ? 'Cancel' : 'Edit'}</span>
        </button>
      </motion.div>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Bio *
                </label>
                <textarea
                  {...register('shortBio', { required: 'Short bio is required' })}
                  disabled={!isEditing}
                  rows={3}
                  className="input-field disabled:bg-gray-100"
                  placeholder="Brief description for hero section"
                />
                {errors.shortBio && (
                  <p className="mt-1 text-sm text-red-600">{errors.shortBio.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Bio *
                </label>
                <textarea
                  {...register('bio', { required: 'Bio is required' })}
                  disabled={!isEditing}
                  rows={6}
                  className="input-field disabled:bg-gray-100"
                  placeholder="Detailed description about yourself"
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Social Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub
                </label>
                <input
                  {...register('socialLinks.github')}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100"
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  {...register('socialLinks.linkedin')}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter
                </label>
                <input
                  {...register('socialLinks.twitter')}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100"
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  {...register('socialLinks.website')}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>

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
                    <h3 className="font-medium text-gray-900">Education {index + 1}</h3>
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
      {showPhotoEditor && about?.photo?.url && (
        <PhotoEditor
          imageUrl={about.photo.url}
          onSave={handlePhotoEditorSave}
          onClose={() => setShowPhotoEditor(false)}
        />
      )}
    </div>
  );
};

export default AboutManagement;


