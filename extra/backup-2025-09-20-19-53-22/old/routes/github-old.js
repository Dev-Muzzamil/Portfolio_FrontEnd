const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get GitHub contribution data for a user using GraphQL API
router.get('/contributions/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // GitHub API token for authenticated requests
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    if (!GITHUB_TOKEN) {
      return res.status(400).json({ message: 'GitHub token is required for GraphQL API' });
    }
    
    const headers = {
      'Authorization': `bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    };

    // First, get user profile using REST API
    const profileResponse = await axios.get(`https://api.github.com/users/${username}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    const profile = profileResponse.data;

    // GraphQL query to get contribution data
    const graphqlQuery = {
      query: `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                    weekday
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        username: username
      }
    };

    // Fetch contribution data using GraphQL
    const graphqlResponse = await axios.post('https://api.github.com/graphql', graphqlQuery, { headers });
    
    if (graphqlResponse.data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(graphqlResponse.data.errors)}`);
    }

    const contributionCalendar = graphqlResponse.data.data.user.contributionsCollection.contributionCalendar;
    
    // Process the contribution data
    const contributionsByDate = {};
    let totalContributions = 0;
    
    contributionCalendar.weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        if (day.contributionCount > 0) {
          contributionsByDate[day.date] = day.contributionCount;
          totalContributions += day.contributionCount;
        }
      });
    });

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    let checkDate = new Date(today);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    while (checkDate >= oneYearAgo) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (contributionsByDate[dateStr] > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = Object.keys(contributionsByDate).sort();
    
    for (const date of sortedDates) {
      if (contributionsByDate[date] > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    console.log(`GraphQL API - Total contributions: ${totalContributions}`);
    console.log(`GraphQL API - Contribution days: ${Object.keys(contributionsByDate).length}`);

    res.json({
      profile,
      contributions: {
        totalContributions,
        currentStreak,
        longestStreak,
        avgPerWeek: Math.round(totalContributions / 52),
        contributionsByDate
      }
    });

  } catch (error) {
    console.error('GitHub GraphQL API Error:', error);
    res.status(500).json({ 
      message: 'Error fetching GitHub data',
      error: error.message 
    });
  }
});

// Get GitHub repositories for a user
router.get('/repos/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { sort = 'updated', per_page = 6 } = req.query;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // GitHub API token for authenticated requests
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    const headers = GITHUB_TOKEN ? {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    } : {
      'Accept': 'application/vnd.github.v3+json'
    };

    // Fetch repositories
    const reposResponse = await axios.get(
      `https://api.github.com/users/${username}/repos?sort=${sort}&per_page=${per_page}`, 
      { headers }
    );
    
    res.json(reposResponse.data);

  } catch (error) {
    console.error('GitHub API Error:', error);
    res.status(500).json({ 
      message: 'Error fetching GitHub repositories',
      error: error.message 
    });
  }
});

module.exports = router;
