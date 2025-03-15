import { OpenAI } from 'openai';
import fs from 'fs/promises';
import path from 'path';
import logger from '../config/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config(); 

// Initialize OpenAI client
let openai;
try {
  // Check if API key exists before initializing
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.error("OPENAI_API_KEY environment variable is missing. Make sure it's defined in your .env file.");
    // We'll initialize it anyway but functions will fail gracefully when called
  }
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  logger.info("OpenAI client initialized successfully");
} catch (error) {
  logger.error("Failed to initialize OpenAI client:", error);
}

/**
 * Analyzes tweets for a specific user using OpenAI
 * @param {string} username - Twitter username to analyze
 * @param {Array} tweets - Array of tweets
 * @param {Object} options - Analysis options
 * @returns {Object} - Analysis results
 */
export async function analyzeUserTweets(username, tweets, options) {
  const { 
    model = 'gpt-3.5-turbo', 
    customPrompt = null,
    includeRawTweets = false 
  } = options;
  
  logger.info(`Analyzing tweets for user @${username}`);
  
  if (!tweets || tweets.length === 0) {
    logger.warn(`No tweets found for user @${username}`);
    return {
      username,
      analyzedAt: new Date().toISOString(),
      tweetCount: 0,
      summary: "No tweets available for analysis."
    };
  }
  
  // Extract text content from tweets
  const tweetTexts = tweets.map(tweet => {
    return tweet.full_text || tweet.text || '';
  }).filter(text => text.length > 0);
  
  logger.info(`Found ${tweetTexts.length} tweet texts for analysis for @${username}`);
  
  if (tweetTexts.length === 0) {
    logger.warn(`No tweet texts available for analysis for @${username}`);
    return {
      username,
      analyzedAt: new Date().toISOString(),
      tweetCount: tweets.length,
      summary: "Tweets found but no text content available for analysis."
    };
  }
  
  // Determine date range of tweets
  let earliestTweet = null;
  let latestTweet = null;
  
  try {
    // Sort by date
    const sortedTweets = [...tweets].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt);
      const dateB = new Date(b.created_at || b.createdAt);
      return dateA - dateB;
    });
    
    earliestTweet = sortedTweets[0].created_at || sortedTweets[0].createdAt;
    latestTweet = sortedTweets[sortedTweets.length - 1].created_at || sortedTweets[sortedTweets.length - 1].createdAt;
  } catch (error) {
    logger.error(`Error determining tweet date range for @${username}:`, error);
  }
  
  // Create system prompt
  const systemPrompt = customPrompt || 
    "You are an analyst who specializes in summarizing social media content. Provide a concise summary of the main topics, themes, and sentiments in these tweets.";
  
  // Create user prompt with tweets
  const userPrompt = `Please analyze these tweets from @${username} and provide a summary of what they mainly talked about in the past week:\n\n${tweetTexts.join('\n\n')}`;
  
  logger.info(`Sending ${tweetTexts.length} tweets to OpenAI for analysis for @${username}`);
  
  try {
    // Send to OpenAI for analysis
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    // Get the summary
    const summary = completion.choices[0].message.content;
    logger.info(`Analysis completed for @${username}`);
    
    // Extract key topics using simple NLP approach (could be enhanced)
    const keyTopics = extractKeyTopics(summary);
    
    // Create tweet references (simplified versions of tweets)
    const tweetReferences = tweets.map((tweet, index) => {
      return {
        index,
        id: tweet.id_str || tweet.id,
        createdAt: tweet.created_at || tweet.createdAt,
        text: (tweet.full_text || tweet.text || '').substring(0, 100) + 
              ((tweet.full_text || tweet.text || '').length > 100 ? '...' : '')
      };
    });
    
    // Prepare result object
    const result = {
      username,
      analyzedAt: new Date().toISOString(),
      tweetCount: tweets.length,
      tweetDateRange: {
        earliestTweet,
        latestTweet
      },
      analysisParams: {
        model,
        promptTemplate: systemPrompt
      },
      promptUsed: {
        system: systemPrompt,
        user: userPrompt
      },
      summary,
      keyTopics,
      sentiment: determineSentiment(summary),
      tweetReferences
    };
    
    // Include raw tweets if requested
    if (includeRawTweets) {
      result.rawTweets = tweets;
    }
    
    return result;
  } catch (error) {
    logger.error(`Error analyzing tweets for @${username}:`, error);
    
    return {
      username,
      analyzedAt: new Date().toISOString(),
      tweetCount: tweets.length,
      error: `Analysis failed: ${error.message}`
    };
  }
}

