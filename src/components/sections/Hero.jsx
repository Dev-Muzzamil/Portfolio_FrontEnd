import { motion, useReducedMotion } from 'framer-motion'
import { Download, ExternalLink, ChevronDown, Github, Linkedin, Globe, Mail, Phone, MapPin, Twitter, Instagram, Youtube, Facebook } from 'lucide-react'
import { normalizeSocial } from '../../utils/social'

const Hero = ({ data }) => {
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center section-padding">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to My Portfolio
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Full Stack Developer
          </p>
        </div>
      </div>
    )
  }

  // Helper function to extract username from social media URL
  const extractUsernameFromUrl = (url, platform) => {
    if (!url) return platform;
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      switch (platform) {
        case 'github':
          return path.split('/').filter(p => p)[0] || 'github';
        case 'linkedin':
          return path.split('/').filter(p => p)[1] || 'linkedin';
        case 'x':
        case 'twitter':
          return path.split('/').filter(p => p)[0] || 'x';
        case 'instagram':
          return path.split('/').filter(p => p)[0] || 'instagram';
        case 'facebook':
          return path.split('/').filter(p => p)[0] || 'facebook';
        case 'youtube':
          return path.split('/').filter(p => p)[1] || 'youtube';
        case 'tiktok':
          return path.split('/').filter(p => p)[0] || 'tiktok';
        case 'discord':
          return path.split('/').filter(p => p)[0] || 'discord';
        case 'telegram':
          return path.split('/').filter(p => p)[0] || 'telegram';
        case 'whatsapp':
          return path.split('/').filter(p => p)[0] || 'whatsapp';
        case 'reddit':
          return path.split('/').filter(p => p)[1] || 'reddit';
        case 'behance':
          return path.split('/').filter(p => p)[0] || 'behance';
        case 'dribbble':
          return path.split('/').filter(p => p)[0] || 'dribbble';
        case 'pinterest':
          return path.split('/').filter(p => p)[0] || 'pinterest';
        case 'medium':
          return path.split('/').filter(p => p)[0] || 'medium';
        case 'dev':
          return path.split('/').filter(p => p)[0] || 'dev';
        case 'stackoverflow':
          return path.split('/').filter(p => p)[0] || 'stackoverflow';
        case 'website': {
          const host = urlObj.hostname.replace(/^www\./, '');
          return host || 'website';
        }
        default:
          return platform;
      }
    } catch {
      return platform;
    }
  };

  const prefersReducedMotion = useReducedMotion()

  // Centralized social: prefer hero.socialLinks; fallback to global about
  // eslint-disable-next-line no-underscore-dangle
  const globalAbout = (typeof window !== 'undefined' && window.__PORTFOLIO_DATA?.about) || {}
  const social = Object.keys(normalizeSocial(data.socialLinks)).length
    ? normalizeSocial(data.socialLinks)
    : normalizeSocial(globalAbout.socialLinks || globalAbout.social)
  const contact = {
    email: data.email || globalAbout.email,
    phone: data.phone || globalAbout.phone,
    location: data.location || globalAbout.location
  }

  return (
    <section className="relative min-h-[90vh] overflow-hidden section-padding">
      {/* Ambient background to match site theme */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white to-primary-50/40 dark:from-gray-950 dark:to-gray-900"
      />
      {/* Split layout container */}
      <div className="container-max">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh] md:min-h-[70vh] items-center gap-6 md:gap-8 lg:gap-12 xl:gap-16 3xl:gap-20">
        {/* Left panel: solid brand color with text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="relative flex items-center"
        >
          <div className="w-full px-2 md:px-0 py-4 md:py-0">
            <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-sm p-6 md:p-8 space-y-6">
              <div className="text-primary-600 dark:text-primary-400 text-base md:text-lg font-semibold">Hey, I’m</div>
              <h1 className="font-display2 leading-[0.95] font-extrabold text-4xl md:text-6xl xl:text-7xl text-gray-900 dark:text-white">
                {(() => {
                  const name = data?.name || 'Your Name'
                  const parts = name.split(' ')
                  if (parts.length > 1) {
                    return (
                      <>
                        <span className="block">{parts[0]}</span>
                        <span className="block">{parts.slice(1).join(' ')}</span>
                      </>
                    )
                  }
                  return <span className="block">{name}</span>
                })()}
              </h1>
              <div className="text-lg md:text-xl text-gray-700 dark:text-gray-300 font-semibold">
                {data?.role || 'Your Role / Title'}
              </div>
              {Array.isArray(data?.roles) && data.roles.length > 0 && (
                <div className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                  {data.roles.filter(Boolean).join(' / ')}
                </div>
              )}

              {/* Optional tagline paragraphs below heading */}
              {(() => {
                const shortBio = data?.tagline || []
                const items = Array.isArray(shortBio) ? shortBio : [shortBio]
                if (items.length === 0) return null
                return (
                  <div className="space-y-3 max-w-2xl">
                    {items.map((t, i) => (
                      <p key={i} className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                        {t}
                      </p>
                    ))}
                  </div>
                )
              })()}

              {/* Social row with platform-colored pills and usernames */}
              {(() => {
                const entries = [
                  ['github', Github],
                  ['linkedin', Linkedin],
                  ['twitter', Twitter],
                  ['website', Globe],
                  ['instagram', Instagram],
                  ['youtube', Youtube],
                  ['facebook', Facebook],
                ].filter(([key]) => social[key])
                if (entries.length === 0) return null
                const brandClasses = {
                  github: 'bg-[#24292e] text-white',
                  linkedin: 'bg-[#0A66C2] text-white',
                  twitter: 'bg-[#1DA1F2] text-white',
                  website: 'bg-gray-900 text-white',
                  instagram: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white',
                  youtube: 'bg-[#FF0000] text-white',
                  facebook: 'bg-[#1877F2] text-white',
                }
                return (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {entries.map(([key, Icon]) => {
                      const username = extractUsernameFromUrl(social[key], key)
                      return (
                        <a
                          key={key}
                          href={social[key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`group inline-flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm ${brandClasses[key] || 'bg-primary-600 text-white'} hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 transition`}
                          aria-label={key}
                          title={username}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="truncate max-w-[120px] sm:max-w-[180px]">{username}</span>
                        </a>
                      )
                    })}
                  </div>
                )
              })()}

              {/* CTAs aligned with this panel */}
              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all"
                >
                  <span>Get to know me</span>
                  <ChevronDown className="w-5 h-5" />
                </button>

                {data?.ctaButtons?.map((button, index) => (
                  <a
                    key={index}
                    href={button.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      button.type === 'primary'
                        ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20'
                        : 'bg-white/80 backdrop-blur dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {button.text === 'View Resume' && <Download className="w-5 h-5 mr-2" />}
                    {button.text === 'Contact' && <ExternalLink className="w-5 h-5 mr-2" />}
                    {button.text}
                  </a>
                ))}
              </div>

              {/* Quick badges (optional) */}
              {(() => {
                const badges = []
                if (data?.openToWork || data?.availability === 'open') badges.push({ label: 'Open to work' })
                if (data?.location) badges.push({ label: data.location })
                if (badges.length === 0) return null
                return (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {badges.map((b, i) => (
                      <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700">
                        {b.label}
                      </span>
                    ))}
                  </div>
                )
              })()}

              {/* (Removed consolidated banner; social moved up, contact bar moved to bottom of section) */}
            </div>
          </div>
        </motion.div>

        {/* Right panel: Portrait image */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="w-full h-full min-h-[50vh] lg:min-h-[90vh] flex items-center justify-center bg-transparent">
            {data?.backgroundImage ? (
              <img
                src={data.backgroundImage}
                alt={data?.name || 'Portrait'}
                className="max-w-full max-h-full object-contain transform scale-75 rounded-xl shadow-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-72 h-72 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center transform scale-75">
                  <span className="text-7xl font-bold text-gray-400">{data?.name?.charAt(0) || 'P'}</span>
                </div>
              </div>
            )}
          </div>
          {/* Floating glass card (optional) */}
          {(data?.openToWork || data?.location) && (
            <div className="absolute bottom-6 right-6 px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur border border-white/30 dark:border-gray-700/30 shadow-md">
              <div className="flex items-center gap-3">
                {data?.openToWork && (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-emerald-100 text-emerald-700">Open to work</span>
                )}
                {data?.location && (
                  <span className="text-sm text-gray-800 dark:text-gray-200">{data.location}</span>
                )}
              </div>
            </div>
          )}
        </motion.div>
        </div>
      </div>

      {/* Bottom contact bar (positioned above scroll indicator) */}
      {(contact.email || contact.phone || contact.location) && (
        <div className="absolute inset-x-0 bottom-12">
          <div className="mx-auto max-w-7xl px-4 pb-2">
            <div className="w-full rounded-xl bg-white/85 dark:bg-gray-800/85 backdrop-blur border border-white/30 dark:border-gray-700/40 shadow-sm px-5 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 text-gray-800 dark:text-gray-200 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                  <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium">{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 text-gray-800 dark:text-gray-200 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                  <Phone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium">{contact.phone}</span>
                </a>
              )}
              {contact.location && (
                <div className="inline-flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium">{contact.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scroll Indicator at very bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-2 left-1/2 -translate-x-1/2"
      >
        <motion.button
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      </motion.div>
    </section>
  )
}

export default Hero