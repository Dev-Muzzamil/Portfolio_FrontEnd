import { Github, Linkedin, Mail, Globe, Instagram, Youtube, Facebook } from 'lucide-react'
import { useState, useEffect } from 'react'
import { normalizeSocial } from '../utils/social'

// Custom X (formerly Twitter) icon component
const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const getCentralData = () => {
  return window.__PORTFOLIO_DATA?.about || {};
};

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const [siteSettings, setSiteSettings] = useState(window.__SITE_SETTINGS__ || {})

  const about = getCentralData();
  const social = normalizeSocial(about.socialLinks || about.social);
  const contactEmail = about.email;

  useEffect(() => {
    const onUpdate = (e) => setSiteSettings(window.__SITE_SETTINGS__ || e?.detail || {})
    window.addEventListener('site-settings-updated', onUpdate)
    return () => window.removeEventListener('site-settings-updated', onUpdate)
  }, [])

  return (
    <footer className="bg-paper dark:bg-paper-dark border-t border-ink/10 dark:border-ink-dark/10 py-8 sm:py-12 lg:py-16 relative z-10 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="text-center md:text-left space-y-3 sm:space-y-4">
            <p
              className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark hover:text-ink dark:hover:text-ink-dark transition-colors cursor-default select-none"
              onClick={(e) => {
                if (e.detail === 3) {
                  window.location.href = '/admin';
                }
              }}
              title="Triple-click for admin access"
            >
              © {currentYear} {siteSettings?.site?.title || 'Portfolio'}. All rights reserved.
            </p>
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark hover:text-accent dark:hover:text-accent-dark transition-colors"
              >
                <Mail className="w-3 h-3" />
                <span className="truncate max-w-[200px] sm:max-w-none">{contactEmail}</span>
              </a>
            )}
          </div>

          {(() => {
            const customLinks = about.social?.customLinks || []
            const activeSocialLinks = Object.entries(social).filter(([key, value]) => {
              if (about.socialLinks && Array.isArray(about.socialLinks)) {
                const linkData = about.socialLinks.find(l => l.platform === key)
                return linkData && linkData.isActive !== false && value
              }
              return value
            })

            const hasAnyLinks = activeSocialLinks.length > 0 || customLinks.length > 0
            if (!hasAnyLinks) return null

            return (
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                {(
                  [
                    ['github', Github],
                    ['linkedin', Linkedin],
                    ['x', XIcon],
                    ['website', Globe],
                    ['instagram', Instagram],
                    ['youtube', Youtube],
                    ['facebook', Facebook]
                  ]
                ).filter(([key]) => activeSocialLinks.some(([k]) => k === key)).map(([key, Icon]) => {
                  const url = social[key]
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={key}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-ink/10 dark:border-ink-dark/10 text-ink dark:text-ink-dark hover:bg-ink dark:hover:bg-ink-dark hover:text-paper dark:hover:text-paper-dark transition-all duration-300"
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                      aria-label={link.label}
                      title={link.label}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-ink/10 dark:border-ink-dark/10 text-ink dark:text-ink-dark hover:bg-ink dark:hover:bg-ink-dark hover:text-paper dark:hover:text-paper-dark transition-all duration-300"
                    >
                      <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                  )
                ))}
              </div>
            )
          })()}
        </div>
      </div>
    </footer>
  )
}

export default Footer