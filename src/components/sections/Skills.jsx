import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import TechnologyIcon from '../TechnologyIcon'

const Skills = ({ data }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  // Define skill categories with icons and colors using primary theme
  const skillCategories = {
    'Language': { name: 'Programming Languages', color: 'from-primary-600 to-primary-700', icon: '💻' },
    'Framework / Library': { name: 'Frameworks & Libraries', color: 'from-primary-500 to-primary-600', icon: '⚡' },
    'Database': { name: 'Databases', color: 'from-primary-700 to-primary-800', icon: '🗄️' },
    'DevOps / Cloud': { name: 'Cloud & DevOps', color: 'from-primary-600 to-primary-700', icon: '☁️' },
    'Tooling': { name: 'Development Tools', color: 'from-primary-500 to-primary-600', icon: '🛠️' },
    'Testing': { name: 'Testing', color: 'from-primary-600 to-primary-700', icon: '🧪' },
    'UI / UX': { name: 'UI / UX', color: 'from-primary-500 to-primary-600', icon: '🎨' },
    'Technical': { name: 'Technical Skills', color: 'from-primary-600 to-primary-800', icon: '⚙️' },
    'Other': { name: 'Other Skills', color: 'from-primary-500 to-primary-700', icon: '🔧' },
    // Legacy categories for backward compatibility
    'languages': { name: 'Programming Languages', color: 'from-primary-600 to-primary-700', icon: '💻' },
    'frameworks': { name: 'Frameworks & Libraries', color: 'from-primary-500 to-primary-600', icon: '⚡' },
    'databases': { name: 'Databases', color: 'from-primary-700 to-primary-800', icon: '🗄️' },
    'cloud': { name: 'Cloud & DevOps', color: 'from-primary-600 to-primary-700', icon: '☁️' },
    'ai-ml': { name: 'AI/ML Tools', color: 'from-primary-500 to-primary-600', icon: '🤖' },
    'tools': { name: 'Development Tools', color: 'from-primary-500 to-primary-600', icon: '🛠️' },
    'security': { name: 'Security', color: 'from-primary-700 to-primary-800', icon: '🔒' },
    'concepts': { name: 'Concepts & Methodologies', color: 'from-primary-600 to-primary-700', icon: '📚' },
    'data': { name: 'Data & Analytics', color: 'from-primary-600 to-primary-700', icon: '📊' },
    'other': { name: 'Other Skills', color: 'from-primary-500 to-primary-700', icon: '🔧' }
  }
  
  // Default category info for unknown categories
  const getDefaultCategoryInfo = (category) => ({
    name: category || 'Other Skills',
    color: 'from-primary-500 to-primary-700',
    icon: '📦'
  })

  // Loading skeleton component
  const SkillSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (!data || data.length === 0) {
    return (
      <section ref={ref} className="section-padding bg-gray-50 dark:bg-gray-800">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              My <span className="text-primary-600 dark:text-primary-400">Skills</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Technologies and tools I work with to bring ideas to life
            </p>
            <SkillSkeleton />
          </motion.div>
        </div>
      </section>
    )
  }

  // Group skills by category
  const skillsByCategory = data.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {})

  return (
    <section ref={ref} className="section-padding bg-gray-50 dark:bg-gray-800">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            My <span className="text-primary-600 dark:text-primary-400">Skills</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Technologies and tools I work with to bring ideas to life
          </p>
        </motion.div>

        <div className="space-y-8">
          {Object.entries(skillsByCategory).map(([category, categorySkills]) => {
            const categoryInfo = skillCategories[category] || getDefaultCategoryInfo(category)

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${categoryInfo.color} rounded-xl flex items-center justify-center text-white text-xl shadow-lg dark:shadow-primary-900/50`}>
                    {categoryInfo.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {categoryInfo.name}
                    </h3>
                    <div className="w-16 h-1 bg-gradient-to-r from-primary-300 to-primary-400 dark:from-primary-700 dark:to-primary-800 rounded-full mt-2" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {categorySkills.map((skill, index) => (
                    <motion.div
                      key={skill._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={inView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-primary-400 dark:hover:border-primary-600 h-[72px]"
                    >
                      {/* Gradient overlay for hover effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-primary-100/30 dark:from-primary-900/20 dark:via-transparent dark:to-primary-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative z-10 flex items-center space-x-3 p-3 h-full">
                        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300 shadow-sm">
                          <TechnologyIcon technology={skill.name} className="w-6 h-6" />
                        </div>

                        <div className="flex flex-col justify-center min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300 text-sm leading-tight whitespace-nowrap">
                            {skill.name}
                          </h4>
                          {skill.proficiency && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                              {skill.proficiency}
                            </div>
                          )}
                        </div>
                      </div>
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