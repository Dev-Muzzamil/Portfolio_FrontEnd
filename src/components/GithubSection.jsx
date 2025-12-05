import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Github, ExternalLink, Star, GitFork, Calendar, MapPin, Link as LinkIcon } from 'lucide-react'
import { api } from '../services/api'
import { normalizeSocial } from '../utils/social'

const GithubSection = ({ username, about }) => {
  const [profile, setProfile] = useState(null)
  const [repos, setRepos] = useState([])
  const [contributions, setContributions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // derive username from central about.socialLinks if not provided
  const getUsernameFromUrl = (url) => {
    if (!url) return null
    try {
      const u = new URL(url)
      const parts = u.pathname.split('/').filter(Boolean)
      return parts.length ? parts[0] : null
    } catch {
      // not a URL — assume it's already a username
      return url
    }
  }

  const deriveGithubUsername = () => {
    if (username) return getUsernameFromUrl(username)
    // try passed about prop first
    if (about) {
      const social = normalizeSocial(about.socialLinks || about.social || about)
      const gh = social.github || social.gh || social['github.com'] || social['git']
      if (gh) return getUsernameFromUrl(gh)
    }
    // try global about data
    const globalAbout = (typeof window !== 'undefined' && window.__PORTFOLIO_DATA?.about) || {}
    const social = normalizeSocial(globalAbout.socialLinks || globalAbout.social || globalAbout)
    const gh = social.github || social.gh || social['github.com'] || social['git']
    if (gh) return getUsernameFromUrl(gh)
    return null
  }

  useEffect(() => {
    const fetchGithub = async (user) => {
      setLoading(true)
      try {
        const [profileRes, reposRes, calendarRes] = await Promise.all([
          api.get(`/github/profile/${user}`),
          api.get(`/github/repos/${user}?per_page=8`),
          api.get(`/github/contributionCalendar/${user}`)
        ])

        setProfile(profileRes.data.profile)
        setRepos(reposRes.data.repositories || [])
        setContributions(calendarRes.data.calendar || null)
      } catch (err) {
        console.error('GitHub fetch error:', err)
        setError('Failed to load GitHub data')
      } finally {
        setLoading(false)
      }
    }

    const user = deriveGithubUsername()
    if (!user) {
      setLoading(false)
      setError('GitHub profile not configured')
      console.warn('GithubSection: no username found in props or centralized about.socialLinks')
      return
    }

    fetchGithub(user)
  }, [username, about])

  if (loading) {
    return (
      <section className="py-16 sm:py-24 lg:py-32 bg-paper dark:bg-paper-dark transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink dark:border-ink-dark"></div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !profile) {
    return null // Hide section if GitHub is not configured or failed to load
  }

  // If backend provided a contribution calendar (weeks -> days), convert it
  const calendarWeeks = (contributions && contributions.weeks)
    ? contributions.weeks.map(week => (
        week.days.map(d => {
          const count = d.count || 0
          const level = count === 0 ? 0 : count <= 3 ? 1 : count <= 6 ? 2 : count <= 9 ? 3 : 4
          return {
            date: new Date(d.date),
            contributions: count,
            level,
            dateStr: d.date,
            isInRange: true
          }
        })
      ))
    : []

  return (
    <motion.section
      className="py-16 sm:py-24 lg:py-32 relative transition-colors duration-300"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      {/* Clean Gradient Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E6C2A3]/12 via-transparent to-transparent dark:from-[#4A3C32]/18" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#D4A373]/8 via-transparent to-transparent dark:from-[#5C4A3D]/12" />
      </div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16 md:mb-24"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-ink dark:text-ink-dark mb-4 sm:mb-6">
            My <span className="text-accent dark:text-accent-dark">GitHub.</span>
          </h2>
          <p className="font-sans text-ink/60 dark:text-ink-dark/60 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto px-2">
            Check out my latest projects, contributions, and coding activity.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Profile Card - Sticky on scroll */}
          <div className="lg:w-1/3 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              style={{ position: 'sticky', top: '6rem' }}
              className="bg-white/60 dark:bg-surface-dark backdrop-blur-xl dark:backdrop-blur-none rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/70 dark:border-white/[0.06] shadow-lg shadow-black/5 dark:shadow-black/30"
            >
              <div className="text-center mb-6">
                <img
                  src={profile.avatar_url || profile.avatarUrl || `https://github.com/identicons/${profile.login || profile.username || 'user'}.png`}
                  alt={profile.name || profile.login || profile.username || 'GitHub Profile'}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-4 border-4 border-accent/20 dark:border-accent-dark/20 shadow-lg"
                />
                <h3 className="font-serif text-xl sm:text-2xl text-ink dark:text-ink-dark mb-1">
                  {profile.name || profile.login || profile.username || 'GitHub User'}
                </h3>
                <p className="font-sans text-sm text-ink/60 dark:text-ink-dark/60 mb-4">
                  @{profile.login || profile.username || 'user'}
                </p>
                {profile.bio && (
                  <p className="font-sans text-sm text-ink/80 dark:text-ink-dark/80 mb-4">{profile.bio}</p>
                )}
              </div>

              {/* Profile Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-ink/10 dark:border-ink-dark/10">
                  <span className="font-sans text-xs sm:text-sm text-ink/60 dark:text-ink-dark/60">Public Repos</span>
                  <span className="font-sans text-sm sm:text-base font-bold text-ink dark:text-ink-dark">{profile.public_repos || profile.publicRepos || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-ink/10 dark:border-ink-dark/10">
                  <span className="font-sans text-xs sm:text-sm text-ink/60 dark:text-ink-dark/60">Followers</span>
                  <span className="font-sans text-sm sm:text-base font-bold text-ink dark:text-ink-dark">{profile.followers || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-ink/10 dark:border-ink-dark/10">
                  <span className="font-sans text-xs sm:text-sm text-ink/60 dark:text-ink-dark/60">Following</span>
                  <span className="font-sans text-sm sm:text-base font-bold text-ink dark:text-ink-dark">{profile.following || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-sans text-xs sm:text-sm text-ink/60 dark:text-ink-dark/60">Member since</span>
                  <span className="font-sans text-sm sm:text-base font-bold text-ink dark:text-ink-dark">
                    {profile.created_at ? new Date(profile.created_at).getFullYear() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Profile Links */}
              <div className="space-y-3">
                {profile.location && (
                  <div className="flex items-center gap-2 text-sm text-ink/60 dark:text-ink-dark/60">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{profile.location}</span>
                  </div>
                )}
                {profile.blog && (
                  <div className="flex items-center gap-2 text-sm text-ink/60 dark:text-ink-dark/60">
                    <LinkIcon className="w-4 h-4 flex-shrink-0" />
                    <a
                      href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-accent dark:hover:text-accent-dark transition-colors truncate"
                    >
                      {profile.blog}
                    </a>
                  </div>
                )}
                <a
                  href={profile.html_url || profile.htmlUrl || `https://github.com/${profile.login || profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full mt-4 px-6 py-3 bg-ink dark:bg-ink-dark text-paper dark:text-paper-dark rounded-full font-sans text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-accent dark:hover:bg-accent-dark transition-colors duration-300"
                >
                  <Github className="w-4 h-4" />
                  <span>View Profile</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Repositories and Calendar */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="lg:w-2/3 flex-grow"
          >
            {/* Contribution Calendar */}
            {contributions && calendarWeeks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="mb-6 sm:mb-8 bg-white/60 dark:bg-surface-dark backdrop-blur-xl dark:backdrop-blur-none rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/70 dark:border-white/[0.06] shadow-lg shadow-black/5 dark:shadow-black/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-sans text-sm sm:text-base font-bold uppercase tracking-widest text-ink dark:text-ink-dark flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-accent dark:text-accent-dark" />
                    Contribution Activity
                  </h4>
                </div>

                {/* Calendar Grid */}
                <div className="overflow-x-auto pb-2">
                  <div className="inline-block min-w-full">
                    {/* Month labels */}
                    <div className="flex mb-2">
                      <div className="w-6 sm:w-8"></div>
                      <div className="flex gap-[3px]">
                        {Array.from({ length: 53 }, (_, weekIndex) => {
                          const weekStart = calendarWeeks[weekIndex]?.[0]?.date
                          if (!weekStart) return <div key={weekIndex} className="w-[10px] sm:w-3"></div>
                          const month = weekStart.getMonth()
                          const isFirstOfMonth = weekStart.getDate() <= 7
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                          return (
                            <div key={weekIndex} className="w-[10px] sm:w-3 text-[8px] sm:text-[10px] text-ink/40 dark:text-ink-dark/40 text-center">
                              {isFirstOfMonth ? monthNames[month] : ''}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Calendar grid */}
                    <div className="flex">
                      {/* Day labels */}
                      <div className="flex flex-col gap-[3px] mr-1 sm:mr-2">
                        <div className="h-[10px] sm:h-3"></div>
                        <div className="h-[10px] sm:h-3 text-[8px] sm:text-[10px] text-ink/40 dark:text-ink-dark/40">Mon</div>
                        <div className="h-[10px] sm:h-3"></div>
                        <div className="h-[10px] sm:h-3 text-[8px] sm:text-[10px] text-ink/40 dark:text-ink-dark/40">Wed</div>
                        <div className="h-[10px] sm:h-3"></div>
                        <div className="h-[10px] sm:h-3 text-[8px] sm:text-[10px] text-ink/40 dark:text-ink-dark/40">Fri</div>
                        <div className="h-[10px] sm:h-3"></div>
                      </div>

                      {/* Weeks grid */}
                      <div className="flex gap-[3px]">
                        {calendarWeeks.map((week, weekIndex) => (
                          <div key={weekIndex} className="flex flex-col gap-[3px]">
                            {week.map((day, dayIndex) => (
                              <div
                                key={`${weekIndex}-${dayIndex}`}
                                className={`w-[10px] h-[10px] sm:w-3 sm:h-3 rounded-sm transition-all duration-200 cursor-pointer hover:ring-1 hover:ring-ink/30 dark:hover:ring-ink-dark/30 ${
                                  !day.isInRange ? 'bg-transparent' :
                                  day.level === 0 ? 'bg-ink/5 dark:bg-ink-dark/10' :
                                  day.level === 1 ? 'bg-accent/30 dark:bg-accent-dark/30' :
                                  day.level === 2 ? 'bg-accent/50 dark:bg-accent-dark/50' :
                                  day.level === 3 ? 'bg-accent/70 dark:bg-accent-dark/70' :
                                  'bg-accent dark:bg-accent-dark'
                                }`}
                                title={`${day.date.toLocaleDateString()}: ${day.contributions} contributions`}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-ink/40 dark:text-ink-dark/40 mt-4">
                  <span>Less</span>
                  <div className="flex items-center gap-1">
                    <div className="w-[10px] h-[10px] sm:w-3 sm:h-3 bg-ink/5 dark:bg-ink-dark/10 rounded-sm"></div>
                    <div className="w-[10px] h-[10px] sm:w-3 sm:h-3 bg-accent/30 dark:bg-accent-dark/30 rounded-sm"></div>
                    <div className="w-[10px] h-[10px] sm:w-3 sm:h-3 bg-accent/50 dark:bg-accent-dark/50 rounded-sm"></div>
                    <div className="w-[10px] h-[10px] sm:w-3 sm:h-3 bg-accent/70 dark:bg-accent-dark/70 rounded-sm"></div>
                    <div className="w-[10px] h-[10px] sm:w-3 sm:h-3 bg-accent dark:bg-accent-dark rounded-sm"></div>
                  </div>
                  <span>More</span>
                </div>

                {/* Stats Summary */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="bg-white/30 dark:bg-surface-elevated rounded-xl p-3 sm:p-4">
                    <div className="font-serif text-xl sm:text-2xl text-ink dark:text-ink-dark">
                      {contributions?.totalContributions || 0}
                    </div>
                    <div className="font-sans text-[10px] sm:text-xs text-ink/60 dark:text-ink-dark/60 uppercase tracking-wider">This Year</div>
                  </div>
                  <div className="bg-white/30 dark:bg-surface-elevated rounded-xl p-3 sm:p-4">
                    <div className="font-serif text-xl sm:text-2xl text-ink dark:text-ink-dark">
                      {contributions?.currentStreak || 0}
                    </div>
                    <div className="font-sans text-[10px] sm:text-xs text-ink/60 dark:text-ink-dark/60 uppercase tracking-wider">Current Streak</div>
                  </div>
                  <div className="bg-white/30 dark:bg-surface-elevated rounded-xl p-3 sm:p-4">
                    <div className="font-serif text-xl sm:text-2xl text-ink dark:text-ink-dark">
                      {contributions?.longestStreak || 0}
                    </div>
                    <div className="font-sans text-[10px] sm:text-xs text-ink/60 dark:text-ink-dark/60 uppercase tracking-wider">Longest Streak</div>
                  </div>
                  <div className="bg-white/30 dark:bg-surface-elevated rounded-xl p-3 sm:p-4">
                    <div className="font-serif text-xl sm:text-2xl text-ink dark:text-ink-dark">
                      {contributions?.avgPerWeek || 0}
                    </div>
                    <div className="font-sans text-[10px] sm:text-xs text-ink/60 dark:text-ink-dark/60 uppercase tracking-wider">Avg/Week</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Repositories Header */}
            <div className="mb-4 sm:mb-6">
              <h3 className="font-sans text-sm sm:text-base font-bold uppercase tracking-widest text-ink dark:text-ink-dark">
                Recent Repositories
              </h3>
            </div>

            {/* Repositories */}
            <div className="space-y-4">
              {repos.map((repo, index) => (
                <motion.a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="block bg-white/50 dark:bg-surface-dark backdrop-blur-xl dark:backdrop-blur-none rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/60 dark:border-white/[0.06] shadow-md shadow-black/5 dark:shadow-black/25 hover:shadow-lg hover:bg-white/60 dark:hover:bg-surface-elevated hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-base sm:text-lg text-ink dark:text-ink-dark group-hover:text-accent dark:group-hover:text-accent-dark transition-colors flex items-center gap-2 truncate">
                        <span className="truncate">{repo.name}</span>
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h4>
                      {repo.description && (
                        <p className="font-sans text-xs sm:text-sm text-ink/60 dark:text-ink-dark/60 mt-1 line-clamp-2">{repo.description}</p>
                      )}
                    </div>
                    {repo.fork && (
                      <span className="font-sans text-[10px] sm:text-xs bg-ink/5 dark:bg-ink-dark/10 text-ink/60 dark:text-ink-dark/60 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                        Fork
                      </span>
                    )}
                  </div>

                  <div className="flex items-center flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-ink/50 dark:text-ink-dark/50">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{repo.stargazers_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{repo.forks_count}</span>
                    </div>
                    {repo.language && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-accent dark:bg-accent-dark"></div>
                        <span>{repo.language}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 ml-auto">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Updated </span>
                      <span>{new Date(repo.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* View All Button */}
            <div className="mt-6 sm:mt-8 text-center">
              <a
                href={profile.html_url || `https://github.com/${profile.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-ink dark:bg-ink-dark text-paper dark:text-paper-dark rounded-full font-sans text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-accent dark:hover:bg-accent-dark transition-colors duration-300"
              >
                <Github className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>View All Repositories</span>
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}

export default GithubSection
