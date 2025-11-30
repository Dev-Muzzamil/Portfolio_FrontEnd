import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import UnifiedCard from '../UnifiedCard'
import UnifiedModal from '../UnifiedModal'
import { useState } from 'react'

const Certifications = ({ data }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  const [expandedCert, setExpandedCert] = useState(null)

  const handleExpand = (certId) => {
    setExpandedCert(certId)
  }

  const handleCloseModal = () => {
    setExpandedCert(null)
  }

  if (!data || data.length === 0) return null

  return (
    <section id="certifications" ref={ref} className="py-16 sm:py-24 lg:py-32 bg-paper dark:bg-paper-dark relative overflow-hidden transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16 md:mb-24"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-ink dark:text-ink-dark mb-4 sm:mb-6">
            My <span className="text-accent dark:text-accent-dark">Certifications.</span>
          </h2>
          <p className="font-sans text-ink/60 dark:text-ink-dark/60 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto px-2">
            Professional credentials and achievements.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {data.map((certification) => (
            <UnifiedCard
              key={certification._id}
              data={certification}
              type="certificate"
              mode="home"
              onExpand={handleExpand}
            />
          ))}
        </div>

        <UnifiedModal
          data={data.find(cert => cert._id === expandedCert)}
          type="certificate"
          mode="home"
          isOpen={!!expandedCert}
          onClose={handleCloseModal}
        />
      </div>
    </section>
  )
}

export default Certifications