/**
 * Generate an overall summary of all user analyses
 * @param {string} taskId - Task ID
 * @param {Object} userAnalyses - Analysis results for each user
 * @param {Object} options - Analysis options used
 * @returns {Object} - Overall summary
 */
export async function generateOverallSummary(taskId, userAnalyses, options) {
  logger.info(`Generating overall summary for task ${taskId}`);
  
  const usernames = Object.keys(userAnalyses);
  const usersAnalyzed = usernames.length;
  
  if (usersAnalyzed === 0) {
    logger.warn(`No user analyses available for task ${taskId}`);
    return {
      taskId,
      generatedAt: new Date().toISOString(),
      analysisParams: options,
      statistics: {
        usersAnalyzed: 0,
        totalTweets: 0
      },
      message: "No analyses available."
    };
  }
  
  // Collect statistics
  let totalTweets = 0;
  let usersWithoutSufficientTweets = 0;
  const userSummaries = {};
  const mentionedThemes = {};
  const tweetCounts = [];
  
  // Process each user analysis
  for (const username of usernames) {
    const analysis = userAnalyses[username];
    
    // Count tweets
    totalTweets += analysis.tweetCount || 0;
    
    // Track users with errors or insufficient tweets
    if (analysis.error || analysis.tweetCount === 0) {
      usersWithoutSufficientTweets++;
    }
    
    // Store tweet counts for active users ranking
    if (analysis.tweetCount > 0) {
      tweetCounts.push({
        username,
        tweetCount: analysis.tweetCount
      });
    }
    
    // Store summaries
    userSummaries[username] = analysis.summary || analysis.error || "No analysis available.";
    
    // Collect themes from key topics
    if (analysis.keyTopics && Array.isArray(analysis.keyTopics)) {
      analysis.keyTopics.forEach(topic => {
        if (!mentionedThemes[topic]) {
          mentionedThemes[topic] = 0;
        }
        mentionedThemes[topic]++;
      });
    }
  }
  
  // Calculate average tweets per user
  const averageTweetsPerUser = usersAnalyzed > 0 ? (totalTweets / usersAnalyzed) : 0;
  
  // Sort users by tweet count for top active users
  const topActiveUsers = tweetCounts
    .sort((a, b) => b.tweetCount - a.tweetCount)
    .slice(0, 5);
  
  // Sort themes by mention count for common themes
  const commonThemes = Object.keys(mentionedThemes)
    .map(theme => ({
      theme,
      mentionedByUsers: mentionedThemes[theme]
    }))
    .sort((a, b) => b.mentionedByUsers - a.mentionedByUsers)
    .slice(0, 10);
  
  // Generate combined summary using OpenAI
  let combinedSummary = null;
  try {
    // Prepare the data for OpenAI
    const model = options.model || 'gpt-3.5-turbo';
    
    // Create a formatted text with all the user summaries
    const formattedSummaries = Object.entries(userSummaries)
      .map(([username, summary]) => `@${username}: ${summary}`)
      .join('\n\n');
    
    // Create system prompt
    const systemPrompt = "You are an analyst who specializes in creating comprehensive overviews from multiple social media summaries. Create a meta-summary that identifies common themes, notable differences, and overall trends across all these accounts.";
    
    // Create user prompt
    const userPrompt = `Below are summaries of what different Twitter accounts have been discussing in the past week. Please analyze these summaries and provide a comprehensive overview that identifies the main topics, themes, and trends across all these accounts.\n\n${formattedSummaries}`;
    
    logger.info(`Sending ${usernames.length} user summaries to OpenAI for combined analysis for task ${taskId}`);
    
    // Send to OpenAI for analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4.5-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    });
    
    // Get the combined summary
    combinedSummary = completion.choices[0].message.content;
    logger.info(`Combined summary analysis completed for task ${taskId}`);
    
  } catch (error) {
    logger.error(`Error generating combined summary for task ${taskId}:`, error);
    combinedSummary = "Failed to generate combined summary due to an error.";
  }
  
  // Create summary object
  return {
    taskId,
    generatedAt: new Date().toISOString(),
    analysisParams: options,
    statistics: {
      usersAnalyzed,
      totalTweets,
      usersWithoutSufficientTweets,
      averageTweetsPerUser: parseFloat(averageTweetsPerUser.toFixed(2))
    },
    topActiveUsers,
    commonThemes,
    userSummaries,
    combinedSummary
  };
}

