import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const Education = ({ data }) => {
    const [ref, inView] = useInView({
        threshold: 0.1,
        triggerOnce: true,
    })

    if (!data || data.length === 0) return null

    // Helper to safely extract year
    const getYear = (dateStr) => {
        if (!dateStr) return null
        const d = new Date(dateStr)
        if (!isNaN(d.getTime())) return d.getFullYear()
        const match = String(dateStr).match(/\d{4}/)
        return match ? parseInt(match[0]) : null
    }

    // Helper to format the period/duration
    const getDisplayPeriod = (edu) => {
        // Check all possible fields for date/duration
        if (edu.year) return edu.year
        if (edu.period) return edu.period
        if (edu.duration) return edu.duration
        if (edu.date) return edu.date
        if (edu.years) return edu.years

        // Try labels if they exist
        if (edu.startLabel && edu.endLabel) return `${edu.startLabel} - ${edu.endLabel}`

        const start = getYear(edu.startDate || edu.start_date || edu.startTime)
        const end = (edu.endDate || edu.end_date || edu.endTime)
            ? getYear(edu.endDate || edu.end_date || edu.endTime)
            : (edu.current ? 'Present' : null)

        if (start) {
            return end ? `${start} - ${end}` : `${start}`
        }

        // Fallback: if only end exists (e.g. graduation year only)
        if (end) return `${end}`
        if (edu.endLabel) return edu.endLabel

        return null
    }

    // Sort education by date (recent to oldest)
    const sortedData = [...data].sort((a, b) => {
        const getLatestYear = (item) => {
            if (item.endDate || item.end_date) return getYear(item.endDate || item.end_date)
            if (item.current) return 9999
            const str = item.year || item.period || item.duration || item.date
            if (str) {
                const matches = String(str).match(/\d{4}/g)
                if (matches && matches.length > 0) return parseInt(matches[matches.length - 1])
            }
            if (item.startDate || item.start_date) return getYear(item.startDate || item.start_date)
            return 0
        }
        return getLatestYear(b) - getLatestYear(a)
    })

    return (
        <div className="h-full relative" ref={ref}>
            {/* Warm Gradient Background */}
            <div className="absolute inset-0 -z-10 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#E6C2A3]/8 via-transparent to-transparent dark:from-[#D4A373]/5" />
            </div>
            <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-ink dark:text-ink-dark mb-2 sm:mb-3 lg:mb-4">
                    Academic <span className="text-accent dark:text-accent-dark">Journey.</span>
                </h2>
                <p className="font-sans text-ink/60 dark:text-ink-dark/60 text-xs sm:text-sm md:text-base lg:text-lg max-w-2xl mx-auto px-2">
                    Foundations of my technical knowledge.
                </p>
            </div>

            <div className="relative border-l border-ink/10 dark:border-ink-dark/10 ml-2 sm:ml-3 md:ml-6 lg:ml-8 space-y-4 sm:space-y-5 lg:space-y-6">
                {sortedData.map((edu, i) => {
                    const period = getDisplayPeriod(edu)
                    const grade = edu.grade || edu.cgpa || edu.gpa || edu.score || edu.percentage

                    const specialization =
                        edu.specialization ||
                        edu.branch ||
                        edu.fieldOfStudy ||
                        edu.major ||
                        edu.stream ||
                        edu.department ||
                        edu.subject ||
                        edu.field

                    const title = specialization ? `${edu.degree} - ${specialization}` : edu.degree

                    return (
                        <motion.div
                            key={edu._id || i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: i * 0.2 }}
                            className="relative pl-4 sm:pl-6 md:pl-8 lg:pl-10 group"
                        >
                            <span className="absolute -left-[5px] top-4 sm:top-5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-accent dark:bg-accent-dark ring-2 sm:ring-4 ring-paper dark:ring-paper-dark group-hover:scale-150 transition-transform duration-300" />

                            {/* Ultra Compact Glassmorphism Education Card */}
                            <div className="p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl bg-white/50 dark:bg-surface-dark backdrop-blur-xl dark:backdrop-blur-none border border-white/60 dark:border-white/[0.06] shadow-lg shadow-black/5 dark:shadow-black/30 hover:shadow-xl hover:bg-white/60 dark:hover:bg-surface-elevated transition-all duration-300">

                                {/* Year Range */}
                                {period && (
                                    <span className="font-sans text-[9px] sm:text-[10px] font-bold text-accent dark:text-accent-dark tracking-widest uppercase mb-0.5 sm:mb-1 block">
                                        {period}
                                    </span>
                                )}

                                {/* Degree - Specialization */}
                                <h3 className="font-serif text-sm sm:text-base md:text-lg lg:text-xl text-ink dark:text-ink-dark mb-0.5 sm:mb-1 group-hover:text-accent dark:group-hover:text-accent-dark transition-colors duration-300 leading-tight">
                                    {title}
                                </h3>

                                {/* Institution */}
                                <h4 className="font-sans text-ink/60 dark:text-ink-dark/60 mb-1.5 sm:mb-2 text-[10px] sm:text-xs md:text-sm">
                                    {edu.institution || edu.school || edu.college}
                                </h4>

                                {/* Description + CGPA inline */}
                                <p className="font-sans text-[10px] sm:text-xs text-ink/80 dark:text-ink-dark/80 max-w-2xl leading-relaxed mb-2 sm:mb-3">
                                    {edu.description}
                                    {edu.description && grade && !edu.description.toLowerCase().includes('cgpa') && (
                                        <span> CGPA: {grade}.</span>
                                    )}
                                    {!edu.description && grade && (
                                        <span>CGPA: {grade}.</span>
                                    )}
                                </p>

                                {/* Tags */}
                                {edu.courses && Array.isArray(edu.courses) && edu.courses.length > 0 && (
                                    <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                                        {edu.courses.map((course, idx) => (
                                            <span key={idx} className="text-[8px] sm:text-[9px] font-medium text-ink/60 dark:text-ink-dark/60 bg-white dark:bg-white/10 px-1 sm:px-1.5 py-0.5 rounded border border-ink/5 dark:border-ink-dark/5">
                                                {course}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

export default Education
