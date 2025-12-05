import { Github, Linkedin, Twitter, Mail, Globe, Instagram, Youtube, Facebook } from 'lucide-react'
import { useState, useEffect } from 'react'
import { normalizeSocial } from '../utils/social'

// In future we can fetch a centralized settings/about record. For now, pull from window.__PORTFOLIO_DATA if injected.
const getCentralData = () => {
  // This global could be hydrated server-side later; fallback to empty.
  // eslint-disable-next-line no-underscore-dangle
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
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="container-max py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-gray-600 dark:text-gray-400">
              © {currentYear} {siteSettings?.site?.title || 'Portfolio'}. All rights reserved.
            </p>
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 mt-2"
              >
                <Mail className="w-4 h-4" />
                {contactEmail}
              </a>
            )}
          </div>

          {(() => {
            const customLinks = about.social?.customLinks || []
            const hasAnyLinks = Object.keys(social).length > 0 || customLinks.length > 0
            if (!hasAnyLinks) return null
            return (
              <div className="flex flex-wrap justify-center gap-3">
                {(
                  [
                    ['github', Github],
                    ['linkedin', Linkedin],
                    ['twitter', Twitter],
                    ['website', Globe],
                    ['instagram', Instagram],
                    ['youtube', Youtube],
                    ['facebook', Facebook]
                  ]
                ).filter(([key]) => social[key]).map(([key, Icon]) => (
                  <a
                    key={key}
                    href={social[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 transition-colors duration-200"
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
                      aria-label={link.label}
                      title={link.label}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 transition-colors duration-200"
                    >
                      <Globe className="w-5 h-5" />
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