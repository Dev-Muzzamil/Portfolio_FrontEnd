import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Save, 
  Edit3, 
  X, 
  Plus,
  Github,
  Linkedin,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { useData } from '../../contexts/DataContext';
import LoadingSpinner from '../LoadingSpinner';

const SocialMediaManagement = () => {
  const { about, refreshData } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      socialLinks: about?.socialLinks || {}
    }
  });

  // Update form when about data changes
  useEffect(() => {
    if (about?.socialLinks) {
      setValue('socialLinks', about.socialLinks);
    }
  }, [about, setValue]);

  const watchedSocialLinks = watch('socialLinks');

  const socialPlatforms = [
    {
      key: 'github',
      name: 'GitHub',
      icon: Github,
      placeholder: 'https://github.com/username',
      color: 'bg-gray-900',
      description: 'Your GitHub profile URL'
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      placeholder: 'https://linkedin.com/in/username',
      color: 'bg-blue-600',
      description: 'Your LinkedIn profile URL'
    },
    {
      key: 'x',
      name: 'X (formerly Twitter)',
      icon: X,
      placeholder: 'https://x.com/username',
      color: 'bg-black',
      description: 'Your X profile URL'
    },
    {
      key: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      placeholder: 'https://instagram.com/username',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      description: 'Your Instagram profile URL'
    },
    {
      key: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      placeholder: 'https://facebook.com/username',
      color: 'bg-blue-600',
      description: 'Your Facebook profile URL'
    },
    {
      key: 'youtube',
      name: 'YouTube',
      icon: Youtube,
      placeholder: 'https://youtube.com/@username',
      color: 'bg-red-600',
      description: 'Your YouTube channel URL'
    },
    {
      key: 'tiktok',
      name: 'TikTok',
      icon: MessageCircle,
      placeholder: 'https://tiktok.com/@username',
      color: 'bg-black',
      description: 'Your TikTok profile URL'
    },
    {
      key: 'discord',
      name: 'Discord',
      icon: MessageCircle,
      placeholder: 'https://discord.gg/invite',
      color: 'bg-indigo-600',
      description: 'Your Discord server invite'
    },
    {
      key: 'telegram',
      name: 'Telegram',
      icon: MessageCircle,
      placeholder: 'https://t.me/username',
      color: 'bg-blue-500',
      description: 'Your Telegram profile URL'
    },
    {
      key: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      placeholder: 'https://wa.me/1234567890',
      color: 'bg-green-600',
      description: 'Your WhatsApp contact URL'
    },
    {
      key: 'reddit',
      name: 'Reddit',
      icon: MessageCircle,
      placeholder: 'https://reddit.com/u/username',
      color: 'bg-orange-600',
      description: 'Your Reddit profile URL'
    },
    {
      key: 'behance',
      name: 'Behance',
      icon: MessageCircle,
      placeholder: 'https://behance.net/username',
      color: 'bg-blue-800',
      description: 'Your Behance profile URL'
    },
    {
      key: 'dribbble',
      name: 'Dribbble',
      icon: MessageCircle,
      placeholder: 'https://dribbble.com/username',
      color: 'bg-pink-600',
      description: 'Your Dribbble profile URL'
    },
    {
      key: 'pinterest',
      name: 'Pinterest',
      icon: MessageCircle,
      placeholder: 'https://pinterest.com/username',
      color: 'bg-red-700',
      description: 'Your Pinterest profile URL'
    },
    {
      key: 'medium',
      name: 'Medium',
      icon: MessageCircle,
      placeholder: 'https://medium.com/@username',
      color: 'bg-gray-800',
      description: 'Your Medium profile URL'
    },
    {
      key: 'dev',
      name: 'Dev.to',
      icon: MessageCircle,
      placeholder: 'https://dev.to/username',
      color: 'bg-gray-900',
      description: 'Your Dev.to profile URL'
    },
    {
      key: 'stackoverflow',
      name: 'Stack Overflow',
      icon: MessageCircle,
      placeholder: 'https://stackoverflow.com/users/userid/username',
      color: 'bg-orange-500',
      description: 'Your Stack Overflow profile URL'
    },
    {
      key: 'website',
      name: 'Website',
      icon: Globe,
      placeholder: 'https://yourwebsite.com',
      color: 'bg-gray-600',
      description: 'Your personal website URL'
    }
  ];

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Merge social links with existing about data
      const updateData = {
        ...about,
        socialLinks: data.socialLinks
      };
      
      const response = await axios.put('/api/v1/admin/content/about', updateData);
      
      if (response.data) {
        toast.success('Social media links updated successfully!');
        setIsEditing(false);
        await refreshData();
      } else {
        toast.error('Failed to update social media links');
      }
    } catch (error) {
      console.error('Error updating social media links:', error);
      toast.error(error.response?.data?.message || 'Failed to update social media links');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowAddCustom(false);
    // Reset form to original values
    setValue('socialLinks', about?.socialLinks || {});
  };

  const addCustomSocialMedia = () => {
    setShowAddCustom(true);
  };

  const removeCustomSocialMedia = (index) => {
    const currentCustom = watchedSocialLinks.custom || [];
    const updatedCustom = currentCustom.filter((_, i) => i !== index);
    setValue(`socialLinks.custom`, updatedCustom);
  };

  const addNewCustomSocialMedia = () => {
    const currentCustom = watchedSocialLinks.custom || [];
    const newCustom = [...currentCustom, { name: '', url: '' }];
    setValue(`socialLinks.custom`, newCustom);
    setShowAddCustom(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-lg"
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Social Media Management</h1>
              <p className="text-gray-600 mt-1">Manage your social media links and profiles</p>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Social Media Platforms */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Media Platforms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {socialPlatforms.map((platform) => {
                  const IconComponent = platform.icon;
                  const currentValue = watchedSocialLinks[platform.key] || '';
                  
                  return (
                    <motion.div
                      key={platform.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`rounded-lg p-4 border-2 transition-all duration-200 ${
                        currentValue ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${platform.color}`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{platform.name}</h3>
                          <p className="text-xs text-gray-500">{platform.description}</p>
                        </div>
                      </div>
                      
                      <input
                        {...register(`socialLinks.${platform.key}`)}
                        disabled={!isEditing}
                        placeholder={platform.placeholder}
                        className={`w-full px-3 py-2 rounded-lg border transition-colors duration-200 ${
                          isEditing 
                            ? 'border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500' 
                            : 'border-gray-200 bg-gray-100'
                        }`}
                      />
                      
                      {currentValue && (
                        <div className="mt-2 text-xs text-green-600 flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Active</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Custom Social Media */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Custom Social Media</h2>
                {isEditing && !showAddCustom && (
                  <button
                    type="button"
                    onClick={addCustomSocialMedia}
                    className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Custom</span>
                  </button>
                )}
              </div>

              {/* Existing Custom Social Media */}
              {watchedSocialLinks.custom && watchedSocialLinks.custom.length > 0 && (
                <div className="space-y-4">
                  {watchedSocialLinks.custom.map((customLink, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-purple-50 rounded-lg p-4 border border-purple-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Platform Name
                          </label>
                          <input
                            {...register(`socialLinks.custom.${index}.name`)}
                            disabled={!isEditing}
                            placeholder="e.g., Mastodon, Signal"
                            className={`w-full px-3 py-2 rounded-lg border transition-colors duration-200 ${
                              isEditing 
                                ? 'border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                                : 'border-gray-200 bg-gray-100'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL
                          </label>
                          <input
                            {...register(`socialLinks.custom.${index}.url`)}
                            disabled={!isEditing}
                            placeholder="https://example.com/username"
                            className={`w-full px-3 py-2 rounded-lg border transition-colors duration-200 ${
                              isEditing 
                                ? 'border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                                : 'border-gray-200 bg-gray-100'
                            }`}
                          />
                        </div>
                        {isEditing && (
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeCustomSocialMedia(index)}
                              className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add Custom Form */}
              {showAddCustom && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-purple-50 rounded-lg p-4 border border-purple-200"
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add Custom Social Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Platform Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Mastodon, Signal, Twitch"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/username"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={addNewCustomSocialMedia}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    >
                      Add Platform
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {(!watchedSocialLinks.custom || watchedSocialLinks.custom.length === 0) && !showAddCustom && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No custom social media platforms added yet.</p>
                  {isEditing && (
                    <p className="text-sm mt-1">Click "Add Custom" to add platforms not listed above.</p>
                  )}
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-4">How your social media links will appear on your portfolio:</p>
                <div className="flex flex-wrap gap-3">
                  {socialPlatforms.map((platform) => {
                    const value = watchedSocialLinks[platform.key];
                    if (!value) return null;
                    
                    const IconComponent = platform.icon;
                    return (
                      <div
                        key={platform.key}
                        className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border border-gray-200"
                      >
                        <div className={`w-6 h-6 rounded ${platform.color} flex items-center justify-center`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{platform.name}</span>
                      </div>
                    );
                  })}
                  {watchedSocialLinks.custom?.map((customLink, index) => {
                    if (!customLink.name || !customLink.url) return null;
                    return (
                      <div
                        key={`custom-${index}`}
                        className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{customLink.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SocialMediaManagement;
