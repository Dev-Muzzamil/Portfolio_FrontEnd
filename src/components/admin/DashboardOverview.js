import React from 'react';
import { motion } from 'framer-motion';
import { 
  FolderOpen, 
  Award, 
  Wrench, 
  User, 
  Eye, 
  ExternalLink
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const DashboardOverview = () => {
  const { about, projects, certificates, skills, loading } = useData();

  const stats = [
    {
      name: 'Projects',
      value: projects.length,
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+2 this month'
    },
    {
      name: 'Certificates',
      value: certificates.length,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+1 this month'
    },
    {
      name: 'Skills',
      value: skills.length,
      icon: Wrench,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: 'Updated recently'
    },
    {
      name: 'Profile Views',
      value: '1,234',
      icon: Eye,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '+12% from last month'
    }
  ];

  const recentProjects = projects
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

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
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's an overview of your portfolio content.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">{stat.change}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
            <a
              href="/admin/projects"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all
            </a>
          </div>
          
          {recentProjects.length > 0 ? (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project._id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {project.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {project.category} • {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No projects yet</p>
              <a
                href="/admin/projects"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Add your first project
              </a>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          
          <div className="space-y-4">
            <a
              href="/admin/about"
              className="flex items-center p-4 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors duration-200"
            >
              <User className="w-5 h-5 text-primary-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Update Profile</p>
                <p className="text-sm text-gray-500">Edit your personal information</p>
              </div>
            </a>
            
            <a
              href="/admin/projects"
              className="flex items-center p-4 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors duration-200"
            >
              <FolderOpen className="w-5 h-5 text-primary-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Add Project</p>
                <p className="text-sm text-gray-500">Showcase your latest work</p>
              </div>
            </a>
            
            <a
              href="/admin/certificates"
              className="flex items-center p-4 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors duration-200"
            >
              <Award className="w-5 h-5 text-primary-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Add Certificate</p>
                <p className="text-sm text-gray-500">Add your achievements</p>
              </div>
            </a>
            
            <a
              href="/admin/skills"
              className="flex items-center p-4 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors duration-200"
            >
              <Wrench className="w-5 h-5 text-primary-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Manage Skills</p>
                <p className="text-sm text-gray-500">Update your technical skills</p>
              </div>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Portfolio Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Portfolio Preview</h2>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>View Live Site</span>
          </a>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {about?.name || 'Syed Muzzamil Ali'}
          </h3>
          <p className="text-gray-600 mb-4">
            {about?.title || 'Computer Science Engineer & Tech Enthusiast'}
          </p>
          <p className="text-sm text-gray-500">
            Your portfolio is live at syedmuzzamilali.me and ready to impress visitors!
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;


