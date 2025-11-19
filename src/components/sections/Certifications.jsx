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

  // If no certifications available, hide the section
  if (!data || data.length === 0) return null

  return (
    <section ref={ref} className="section-padding bg-white dark:bg-gray-900">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Certifications
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Professional certifications and credentials
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.map((certification, index) => (
            <UnifiedCard
              key={certification._id}
              data={certification}
              type="certificate"
              mode="home"
              onExpand={handleExpand}
            />
          ))}
        </div>

        {/* Expanded Modal */}
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