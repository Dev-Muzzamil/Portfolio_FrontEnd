import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, ExternalLink, Star, GitFork, Calendar, MapPin, Link as LinkIcon } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const GitHubProfile = () => {
  const { about } = useData();
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [contributions, setContributions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get weeks for the calendar (GitHub style)
  const getCalendarData = (contributionsByDate) => {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    // Find the first Sunday of the year-long period
    const startDate = new Date(oneYearAgo);
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }

    const weeks = [];
    const currentDate = new Date(startDate);
    
    // Generate 53 weeks (364 days + partial weeks)
    for (let week = 0; week < 53; week++) {
      const weekData = [];
      
      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isInRange = currentDate <= today && currentDate >= oneYearAgo;
        const contributions = isInRange ? (contributionsByDate[dateStr] || 0) : 0;
        
        weekData.push({
          date: new Date(currentDate),
          contributions,
          level: contributions === 0 ? 0 : 
                 contributions <= 3 ? 1 : 
                 contributions <= 6 ? 2 : 
                 contributions <= 9 ? 3 : 4,
          dateStr,
          isInRange
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeks.push(weekData);
    }

    return weeks;
  };

  // Fetch GitHub data from backend API
  const fetchGitHubData = async (username) => {
    try {
      // Fetch both profile and contributions data
      const [contributionsRes, reposRes] = await Promise.all([
        fetch(`/api/github/contributions/${username}`),
        fetch(`/api/github/repos/${username}`)
      ]);

      if (!contributionsRes.ok) {
        throw new Error('Failed to fetch contributions data');
      }

      const contributionsData = await contributionsRes.json();
      const reposData = reposRes.ok ? await reposRes.json() : [];

      return {
        profile: contributionsData.profile,
        contributions: contributionsData.contributions,
        repos: reposData
      };
    } catch (error) {
      console.error('Error fetching GitHub data:', error);
      throw error;
    }
  };


  useEffect(() => {
    const fetchGitHubProfile = async () => {
      try {
        if (!about?.socialLinks?.github) {
          setError('GitHub profile not configured');
          setLoading(false);
          return;
        }

        const githubUrl = about.socialLinks.github;
        let username;
        
        if (githubUrl.includes('github.com/')) {
          username = githubUrl.split('github.com/')[1].split('/')[0];
        } else {
          username = githubUrl.replace(/https?:\/\/(www\.)?github\.com\//, '').replace('/', '');
        }
        
        if (!username) {
          setError('Invalid GitHub URL');
          setLoading(false);
          return;
        }

        console.log('Fetching GitHub data for username:', username);
        
        // Fetch data from backend API
        const data = await fetchGitHubData(username);
        
        setProfile(data.profile);
        setRepos(data.repos);
        setContributions(data.contributions);
        
        console.log('Successfully fetched GitHub data');
        console.log(`Total contributions: ${data.contributions.totalContributions}`);
        console.log(`Contribution days: ${Object.keys(data.contributions.contributionsByDate).length}`);
        console.log('Contribution data:', data.contributions.contributionsByDate);

      } catch (err) {
        setError('Error fetching GitHub profile');
        console.error('GitHub API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (about?.socialLinks?.github) {
      fetchGitHubProfile();
    } else {
      setLoading(false);
    }
  }, [about?.socialLinks?.github]);

  if (loading) {
    return (
      <section className="section-padding bg-gray-50">
        <div className="container-max">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section className="section-padding bg-gray-50">
        <div className="container-max">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">GitHub Profile Unavailable</h3>
            <p className="text-gray-600 mb-4">
              {error === 'GitHub profile not configured' 
                ? 'Please add your GitHub profile link in the admin panel to view your GitHub activity.'
                : 'Unable to load GitHub profile at this time.'
              }
            </p>
          </div>
        </div>
      </section>
    );
  }

  const calendarWeeks = contributions ? getCalendarData(contributions.contributionsByDate) : [];

  return (
    <motion.section 
      className="section-padding bg-gray-50"
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
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            My <span className="text-primary-600">GitHub</span> Activity
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
            <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 sticky top-8">
              <div className="text-center mb-6">
                <img
                  src={profile.avatar_url}
                  alt={profile.name || profile.login}
                  className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-primary-200"
                />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {profile.name || profile.login}
                </h3>
                <p className="text-gray-600 mb-4">@{profile.login}</p>
                {profile.bio && (
                  <p className="text-gray-700 mb-4">{profile.bio}</p>
                )}
              </div>

              {/* Profile Stats */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Public Repos</span>
                  <span className="font-semibold text-gray-900">{profile.public_repos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Followers</span>
                  <span className="font-semibold text-gray-900">{profile.followers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Following</span>
                  <span className="font-semibold text-gray-900">{profile.following}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Member since</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(profile.created_at).getFullYear()}
                  </span>
                </div>
              </div>


              {/* Profile Links */}
              <div className="space-y-3">
                {profile.location && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.blog && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <LinkIcon className="w-4 h-4" />
                    <a 
                      href={profile.blog} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary-600 transition-colors"
                    >
                      {profile.blog}
                    </a>
                  </div>
                )}
                <a
                  href={profile.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 w-full bg-gray-900 hover:bg-gray-800 text-white py-2 px-4 rounded-lg transition-colors duration-200"
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Recent Repositories</h3>
              <p className="text-gray-600">My latest projects and contributions</p>
            </div>

            {/* Contribution Calendar */}
            {contributions && calendarWeeks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="mb-8 bg-white rounded-lg shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Contribution Activity
                  </h4>
                  <a
                    href={`https://github.com/${profile.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
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
                          const weekStart = calendarWeeks[weekIndex]?.[0]?.date;
                          if (!weekStart) return <div key={weekIndex} className="w-2.5"></div>;
                          
                          const month = weekStart.getMonth();
                          const isFirstOfMonth = weekStart.getDate() <= 7;
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          
                          return (
                            <div key={weekIndex} className="w-2.5 text-xs text-gray-500 text-center">
                              {isFirstOfMonth ? monthNames[month] : ''}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Calendar grid */}
                    <div className="flex">
                      {/* Day labels */}
                      <div className="flex flex-col space-y-1 mr-2">
                        <div className="h-2.5"></div> {/* Sun */}
                        <div className="h-2.5 text-xs text-gray-500">Mon</div>
                        <div className="h-2.5"></div> {/* Tue */}
                        <div className="h-2.5 text-xs text-gray-500">Wed</div>
                        <div className="h-2.5"></div> {/* Thu */}
                        <div className="h-2.5 text-xs text-gray-500">Fri</div>
                        <div className="h-2.5"></div> {/* Sat */}
                      </div>

                      {/* Weeks grid */}
                      <div className="flex space-x-1">
                        {calendarWeeks.map((week, weekIndex) => (
                          <div key={weekIndex} className="flex flex-col space-y-1">
                            {week.map((day, dayIndex) => (
                              <div
                                key={`${weekIndex}-${dayIndex}`}
                                className={`w-2.5 h-2.5 rounded-sm transition-all duration-200 cursor-pointer hover:ring-1 hover:ring-gray-400 ${
                                  !day.isInRange ? 'bg-transparent' :
                                  day.level === 0 ? 'bg-gray-100 hover:bg-gray-200' :
                                  day.level === 1 ? 'bg-green-200 hover:bg-green-300' :
                                  day.level === 2 ? 'bg-green-400 hover:bg-green-500' :
                                  day.level === 3 ? 'bg-green-600 hover:bg-green-700' :
                                  'bg-green-800 hover:bg-green-900'
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
                <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                  <span>Less</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2.5 h-2.5 bg-gray-100 rounded-sm"></div>
                    <div className="w-2.5 h-2.5 bg-green-200 rounded-sm"></div>
                    <div className="w-2.5 h-2.5 bg-green-400 rounded-sm"></div>
                    <div className="w-2.5 h-2.5 bg-green-600 rounded-sm"></div>
                    <div className="w-2.5 h-2.5 bg-green-800 rounded-sm"></div>
                  </div>
                  <span>More</span>
                </div>
                
                {/* Stats Summary */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {contributions.totalContributions}
                    </div>
                    <div className="text-sm text-gray-600">This Year</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {contributions.currentStreak}
                    </div>
                    <div className="text-sm text-gray-600">Current Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {contributions.longestStreak}
                    </div>
                    <div className="text-sm text-gray-600">Longest Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {contributions.avgPerWeek}
                    </div>
                    <div className="text-sm text-gray-600">Avg/Week</div>
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
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
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
                        <p className="text-gray-600 text-sm mb-3">{repo.description}</p>
                      )}
                    </div>
                    {repo.fork && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Fork
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
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
                          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
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
                className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg transition-colors duration-200"
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
  );
};

export default GitHubProfile;