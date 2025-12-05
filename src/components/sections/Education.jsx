import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { GraduationCap, Calendar, MapPin, Award } from 'lucide-react'

const Education = ({ data }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  if (!data || data.length === 0) {
    return (
      <section ref={ref} className="section-padding bg-gray-50 dark:bg-gray-800">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="font-display2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Education
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto p-4 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-md">
              Education details will appear here when available.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section ref={ref} className="section-padding bg-gray-50 dark:bg-gray-800">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="font-display2 text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Education
          </h2>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary-200/60 dark:bg-primary-800/60 hidden md:block"></div>

          <div className="space-y-8">
            {data.map((education, index) => (
              <motion.div
                key={education._id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.15 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div className="absolute left-6 w-4 h-4 bg-primary-600 dark:bg-primary-400 rounded-full hidden md:block"></div>

                <div className="md:ml-16">
                  <div className="p-6 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-2">
                      <div className="flex-1">
                        {/* Line 1: Degree, Field */}
                        <h3 className="font-display2 text-lg font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
                          {education.degree}{education.field ? ` - ${education.field}` : ''}
                        </h3>

                        {/* Line 2: Institution, Optional Location */}
                        <p className="text-lg text-primary-600 dark:text-primary-400 mb-1 flex items-center font-medium">
                          <GraduationCap className="w-4 h-4 mr-2" />
                          <span>
                            {education.institution}
                            {education.location ? `, ${education.location}` : ''}
                          </span>
                        </p>

                        {/* Line 3: Year or Year Range */}
                        {(education.startLabel || education.startDate || education.endLabel || education.endDate || education.isCurrent) && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {(() => {
                              const getYear = (label, dateStr) => {
                                if (label) {
                                  const y = String(label).match(/\d{4}/)
                                  if (y) return y[0]
                                }
                                if (dateStr) return new Date(dateStr).getFullYear().toString()
                                return ''
                              }
                              const startYear = getYear(education.startLabel, education.startDate)
                              const endYear = education.isCurrent ? 'Present' : getYear(education.endLabel, education.endDate)
                              if (startYear) return <span>{endYear ? `${startYear} - ${endYear}` : startYear}</span>
                              return <span>{endYear}</span>
                            })()}
                          </p>
                        )}

                        {/* Line 4: CGPA / Grade */}
                        {(education.gpa || education.grade) && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {education.gpa ? `CGPA: ${education.gpa}` : `Grade: ${education.grade}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {education.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {education.description}
                      </p>
                    )}

                    {/* Skills */}
                    {education.skills && education.skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Skills developed
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {education.skills.map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="px-3 py-1 text-sm rounded-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 text-primary-700 dark:text-primary-300 shadow-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certificate */}
                    {(education.certificateFile?.originalUrl || education.certificateUrl) && (
                      <a
                        href={education.certificateFile?.originalUrl || education.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 transition-colors text-sm font-medium px-3 py-1 rounded-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-sm"
                      >
                        <Award className="w-4 h-4 mr-2" />
                        View certificate
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Education