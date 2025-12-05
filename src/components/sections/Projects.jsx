import { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Filter } from 'lucide-react'
import UnifiedCard from '../UnifiedCard'
import UnifiedModal from '../UnifiedModal'

const Projects = ({ data, skills = [] }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  const [selectedFilter, setSelectedFilter] = useState('all')
  const [expandedProject, setExpandedProject] = useState(null)
  const gridRef = useRef(null)
  const [cardHeights, setCardHeights] = useState({})
  const prevCardHeightsRef = useRef({})
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

  // Default filters for projects (primary + subcategories)
  const availableFilters = ['all', 'academic', 'personal', 'web', 'mobile', 'ai-ml-dl', 'cloud', 'desktop', 'other']

  // Normalize a project's category into the simplified taxonomy
  const normalizeCategory = (value) => {
    if (!value) return 'personal'
    const v = String(value).toLowerCase()
    if (v === 'academic' || v === 'school' || v === 'course' || v === 'thesis' || v === 'research') return 'academic'
    return 'personal'
  }

  // Filter projects based on selected filter. If the filter is primary (academic/personal) match against project.category,
  // otherwise match against project.subcategories (array).
  const filteredProjects = data
    ? data.filter(project => {
        if (selectedFilter === 'all') return true

        if (selectedFilter === 'academic' || selectedFilter === 'personal') {
          return normalizeCategory(project.category) === selectedFilter
        }

        // check subcategories (normalize values defensively)
        const subcats = Array.isArray(project.subcategories) ? project.subcategories : (project.subcategories ? [project.subcategories] : [])
        const sNormalized = subcats.map(s => String(s || '').toLowerCase())
        return sNormalized.includes(selectedFilter)
      })
    : []

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter)
  }

  // If a project id is provided in the URL search params (e.g. ?project=<id>), open its modal
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const pid = params.get('project')
      if (pid) setExpandedProject(pid)
    } catch (_) {}
  }, [])

  const handleExpand = (projectId) => {
    setExpandedProject(projectId)
  }

  // Compute a uniform height based on the tallest visible card in the grid
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const measure = () => {
      const cardEls = Array.from(grid.querySelectorAll('.project-card'))
      if (cardEls.length === 0) {
        setCardHeights({})
        if (uniformCardHeight) setUniformCardHeight(null)
        return
      }

      // Reset temporary heights so we can measure natural heights
      cardEls.forEach(c => (c.style.height = 'auto'))

      // Group items by top offset (row grouping). Use rounded top to avoid fractional differences.
      const groups = new Map()
      cardEls.forEach(el => {
        const rect = el.getBoundingClientRect()
        const top = Math.round(rect.top)
        if (!groups.has(top)) groups.set(top, [])
        groups.get(top).push(el)
      })

      const newHeights = {}
      for (const [top, els] of groups.entries()) {
        const max = els.reduce((m, el) => Math.max(m, el.offsetHeight), 0)
        els.forEach(el => {
          const id = el.getAttribute('data-project-id') || el.dataset.projectId
          if (id) newHeights[id] = max > 0 ? `${max}px` : null
        })
      }
      // Only update state when heights actually change to avoid infinite loops
      const prev = prevCardHeightsRef.current || {}
      const keysA = Object.keys(prev)
      const keysB = Object.keys(newHeights)
      let equal = keysA.length === keysB.length
      if (equal) {
        for (const key of keysA) {
          if (prev[key] !== newHeights[key]) { equal = false; break }
        }
      }
      if (!equal) {
        prevCardHeightsRef.current = newHeights
        setCardHeights(newHeights)
      }
      if (import.meta.env.DEV) console.debug('[Projects] per-row groups', Array.from(groups.keys()).length, 'rows, cardHeights', newHeights)

      // compute global maximum height as well
      const globalMax = cardEls.reduce((m, el) => Math.max(m, el.offsetHeight), 0)
      const uniformHeight = globalMax > 0 ? `${globalMax}px` : null
      const prevUniform = prevUniformHeightRef.current || null
      if (prevUniform !== uniformHeight) {
        prevUniformHeightRef.current = uniformHeight
        setUniformCardHeight(uniformHeight)
      }
      if (import.meta.env.DEV) { console.debug('[Projects] uniformCardHeight', uniformHeight) }
    }

    // Measure on next frame to allow images/content to load into layout
    const id = window.setTimeout(measure, 120)
    // Re-measure again later to catch images that load after initial paint
    const id2 = window.setTimeout(measure, 500)
    const id3 = window.setTimeout(measure, 1200)

    // Resize observer to handle images or layout changes
    let ro
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measure())
      ro.observe(grid)
      Array.from(grid.querySelectorAll('.project-card')).forEach(el => ro.observe(el))
    }

    // MutationObserver: if card children change (e.g., images, badges), remeasure
    const mo = new MutationObserver(() => measure())
    mo.observe(grid, { childList: true, subtree: true, attributes: true })

    // Also remeasure on image load in case thumbnails change layout
    const imgs = Array.from(grid.querySelectorAll('img'))
      imgs.forEach(img => {
      img.addEventListener('load', measure)
      img.addEventListener('error', measure)
    })
      // If images already complete, remeasure right away
      if (imgs.length > 0 && imgs.every(img => img.complete)) {
        measure()
      }

    window.addEventListener('resize', measure)

    return () => {
      window.clearTimeout(id)
      window.clearTimeout(id2)
      window.clearTimeout(id3)
      window.removeEventListener('resize', measure)
      if (ro) ro.disconnect()
      imgs.forEach(img => {
        img.removeEventListener('load', measure)
        img.removeEventListener('error', measure)
      })
      mo.disconnect()
      mo.disconnect()
    }
  }, [filteredProjects])

  const handleCloseModal = () => {
    setExpandedProject(null)
  }

  // If no projects available, render nothing (hide the section)
  if (!data || data.length === 0) return null

  return (
    <section ref={ref} className="section-padding bg-gray-50 dark:bg-gray-800">
      <div className="container-max">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            My <span className="text-primary-600 dark:text-primary-400">Projects</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Here are some of my recent projects that showcase my skills and experience
          </p>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {availableFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-4 py-2 sm:px-6 sm:py-2 rounded-full font-medium transition-all duration-200 ${
                selectedFilter === filter
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-2" />
              {filter === 'ai-ml-dl' ? 'AI/ML/DL' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        {/* Use three columns on large/xl to match previous layout and make cards appear taller and center-aligned */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 3xl:gap-10">
            {filteredProjects.map((project, index) => (
              <UnifiedCard
                key={project._id}
                data={project}
                type="project"
                mode="home"
                onExpand={handleExpand}
                // use global equal height for simplicity
                targetHeight={uniformCardHeight}
                // pass active skill names so UnifiedCard can hide inactive ones
                activeSkillNames={activeSkillNames}
              />
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No projects found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No projects match the selected category. Try selecting a different filter.
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