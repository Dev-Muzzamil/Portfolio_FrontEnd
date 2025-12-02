import { motion } from 'framer-motion'
import { Download, ChevronDown, Github, Linkedin, Globe, Mail, Phone, MapPin, Instagram, Youtube, Facebook, ArrowRight, ArrowUpRight } from 'lucide-react'
import { normalizeSocial } from '../../utils/social'
import HeroMarquee from '../HeroMarquee'
import Reveal from '../Reveal'

// Custom X (formerly Twitter) icon component
const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const Hero = ({ data }) => {
    if (!data) return null

    const globalAbout = (typeof window !== 'undefined' && window.__PORTFOLIO_DATA?.about) || {}
    const socialLinks = globalAbout.socialLinks || globalAbout.social || data.socialLinks || []
    const social = normalizeSocial(socialLinks)

    const contact = {
        email: globalAbout.email || data.email,
        phone: globalAbout.phone || data.phone,
        location: globalAbout.location || data.location
    }

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 transition-colors duration-300">
            {/* Clean Gradient Background */}
            <div className="absolute inset-0 -z-20">
                <div className="absolute inset-0 bg-paper dark:bg-paper-dark" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#E6C2A3]/15 dark:to-[#1e293b]/40" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#D4A373]/10 via-transparent to-transparent dark:from-[#D4A373]/5" />
            </div>
            <HeroMarquee text={`${data?.role || 'CREATIVE DEVELOPER'} • ${data?.name || 'PORTFOLIO'} • `} />

            {/* Content Container */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
                {/* Mobile Header & Name (visible only on mobile, above image) */}
                <div className="lg:hidden text-center mb-6 sm:mb-8">
                    <Reveal delay={0.2}>
                        <h2 className="text-xs sm:text-sm font-sans font-bold tracking-widest text-accent dark:text-accent-dark uppercase mb-2 sm:mb-4">
                            {data?.role || 'Full Stack Developer'}
                        </h2>
                    </Reveal>

                    <Reveal delay={0.4}>
                        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[0.85] text-ink dark:text-ink-dark tracking-tight">
                            {data?.name || 'Your Name'}
                        </h1>
                    </Reveal>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-20 items-center">

                    {/* Left Column: Text Content (7 cols) - Desktop Only */}
                    <div className="hidden lg:block lg:col-span-7 space-y-6 sm:space-y-8 lg:space-y-10 text-center lg:text-left order-3 lg:order-1">
                        <div className="space-y-4 sm:space-y-6">
                            <Reveal delay={0.2}>
                                <h2 className="text-xs sm:text-sm font-sans font-bold tracking-widest text-accent dark:text-accent-dark uppercase mb-2 sm:mb-4">
                                    {data?.role || 'Full Stack Developer'}
                                </h2>
                            </Reveal>

                            <Reveal delay={0.4}>
                                <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl leading-[0.85] text-ink dark:text-ink-dark tracking-tight">
                                    {data?.name || 'Your Name'}
                                </h1>
                            </Reveal>

                            <Reveal delay={0.6}>
                                <div className="max-w-xl mx-auto lg:mx-0">
                                    <p className="font-sans text-base sm:text-lg md:text-xl lg:text-2xl text-ink/70 dark:text-ink-dark/70 leading-relaxed font-light px-2 sm:px-0">
                                        {data?.tagline || 'Building digital experiences with focus on simplicity and performance.'}
                                    </p>
                                </div>
                            </Reveal>
                        </div>

                        {/* Action Buttons */}
                        <Reveal delay={0.8}>
                            <motion.div 
                                className="flex flex-wrap gap-4 sm:gap-6 justify-center lg:justify-start pt-2 sm:pt-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.6 }}
                            >
                                <button
                                    onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-ink dark:bg-ink-dark text-paper dark:text-paper-dark rounded-full font-sans text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-accent dark:hover:bg-accent-dark transition-colors duration-300"
                                >
                                    <span>View Work</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                            </motion.div>
                        </Reveal>

                        {/* Minimal Social Links */}
                        <Reveal delay={1.0}>
                            {(() => {
                                const entries = [
                                    ['github', Github], 
                                    ['linkedin', Linkedin], 
                                    ['x', XIcon], 
                                    ['instagram', Instagram],
                                    ['facebook', Facebook],
                                    ['youtube', Youtube],
                                    ['email', Mail],
                                    ['phone', Phone]
                                ]
                                    .filter(([key]) => {
                                        if (key === 'email') return contact.email
                                        if (key === 'phone') return contact.phone
                                        return social[key]
                                    })

                                if (entries.length === 0) return null

                                return (
                                    <div className="flex gap-4 sm:gap-6 justify-center lg:justify-start pt-4 sm:pt-8 flex-wrap">
                                        {entries.map(([key, Icon]) => {
                                            const href = 
                                                key === 'email' ? `mailto:${contact.email}` :
                                                key === 'phone' ? `tel:${contact.phone}` :
                                                social[key]
                                            
                                            return (
                                                <a
                                                    key={key}
                                                    href={href}
                                                    target={key === 'email' || key === 'phone' ? undefined : '_blank'}
                                                    rel={key === 'email' || key === 'phone' ? undefined : 'noopener noreferrer'}
                                                    className="text-ink/40 dark:text-ink-dark/40 hover:text-accent dark:hover:text-accent-dark transition-colors duration-300 transform hover:scale-110"
                                                    aria-label={key}
                                                >
                                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                                </a>
                                            )
                                        })}
                                    </div>
                                )
                            })()}
                        </Reveal>
                    </div>

                    {/* Right Column: Image (5 cols) */}
                    <div className="lg:col-span-5 relative flex justify-center lg:justify-end order-2 lg:order-2">
                        <Reveal delay={0.4} width="100%">
                            <div className="relative w-full max-w-[280px] sm:max-w-[350px] lg:max-w-[400px] aspect-[3/4] rounded-arch overflow-hidden bg-paper dark:bg-paper-dark border border-ink/10 dark:border-ink-dark/10 grayscale hover:grayscale-0 transition-all duration-1000 ease-out shadow-2xl dark:shadow-strong-dark hover:rotate-0 hover:shadow-3xl group mx-auto">
                                {data?.backgroundImage ? (
                                    <img
                                        src={data.backgroundImage}
                                        alt={data?.name}
                                        className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                        <span className="text-6xl sm:text-7xl lg:text-9xl font-serif font-bold text-gray-300">
                                            {data?.name?.charAt(0) || 'P'}
                                        </span>
                                    </div>
                                )}

                                {/* Glass Overlay Card */}
                                {(contact.location || contact.email) && (
                                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 lg:bottom-8 lg:left-8 lg:right-8 p-4 sm:p-5 lg:p-6 bg-white/70 dark:bg-black/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/50 dark:border-white/[0.1] shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                        <div className="flex flex-col gap-2 sm:gap-3">
                                            {contact.location && (
                                                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-sans font-medium text-ink dark:text-ink-dark">
                                                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-accent dark:text-accent-dark flex-shrink-0" />
                                                    <span className="truncate">{contact.location}</span>
                                                </div>
                                            )}
                                            {contact.email && (
                                                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-sans text-ink/70 dark:text-ink-dark/70">
                                                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-accent dark:text-accent-dark flex-shrink-0" />
                                                    <span className="truncate">{contact.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    </div>
                </div>

                {/* Mobile Content (tagline, button, socials - visible only on mobile, below image) */}
                <div className="lg:hidden text-center mt-8 sm:mt-10 space-y-6 sm:space-y-8">
                    <Reveal delay={0.6}>
                        <div className="max-w-xl mx-auto">
                            <p className="font-sans text-base sm:text-lg text-ink/70 dark:text-ink-dark/70 leading-relaxed font-light px-2 sm:px-0">
                                {data?.tagline || 'Building digital experiences with focus on simplicity and performance.'}
                            </p>
                        </div>
                    </Reveal>

                    {/* Action Buttons */}
                    <Reveal delay={0.8}>
                        <motion.div 
                            className="flex flex-wrap gap-4 sm:gap-6 justify-center pt-2 sm:pt-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                        >
                            <button
                                onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
                                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-ink dark:bg-ink-dark text-paper dark:text-paper-dark rounded-full font-sans text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-accent dark:hover:bg-accent-dark transition-colors duration-300"
                            >
                                <span>View Work</span>
                                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                        </motion.div>
                    </Reveal>

                    {/* Minimal Social Links */}
                    <Reveal delay={1.0}>
                        {(() => {
                            const entries = [
                                ['github', Github], 
                                ['linkedin', Linkedin], 
                                ['x', XIcon], 
                                ['instagram', Instagram],
                                ['facebook', Facebook],
                                ['youtube', Youtube],
                                ['email', Mail],
                                ['phone', Phone]
                            ]
                                .filter(([key]) => {
                                    if (key === 'email') return contact.email
                                    if (key === 'phone') return contact.phone
                                    return social[key]
                                })

                            if (entries.length === 0) return null

                            return (
                                <div className="flex gap-4 sm:gap-6 justify-center pt-4 sm:pt-8 flex-wrap">
                                    {entries.map(([key, Icon]) => {
                                        const href = 
                                            key === 'email' ? `mailto:${contact.email}` :
                                            key === 'phone' ? `tel:${contact.phone}` :
                                            social[key]
                                        
                                        return (
                                            <a
                                                key={key}
                                                href={href}
                                                target={key === 'email' || key === 'phone' ? undefined : '_blank'}
                                                rel={key === 'email' || key === 'phone' ? undefined : 'noopener noreferrer'}
                                                className="text-ink/40 dark:text-ink-dark/40 hover:text-accent dark:hover:text-accent-dark transition-colors duration-300 transform hover:scale-110"
                                                aria-label={key}
                                            >
                                                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </a>
                                        )
                                    })}
                                </div>
                            )
                        })()}
                    </Reveal>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <ChevronDown className="w-6 h-6 text-ink/30 dark:text-ink-dark/30 animate-bounce" />
            </motion.div>
        </section>
    )
}

export default Hero