import { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import UnifiedCard from '../UnifiedCard'
import UnifiedModal from '../UnifiedModal'
import SEO from '../SEO'

const Projects = ({ data, skills = [] }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  const [selectedFilter, setSelectedFilter] = useState('all')
  const [expandedProject, setExpandedProject] = useState(null)
  const gridRef = useRef(null)
  const [uniformCardHeight, setUniformCardHeight] = useState(null)
  const prevUniformHeightRef = useRef(null)

  // Build a set of active skill names to hide inactive chips
  const activeSkillNames = useMemo(() => {
    if (!skills || skills.length === 0) return null
    const set = new Set()
    skills.forEach(skill => {
      if (skill && skill.name) set.add(skill.name)
    })
    return set
  }, [skills])

  const availableFilters = ['all', 'academic', 'personal', 'web', 'mobile', 'ai-ml-dl', 'cloud', 'desktop', 'other']

  const normalizeCategory = (value) => {
    if (!value) return 'personal'
    const v = String(value).toLowerCase()
    if (v === 'academic' || v === 'school' || v === 'course' || v === 'thesis' || v === 'research') return 'academic'
    return 'personal'
  }

  const filteredProjects = data
    ? data.filter(project => {
      if (selectedFilter === 'all') return true

      if (selectedFilter === 'academic' || selectedFilter === 'personal') {
        return normalizeCategory(project.category) === selectedFilter
      }

      const subcats = Array.isArray(project.subcategories) ? project.subcategories : (project.subcategories ? [project.subcategories] : [])
      const sNormalized = subcats.map(s => String(s || '').toLowerCase())
      return sNormalized.includes(selectedFilter)
    })
    : []

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter)
  }

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const pid = params.get('project')
      if (pid) setExpandedProject(pid)
    } catch (_) { /* ignore */ }
  }, [])

  const handleExpand = (projectId) => {
    setExpandedProject(projectId)
  }

  // Compute uniform height logic (simplified)
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const measure = () => {
      const cardEls = Array.from(grid.querySelectorAll('.project-card'))
      if (cardEls.length === 0) {
        setUniformCardHeight(null)
        return
      }

      // Reset heights to auto
      cardEls.forEach(c => (c.style.height = 'auto'))

      // Find max height
      const globalMax = cardEls.reduce((m, el) => Math.max(m, el.offsetHeight), 0)
      const uniformHeight = globalMax > 0 ? `${globalMax}px` : null

      if (prevUniformHeightRef.current !== uniformHeight) {
        prevUniformHeightRef.current = uniformHeight
        setUniformCardHeight(uniformHeight)
      }
    }

    const id = window.setTimeout(measure, 100)
    window.addEventListener('resize', measure)

    // Observer for images
    const imgs = Array.from(grid.querySelectorAll('img'))
    imgs.forEach(img => img.addEventListener('load', measure))

    return () => {
      window.clearTimeout(id)
      window.removeEventListener('resize', measure)
      imgs.forEach(img => img.removeEventListener('load', measure))
    }
  }, [filteredProjects])

  const handleCloseModal = () => {
    setExpandedProject(null)
  }

  if (!data || data.length === 0) return null

  return (
    <section id="projects" ref={ref} className="py-16 sm:py-24 lg:py-32 relative overflow-hidden transition-colors duration-300">
      <SEO
        title="Projects"
        description="Explore my portfolio of projects ranging from web development to AI/ML."
      />
      {/* Warm Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#E6C2A3]/10 via-transparent to-transparent dark:from-[#1e293b]/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#D4A373]/6 via-transparent to-transparent dark:from-[#D4A373]/5" />
      </div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16 md:mb-24"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-ink dark:text-ink-dark mb-4 sm:mb-6">
            My <span className="text-accent dark:text-accent-dark">Works.</span>
          </h2>
          <p className="font-sans text-ink/60 dark:text-ink-dark/60 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto px-2">
            Where engineering meets human-centric design.
          </p>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 mb-8 sm:mb-12 lg:mb-16 justify-center sm:justify-start"
        >
          {availableFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-full text-[10px] sm:text-xs font-sans font-bold uppercase tracking-widest transition-all duration-300 ${selectedFilter === filter
                ? 'bg-ink dark:bg-ink-dark text-paper dark:text-paper-dark shadow-lg dark:shadow-strong-dark transform scale-105'
                : 'bg-transparent text-ink/50 dark:text-ink-dark/50 border border-ink/10 dark:border-ink-dark/10 hover:border-accent dark:hover:border-accent-dark hover:text-accent dark:hover:text-accent-dark'
                }`}
            >
              {filter === 'ai-ml-dl' ? 'AI / ML' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {filteredProjects.map((project) => (
            <UnifiedCard
              key={project._id}
              data={project}
              type="project"
              mode="home"
              onExpand={handleExpand}
              targetHeight={uniformCardHeight}
              activeSkillNames={activeSkillNames}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center py-12 sm:py-16 lg:py-24"
          >
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4 opacity-20">🔍</div>
            <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl text-ink dark:text-ink-dark mb-2">No projects found</h3>
            <p className="font-sans text-sm sm:text-base text-ink/60 dark:text-ink-dark/60">
              No projects match the selected category.
            </p>
          </motion.div>
        )}

        {/* Expanded Modal */}
        <UnifiedModal
          data={filteredProjects.find(project => project._id === expandedProject)}
          type="project"
          mode="home"
          isOpen={!!expandedProject}
          onClose={handleCloseModal}
        />
      </div>
    </section>
  )
}

export default Projects