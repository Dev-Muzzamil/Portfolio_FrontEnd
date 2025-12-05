import React from 'react';
import Hero from '../components/sections/Hero';
import About from '../components/sections/About';
import ProjectsUnified from '../components/sections/ProjectsUnified';
import Skills from '../components/sections/Skills';
import CertificatesUnified from '../components/sections/CertificatesUnified';
import GitHubProfile from '../components/sections/GitHubProfile';
import ContactFooter from '../components/sections/ContactFooter';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <About />
      <ProjectsUnified mode="home" />
      <Skills />
      <CertificatesUnified mode="home" />
      <GitHubProfile />
      <ContactFooter />
    </div>
  );
};

export default Home;


