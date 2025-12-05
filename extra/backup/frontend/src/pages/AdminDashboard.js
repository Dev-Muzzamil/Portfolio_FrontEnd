import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  FolderOpen, 
  Award, 
  Wrench, 
  Settings,
  LogOut,
  Menu,
  X,
  Layers,
  FileText,
  Share2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import LoadingSpinner from '../components/LoadingSpinner';

// Admin Components
import DashboardOverview from '../components/admin/DashboardOverview';
import AboutManagement from '../components/admin/AboutManagement';
import ProjectsManagementUnified from '../components/admin/ProjectsManagementUnified';
import CertificatesManagementUnified from '../components/admin/CertificatesManagementUnified';
import SimplifiedSkillsManagement from '../components/admin/SimplifiedSkillsManagement';
import SiteConfiguration from '../components/admin/SiteConfiguration';
import ResumeManagement from '../components/admin/ResumeManagement';
import SocialMediaManagement from '../components/admin/SocialMediaManagement';

// Wrapper component for Resume Management
const ResumeManagementWrapper = () => {
  const { about, updateAbout } = useData();
  
  const handleUpdate = async (updatedAbout) => {
    try {
      const result = await updateAbout(updatedAbout);
      return result;
    } catch (error) {
      console.error('Failed to update about data:', error);
      throw error;
    }
  };
  
  return (
    <ResumeManagement 
      key={about?.documentType || 'default'}
      about={about} 
      onUpdate={handleUpdate}
    />
  );
};

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout, loading: authLoading } = useAuth();
  const { refreshData, loading: dataLoading, initialLoad } = useData();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'About', href: '/admin/about', icon: User },
    { name: 'Projects', href: '/admin/projects', icon: FolderOpen },
    { name: 'Certificates', href: '/admin/certificates', icon: Award },
    { name: 'Skills', href: '/admin/skills', icon: Wrench },
    { name: 'Resume/CV', href: '/admin/resume', icon: FileText },
    { name: 'Social Media', href: '/admin/social-media', icon: Share2 },
    { name: 'Site Config', href: '/admin/configuration', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    refreshData();
  };

  // Show loading spinner while data is being fetched
  if (authLoading || (dataLoading && !initialLoad)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Link
                to="/"
                target="_blank"
                className="text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                View Portfolio
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 py-6 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<DashboardOverview />} />
              <Route path="/about" element={<AboutManagement />} />
              <Route path="/projects" element={<ProjectsManagementUnified />} />
              <Route path="/certificates" element={<CertificatesManagementUnified />} />
              <Route path="/skills" element={<SimplifiedSkillsManagement />} />
              <Route path="/resume" element={<ResumeManagementWrapper />} />
              <Route path="/social-media" element={<SocialMediaManagement />} />
              <Route path="/configuration" element={<SiteConfiguration />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;


