import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Settings, Mail, Globe, Palette, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useData } from '../../contexts/DataContext';

const SiteConfiguration = () => {
  const { configuration, updateConfiguration, resetConfiguration, loading } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('site');
  const [showPreview, setShowPreview] = useState(false);

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

  const tabs = [
    { id: 'site', name: 'Site Info', icon: Settings },
    { id: 'contact', name: 'Contact', icon: Mail },
    { id: 'social', name: 'Social Links', icon: Globe },
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
          <h3 className="text-lg font-semibold mb-3">Live Preview</h3>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Hello, I'm <span className="text-blue-600">{watch('siteInfo.name') || 'Your Name'}</span>
              </h1>
              <p className="text-lg text-gray-600 mt-2">{watch('siteInfo.title') || 'Your Professional Title'}</p>
              <p className="text-gray-500 mt-2">{watch('siteInfo.shortBio') || 'A brief description about yourself'}</p>
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
                    Full Name *
                  </label>
                  <input
                    {...register('siteInfo.name', { required: 'Name is required' })}
                    className="input-field"
                    placeholder="Your Full Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Title *
                  </label>
                  <input
                    {...register('siteInfo.title', { required: 'Title is required' })}
                    className="input-field"
                    placeholder="e.g., Software Engineer, Data Scientist"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Bio *
                </label>
                <textarea
                  {...register('siteInfo.shortBio', { required: 'Short bio is required' })}
                  rows={3}
                  className="input-field"
                  placeholder="A brief description that appears in the hero section"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Bio *
                </label>
                <textarea
                  {...register('siteInfo.bio', { required: 'Bio is required' })}
                  rows={5}
                  className="input-field"
                  placeholder="A detailed description about your background and experience"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tagline
                  </label>
                  <input
                    {...register('siteInfo.tagline')}
                    className="input-field"
                    placeholder="e.g., Building innovative solutions"
                  />
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
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Statistics</h3>
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

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    {...register('contactInfo.email', { required: 'Email is required' })}
                    type="email"
                    className="input-field"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    {...register('contactInfo.phone')}
                    className="input-field"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    {...register('contactInfo.location')}
                    className="input-field"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    {...register('contactInfo.address')}
                    className="input-field"
                    placeholder="Your full address"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Social Links Tab */}
          {activeTab === 'social' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub URL
                  </label>
                  <input
                    {...register('socialLinks.github')}
                    className="input-field"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    {...register('socialLinks.linkedin')}
                    className="input-field"
                    placeholder="https://linkedin.com/in/yourusername"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter URL
                  </label>
                  <input
                    {...register('socialLinks.twitter')}
                    className="input-field"
                    placeholder="https://twitter.com/yourusername"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    {...register('socialLinks.website')}
                    className="input-field"
                    placeholder="https://yoursite.com"
                  />
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
