import { useState, useEffect, Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { normalizeSocial } from '../utils/social'
import ErrorBoundary from '../components/ErrorBoundary'

// Lazy load components
const Hero = lazy(() => import('../components/sections/Hero'))
const About = lazy(() => import('../components/sections/About'))
const Projects = lazy(() => import('../components/sections/Projects'))
const Skills = lazy(() => import('../components/sections/Skills'))
const Certifications = lazy(() => import('../components/sections/Certifications'))
const Contact = lazy(() => import('../components/sections/Contact'))
const GithubSection = lazy(() => import('../components/GithubSection'))
// Removed standalone Education section per request

const Home = () => {
  const [portfolioData, setPortfolioData] = useState({
    hero: null,
    about: {},
    projects: [],
    skills: [],
    resumes: [],
    certifications: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPortfolioData = async () => {
      const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

      const fetchWithRetry = async (path, attempts = 3, baseDelay = 500) => {
        let lastErr
        for (let i = 0; i < attempts; i++) {
          try {
            return await api.get(path)
          } catch (err) {
            lastErr = err
            const status = err?.response?.status
            // retry only on 429 (Too Many Requests)
            if (status === 429 && i < attempts - 1) {
              const delay = baseDelay * Math.pow(2, i) // exponential backoff
              // small log for visibility
              // eslint-disable-next-line no-console
              console.warn(`Retry ${i + 1} for ${path} after ${delay}ms due to 429`)
              // wait and retry
              // eslint-disable-next-line no-await-in-loop
              await sleep(delay)
              continue
            }
            throw err
          }
        }
        throw lastErr
      }

      try {
        const [heroRes, aboutRes, projectsRes, skillsRes, resumesRes, certificationsRes] = await Promise.all([
          fetchWithRetry('/hero'),
          fetchWithRetry('/about'),
          fetchWithRetry('/projects'),
          fetchWithRetry('/skills'),
          fetchWithRetry('/resumes')
          , fetchWithRetry('/certifications')
        ])

        const combinedAbout = { ...(aboutRes?.data?.about || {}), resumes: resumesRes?.data?.resumes || [] }
        // Expose globally for Footer/simple consumers without prop drilling
        // eslint-disable-next-line no-underscore-dangle
        window.__PORTFOLIO_DATA = { about: combinedAbout }

        // Only expose active skills to the public sections
        const activeSkills = (skillsRes.data.skills || []).filter(skill => skill.isActive !== false)

        setPortfolioData({
          hero: heroRes.data.hero,
          about: combinedAbout,
          projects: projectsRes.data.projects,
          skills: activeSkills,
          resumes: resumesRes.data.resumes
          , certifications: certificationsRes?.data?.certifications || []
        })
      } catch (error) {
        // If requests fail (e.g., transient 429), ensure we still pass safe defaults to children
        console.error('Error fetching portfolio data:', error)
        setPortfolioData({ hero: null, about: {}, projects: [], skills: [], resumes: [] })
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // derive github username from hero or centralized about social links
  const deriveGithubUsername = () => {
    // prefer explicit hero.github (may be a username or url)
    const heroGithub = portfolioData.hero?.github
    if (heroGithub) {
      // if it looks like a URL, extract last path segment
      try {
        const u = new URL(heroGithub)
        const parts = u.pathname.split('/').filter(Boolean)
        if (parts.length) return parts[0]
      } catch {
        // not a URL, assume it's a username
        return heroGithub
      }
    }

    // fallback to centralized about socialLinks
    const aboutSocial = normalizeSocial(portfolioData.about || {})
    const gh = aboutSocial.github || aboutSocial['gh'] || aboutSocial['github.com']
    if (gh) {
      try {
        const u = new URL(gh)
        const parts = u.pathname.split('/').filter(Boolean)
        if (parts.length) return parts[0]
      } catch {
        return gh
      }
    }

    return null
  }

  const githubUsername = deriveGithubUsername()

  return (
    <div className="pt-16 bg-gradient-to-b from-github-50 to-white dark:from-github-900 dark:to-gray-900">
      {/* Hero Section */}
      <section id="home">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div></div>}>
          <Hero data={portfolioData.hero} />
        </Suspense>
      </section>

      {/* About Section */}
      <section id="about">
        <Suspense fallback={<div className="py-16 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}>
          <ErrorBoundary>
            <About data={portfolioData.about} />
          </ErrorBoundary>
        </Suspense>
      </section>

      {/* Projects Section (render only if projects exist) */}
      {portfolioData.projects && portfolioData.projects.length > 0 && (
        <section id="projects">
          <Suspense fallback={<div className="py-16 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}>
            <Projects data={portfolioData.projects} skills={portfolioData.skills} />
          </Suspense>
        </section>
      )}

      {/* Education section removed intentionally */}

      {/* GitHub Section (optional) */}
      <section id="github" className="py-8">
        <div className="container mx-auto px-4">
          <Suspense fallback={<div className="py-8 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}>
            <GithubSection username={githubUsername || undefined} />
          </Suspense>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills">
        <Suspense fallback={<div className="py-16 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}>
          <Skills data={portfolioData.skills} />
        </Suspense>
      </section>

      {/* Certifications Section (render only if certifications exist) */}
      {portfolioData.certifications && portfolioData.certifications.length > 0 && (
        <section id="certifications">
          <Suspense fallback={<div className="py-16 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}>
            <Certifications data={portfolioData.certifications} />
          </Suspense>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact">
        <Suspense fallback={<div className="py-16 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}>
          <Contact data={portfolioData.about} />
        </Suspense>
      </section>
    </div>
  )
}

export default Home