/**
 * Simple function to extract key topics from a summary
 * @param {string} summary - The text summary to analyze
 * @returns {Array} - Array of key topics
 */
function extractKeyTopics(summary) {
  if (!summary) return [];
  
  // Simple approach - look for lists, key phrases
  const topics = [];
  
  // Look for numbered lists (1. Topic)
  const numberedPattern = /\d+\.\s+([^\n.]+)/g;
  let match;
  while ((match = numberedPattern.exec(summary)) !== null) {
    topics.push(match[1].trim());
  }
  
  // Look for bullet points
  const bulletPattern = /•\s+([^\n.]+)/g;
  while ((match = bulletPattern.exec(summary)) !== null) {
    topics.push(match[1].trim());
  }
  
  // Look for "key topics/themes include"
  const keyTopicsPattern = /key (topics|themes) include\s*:?\s*([^.]+)/i;
  const keyTopicsMatch = summary.match(keyTopicsPattern);
  if (keyTopicsMatch) {
    const topicText = keyTopicsMatch[2];
    const splitTopics = topicText.split(/,\s*|\s+and\s+/).map(t => t.trim());
    topics.push(...splitTopics);
  }
  
  // If we still don't have topics, extract noun phrases (simplified)
  if (topics.length === 0) {
    const words = summary.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      if (/^[A-Z]/.test(words[i]) && !/^[A-Z]/.test(words[i+1])) {
        const phrase = words[i];
        if (phrase.length > 3 && !topics.includes(phrase)) {
          topics.push(phrase);
        }
      }
    }
  }
  
  // Return unique topics, up to 5
  return [...new Set(topics)].slice(0, 5);
}

/**
 * Simple sentiment analysis based on keywords in the summary
 * @param {string} summary - The text summary to analyze
 * @returns {string} - Sentiment evaluation
 */
function determineSentiment(summary) {
  if (!summary) return "Neutral";
  
  const positiveWords = ['positive', 'optimistic', 'excited', 'enthusiastic', 'good', 'great', 'excellent', 'beneficial'];
  const negativeWords = ['negative', 'pessimistic', 'concerned', 'worried', 'bad', 'poor', 'problematic', 'critical'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  const lowercaseSummary = summary.toLowerCase();
  
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = lowercaseSummary.match(regex);
    if (matches) positiveCount += matches.length;
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = lowercaseSummary.match(regex);
    if (matches) negativeCount += matches.length;
  });
  
  if (positiveCount > negativeCount * 2) return "Positive";
  if (negativeCount > positiveCount * 2) return "Negative";
  if (positiveCount > negativeCount) return "Neutral/Positive";
  if (negativeCount > positiveCount) return "Neutral/Negative";
  return "Neutral";
} 