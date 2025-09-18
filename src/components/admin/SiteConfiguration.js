import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Settings, Palette, Eye, EyeOff, Upload, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useData } from '../../contexts/DataContext';
import { uploadFile } from '../../utils/fileUpload';

const SiteConfiguration = () => {
  const { configuration, updateConfiguration, resetConfiguration, loading } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('site');
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const logoInputRef = useRef(null);
  const iconInputRef = useRef(null);

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: configuration || {}
  });

  // Update form when configuration changes
  useEffect(() => {
    if (configuration) {
      reset(configuration);
    }
  }, [configuration, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await updateConfiguration(data);
      if (result.success) {
        toast.success('Configuration updated successfully!');
      } else {
        toast.error(result.message || 'Failed to update configuration');
      }
    } catch (error) {
      toast.error('An error occurred while updating configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all configuration to default values? This action cannot be undone.')) {
      try {
        const result = await resetConfiguration();
        if (result.success) {
          toast.success('Configuration reset to default values!');
        } else {
          toast.error(result.message || 'Failed to reset configuration');
        }
      } catch (error) {
        toast.error('An error occurred while resetting configuration');
      }
    }
  };

  const handleLogoUpload = async (event) => {
    console.log('handleLogoUpload called with event:', event);
    const file = event.target.files[0];
    console.log('Selected file:', file);
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (2MB limit for logo)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file size must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const uploadResult = await uploadFile(file, '/api/upload/branding');
      
      if (uploadResult.success) {
        const updatedConfig = {
          ...configuration,
          branding: {
            ...configuration?.branding,
            logo: uploadResult.data.url
          }
        };
        
        const result = await updateConfiguration(updatedConfig);
        if (result.success) {
          toast.success('Logo uploaded successfully!');
          reset(updatedConfig);
        } else {
          toast.error(result.message || 'Failed to save logo');
        }
      } else {
        toast.error(uploadResult.message || 'Failed to upload logo');
      }
    } catch (error) {
      toast.error('An error occurred while uploading logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleIconUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (1MB limit for icon)
    if (file.size > 1 * 1024 * 1024) {
      toast.error('Icon file size must be less than 1MB');
      return;
    }

    setUploadingIcon(true);
    try {
      const uploadResult = await uploadFile(file, '/api/upload/branding');
      
      if (uploadResult.success) {
        const updatedConfig = {
          ...configuration,
          branding: {
            ...configuration?.branding,
            icon: uploadResult.data.url
          }
        };
        
        const result = await updateConfiguration(updatedConfig);
        if (result.success) {
          toast.success('Icon uploaded successfully!');
          reset(updatedConfig);
        } else {
          toast.error(result.message || 'Failed to save icon');
        }
      } else {
        toast.error(uploadResult.message || 'Failed to upload icon');
      }
    } catch (error) {
      toast.error('An error occurred while uploading icon');
    } finally {
      setUploadingIcon(false);
    }
  };

  const removeLogo = async () => {
    const updatedConfig = {
      ...configuration,
      branding: {
        ...configuration?.branding,
        logo: ''
      }
    };
    
    const result = await updateConfiguration(updatedConfig);
    if (result.success) {
      toast.success('Logo removed successfully!');
      reset(updatedConfig);
    } else {
      toast.error(result.message || 'Failed to remove logo');
    }
  };

  const removeIcon = async () => {
    const updatedConfig = {
      ...configuration,
      branding: {
        ...configuration?.branding,
        icon: ''
      }
    };
    
    const result = await updateConfiguration(updatedConfig);
    if (result.success) {
      toast.success('Icon removed successfully!');
      reset(updatedConfig);
    } else {
      toast.error(result.message || 'Failed to remove icon');
    }
  };

  const tabs = [
    { id: 'site', name: 'Site Info', icon: Settings },
    { id: 'theme', name: 'Theme', icon: Palette },
    { id: 'settings', name: 'Settings', icon: Eye }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Site Configuration</h2>
          <p className="text-gray-600 mt-2">Manage your portfolio site settings and content</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-outline flex items-center space-x-2"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
          <button
            onClick={handleReset}
            className="btn-outline flex items-center space-x-2 text-red-600 hover:text-red-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default</span>
          </button>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-100 rounded-lg p-4 mb-6"
        >
          <h3 className="text-lg font-semibold mb-3">Site Configuration Preview</h3>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Site Settings Preview
              </h1>
              <p className="text-lg text-gray-600 mt-2">{watch('siteInfo.tagline') || 'Your site tagline will appear here'}</p>
              <p className="text-gray-500 mt-2">Personal information is managed in the About section</p>
            </div>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Site Info Tab */}
          {activeTab === 'site' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Tagline
                  </label>
                  <input
                    {...register('siteInfo.tagline')}
                    className="input-field"
                    placeholder="e.g., Building innovative solutions"
                  />
                  <p className="mt-1 text-sm text-gray-500">A catchy tagline for your site header</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    {...register('siteInfo.website')}
                    className="input-field"
                    placeholder="https://yoursite.com"
                  />
                  <p className="mt-1 text-sm text-gray-500">Your main website URL</p>
                </div>
              </div>


              {/* Logo and Icon Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Site Branding</h3>
                <p className="text-sm text-gray-600 mb-4">Upload your logo and icon or provide URLs for better branding</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo
                    </label>
                    
                    {/* Current Logo Display */}
                    {watch('branding.logo') && (
                      <div className="mb-3 p-3 bg-white rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={watch('branding.logo')}
                              alt="Current Logo"
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${watch('branding.logo') ? 'hidden' : ''}`} style={{ backgroundColor: '#3B82F6' }}>
                              <span className="text-white font-bold text-sm">L</span>
                            </div>
                            <span className="text-sm text-gray-600">Current Logo</span>
                          </div>
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Remove Logo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Logo upload button clicked');
                          console.log('logoInputRef.current:', logoInputRef.current);
                          logoInputRef.current?.click();
                        }}
                        disabled={uploadingLogo}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingLogo ? (
                          <>
                            <div className="loading-spinner w-4 h-4"></div>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>{watch('branding.logo') ? 'Change Logo' : 'Upload Logo'}</span>
                          </>
                        )}
                      </button>
                      
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      
                      <input
                        {...register('branding.logo')}
                        className="input-field"
                        placeholder="Or enter logo URL directly"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Upload image (max 2MB) or provide URL</p>
                  </div>

                  {/* Icon Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon/Favicon
                    </label>
                    
                    {/* Current Icon Display */}
                    {watch('branding.icon') && (
                      <div className="mb-3 p-3 bg-white rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={watch('branding.icon')}
                              alt="Current Icon"
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${watch('branding.icon') ? 'hidden' : ''}`} style={{ backgroundColor: '#3B82F6' }}>
                              <span className="text-white font-bold text-sm">I</span>
                            </div>
                            <span className="text-sm text-gray-600">Current Icon</span>
                          </div>
                          <button
                            type="button"
                            onClick={removeIcon}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Remove Icon"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Icon upload button clicked');
                          console.log('iconInputRef.current:', iconInputRef.current);
                          iconInputRef.current?.click();
                        }}
                        disabled={uploadingIcon}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingIcon ? (
                          <>
                            <div className="loading-spinner w-4 h-4"></div>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>{watch('branding.icon') ? 'Change Icon' : 'Upload Icon'}</span>
                          </>
                        )}
                      </button>
                      
                      <input
                        ref={iconInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleIconUpload}
                        className="hidden"
                      />
                      
                      <input
                        {...register('branding.icon')}
                        className="input-field"
                        placeholder="Or enter icon URL directly"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Upload image (max 1MB) or provide URL</p>
                  </div>
                </div>
                
                {/* Preview */}
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Live Preview</h4>
                  <div className="flex items-center space-x-3">
                    {watch('branding.logo') ? (
                      <img
                        src={watch('branding.logo')}
                        alt="Logo Preview"
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${watch('branding.logo') ? 'hidden' : ''}`} style={{ backgroundColor: '#3B82F6' }}>
                      <span className="text-white font-bold text-sm">
                        {(watch('siteInfo.name') || 'S').charAt(0)}
                      </span>
                    </div>
                    <span className="text-gray-900 font-medium">
                      {watch('siteInfo.name') || 'Your Site Name'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">This is how your logo will appear in the navbar and footer</p>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Portfolio Statistics</h3>
                <p className="text-sm text-gray-600 mb-4">These numbers are displayed on your portfolio homepage</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years Experience
                    </label>
                    <input
                      {...register('stats.yearsExperience', { valueAsNumber: true })}
                      type="number"
                      className="input-field"
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Projects Count
                    </label>
                    <input
                      {...register('stats.projectsCount', { valueAsNumber: true })}
                      type="number"
                      className="input-field"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technologies Count
                    </label>
                    <input
                      {...register('stats.technologiesCount', { valueAsNumber: true })}
                      type="number"
                      className="input-field"
                      placeholder="15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certificates Count
                    </label>
                    <input
                      {...register('stats.certificatesCount', { valueAsNumber: true })}
                      type="number"
                      className="input-field"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}



          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <input
                    {...register('theme.primaryColor')}
                    type="color"
                    className="w-full h-10 rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <input
                    {...register('theme.secondaryColor')}
                    type="color"
                    className="w-full h-10 rounded-lg border border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent Color
                  </label>
                  <input
                    {...register('theme.accentColor')}
                    type="color"
                    className="w-full h-10 rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <input
                    {...register('theme.backgroundColor')}
                    type="color"
                    className="w-full h-10 rounded-lg border border-gray-300"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Section Visibility</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'showResume', label: 'Show Resume Section' },
                    { key: 'showProjects', label: 'Show Projects Section' },
                    { key: 'showSkills', label: 'Show Skills Section' },
                    { key: 'showCertificates', label: 'Show Certificates Section' },
                    { key: 'showContact', label: 'Show Contact Section' },
                    { key: 'showGitHub', label: 'Show GitHub Section' },
                    { key: 'enableContactForm', label: 'Enable Contact Form' }
                  ].map((setting) => (
                    <label key={setting.key} className="flex items-center space-x-3">
                      <input
                        {...register(`settings.${setting.key}`)}
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{setting.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Maintenance Mode</h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      {...register('settings.maintenanceMode')}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Maintenance Mode</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance Message
                    </label>
                    <textarea
                      {...register('settings.maintenanceMessage')}
                      rows={3}
                      className="input-field"
                      placeholder="Site is under maintenance. Please check back later."
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center space-x-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SiteConfiguration;
