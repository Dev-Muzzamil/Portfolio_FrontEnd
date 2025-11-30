import { useState, useEffect, Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { normalizeSocial } from '../utils/social'
import ErrorBoundary from '../components/ErrorBoundary'
import SEO from '../components/SEO'

// Lazy load components
const Hero = lazy(() => import('../components/sections/Hero'))
const About = lazy(() => import('../components/sections/About'))
const Projects = lazy(() => import('../components/sections/Projects'))
const Skills = lazy(() => import('../components/sections/Skills'))
const Certifications = lazy(() => import('../components/sections/Certifications'))
const Contact = lazy(() => import('../components/sections/Contact'))
const Education = lazy(() => import('../components/sections/Education'))
const Experience = lazy(() => import('../components/sections/Experience'))

const Home = () => {
    const [portfolioData, setPortfolioData] = useState({
        hero: null,
        about: {},
        projects: [],
        skills: [],
        resumes: [],
        certifications: [],
        education: [],
        experience: []
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

                            console.warn(`Retry ${i + 1} for ${path} after ${delay}ms due to 429`)
                            // wait and retry

                            await sleep(delay)
                            continue
                        }
                        throw err
                    }
                }
                throw lastErr
            }

            try {
                const [heroRes, aboutRes, projectsRes, skillsRes, resumesRes, certificationsRes, educationRes, experienceRes] = await Promise.all([
                    fetchWithRetry('/hero'),
                    fetchWithRetry('/about'),
                    fetchWithRetry('/projects'),
                    fetchWithRetry('/skills'),
                    fetchWithRetry('/resumes'),
                    fetchWithRetry('/certifications'),
                    fetchWithRetry('/education'),
                    fetchWithRetry('/experience')
                ])

                const combinedAbout = { ...(aboutRes?.data?.about || {}), resumes: resumesRes?.data?.resumes || [] }
                // Expose globally for Footer/simple consumers without prop drilling

                window.__PORTFOLIO_DATA = { about: combinedAbout }

                // Only expose active skills to the public sections
                const activeSkills = (skillsRes.data.skills || []).filter(skill => skill.isActive !== false)

                setPortfolioData({
                    hero: heroRes.data.hero,
                    about: combinedAbout,
                    projects: projectsRes.data.projects,
                    skills: activeSkills,
                    resumes: resumesRes.data.resumes,
                    certifications: certificationsRes?.data?.certifications || [],
                    education: educationRes?.data?.education || [],
                    experience: experienceRes?.data?.experience || []
                })
            } catch (error) {
                // If requests fail (e.g., transient 429), ensure we still pass safe defaults to children
                console.error('Error fetching portfolio data:', error)
                setPortfolioData({ hero: null, about: {}, projects: [], skills: [], resumes: [], education: [], experience: [] })
            } finally {
                setLoading(false)
            }
        }

        fetchPortfolioData()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-paper-dark transition-colors duration-300">
                <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 lg:h-32 lg:w-32 border-b-2 border-ink dark:border-ink-dark"></div>
            </div>
        )
    }

    return (
        <div className="pt-16">
            {/* Hero Section */}
            <section id="home">
                <SEO
                    title={portfolioData.hero?.title}
                    description={portfolioData.hero?.subtitle}
                />
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-paper dark:bg-paper-dark"><div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-ink dark:border-ink-dark"></div></div>}>
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

            {/* Experience & Education Section */}
            {(portfolioData.experience?.length > 0 || portfolioData.education?.length > 0) && (
                <section id="experience-education" className="py-16 sm:py-24 lg:py-32 bg-paper dark:bg-paper-dark relative transition-colors duration-300">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20">
                            {/* Experience Column */}
                            {portfolioData.experience?.length > 0 && (
                                <div className={`${portfolioData.education?.length === 0 ? 'lg:col-span-2 max-w-4xl mx-auto w-full' : 'lg:col-span-1'}`}>
                                    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-ink dark:border-ink-dark"></div></div>}>
                                        <Experience data={portfolioData.experience} />
                                    </Suspense>
                                </div>
                            )}

                            {/* Education Column */}
                            {portfolioData.education?.length > 0 && (
                                <div className={`${portfolioData.experience?.length === 0 ? 'lg:col-span-2 max-w-4xl mx-auto w-full' : 'lg:col-span-1'}`}>
                                    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-ink dark:border-ink-dark"></div></div>}>
                                        <Education data={portfolioData.education} />
                                    </Suspense>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Projects Section (render only if projects exist) */}
            {portfolioData.projects && portfolioData.projects.length > 0 && (
                <section id="projects">
                    <Suspense fallback={<div className="py-16 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-ink dark:border-ink-dark"></div></div>}>
                        <Projects data={portfolioData.projects} skills={portfolioData.skills} />
                    </Suspense>
                </section>
            )}

            {/* Skills Section */}
            <section id="skills">
                <Suspense fallback={<div className="py-16 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-ink dark:border-ink-dark"></div></div>}>
                    <Skills data={portfolioData.skills} />
                </Suspense>
            </section>

            {/* Certifications Section (render only if certifications exist) */}
            {portfolioData.certifications && portfolioData.certifications.length > 0 && (
                <section id="certifications">
                    <Suspense fallback={<div className="py-16 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-ink dark:border-ink-dark"></div></div>}>
                        <Certifications data={portfolioData.certifications} />
                    </Suspense>
                </section>
            )}

            {/* Contact Section */}
            <section id="contact">
                <Suspense fallback={<div className="py-16 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-ink dark:border-ink-dark"></div></div>}>
                    <Contact data={portfolioData.about} />
                </Suspense>
            </section>
        </div>
    )
}

export default Home