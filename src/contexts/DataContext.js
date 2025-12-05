import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [aboutRes, projectsRes, certificatesRes, skillsRes] = await Promise.all([
        axios.get('/api/about'),
        axios.get('/api/projects'),
        axios.get('/api/certificates'),
        axios.get('/api/skills')
      ]);

      setAbout(aboutRes.data);
      setProjects(projectsRes.data);
      setCertificates(certificatesRes.data);
      setSkills(skillsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // About methods
  const updateAbout = async (data) => {
    // Optimistic update - update UI immediately
    const previousAbout = about;
    setAbout(data);
    
    try {
      const response = await axios.put('/api/about', data);
      setAbout(response.data);
      return { success: true };
    } catch (error) {
      // Revert on error
      setAbout(previousAbout);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Update failed' 
      };
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
      const response = await axios.put(`/api/projects/${id}`, data);
      setProjects(prev => prev.map(p => p._id === id ? response.data : p));
      return { success: true };
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
      const response = await axios.put(`/api/certificates/${id}`, data);
      setCertificates(prev => prev.map(c => c._id === id ? response.data : c));
      return { success: true };
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

  const value = {
    about,
    projects,
    certificates,
    skills,
    loading,
    updateAbout,
    createProject,
    updateProject,
    deleteProject,
    createCertificate,
    updateCertificate,
    deleteCertificate,
    createSkill,
    updateSkill,
    deleteSkill,
    refreshData: fetchAllData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};


