import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Github, ExternalLink, Star, GitFork, Calendar, MapPin, Link as LinkIcon } from 'lucide-react'
import { api } from '../services/api'
import { normalizeSocial } from '../utils/social'

const GithubSection = ({ username }) => {
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
    // try global about data
    // eslint-disable-next-line no-underscore-dangle
    const about = (typeof window !== 'undefined' && window.__PORTFOLIO_DATA?.about) || {}
    const social = normalizeSocial(about.socialLinks || about.social || about)
    const gh = social.github || social.gh || social['github.com'] || social['git']
    if (gh) return getUsernameFromUrl(gh)
    return null
  }

  // Helper function to get weeks for the calendar (GitHub style)
  const getCalendarData = (contributionsByDate = {}) => {
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(today.getFullYear() - 1)

    // Find the first Sunday of the year-long period
    const startDate = new Date(oneYearAgo)
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1)
    }

    const weeks = []
    const currentDate = new Date(startDate)

    // Generate 53 weeks (364 days + partial weeks)
    for (let week = 0; week < 53; week++) {
      const weekData = []

      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const isInRange = currentDate <= today && currentDate >= oneYearAgo
        const contributions = isInRange ? (contributionsByDate[dateStr] || 0) : 0

        weekData.push({
          date: new Date(currentDate),
          contributions,
          level: contributions === 0 ? 0 :
                 contributions <= 3 ? 1 :
                 contributions <= 6 ? 2 :
                 contributions <= 9 ? 3 : 4,
          dateStr,
          isInRange
        })

        currentDate.setDate(currentDate.getDate() + 1)
      }

      weeks.push(weekData)
    }

    return weeks
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
      // show clearer message in UI
      setLoading(false)
      setError('GitHub profile not configured')
      console.warn('GithubSection: no username found in props or centralized about.socialLinks')
      return
    }

    fetchGithub(user)
  }, [username])

  if (loading) {
    return (
      <section className="section-padding bg-gray-50 dark:bg-gray-800">
        <div className="container-max">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !profile) {
    return (
      <section className="section-padding bg-gray-50 dark:bg-gray-800">
        <div className="container-max">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">GitHub Profile Unavailable</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error === 'GitHub profile not configured'
                ? 'Please add your GitHub profile link in the admin panel to view your GitHub activity.'
                : 'Unable to load GitHub profile at this time.'
              }
            </p>
          </div>
        </div>
      </section>
    )
  }

  // If backend provided a contribution calendar (weeks -> days), convert it to the
  // shape expected by the calendar renderer. Otherwise, fall back to empty.
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

  // Ensure contribution summary fields exist (some endpoints provide more, others less)
  const contributionSummary = {
    totalContributions: contributions?.totalContributions || 0,
    currentStreak: contributions?.currentStreak || 0,
    longestStreak: contributions?.longestStreak || 0,
    avgPerWeek: contributions?.avgPerWeek || Math.round((contributions?.totalContributions || 0) / 52)
  }

  return (
    <motion.section
      className="section-padding bg-gray-50 dark:bg-gray-800"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, margin: "-50px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            My <span className="text-primary-600 dark:text-primary-400">GitHub</span> Activity
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Check out my latest projects, contributions, and coding activity on GitHub
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-gray-900/50 transition-all duration-300 p-6 sticky top-8">
              <div className="text-center mb-6">
                <img
                  src={profile.avatar_url || profile.avatarUrl || `https://github.com/identicons/${profile.login || profile.username || 'user'}.png`}
                  alt={profile.name || profile.login || profile.username || 'GitHub Profile'}
                  className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-primary-200 dark:border-primary-800"
                />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {profile.name || profile.login || profile.username || 'GitHub User'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">@{profile.login || profile.username || 'user'}</p>
                {profile.bio && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{profile.bio}</p>
                )}
              </div>

              {/* Profile Stats */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Public Repos</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{profile.public_repos || profile.publicRepos || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Followers</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{profile.followers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Following</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{profile.following || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Member since</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {profile.created_at ? new Date(profile.created_at).getFullYear() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Profile Links */}
              <div className="space-y-3">
                {profile.location && (
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.blog && (
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <LinkIcon className="w-4 h-4" />
                    <a
                      href={profile.blog}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {profile.blog}
                    </a>
                  </div>
                )}
                <a
                  href={profile.html_url || profile.htmlUrl || `https://github.com/${profile.login || profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  <Github className="w-4 h-4" />
                  <span>View on GitHub</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Repositories and Calendar */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Recent Repositories</h3>
              <p className="text-gray-600 dark:text-gray-400">My latest projects and contributions</p>
            </div>

            {/* Contribution Calendar */}
            {contributions && calendarWeeks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="mb-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-2xl dark:shadow-gray-900/50 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Contribution Activity
                  </h4>
                  <a
                    href={`https://github.com/${profile.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>

                {/* Calendar Grid - GitHub Style */}
                <div className="overflow-x-auto">
                  <div className="inline-block">
                    {/* Month labels */}
                    <div className="flex mb-2">
                      <div className="w-8"></div> {/* Space for day labels */}
                      <div className="flex space-x-1">
                        {Array.from({ length: 53 }, (_, weekIndex) => {
                          const weekStart = calendarWeeks[weekIndex]?.[0]?.date
                          if (!weekStart) return <div key={weekIndex} className="w-2.5"></div>

                          const month = weekStart.getMonth()
                          const isFirstOfMonth = weekStart.getDate() <= 7
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

                          return (
                            <div key={weekIndex} className="w-2.5 text-xs text-gray-500 dark:text-gray-400 text-center">
                              {isFirstOfMonth ? monthNames[month] : ''}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Calendar grid */}
                    <div className="flex">
                      {/* Day labels */}
                      <div className="flex flex-col space-y-1 mr-2">
                        <div className="h-2.5"></div> {/* Sun */}
                        <div className="h-2.5 text-xs text-gray-500 dark:text-gray-400">Mon</div>
                        <div className="h-2.5"></div> {/* Tue */}
                        <div className="h-2.5 text-xs text-gray-500 dark:text-gray-400">Wed</div>
                        <div className="h-2.5"></div> {/* Thu */}
                        <div className="h-2.5 text-xs text-gray-500 dark:text-gray-400">Fri</div>
                        <div className="h-2.5"></div> {/* Sat */}
                      </div>

                      {/* Weeks grid */}
                      <div className="flex space-x-1">
                        {calendarWeeks.map((week, weekIndex) => (
                          <div key={weekIndex} className="flex flex-col space-y-1">
                            {week.map((day, dayIndex) => (
                              <div
                                key={`${weekIndex}-${dayIndex}`}
                                className={`w-2.5 h-2.5 rounded-sm transition-all duration-200 cursor-pointer hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-600 ${
                                  !day.isInRange ? 'bg-transparent' :
                                  day.level === 0 ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700' :
                                  day.level === 1 ? 'bg-green-200 dark:bg-green-800 hover:bg-green-300 dark:hover:bg-green-700' :
                                  day.level === 2 ? 'bg-green-400 dark:bg-green-600 hover:bg-green-500 dark:hover:bg-green-500' :
                                  day.level === 3 ? 'bg-green-600 dark:bg-green-400 hover:bg-green-700 dark:hover:bg-green-300' :
                                  'bg-green-800 dark:bg-green-200 hover:bg-green-900 dark:hover:bg-green-100'
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
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-4">
                  <span>Less</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2.5 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                    <div className="w-2.5 h-2.5 bg-green-200 dark:bg-green-800 rounded-sm"></div>
                    <div className="w-2.5 h-2.5 bg-green-400 dark:bg-green-600 rounded-sm"></div>
                    <div className="w-2.5 h-2.5 bg-green-600 dark:bg-green-400 rounded-sm"></div>
                    <div className="w-2.5 h-2.5 bg-green-800 dark:bg-green-200 rounded-sm"></div>
                  </div>
                  <span>More</span>
                </div>

                {/* Stats Summary */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {contributions?.totalContributions || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">This Year</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {contributions?.currentStreak || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {contributions?.longestStreak || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {contributions?.avgPerWeek || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg/Week</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Repositories */}
            <div className="space-y-4">
              {repos.map((repo, index) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-lg hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-gray-900/50 transition-all duration-300 p-6 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2"
                        >
                          <span>{repo.name}</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </h4>
                      {repo.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{repo.description}</p>
                      )}
                    </div>
                    {repo.fork && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-md">
                        Fork
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4" />
                        <span>{repo.stargazers_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <GitFork className="w-4 h-4" />
                        <span>{repo.forks_count}</span>
                      </div>
                      {repo.language && (
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                          <span>{repo.language}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <a
                href={profile.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white py-3 px-6 rounded-lg transition-colors duration-200"
              >
                <Github className="w-5 h-5" />
                <span>View All Repositories</span>
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}

export default GithubSection
