import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Award, Calendar, Eye, EyeOff } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import toast from 'react-hot-toast';

const CertificatesManagement = () => {
  const { certificates, createCertificate, updateCertificate, deleteCertificate, loading } = useData();
  const [isCreating, setIsCreating] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data) => {
    const certificateData = {
      ...data,
      skills: data.skills ? data.skills.split(',').map(skill => skill.trim()) : [],
      issueDate: new Date(data.issueDate),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      visible: data.visible === 'true'
    };

    const result = editingCertificate 
      ? await updateCertificate(editingCertificate._id, certificateData)
      : await createCertificate(certificateData);

    if (result.success) {
      toast.success(editingCertificate ? 'Certificate updated successfully!' : 'Certificate created successfully!');
      reset();
      setIsCreating(false);
      setEditingCertificate(null);
    } else {
      toast.error(result.message);
    }
  };

  const handleEdit = (certificate) => {
    setEditingCertificate(certificate);
    setIsCreating(true);
    reset({
      ...certificate,
      skills: certificate.skills.join(', '),
      issueDate: certificate.issueDate ? new Date(certificate.issueDate).toISOString().split('T')[0] : '',
      expiryDate: certificate.expiryDate ? new Date(certificate.expiryDate).toISOString().split('T')[0] : '',
      visible: certificate.visible.toString()
    });
  };

  const handleDelete = async (certificateId) => {
    if (window.confirm('Are you sure you want to delete this certificate?')) {
      const result = await deleteCertificate(certificateId);
      if (result.success) {
        toast.success('Certificate deleted successfully!');
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingCertificate(null);
    reset();
  };

  const handleToggleVisibility = async (certificateId, visible) => {
    const result = await updateCertificate(certificateId, { visible });
    if (result.success) {
      toast.success(visible ? 'Certificate is now visible' : 'Certificate is now hidden');
    } else {
      toast.error(result.message);
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
          <h1 className="text-3xl font-bold text-gray-900">Certificates Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your professional certificates and achievements
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Certificate</span>
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
            {editingCertificate ? 'Edit Certificate' : 'Add New Certificate'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Title *
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  className="input-field"
                  placeholder="e.g., Machine Learning Specialization"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issuing Organization *
                </label>
                <input
                  {...register('issuer', { required: 'Issuer is required' })}
                  className="input-field"
                  placeholder="e.g., Coursera, Google, Microsoft"
                />
                {errors.issuer && (
                  <p className="mt-1 text-sm text-red-600">{errors.issuer.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date *
                </label>
                <input
                  {...register('issueDate', { required: 'Issue date is required' })}
                  type="date"
                  className="input-field"
                />
                {errors.issueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.issueDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  {...register('expiryDate')}
                  type="date"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credential ID
                </label>
                <input
                  {...register('credentialId')}
                  className="input-field"
                  placeholder="e.g., ML-SPEC-2023"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  {...register('category')}
                  className="input-field"
                >
                  <option value="course">Course</option>
                  <option value="workshop">Workshop</option>
                  <option value="certification">Certification</option>
                  <option value="award">Award</option>
                  <option value="other">Other</option>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="input-field"
                placeholder="Describe what this certificate represents..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills Covered
              </label>
              <input
                {...register('skills')}
                className="input-field"
                placeholder="Machine Learning, Python, TensorFlow (comma separated)"
              />
              <p className="mt-1 text-sm text-gray-500">
                Separate multiple skills with commas
              </p>
            </div>

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
                {editingCertificate ? 'Update Certificate' : 'Create Certificate'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Certificates List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {certificates.map((certificate) => (
          <div key={certificate._id} className="card hover:shadow-lg transition-shadow duration-200">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{certificate.title}</h3>
                  <p className="text-sm text-primary-600 font-medium">{certificate.issuer}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleVisibility(certificate._id, !certificate.visible)}
                    className={`p-1 rounded ${certificate.visible ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                    title={certificate.visible ? 'Hide certificate' : 'Show certificate'}
                  >
                    {certificate.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(certificate)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(certificate._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(certificate.issueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  certificate.category === 'workshop' 
                    ? 'bg-purple-100 text-purple-700'
                    : certificate.category === 'course'
                    ? 'bg-blue-100 text-blue-700'
                    : certificate.category === 'certification'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {certificate.category}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  certificate.visible 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {certificate.visible ? 'Visible' : 'Hidden'}
                </span>
                {certificate.expiryDate && (
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4" />
                    <span>
                      Expires: {new Date(certificate.expiryDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                )}
              </div>

              {certificate.description && (
                <p className="text-gray-600 text-sm line-clamp-3">
                  {certificate.description}
                </p>
              )}

              {certificate.skills && certificate.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {certificate.skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                  {certificate.skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      +{certificate.skills.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {certificate.credentialId && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    ID: {certificate.credentialId}
                  </p>
                </div>
              )}

              {certificate.credentialUrl && (
                <a
                  href={certificate.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View Certificate →
                </a>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      {certificates.length === 0 && !isCreating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No certificates yet</h3>
          <p className="text-gray-600 mb-6">
            Add your professional certificates and achievements
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Certificate</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default CertificatesManagement;


