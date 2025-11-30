import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Mail, Phone, MapPin, Send, MessageCircle, Github, Linkedin, Globe, Instagram, Youtube, Facebook } from 'lucide-react'
import { normalizeSocial } from '../../utils/social'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { api } from '../../services/api'
import SEO from '../SEO'

// Custom X (formerly Twitter) icon component
const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

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

        const phoneNumber = data?.phone || '+1234567890'

        if (!phoneNumber) {
            toast.error('WhatsApp number not available')
            return
        }

        const cleanPhone = phoneNumber.replace(/[^\d+]/g, '')
        let whatsappMessage = `Hi! I'm ${formData.name}`
        if (formData.email) whatsappMessage += ` (${formData.email})`
        if (formData.subject) whatsappMessage += `\n\nSubject: ${formData.subject}`
        whatsappMessage += `\n\n${formData.message}`

        const encodedMessage = encodeURIComponent(whatsappMessage)
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
        window.open(whatsappUrl, '_blank')
    }

    return (
        <section id="contact" ref={ref} className="py-16 sm:py-24 lg:py-32 bg-paper dark:bg-paper-dark relative overflow-hidden transition-colors duration-300">
            <SEO
                title="Contact Me"
                description="Get in touch with Syed Muzzamil Ali for project inquiries or collaboration."
            />
            {/* Ambient Background Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[20%] right-[-10%] w-[300px] sm:w-[400px] lg:w-[600px] h-[300px] sm:h-[400px] lg:h-[600px] bg-accent/5 dark:bg-accent-dark/5 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[300px] sm:w-[400px] lg:w-[600px] h-[300px] sm:h-[400px] lg:h-[600px] bg-ink/5 dark:bg-ink-dark/5 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px]" />
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-10 sm:mb-16 md:mb-24"
                >
                    <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-ink dark:text-ink-dark mb-4 sm:mb-6">
                        Get in <span className="text-accent dark:text-accent-dark">Touch.</span>
                    </h2>
                    <p className="font-sans text-ink/60 dark:text-ink-dark/60 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto px-2">
                        Let&apos;s build something amazing together.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 xl:gap-24 items-start">
                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <p className="font-serif text-lg sm:text-xl lg:text-2xl text-ink/80 dark:text-ink-dark/80 leading-relaxed mb-8 sm:mb-10 lg:mb-12">
                            I&apos;m always open to discussing new projects, creative ideas or opportunities to be part of your visions.
                        </p>

                        <div className="space-y-5 sm:space-y-6 lg:space-y-8">
                            <div className="flex items-start gap-4 sm:gap-5 lg:gap-6 group">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/60 dark:border-white/10 flex items-center justify-center group-hover:border-accent dark:group-hover:border-accent-dark transition-colors shadow-sm flex-shrink-0">
                                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-ink dark:text-ink-dark group-hover:text-accent dark:group-hover:text-accent-dark transition-colors" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark mb-1">Email</p>
                                    <a href={`mailto:${data?.email}`} className="font-serif text-base sm:text-lg lg:text-xl text-ink dark:text-ink-dark hover:text-accent dark:hover:text-accent-dark transition-colors break-all">
                                        {data?.email || 'hello@example.com'}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 sm:gap-5 lg:gap-6 group">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/60 dark:border-white/10 flex items-center justify-center group-hover:border-accent dark:group-hover:border-accent-dark transition-colors shadow-sm flex-shrink-0">
                                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-ink dark:text-ink-dark group-hover:text-accent dark:group-hover:text-accent-dark transition-colors" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark mb-1">Phone</p>
                                    <a href={`tel:${data?.phone}`} className="font-serif text-base sm:text-lg lg:text-xl text-ink dark:text-ink-dark hover:text-accent dark:hover:text-accent-dark transition-colors">
                                        {data?.phone || '+1 (555) 000-0000'}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 sm:gap-5 lg:gap-6 group">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/60 dark:border-white/10 flex items-center justify-center group-hover:border-accent dark:group-hover:border-accent-dark transition-colors shadow-sm flex-shrink-0">
                                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-ink dark:text-ink-dark group-hover:text-accent dark:group-hover:text-accent-dark transition-colors" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark mb-1">Location</p>
                                    <p className="font-serif text-base sm:text-lg lg:text-xl text-ink dark:text-ink-dark">
                                        {data?.address || data?.location || 'Remote'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Socials */}
                        <div className="mt-10 sm:mt-12 lg:mt-16 pt-6 sm:pt-8 border-t border-ink/10 dark:border-ink-dark/10">
                            <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark mb-4 sm:mb-6">Follow Me</p>
                            <div className="flex flex-wrap gap-3 sm:gap-4">
                                {(() => {
                                    const links = normalizeSocial(data?.socialLinks || data?.social)
                                    const customLinks = data?.social?.customLinks || []
                                    const activeSocialLinks = Object.entries(links).filter(([key, value]) => {
                                        if (data?.socialLinks && Array.isArray(data.socialLinks)) {
                                            const linkData = data.socialLinks.find(l => l.platform === key)
                                            return linkData && linkData.isActive !== false && value
                                        }
                                        return value
                                    })

                                    return (
                                        <>
                                            {[
                                                ['github', Github],
                                                ['linkedin', Linkedin],
                                                ['x', XIcon],
                                                ['website', Globe],
                                                ['instagram', Instagram],
                                                ['youtube', Youtube],
                                                ['facebook', Facebook]
                                            ].filter(([key]) => activeSocialLinks.some(([k]) => k === key)).map(([key, Icon]) => {
                                                const url = links[key]
                                                return (
                                                    <a
                                                        key={key}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/60 dark:border-white/10 flex items-center justify-center hover:bg-ink dark:hover:bg-ink-dark hover:text-paper dark:hover:text-paper-dark transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1"
                                                        aria-label={key}
                                                    >
                                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </a>
                                                )
                                            })}
                                            {customLinks.map((link, index) => (
                                                link.url && (
                                                    <a
                                                        key={`custom-${index}`}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/60 dark:border-white/10 flex items-center justify-center hover:bg-ink dark:hover:bg-ink-dark hover:text-paper dark:hover:text-paper-dark transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1"
                                                        aria-label={link.label}
                                                        title={link.label}
                                                    >
                                                        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </a>
                                                )
                                            ))}
                                        </>
                                    )
                                })()}
                            </div>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 md:p-8 lg:p-12 border border-white/50 dark:border-white/10 shadow-xl dark:shadow-strong-dark">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6 lg:space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
                                    <div>
                                        <label htmlFor="name" className="block font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark mb-1.5 sm:mb-2">Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            {...register('name', { required: 'Name is required' })}
                                            className="w-full bg-white/30 dark:bg-white/10 border-b border-ink/10 dark:border-ink-dark/10 py-2.5 sm:py-3 px-3 sm:px-4 rounded-t-lg text-ink dark:text-ink-dark font-serif text-base sm:text-lg focus:border-accent dark:focus:border-accent-dark focus:bg-white/50 dark:focus:bg-white/20 focus:outline-none transition-all placeholder-ink/30 dark:placeholder-ink-dark/30"
                                            placeholder="John Doe"
                                        />
                                        {errors.name && <p className="text-red-500 text-[10px] sm:text-xs mt-1">{errors.name.message}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark mb-1.5 sm:mb-2">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            {...register('email', { required: 'Email is required' })}
                                            className="w-full bg-white/30 dark:bg-white/10 border-b border-ink/10 dark:border-ink-dark/10 py-2.5 sm:py-3 px-3 sm:px-4 rounded-t-lg text-ink dark:text-ink-dark font-serif text-base sm:text-lg focus:border-accent dark:focus:border-accent-dark focus:bg-white/50 dark:focus:bg-white/20 focus:outline-none transition-all placeholder-ink/30 dark:placeholder-ink-dark/30"
                                            placeholder="john@example.com"
                                        />
                                        {errors.email && <p className="text-red-500 text-[10px] sm:text-xs mt-1">{errors.email.message}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark mb-1.5 sm:mb-2">Subject</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        {...register('subject')}
                                        className="w-full bg-white/30 dark:bg-white/10 border-b border-ink/10 dark:border-ink-dark/10 py-2.5 sm:py-3 px-3 sm:px-4 rounded-t-lg text-ink dark:text-ink-dark font-serif text-base sm:text-lg focus:border-accent dark:focus:border-accent-dark focus:bg-white/50 dark:focus:bg-white/20 focus:outline-none transition-all placeholder-ink/30 dark:placeholder-ink-dark/30"
                                        placeholder="Project Inquiry"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark mb-1.5 sm:mb-2">Message</label>
                                    <textarea
                                        id="message"
                                        rows={4}
                                        {...register('message', { required: 'Message is required' })}
                                        className="w-full bg-white/30 dark:bg-white/10 border-b border-ink/10 dark:border-ink-dark/10 py-2.5 sm:py-3 px-3 sm:px-4 rounded-t-lg text-ink dark:text-ink-dark font-serif text-base sm:text-lg focus:border-accent dark:focus:border-accent-dark focus:bg-white/50 dark:focus:bg-white/20 focus:outline-none transition-all resize-none placeholder-ink/30 dark:placeholder-ink-dark/30"
                                        placeholder="Tell me about your project..."
                                    />
                                    {errors.message && <p className="text-red-500 text-[10px] sm:text-xs mt-1">{errors.message.message}</p>}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 sm:px-8 py-3 sm:py-4 bg-ink dark:bg-ink-dark text-paper dark:text-paper-dark rounded-full font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-accent dark:hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 transform duration-300"
                                    >
                                        {isSubmitting ? 'Sending...' : (
                                            <>
                                                <span>Send Message</span>
                                                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleWhatsApp}
                                        className="px-6 sm:px-8 py-3 sm:py-4 bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/60 dark:border-white/10 text-ink dark:text-ink-dark rounded-full font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-white/80 dark:hover:bg-white/20 hover:text-accent dark:hover:text-accent-dark transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-1 transform duration-300"
                                    >
                                        <span>WhatsApp</span>
                                        <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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