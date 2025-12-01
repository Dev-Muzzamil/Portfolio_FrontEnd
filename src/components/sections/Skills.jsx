import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Code2, Database, Brain, Palette, Server, Cloud, Smartphone, GitBranch, Zap, Package } from 'lucide-react'

const Skills = ({ data }) => {
    const [ref, inView] = useInView({
        threshold: 0.1,
        triggerOnce: true,
    })

    // Group skills by category
    const groupedSkills = useMemo(() => {
        if (!data || !Array.isArray(data)) return {}

        const groups = {}
        data.forEach(skill => {
            const category = skill.category || 'Other'
            if (!groups[category]) {
                groups[category] = []
            }
            groups[category].push(skill)
        })

        return groups
    }, [data])

    const categories = Object.keys(groupedSkills).sort((a, b) => {
        // Optional: Sort by number of skills to help packing?
        // Or just keep alphabetical. Let's keep alphabetical for now.
        return a.localeCompare(b)
    })

    if (!data || data.length === 0) return null

    // Mapping of category names to lucide-react icons
    const getCategoryIcon = (category) => {
        const normalizedCategory = category.toLowerCase().trim()
        
        // Icon mapping with keyword matching
        if (normalizedCategory.includes('frontend') || normalizedCategory.includes('react') || normalizedCategory.includes('vue') || normalizedCategory.includes('angular') || normalizedCategory.includes('javascript') || normalizedCategory.includes('css') || normalizedCategory.includes('html')) return Code2
        
        if (normalizedCategory.includes('backend') || normalizedCategory.includes('node') || normalizedCategory.includes('python') || normalizedCategory.includes('server') || normalizedCategory.includes('api')) return Server
        
        if (normalizedCategory.includes('database') || normalizedCategory.includes('sql') || normalizedCategory.includes('mongo') || normalizedCategory.includes('postgres') || normalizedCategory.includes('firebase') || normalizedCategory.includes('db')) return Database
        
        if (normalizedCategory.includes('ai') || normalizedCategory.includes('ml') || normalizedCategory.includes('machine') || normalizedCategory.includes('learning') || normalizedCategory.includes('tensorflow') || normalizedCategory.includes('pytorch') || normalizedCategory.includes('deep')) return Brain
        
        if (normalizedCategory.includes('design') || normalizedCategory.includes('ui') || normalizedCategory.includes('ux') || normalizedCategory.includes('figma') || normalizedCategory.includes('photoshop') || normalizedCategory.includes('sketch')) return Palette
        
        if (normalizedCategory.includes('devops') || normalizedCategory.includes('docker') || normalizedCategory.includes('kubernetes') || normalizedCategory.includes('jenkins')) return Cloud
        
        if (normalizedCategory.includes('cloud') || normalizedCategory.includes('aws') || normalizedCategory.includes('azure') || normalizedCategory.includes('gcp')) return Cloud
        
        if (normalizedCategory.includes('mobile') || normalizedCategory.includes('ios') || normalizedCategory.includes('android') || normalizedCategory.includes('flutter') || normalizedCategory.includes('react native')) return Smartphone
        
        if (normalizedCategory.includes('git') || normalizedCategory.includes('version') || normalizedCategory.includes('github') || normalizedCategory.includes('gitlab')) return GitBranch
        
        if (normalizedCategory.includes('tool') || normalizedCategory.includes('utility') || normalizedCategory.includes('build') || normalizedCategory.includes('webpack') || normalizedCategory.includes('vite')) return Package
        
        // Default to Zap
        return Zap
    }

    // Helper to determine grid span based on item count
    const getGridSpan = (count) => {
        if (count > 10) return "sm:col-span-2 lg:col-span-2 row-span-2"
        if (count > 5) return "sm:col-span-2 lg:col-span-2 lg:row-span-1"
        return "col-span-1"
    }

    return (
        <section id="skills" ref={ref} className="py-16 sm:py-24 lg:py-32 relative overflow-hidden transition-colors duration-300">
            {/* Warm Gradient Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-[#E6C2A3]/20 via-paper to-paper dark:from-[#3D3530]/40 dark:via-paper-dark dark:to-paper-dark" />
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-[#D4A373]/10 to-transparent dark:from-[#E7A765]/5" />
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
                        My <span className="text-accent dark:text-accent-dark">Skills.</span>
                    </h2>
                    <p className="font-sans text-ink/60 dark:text-ink-dark/60 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto px-2">
                        The tools and technologies I use to build.
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 auto-rows-min"
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.06,
                                delayChildren: 0.2
                            }
                        }
                    }}
                >
                    {categories.map((category, catIndex) => {
                        const skills = groupedSkills[category]
                        const spanClass = getGridSpan(skills.length)

                        return (
                            <motion.div
                                key={category}
                                variants={{
                                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                                    visible: { 
                                        opacity: 1, 
                                        y: 0, 
                                        scale: 1,
                                        transition: { 
                                            type: "spring",
                                            stiffness: 100,
                                            damping: 15
                                        }
                                    }
                                }}
                                className={`
                                    group relative overflow-hidden
                                    bg-white/40 dark:bg-white/5
                                    backdrop-blur-xl border border-white/50 dark:border-white/10
                                    rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 transition-all duration-300
                                    shadow-xl dark:shadow-strong-dark
                                    hover:shadow-2xl dark:hover:shadow-2xl
                                    hover:-translate-y-1 hover:border-accent/30 dark:hover:border-accent-dark/30
                                    flex flex-col
                                    ${spanClass}
                                `}
                            >
                                {/* Decorative gradient blob */}
                                <div className="absolute -top-10 -right-10 w-24 sm:w-32 h-24 sm:h-32 bg-accent/10 dark:bg-accent-dark/10 rounded-full blur-3xl group-hover:bg-accent/20 dark:group-hover:bg-accent-dark/20 transition-colors duration-500" />
                                <div className="absolute -bottom-10 -left-10 w-20 sm:w-24 h-20 sm:h-24 bg-ink/5 dark:bg-white/5 rounded-full blur-2xl group-hover:bg-ink/10 dark:group-hover:bg-white/10 transition-colors duration-500" />

                                <h3 className="font-serif text-lg sm:text-xl lg:text-2xl text-ink dark:text-ink-dark mb-3 sm:mb-4 lg:mb-6 relative z-10 flex items-center gap-2 sm:gap-3 flex-wrap">
                                    {(() => {
                                        const IconComponent = getCategoryIcon(category)
                                        return <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-accent dark:text-accent-dark flex-shrink-0" />
                                    })()}
                                    <span className="break-words">{category}</span>
                                </h3>

                                <div className="flex flex-wrap gap-1.5 sm:gap-2 relative z-10 content-start">
                                    {skills.map((skill, skillIndex) => (
                                        <motion.div
                                            key={skill._id || skill.name || skillIndex}
                                            initial={{ opacity: 0, scale: 0.85 }}
                                            animate={inView ? { opacity: 1, scale: 1 } : {}}
                                            transition={{ delay: 0.1 + skillIndex * 0.03 }}
                                            whileHover={{ scale: 1.08 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="
                                                flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 
                                                bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/60 dark:border-white/10 rounded-full
                                                shadow-sm hover:shadow-md hover:bg-white/70 dark:hover:bg-white/20 hover:border-accent/30 dark:hover:border-accent-dark/30
                                                transition-all duration-300 cursor-default
                                            "
                                        >
                                            {skill.icon && (
                                                <img
                                                    src={skill.icon}
                                                    alt=""
                                                    className="w-3 h-3 sm:w-4 sm:h-4 object-contain dark:brightness-110"
                                                    onError={(e) => { e.target.style.display = 'none' }}
                                                />
                                            )}
                                            <span className="font-sans text-[10px] sm:text-xs font-medium text-ink/80 dark:text-ink-dark/80">
                                                {skill.name}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </div>
        </section>
    )
}

export default Skills
