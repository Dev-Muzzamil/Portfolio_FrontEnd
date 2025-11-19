import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { MapPin, Mail, Phone, GraduationCap, Calendar, Award, Github, Linkedin, Twitter, Globe, Instagram, Youtube, Facebook, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../../services/api'
import { normalizeSocial } from '../../utils/social'

const About = ({ data = {} }) => {
  const [institutes, setInstitutes] = useState([])
  const [education, setEducation] = useState([])
  const [experience, setExperience] = useState([])
  // UX state
  const [openEdu, setOpenEdu] = useState({}) // { id: boolean }
  const [openExp, setOpenExp] = useState({})
  const [linkedProjectsByInstitute, setLinkedProjectsByInstitute] = useState({})
  const [currentEduIndex, setCurrentEduIndex] = useState(0)
  const carouselRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const fetchBoth = async () => {
      try {
        const [instRes, eduRes, expRes] = await Promise.all([
          api.get('/institutes'),
          api.get('/education'),
          api.get('/experience')
        ])
        setInstitutes(instRes.data || [])
        setEducation(eduRes.data?.education || [])
        setExperience(expRes.data?.experience || [])
      } catch (_) {}
    }
    fetchBoth()
  }, [])

  // Fetch linked projects for an institute (by id or name)
  const fetchLinkedProjectsFor = async (instituteIdentifier) => {
    if (!instituteIdentifier) return []
    try {
      // if it's an ObjectId-like string (24 hex chars) treat as id
      const isId = typeof instituteIdentifier === 'string' && /^[0-9a-fA-F]{24}$/.test(instituteIdentifier)
      const res = await api.get(`/projects?${isId ? `instituteId=${instituteIdentifier}` : `instituteName=${encodeURIComponent(instituteIdentifier)}`}`)
      return res.data.projects || []
    } catch (err) {
      return []
    }
  }

  // When an education entry is opened, fetch its linked projects on demand
  useEffect(() => {
    const openIds = Object.keys(openEdu).filter(k => openEdu[k])
    if (openIds.length === 0) return
    openIds.forEach(async (eduKey) => {
      const edu = education.find(e => (e._id || `${eduKey}`).toString() === eduKey.toString())
      if (!edu) return
      const instituteInfo = institutes.find(
        (inst) => inst.name && edu.institution && inst.name.toLowerCase().trim() === edu.institution.toLowerCase().trim()
      )
      const identifier = instituteInfo?._id || edu.institution
      if (linkedProjectsByInstitute[identifier]) return
      const projs = await fetchLinkedProjectsFor(identifier)
      if (projs && projs.length) {
        setLinkedProjectsByInstitute(prev => ({ ...prev, [identifier]: projs }))
      } else {
        setLinkedProjectsByInstitute(prev => ({ ...prev, [identifier]: [] }))
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openEdu, institutes, education])

  // Reset indices if list changes
  useEffect(() => {
    setCurrentEduIndex(0)
    setActiveIndex(0)
    if (carouselRef.current) carouselRef.current.scrollLeft = 0
  }, [education.length])

  const toggleEducation = (id) => setOpenEdu((prev) => ({ ...prev, [id]: !prev[id] }))
  const toggleExperience = (id) => setOpenExp((prev) => ({ ...prev, [id]: !prev[id] }))

  // Build ordered content blocks for Who I Am
  const allBlocks = (() => {
    const blocks = []
    if (data.summary) blocks.push(data.summary)
    // Keep professionalBackground as a single block; allow explicit newlines inside it
    if (data.professionalBackground) blocks.push(String(data.professionalBackground))
    if (Array.isArray(data.bio)) {
      data.bio.filter(Boolean).forEach((p) => blocks.push(p))
    }
    return blocks
  })()

  const firstCount = Math.min(3, allBlocks.length)
  const firstBlocks = allBlocks.slice(0, firstCount)
  const remainingBlocks = allBlocks.slice(firstCount)

  return (
    <motion.section
      id="about"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      className="section-padding bg-gray-50 dark:bg-gray-800"
    >
      <div className="container-max">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="font-display2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">About Me</h2>
        </div>

        {/* Top: Image (1/3) + Who I Am (2/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left: Portrait Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, margin: '-50px' }}
            className="space-y-8 lg:col-span-1"
          >
            <div className="overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-md">
              {data.photo ? (
                <img src={data.photo} alt="About portrait" className="w-full h-64 sm:h-72 md:h-80 lg:h-[420px] object-cover" />
              ) : (
                <div className="w-full h-64 sm:h-72 md:h-80 lg:h-[420px] bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-6xl">👤</div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Add a photo in Admin → About</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right: Who I Am beside image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true, margin: '-50px' }}
            className="space-y-8 lg:col-span-2"
          >
            <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-md">
              <h3 className="font-display2 text-2xl font-bold text-gray-900 dark:text-white mb-2">Who I Am</h3>
              <div className="space-y-4">
                {firstBlocks.length === 0 ? (
                  <p className="text-lg text-gray-600 dark:text-gray-400">A detailed description about your background, experience, and passion for technology.</p>
                ) : (
                  firstBlocks.map((content, idx) => (
                    <motion.p
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 + idx * 0.05 }}
                      className="w-full text-lg text-gray-600 dark:text-gray-400 leading-relaxed p-4 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-md whitespace-pre-line"
                    >
                      {content}
                    </motion.p>
                  ))
                )}
              </div>
            </div>

            {/* Stats (optional) */}
            {(() => {
              if (data.showStatistics === false) return null
              const arrayStats = Array.isArray(data.statistics)
                ? data.statistics.filter((s) => s?.isActive !== false && parseInt(s?.value) > 0)
                : []
              if (arrayStats.length === 0) return null
              const gridCols =
                arrayStats.length === 1
                  ? 'grid-cols-1'
                  : arrayStats.length === 2
                  ? 'grid-cols-2'
                  : arrayStats.length === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-4'
              return (
                <div className={`grid gap-4 ${gridCols}`}>
                  {arrayStats.map((s, i) => (
                    <div
                      key={i}
                      className="w-full text-center p-4 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-md"
                    >
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">{s.value}+</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{s.label || 'Stat'}</div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </motion.div>
        </div>

        {/* Remaining blocks full-width below */}
        {remainingBlocks.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4">
            {remainingBlocks.map((content, idx) => (
              <motion.p
                key={`rem-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + idx * 0.05 }}
                className="w-full text-lg text-gray-600 dark:text-gray-400 leading-relaxed p-4 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-md whitespace-pre-line"
              >
                {content}
              </motion.p>
            ))}
          </div>
        )}

        {/* Experience + Education Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Experience column (left) */}
          {experience && experience.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true, margin: '-50px' }}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:hover:shadow-2xl dark:hover:shadow-gray-900/50 transition-all duration-300 p-6"
            >
              <h3 className="font-display2 text-2xl font-bold text-gray-900 dark:text-white mb-4">Experience</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-200 via-primary-400 to-secondary-300 dark:from-primary-800 dark:via-primary-600 dark:to-primary-400 rounded-full" />
                <div className="space-y-6">
                  {[...experience]
                    .sort((a, b) => {
                      // Current first
                      if (a.isCurrent && !b.isCurrent) return -1
                      if (!a.isCurrent && b.isCurrent) return 1
                      // Then by endDate desc (undefined last)
                      const aEnd = a.endDate ? new Date(a.endDate).getTime() : -Infinity
                      const bEnd = b.endDate ? new Date(b.endDate).getTime() : -Infinity
                      if (bEnd !== aEnd) return bEnd - aEnd
                      // Then by startDate desc
                      const aStart = a.startDate ? new Date(a.startDate).getTime() : -Infinity
                      const bStart = b.startDate ? new Date(b.startDate).getTime() : -Infinity
                      return bStart - aStart
                    })
                    .map((exp, idx) => {
                    const id = exp._id || `exp-${idx}`
                    const isOpen = !!openExp[id]
                    const yearOnly = (label, dateStr) => {
                      if (label) {
                        const y = String(label).match(/\d{4}/)
                        if (y) return y[0]
                      }
                      if (dateStr) return new Date(dateStr).getFullYear().toString()
                      return ''
                    }
                    const startYear = yearOnly(exp.startLabel, exp.startDate)
                    const endYear = exp.isCurrent ? 'Present' : yearOnly(exp.endLabel, exp.endDate)
                    const yearLine = startYear ? `${startYear}${endYear ? ` - ${endYear}` : ''}` : endYear || ''
                    const previewDesc = exp.description && exp.description.length > 140 ? `${exp.description.slice(0, 140)}…` : exp.description

                    let progressPct = null
                    if (exp.isCurrent && exp.startDate) {
                      try {
                        const start = new Date(exp.startDate).getTime()
                        const now = Date.now()
                        // Assume 2 years default for roles visualization
                        const duration = 2 * 365 * 24 * 3600 * 1000
                        progressPct = Math.min(95, Math.max(5, ((now - start) / duration) * 100))
                      } catch (_) {}
                    }

                    return (
                      <div key={id} className="relative pl-10 group">
                        <motion.div
                          className={`absolute left-3 top-5 w-4 h-4 rounded-full ring-4 ring-white/40 dark:ring-gray-800/40 transition-all duration-300 ${isOpen ? 'bg-primary-600 dark:bg-primary-400 scale-110' : 'bg-primary-400 dark:bg-primary-500 group-hover:scale-110'}`}
                          initial={{ opacity: 0, scale: 0.6 }}
                          whileInView={{ opacity: 1, scale: isOpen ? 1.1 : 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.35, delay: idx * 0.05 }}
                        />
                        <div className="p-5 md:p-6 rounded-lg bg-white/85 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-md hover:shadow-lg transition-all duration-300">
                          <button
                            type="button"
                            onClick={() => toggleExperience(id)}
                            aria-expanded={isOpen}
                            className="w-full text-left flex items-start justify-between gap-4"
                          >
                            <div className="flex-1">
                              <h4 className="text-base md:text-lg font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                <span>{exp.title || exp.role || 'Role'}</span>
                              </h4>
                              <div className="text-sm md:text-base text-primary-600 dark:text-primary-400 font-medium mt-1">
                                {exp.company || exp.organization || 'Company'}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {yearLine && (
                                  <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-white/80 dark:bg-gray-800/80 border border-white/30 dark:border-gray-700/30 text-gray-700 dark:text-gray-300">
                                    <Calendar className="w-3 h-3 mr-1.5 text-primary-600 dark:text-primary-400" />
                                    {yearLine}
                                  </span>
                                )}
                                {exp.isCurrent && progressPct != null && (
                                  <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-gradient-to-r from-primary-500 via-primary-400 to-secondary-400 text-white shadow-sm">
                                    Progress ~{Math.round(progressPct)}%
                                  </span>
                                )}
                              </div>
                              {previewDesc && !isOpen && (
                                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">{previewDesc}</p>
                              )}
                            </div>
                            {/* Removed chevron for minimalist look; entire header toggles */}
                          </button>
                          <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
                            {isOpen && (
                              <div className="pt-4">
                                {exp.description && (
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">{exp.description}</p>
                                )}
                                {Array.isArray(exp.skills) && exp.skills.length > 0 && (
                                  <div className="mb-1">
                                    <div className="flex flex-wrap gap-2">
                                      {exp.skills.map((s, i) => (
                                        <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-white/80 dark:bg-gray-800/80 border border-white/30 dark:border-gray-700/30 text-primary-700 dark:text-primary-300 shadow-sm">{s}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Education column (right or full-width if alone) */}
          {(education && education.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, margin: '-50px' }}
              className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:hover:shadow-2xl dark:hover:shadow-gray-900/50 transition-all duration-300 p-6 ${(!experience || experience.length === 0) ? 'lg:col-span-2' : ''}`}
            >
              <h3 className="font-display2 text-2xl font-bold text-gray-900 dark:text-white mb-4">Education</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-200 via-primary-400 to-secondary-300 dark:from-primary-800 dark:via-primary-600 dark:to-primary-400 rounded-full" />
                <div className="space-y-6">
                  {[...education]
                    .sort((a, b) => {
                      // Current first
                      if (a.isCurrent && !b.isCurrent) return -1
                      if (!a.isCurrent && b.isCurrent) return 1
                      // Then by endDate desc (undefined last)
                      const aEnd = a.endDate ? new Date(a.endDate).getTime() : -Infinity
                      const bEnd = b.endDate ? new Date(b.endDate).getTime() : -Infinity
                      if (bEnd !== aEnd) return bEnd - aEnd
                      // Then by startDate desc
                      const aStart = a.startDate ? new Date(a.startDate).getTime() : -Infinity
                      const bStart = b.startDate ? new Date(b.startDate).getTime() : -Infinity
                      return bStart - aStart
                    })
                    .map((edu, idx) => {
                    const instituteInfo = institutes.find(
                      (inst) =>
                        inst.name &&
                        edu.institution &&
                        inst.name.toLowerCase().trim() === edu.institution.toLowerCase().trim()
                    )
                    const instituteId = instituteInfo?._id
                    const linkedKey = instituteId || edu.institution
                    const linkedForThis = linkedProjectsByInstitute[linkedKey] || []
                    const yearOnly = (label, dateStr) => {
                      if (label) {
                        const y = String(label).match(/\d{4}/)
                        if (y) return y[0]
                      }
                      if (dateStr) return new Date(dateStr).getFullYear().toString()
                      return ''
                    }
                    const startYear = yearOnly(edu.startLabel, edu.startDate)
                    const endYear = edu.isCurrent ? 'Present' : yearOnly(edu.endLabel, edu.endDate)
                    const yearLine = startYear ? `${startYear}${endYear ? ` - ${endYear}` : ''}` : endYear || ''
                    const id = edu._id || `idx-${idx}`
                    const isOpen = !!openEdu[id]
                    // Truncated preview for collapsed state
                    const previewDesc = edu.description && edu.description.length > 140
                      ? `${edu.description.slice(0, 140)}…`
                      : edu.description

                    // Progress (simple) if current
                    let progressPct = null
                    if (edu.isCurrent && edu.startDate) {
                      try {
                        const start = new Date(edu.startDate).getTime()
                        const now = Date.now()
                        // Assume typical duration of 4 years for visualization
                        const duration = 4 * 365 * 24 * 3600 * 1000
                        progressPct = Math.min(95, Math.max(5, ((now - start) / duration) * 100))
                      } catch (_) {}
                    }

                    return (
                      <div key={id} className="relative pl-10 group">
                        {/* Animated dot */}
                        <motion.div
                          className={`absolute left-3 top-5 w-4 h-4 rounded-full ring-4 ring-white/40 dark:ring-gray-800/40 transition-all duration-300 ${isOpen ? 'bg-primary-600 dark:bg-primary-400 scale-110' : 'bg-primary-400 dark:bg-primary-500 group-hover:scale-110'}`}
                          initial={{ opacity: 0, scale: 0.6 }}
                          whileInView={{ opacity: 1, scale: isOpen ? 1.1 : 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.35, delay: idx * 0.05 }}
                        />
                        <div className="p-5 md:p-6 rounded-lg bg-white/85 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-md hover:shadow-lg transition-all duration-300">
                          {/* Header clickable area */}
                          <button
                            type="button"
                            onClick={() => toggleEducation(id)}
                            aria-expanded={isOpen}
                            className="w-full text-left flex items-start justify-between gap-4 focus:outline-none"
                          >
                            <div className="flex-1">
                              <h4 className="text-base md:text-lg font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                <span>{edu.degree}{edu.field ? ` - ${edu.field}` : ''}</span>
                              </h4>
                              <div className="text-sm md:text-base text-primary-600 dark:text-primary-400 font-medium mt-1">
                                {edu.institution}
                              </div>
                              {instituteInfo && instituteInfo.location && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {[
                                    instituteInfo.location.city,
                                    instituteInfo.location.state,
                                    instituteInfo.location.country
                                  ].filter(Boolean).join(', ')}
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {yearLine && (
                                  <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-white/80 dark:bg-gray-800/80 border border-white/30 dark:border-gray-700/30 text-gray-700 dark:text-gray-300">
                                    <Calendar className="w-3 h-3 mr-1.5 text-primary-600 dark:text-primary-400" />
                                    {yearLine}
                                  </span>
                                )}
                                {(edu.gpa || edu.grade) && (
                                  <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-white/80 dark:bg-gray-800/80 border border-white/30 dark:border-gray-700/30 text-gray-700 dark:text-gray-300">
                                    {edu.gpa ? `CGPA ${edu.gpa}` : `Grade ${edu.grade}`}
                                  </span>
                                )}
                                {edu.isCurrent && (() => {
                                  let pct = null
                                  if (edu.startDate) {
                                    try {
                                      const start = new Date(edu.startDate).getTime()
                                      const now = Date.now()
                                      const duration = 4 * 365 * 24 * 3600 * 1000
                                      pct = Math.min(95, Math.max(5, ((now - start) / duration) * 100))
                                    } catch (_) {}
                                  }
                                  return pct != null ? (
                                    <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-gradient-to-r from-primary-500 via-primary-400 to-secondary-400 text-white shadow-sm">Progress ~{Math.round(pct)}%</span>
                                  ) : null
                                })()}
                              </div>
                              {previewDesc && !isOpen && (
                                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                                  {previewDesc}
                                </p>
                              )}
                            </div>
                            {/* Removed chevron for minimalist look; entire header toggles */}
                          </button>
                          {/* Expanded content */}
                          <motion.div
                            initial={false}
                            animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                            transition={{ duration: 0.35 }}
                            className="overflow-hidden"
                          >
                            {isOpen && (
                              <div className="pt-4">
                                {edu.description && (
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">
                                    {edu.description}
                                  </p>
                                )}
                                {Array.isArray(edu.skills) && edu.skills.length > 0 && (
                                  <div className="mb-4">
                                    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Skills Developed</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {edu.skills.map((skill, sIdx) => (
                                        <span
                                          key={sIdx}
                                          className="px-2.5 py-1 text-xs rounded-full bg-white/80 dark:bg-gray-800/80 border border-white/30 dark:border-gray-700/30 text-primary-700 dark:text-primary-300 shadow-sm hover:shadow md:transition"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {(edu.certificateFile?.originalUrl || edu.certificateUrl) && (
                                  <a
                                    href={edu.certificateFile?.originalUrl || edu.certificateUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 transition-colors text-xs font-medium px-3 py-1 rounded-full bg-white/80 dark:bg-gray-800/80 border border-white/30 dark:border-gray-700/30 shadow-sm"
                                  >
                                    <Award className="w-4 h-4 mr-2" /> View certificate
                                  </a>
                                )}
                                {/* Linked projects for this institute/education */}
                                {linkedForThis.length > 0 && (
                                  <div className="mt-4">
                                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Related Projects</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {linkedForThis.map((p) => (
                                        <a
                                          key={p._id}
                                          href={`/?project=${p._id}#projects`}
                                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-sm hover:shadow-lg transition-all duration-200 text-sm text-primary-700 dark:text-primary-300"
                                        >
                                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 11c0 3-3 6-7 6s-7-3-7-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                          <span>{p.title || p.name || p.full_name}</span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
          {/* If neither present, show placeholder full-width (only on single-column render) */}
          {(!experience || experience.length === 0) && (!education || education.length === 0) && (
            <div className="col-span-1">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 text-gray-600 dark:text-gray-400">Experience and education details will appear here.</div>
            </div>
          )}
        </div>

        {/* Full-width: Key Achievements below Education */}
        {(() => {
          const achievements = Array.isArray(data.keyAchievements)
            ? data.keyAchievements
            : Array.isArray(data.achievements)
            ? data.achievements
            : []
          if (!achievements || achievements.length === 0) return null
          const monthName = (m) => {
            const idx = parseInt(m, 10) - 1
            return isNaN(idx) ? '' : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx]
          }
          return (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true, margin: '-50px' }}
              className="mt-6"
            >
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:hover:shadow-2xl dark:hover:shadow-gray-900/50 transition-all duration-300 p-6">
                <h3 className="font-display2 text-2xl font-bold text-gray-900 dark:text-white mb-4">Key Achievements</h3>
                <div className="flex flex-wrap gap-3">
                  {achievements
                    .filter((a) => a && a.isActive !== false)
                    .map((a, i) => {
                      const title = a.title || a.label || 'Achievement'
                      const when =
                        a.dateLabel ||
                        (a.month && a.year ? `${monthName(a.month)} ${a.year}` : a.year || '')
                      return (
                        <a
                          key={i}
                          href={a.link || undefined}
                          target={a.link ? '_blank' : undefined}
                          rel={a.link ? 'noopener noreferrer' : undefined}
                          className="group inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <Award className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{title}</span>
                          {when && <span className="text-xs text-gray-600 dark:text-gray-400">• {when}</span>}
                        </a>
                      )
                    })}
                </div>
              </div>
            </motion.div>
          )
        })()}

        {/* Contact banner moved to Hero section */}
      </div>
    </motion.section>
  )
}

export default About