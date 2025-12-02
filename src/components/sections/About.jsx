import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import SEO from '../SEO';

const About = ({ data }) => {
  const safeData = data || {};

  // Content blocks
  const blocks = [];
  if (safeData.summary) blocks.push(safeData.summary);
  if (safeData.professionalBackground) blocks.push(String(safeData.professionalBackground));
  if (Array.isArray(safeData.bio)) {
    safeData.bio.forEach((p) => {
      if (p && typeof p === 'string') blocks.push(p);
    });
  }

  return (
    <section id="about" className="py-16 sm:py-24 lg:py-32 relative overflow-hidden transition-colors duration-300">
      <SEO
        title="About Me"
        description={safeData.summary || "Learn more about Syed Muzzamil Ali, a Full Stack Developer."}
      />
      {/* Warm Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#E6C2A3]/10 via-transparent to-transparent dark:from-[#1e293b]/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#D4A373]/8 via-transparent to-transparent dark:from-[#D4A373]/5" />
      </div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* New Centered Heading Block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16 md:mb-24"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-ink dark:text-ink-dark mb-4 sm:mb-6">
            About <span className="text-accent dark:text-accent-dark">Me.</span>
          </h2>
          <p className="font-sans text-ink/60 dark:text-ink-dark/60 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto px-2">
            A glimpse into who I am and what I do.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-20 items-start">

          {/* Left Column: Image */}
          <div className="lg:col-span-5 order-1 lg:order-1">
            <div className="lg:sticky lg:top-32">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative aspect-[3/4] w-[60%] sm:w-[50%] lg:w-[70%] mx-auto rounded-arch overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-all duration-700"
              >
                {safeData.photo ? (
                  <img src={safeData.photo} alt="Portrait" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                ) : (
                  <div className="w-full h-full bg-gray/10 flex items-center justify-center">
                    <span className="text-4xl sm:text-5xl lg:text-6xl">👤</span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-7 flex flex-col justify-center h-full pt-4 sm:pt-6 lg:pt-0 order-2 lg:order-2">

            {/* Bio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-sans text-[10px] sm:text-xs font-bold tracking-widest uppercase text-accent dark:text-accent-dark mb-4 sm:mb-6 lg:mb-8">Who I Am</h3>
              <div className="space-y-4 sm:space-y-5 lg:space-y-6 font-serif text-base sm:text-lg md:text-xl lg:text-2xl text-ink dark:text-ink-dark leading-relaxed">
                {blocks.length > 0 ? (
                  blocks.map((block, idx) => (
                    <p key={idx} className="text-ink/90 dark:text-ink-dark/90">{block}</p>
                  ))
                ) : (
                  <p className="text-ink/50 dark:text-ink-dark/50 italic">No bio available.</p>
                )}
              </div>
            </motion.div>

            {/* Metrics / Statistics */}
            {(() => {
              // Prepare stats
              let stats = []
              if (safeData.statistics && Array.isArray(safeData.statistics) && safeData.statistics.length > 0) {
                stats = safeData.statistics.filter(s => s.isActive !== false)
              } else {
                // Fallback to legacy
                if (safeData.yearsExperience) stats.push({ label: 'Years Experience', value: safeData.yearsExperience })
                if (safeData.projectsCount) stats.push({ label: 'Projects Completed', value: safeData.projectsCount })
                if (safeData.technologiesCount) stats.push({ label: 'Technologies', value: safeData.technologiesCount })
                if (safeData.certificatesCount) stats.push({ label: 'Certifications', value: safeData.certificatesCount })
              }

              if (stats.length === 0) return null

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-10 lg:mt-12 pt-8 sm:pt-10 lg:pt-12 border-t border-ink/10 dark:border-ink-dark/10"
                >
                  {stats.map((stat, idx) => (
                    <div key={idx}>
                      <h4 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-accent dark:text-accent-dark mb-1 sm:mb-2">
                        {stat.value}+
                      </h4>
                      <p className="font-sans text-[9px] sm:text-[10px] md:text-xs font-bold tracking-widest uppercase text-ink/60 dark:text-ink-dark/60">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )
            })()}

            {/* Resume Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              {safeData.resumes && safeData.resumes.length > 0 && (
                <div className="mt-8 sm:mt-10 lg:mt-12">
                  <a
                    href={safeData.resumes[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-ink dark:bg-ink-dark text-paper dark:text-paper-dark rounded-full font-sans text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-accent dark:hover:bg-accent-dark transition-colors duration-300"
                  >
                    Download Resume
                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </a>
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default About;