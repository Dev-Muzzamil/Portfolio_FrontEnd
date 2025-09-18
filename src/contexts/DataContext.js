import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [about, setAbout] = useState(null);
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [skills, setSkills] = useState([]);
  const [configuration, setConfiguration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [aboutRes, projectsRes, certificatesRes, skillsRes, configRes] = await Promise.all([
        axios.get('/api/about'),
        axios.get('/api/projects'),
        axios.get('/api/certificates'),
        axios.get('/api/skills'),
        axios.get('/api/configuration')
      ]);

      setAbout(aboutRes.data);
      setProjects(projectsRes.data);
      setCertificates(certificatesRes.data);
      setSkills(skillsRes.data);
      setConfiguration(configRes.data);
      setInitialLoad(true);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSkills = async () => {
    try {
      const skillsRes = await axios.get('/api/skills');
      setSkills(skillsRes.data);
    } catch (error) {
      console.error('Error refreshing skills:', error);
    }
  };

  // About methods
  const updateAbout = async (data) => {
    try {
      const response = await axios.put('/api/about', data);
      setAbout(response.data);
      return { success: true };
    } catch (error) {
      // Handle different types of errors
      if (error.response?.status === 401) {
        // Auth error - let the interceptor handle it
        return { 
          success: false, 
          message: 'Authentication expired. Please login again.' 
        };
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        return { 
          success: false, 
          message: 'Request timed out. Please try again.' 
        };
      } else {
        // Other errors
        return { 
          success: false, 
          message: error.response?.data?.message || 'Update failed' 
        };
      }
    }
  };

  // Project methods
  const createProject = async (data) => {
    // Optimistic update - add project immediately with temporary ID
    const tempId = `temp_${Date.now()}`;
    const tempProject = { ...data, _id: tempId, createdAt: new Date().toISOString() };
    setProjects(prev => [...prev, tempProject]);
    
    try {
      const response = await axios.post('/api/projects', data);
      setProjects(prev => prev.map(p => p._id === tempId ? response.data : p));
      return { success: true };
    } catch (error) {
      // Revert on error
      setProjects(prev => prev.filter(p => p._id !== tempId));
      return { 
        success: false, 
        message: error.response?.data?.message || 'Creation failed' 
      };
    }
  };

  const updateProject = async (id, data) => {
    // Optimistic update - update UI immediately
    const previousProjects = projects;
    setProjects(prev => prev.map(p => p._id === id ? { ...p, ...data } : p));
    
    try {
      // If only updating visibility, use the public endpoint
      if (Object.keys(data).length === 1 && 'visible' in data) {
        const response = await axios.patch(`/api/projects/${id}/visibility`, { visible: data.visible });
        setProjects(prev => prev.map(p => p._id === id ? response.data : p));
        return { success: true };
      } else {
        // For other updates, use the authenticated endpoint
        const response = await axios.put(`/api/projects/${id}`, data);
        setProjects(prev => prev.map(p => p._id === id ? response.data : p));
        return { success: true };
      }
    } catch (error) {
      // Revert on error
      setProjects(previousProjects);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Update failed' 
      };
    }
  };

  const deleteProject = async (id) => {
    // Optimistic update - remove project immediately
    const projectToDelete = projects.find(p => p._id === id);
    setProjects(prev => prev.filter(p => p._id !== id));
    
    try {
      await axios.delete(`/api/projects/${id}`);
      return { success: true };
    } catch (error) {
      // Revert on error
      if (projectToDelete) {
        setProjects(prev => [...prev, projectToDelete]);
      }
      return { 
        success: false, 
        message: error.response?.data?.message || 'Deletion failed' 
      };
    }
  };

  // Certificate methods
  const createCertificate = async (data) => {
    // Optimistic update - add certificate immediately with temporary ID
    const tempId = `temp_${Date.now()}`;
    const tempCertificate = { ...data, _id: tempId, createdAt: new Date().toISOString() };
    setCertificates(prev => [...prev, tempCertificate]);
    
    try {
      const response = await axios.post('/api/certificates', data);
      setCertificates(prev => prev.map(c => c._id === tempId ? response.data : c));
      return { success: true };
    } catch (error) {
      // Revert on error
      setCertificates(prev => prev.filter(c => c._id !== tempId));
      return { 
        success: false, 
        message: error.response?.data?.message || 'Creation failed' 
      };
    }
  };

  const updateCertificate = async (id, data) => {
    // Optimistic update - update UI immediately
    const previousCertificates = certificates;
    setCertificates(prev => prev.map(c => c._id === id ? { ...c, ...data } : c));
    
    try {
      // If only updating visibility, use the public endpoint
      if (Object.keys(data).length === 1 && 'visible' in data) {
        const response = await axios.patch(`/api/certificates/${id}/visibility`, { visible: data.visible });
        setCertificates(prev => prev.map(c => c._id === id ? response.data : c));
        return { success: true };
      } else {
        // For other updates, use the authenticated endpoint
        const response = await axios.put(`/api/certificates/${id}`, data);
        setCertificates(prev => prev.map(c => c._id === id ? response.data : c));
        return { success: true };
      }
    } catch (error) {
      // Revert on error
      setCertificates(previousCertificates);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Update failed' 
      };
    }
  };

  const deleteCertificate = async (id) => {
    // Optimistic update - remove certificate immediately
    const certificateToDelete = certificates.find(c => c._id === id);
    setCertificates(prev => prev.filter(c => c._id !== id));
    
    try {
      await axios.delete(`/api/certificates/${id}`);
      return { success: true };
    } catch (error) {
      // Revert on error
      if (certificateToDelete) {
        setCertificates(prev => [...prev, certificateToDelete]);
      }
      return { 
        success: false, 
        message: error.response?.data?.message || 'Deletion failed' 
      };
    }
  };

  // Add certificate to state (for file uploads)
  const addCertificate = (certificate) => {
    setCertificates(prev => [...prev, certificate]);
  };

  // Skill methods
  const createSkill = async (data) => {
    // Optimistic update - add skill immediately with temporary ID
    const tempId = `temp_${Date.now()}`;
    const tempSkill = { ...data, _id: tempId, createdAt: new Date().toISOString() };
    setSkills(prev => [...prev, tempSkill]);
    
    try {
      const response = await axios.post('/api/skills', data);
      setSkills(prev => prev.map(s => s._id === tempId ? response.data : s));
      return { success: true };
    } catch (error) {
      // Revert on error
      setSkills(prev => prev.filter(s => s._id !== tempId));
      return { 
        success: false, 
        message: error.response?.data?.message || 'Creation failed' 
      };
    }
  };

  const updateSkill = async (id, data) => {
    // Optimistic update - update UI immediately
    const previousSkills = skills;
    setSkills(prev => prev.map(s => s._id === id ? { ...s, ...data } : s));
    
    try {
      const response = await axios.put(`/api/skills/${id}`, data);
      setSkills(prev => prev.map(s => s._id === id ? response.data : s));
      return { success: true };
    } catch (error) {
      // Revert on error
      setSkills(previousSkills);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Update failed' 
      };
    }
  };

  const deleteSkill = async (id) => {
    // Optimistic update - remove skill immediately
    const skillToDelete = skills.find(s => s._id === id);
    setSkills(prev => prev.filter(s => s._id !== id));
    
    try {
      await axios.delete(`/api/skills/${id}`);
      return { success: true };
    } catch (error) {
      // Revert on error
      if (skillToDelete) {
        setSkills(prev => [...prev, skillToDelete]);
      }
      return { 
        success: false, 
        message: error.response?.data?.message || 'Deletion failed' 
      };
    }
  };

  const bulkDeleteSkills = async (skillIds) => {
    // Optimistic update - remove skills immediately
    const skillsToDelete = skills.filter(s => skillIds.includes(s._id));
    setSkills(prev => prev.filter(s => !skillIds.includes(s._id)));
    
    try {
      await axios.delete('/api/skills/bulk', { data: { skillIds } });
      return { success: true };
    } catch (error) {
      // Revert on error
      setSkills(prev => [...prev, ...skillsToDelete]);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Bulk deletion failed' 
      };
    }
  };

  // Configuration methods
  const updateConfiguration = async (data) => {
    const previousConfig = configuration;
    setConfiguration(prev => ({ ...prev, ...data }));
    
    try {
      const response = await axios.put('/api/configuration', data);
      setConfiguration(response.data);
      return { success: true };
    } catch (error) {
      setConfiguration(previousConfig);
      return { success: false, message: error.response?.data?.message || 'Update failed' };
    }
  };

  const resetConfiguration = async () => {
    try {
      const response = await axios.post('/api/configuration/reset');
      setConfiguration(response.data);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Reset failed' };
    }
  };

  const value = {
    about,
    projects,
    certificates,
    skills,
    configuration,
    loading,
    initialLoad,
    updateAbout,
    createProject,
    updateProject,
    deleteProject,
    createCertificate,
    updateCertificate,
    deleteCertificate,
    addCertificate,
    createSkill,
    updateSkill,
    deleteSkill,
    bulkDeleteSkills,
    updateConfiguration,
    resetConfiguration,
    refreshData: fetchAllData,
    refreshSkills
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};


