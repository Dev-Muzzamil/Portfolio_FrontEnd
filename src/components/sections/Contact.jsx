import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Mail, Phone, MapPin, Send, MessageCircle, Github, Linkedin, Twitter, Globe, Instagram, Youtube, Facebook } from 'lucide-react'
import { normalizeSocial } from '../../utils/social'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { api } from '../../services/api'

const Contact = ({ data }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [siteSettings, setSiteSettings] = useState(window.__SITE_SETTINGS__ || {})

  useEffect(() => {
    const onUpdate = (e) => setSiteSettings(window.__SITE_SETTINGS__ || e?.detail || {})
    window.addEventListener('site-settings-updated', onUpdate)
    return () => window.removeEventListener('site-settings-updated', onUpdate)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      await api.post('/contact', data)
      reset()
      toast.success('Message sent successfully!')
    } catch (error) {
      console.error('Contact form error:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWhatsApp = () => {
    const formData = {
      name: document.getElementById('name')?.value || '',
      email: document.getElementById('email')?.value || '',
      subject: document.getElementById('subject')?.value || '',
      message: document.getElementById('message')?.value || ''
    }

    // Get phone number from data
    const phoneNumber = data?.phone || '+1234567890'

    if (!phoneNumber) {
      toast.error('WhatsApp number not available')
      return
    }

    // Clean phone number (remove any non-digits except +)
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '')

    // Create WhatsApp message
    let whatsappMessage = `Hi! I'm ${formData.name}`
    if (formData.email) whatsappMessage += ` (${formData.email})`
    if (formData.subject) whatsappMessage += `\n\nSubject: ${formData.subject}`
    whatsappMessage += `\n\n${formData.message}`

    // Encode message for URL
    const encodedMessage = encodeURIComponent(whatsappMessage)

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <section ref={ref} className="section-padding bg-gray-50 dark:bg-gray-800">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-display2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Get In <span className="text-primary-600 dark:text-primary-400">Touch</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Have a project in mind or want to collaborate? I'd love to hear from you!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:hover:shadow-2xl dark:hover:shadow-gray-900/50 transition-all duration-300 p-8 h-full">
              {/* Logo/Branding */}
              {siteSettings?.site?.logoUrl && (
                <div className="mb-6 flex justify-center lg:justify-start">
                  <img
                    src={siteSettings.site.logoUrl}
                    alt={siteSettings.site.title || 'Logo'}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  />
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Let's Connect
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  I'm always interested in new opportunities and exciting projects.
                  Whether you have a question or just want to say hi, feel free to reach out!
                </p>
              </div>

              {/* Contact Details */}
              <div className="space-y-5 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Email</p>
                    <a
                      href={`mailto:${data?.email || 'developer@example.com'}`}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200 break-all"
                    >
                      {data?.email || 'developer@example.com'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Phone</p>
                    <a
                      href={`tel:${data?.phone || '+1234567890'}`}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
                    >
                      {data?.phone || '+1 234 567 8900'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Location</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {data?.address || data?.location || 'Your City, Country'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {(() => {
                const links = normalizeSocial(data?.socialLinks || data?.social)
                const customLinks = data?.social?.customLinks || []
                const hasAnyLinks = Object.keys(links).length > 0 || customLinks.length > 0
                if (!hasAnyLinks) return null
                return (
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                      Follow Me
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {[
                        ['github', Github],
                        ['linkedin', Linkedin],
                        ['twitter', Twitter],
                        ['website', Globe],
                        ['instagram', Instagram],
                        ['youtube', Youtube],
                        ['facebook', Facebook]
                      ].filter(([key]) => links[key]).map(([key, Icon]) => (
                        <a
                          key={key}
                          href={links[key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-11 h-11 bg-white/80 dark:bg-gray-800/80 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 border border-white/30 dark:border-gray-700/30 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md text-gray-700 dark:text-gray-300"
                          aria-label={key}
                        >
                          <Icon className="w-5 h-5" />
                        </a>
                      ))}
                      {customLinks.map((link, index) => (
                        link.url && (
                          <a
                            key={`custom-${index}`}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-11 h-11 bg-white/80 dark:bg-gray-800/80 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 border border-white/30 dark:border-gray-700/30 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md text-gray-700 dark:text-gray-300"
                            aria-label={link.label}
                            title={link.label}
                          >
                            <Globe className="w-5 h-5" />
                          </a>
                        )
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:hover:shadow-2xl dark:hover:shadow-gray-900/50 transition-all duration-300 p-8 h-full">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Send a Message
              </h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      {...register('name', { required: 'Name is required' })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white transition-all duration-200 shadow-sm"
                      placeholder="Your name"
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white transition-all duration-200 shadow-sm"
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    {...register('subject')}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white transition-all duration-200 shadow-sm"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    {...register('message', {
                      required: 'Message is required',
                      minLength: {
                        value: 10,
                        message: 'Message must be at least 10 characters'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white resize-none transition-all duration-200 shadow-sm"
                    placeholder="Tell me about your project or just say hello..."
                  />
                  {errors.message && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                {/* Split Button for Email and WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Email Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Email
                      </>
                    )}
                  </button>

                  {/* WhatsApp Button */}
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    WhatsApp
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Contact