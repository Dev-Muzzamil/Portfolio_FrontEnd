import React from 'react';
import Hero from '../components/sections/Hero';
import About from '../components/sections/About';
import Projects from '../components/sections/Projects';
import Skills from '../components/sections/Skills';
import Certificates from '../components/sections/Certificates';
import GitHubProfile from '../components/sections/GitHubProfile';
import Contact from '../components/sections/Contact';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <About />
      <Projects />
      <Skills />
      <Certificates />
      <GitHubProfile />
      <Contact />
    </div>
  );
};

export default Home;


