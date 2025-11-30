import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

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

    // Helper to determine grid span based on item count
    const getGridSpan = (count) => {
        if (count > 10) return "sm:col-span-2 lg:col-span-2 row-span-2"
        if (count > 5) return "sm:col-span-2 lg:col-span-2 lg:row-span-1"
        return "col-span-1"
    }

    return (
        <section id="skills" ref={ref} className="py-16 sm:py-24 lg:py-32 bg-paper dark:bg-paper-dark relative transition-colors duration-300">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 auto-rows-min">
                    {categories.map((category, catIndex) => {
                        const skills = groupedSkills[category]
                        const spanClass = getGridSpan(skills.length)

                        return (
                            <motion.div
                                key={category}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                                transition={{ duration: 0.5, delay: catIndex * 0.05 }}
                                className={`
                                    group relative overflow-hidden
                                    bg-gradient-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-white/5
                                    backdrop-blur-xl border border-white/40 dark:border-white/10
                                    rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 transition-all duration-500
                                    shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
                                    hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] dark:hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]
                                    hover:-translate-y-1 hover:border-white/60 dark:hover:border-white/20
                                    flex flex-col
                                    ${spanClass}
                                `}
                            >
                                {/* Decorative gradient blob */}
                                <div className="absolute -top-10 -right-10 w-24 sm:w-32 h-24 sm:h-32 bg-accent/10 dark:bg-accent-dark/10 rounded-full blur-3xl group-hover:bg-accent/20 dark:group-hover:bg-accent-dark/20 transition-colors duration-500" />
                                <div className="absolute -bottom-10 -left-10 w-20 sm:w-24 h-20 sm:h-24 bg-ink/5 dark:bg-white/5 rounded-full blur-2xl group-hover:bg-ink/10 dark:group-hover:bg-white/10 transition-colors duration-500" />

                                <h3 className="font-serif text-lg sm:text-xl lg:text-2xl text-ink dark:text-ink-dark mb-3 sm:mb-4 lg:mb-6 relative z-10 flex items-center gap-2 sm:gap-3 flex-wrap">
                                    <span className="break-words">{category}</span>
                                    <span className="text-[10px] sm:text-xs font-sans font-bold text-ink/40 dark:text-ink-dark/40 bg-white/30 dark:bg-white/10 border border-white/40 dark:border-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                                        {skills.length}
                                    </span>
                                </h3>

                                <div className="flex flex-wrap gap-1.5 sm:gap-2 relative z-10 content-start">
                                    {skills.map((skill, skillIndex) => (
                                        <motion.div
                                            key={skill._id || skill.name || skillIndex}
                                            whileHover={{ scale: 1.05 }}
                                            className="
                                                flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 
                                                bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/40 dark:border-white/10 rounded-lg sm:rounded-xl 
                                                shadow-sm hover:shadow-md hover:bg-white/50 dark:hover:bg-white/20 hover:border-white/60 dark:hover:border-white/20
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
                </div>
            </div>
        </section>
    )
}

export default Skills
