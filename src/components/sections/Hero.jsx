import { motion } from 'framer-motion'
import { Download, ChevronDown, Github, Linkedin, Globe, Mail, Phone, MapPin, Instagram, Youtube, Facebook, ArrowRight } from 'lucide-react'
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
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 bg-paper dark:bg-paper-dark transition-colors duration-300">
            <HeroMarquee text={`${data?.role || 'CREATIVE DEVELOPER'} • ${data?.name || 'PORTFOLIO'} • `} />

            {/* Content Container */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-20 items-center">

                    {/* Left Column: Text Content (7 cols) */}
                    <div className="lg:col-span-7 space-y-6 sm:space-y-8 lg:space-y-10 text-center lg:text-left order-2 lg:order-1">
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
                            <div className="flex flex-wrap gap-4 sm:gap-6 justify-center lg:justify-start pt-2 sm:pt-4">
                                <button
                                    onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-6 sm:px-8 py-3 sm:py-4 bg-transparent border border-ink/20 dark:border-ink-dark/20 text-ink dark:text-ink-dark rounded-full font-sans text-xs sm:text-sm uppercase tracking-widest hover:bg-ink hover:text-paper dark:hover:bg-ink-dark dark:hover:text-paper-dark transition-all duration-300 inline-flex items-center gap-2"
                                >
                                    <span>View Work</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </Reveal>

                        {/* Minimal Social Links */}
                        <Reveal delay={1.0}>
                            {(() => {
                                const entries = [['github', Github], ['linkedin', Linkedin], ['x', XIcon], ['instagram', Instagram]]
                                    .filter(([key]) => social[key])

                                if (entries.length === 0) return null

                                return (
                                    <div className="flex gap-6 sm:gap-8 justify-center lg:justify-start pt-4 sm:pt-8">
                                        {entries.map(([key, Icon]) => (
                                            <a
                                                key={key}
                                                href={social[key]}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-ink/40 dark:text-ink-dark/40 hover:text-accent dark:hover:text-accent-dark transition-colors duration-300 transform hover:scale-110"
                                                aria-label={key}
                                            >
                                                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </a>
                                        ))}
                                    </div>
                                )
                            })()}
                        </Reveal>
                    </div>

                    {/* Right Column: Image (5 cols) */}
                    <div className="lg:col-span-5 relative flex justify-center lg:justify-end order-1 lg:order-2">
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
                                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 lg:bottom-8 lg:left-8 lg:right-8 p-4 sm:p-5 lg:p-6 bg-paper/80 dark:bg-paper-dark/90 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/30 dark:border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0">
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