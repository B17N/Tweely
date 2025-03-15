import { ApifyClient } from 'apify-client';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { getTaskById, updateTaskWithTwitterData, updateTaskWithTweetFileReferences, updateTaskWithAnalysisReferences } from './taskService.js';
import logger from '../config/logger.js';
import { analyzeUserTweets, generateOverallSummary } from './analysisService.js';

// Track ongoing requests
const activeRequests = new Map();

export async function fetchFollowingUser(taskId, twitterUsername) {
  const requestId = uuidv4();
  
  // Start async processing
  processTwitterRequest(requestId, taskId, twitterUsername);
  
  return requestId;
}

export async function fetchTweets(taskId, options) {
  const requestId = uuidv4();
  logger.info(`Starting tweet fetch for task ${taskId} with requestId ${requestId}`);
  logger.info('Options:', options);
  
  // Start async processing
  processTweetsRequest(requestId, taskId, options);
  
  return requestId;
}

export async function analyzeTweets(taskId, options) {
  const requestId = uuidv4();
  logger.info(`Starting tweet analysis for task ${taskId} with requestId ${requestId}`);
  logger.info('Analysis options:', options);
  
  // Start async processing
  processAnalysisRequest(requestId, taskId, options);
  
  return requestId;
}

async function processTwitterRequest(requestId, taskId, twitterUsername) {
  try {
    // Track request
    activeRequests.set(requestId, {
      taskId,
      twitterUsername,
      status: 'processing',
      startTime: new Date()
    });
    
    // Prepare Actor input
    const input = {
      "getFollowers": false,
      "getFollowing": true,
      "maxItems": 100,
      "twitterHandles": [twitterUsername]
    };
    
    // First, log the request parameters to the task file
    await updateTaskWithTwitterData(taskId, {
      username: twitterUsername,
      requestStarted: new Date().toISOString(),
      status: 'processing',
      apifyRequestParams: input
    });
    
    // Initialize Apify client
    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });
    
    // Call Apify actor
    const run = await client.actor("apidojo/twitter-user-scraper").call(input);
    
    // Log the run information
    await updateTaskWithTwitterData(taskId, {
      username: twitterUsername,
      requestStarted: new Date().toISOString(),
      status: 'fetching_results',
      apifyRequestParams: input,
      apifyRunId: run.id,
      apifyDatasetId: run.defaultDatasetId
    });
    
    // Fetch data from dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    // Update task with complete Twitter data
    await updateTaskWithTwitterData(taskId, {
      username: twitterUsername,
      fetchedAt: new Date().toISOString(),
      following: items,
      followingCount: items.length,
      status: 'completed',
      apifyRequestParams: input,
      apifyRunId: run.id,
      apifyDatasetId: run.defaultDatasetId
    });
    
    // Update request status
    activeRequests.set(requestId, {
      ...activeRequests.get(requestId),
      status: 'completed',
      completedAt: new Date()
    });
  } catch (error) {
    logger.error(`Error processing Twitter request ${requestId}:`, error);
    
    // Update request status on error
    activeRequests.set(requestId, {
      ...activeRequests.get(requestId),
      status: 'failed',
      error: error.message
    });
    
    // Update task with error status
    try {
      await updateTaskWithTwitterData(taskId, {
        username: twitterUsername,
        fetchedAt: new Date().toISOString(),
        error: error.message,
        status: 'failed'
      });
    } catch (updateError) {
      logger.error('Failed to update task with error status:', updateError);
    }
  }
}

async function processTweetsRequest(requestId, taskId, options) {
  const { batchNumber, batchSize, daysBack, includeReplies, includeRetweets, usernames, startUserIndex, endUserIndex } = options;
  
  logger.info(`Starting tweet processing for request ${requestId}`);
  logger.info(`Processing batch ${batchNumber} for users ${startUserIndex}-${endUserIndex}`);
  
  try {
    // Track request
    activeRequests.set(requestId, {
      taskId,
      type: 'tweets',
      batchNumber,
      status: 'processing',
      startTime: new Date()
    });
    
    logger.info('Request tracked in activeRequests');

    logger.info(`Usernames being processed: ${usernames.join(', ')}`);

    // Prepare Actor input using the correct format (new format with start_urls)
    const input = {
      "result_count": "1000",
      "since_date": new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "start_urls": usernames.map(username => ({
        "url": `https://twitter.com/${username}`,
        "method": "GET"
      }))
    };
    //logger.info(JSON.stringify(input, null, 2)+'zzz');
    
   


    logger.info(`Prepared Apify input with ${usernames.length} usernames using new format`);
    
    // Initialize Apify client
    logger.info('Initializing Apify client');
    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });
    
    // Call Apify actor for tweets
    logger.info('Calling Apify actor gentle_cloud/twitter-tweets-scraper');
    const run = await client.actor("gentle_cloud/twitter-tweets-scraper").call(input);
    
    logger.info(`Apify run started with ID: ${run.id}`);
    
    // Fetch data from dataset
    logger.info(`Fetching data from Apify dataset ${run.defaultDatasetId}`);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    logger.info(`Retrieved ${items.length} tweets from dataset`);
    
    // Ensure task directory exists
    const taskDir = path.join(process.cwd(), 'data', 'tasks', `${taskId}`);
    logger.info(`Creating task directory: ${taskDir}`);
    await fs.mkdir(taskDir, { recursive: true });
    
    // Process tweets data and write individual files
    const fileReferences = {};
    let totalTweetCount = 0;
    
    // Output the results of calling Apify in text format
    logger.info(`Tweet fetch completed successfully. Retrieved ${items.length} tweets from ${Object.keys(items.reduce((acc, tweet) => {
      const username = tweet.user?.name || tweet.user.name;
      if (username) acc[username] = true;
      return acc;
    }, {})).length} unique users.`);
    
    // Log a sample of the first few tweets if available
    if (items.length > 0) {
      logger.info(`Sample tweet: "${items[0].full_text?.substring(0, 50)}${items[0].full_text?.length > 50 ? '...' : ''}"`);
    }
    
    // Log the Apify run details for reference
    logger.info(`Full results available at: https://console.apify.com/storage/datasets/${run.defaultDatasetId}`);
    // Log all available fields in the tweet objects
    if (items.length > 0) {
      const sampleTweet = items[0];
      logger.info('Available tweet fields:');
      const fields = Object.keys(sampleTweet);
      logger.info(fields.join(', '));
      
      // Log nested objects structure if they exist
      fields.forEach(field => {
        if (sampleTweet[field] && typeof sampleTweet[field] === 'object' && !Array.isArray(sampleTweet[field])) {
          logger.info(`${field} contains: ${Object.keys(sampleTweet[field]).join(', ')}`);
        }
      });
      
      // Log a more detailed sample of the first tweet
      logger.info('Sample tweet structure:');
      logger.info(JSON.stringify(sampleTweet, null, 2).substring(0, 1000) + (JSON.stringify(sampleTweet, null, 2).length > 1000 ? '...' : ''));
    } else {
      logger.info('No tweets available to analyze fields');
    }

    // Group tweets by username
    logger.info('Grouping tweets by username');
    
    const tweetsByUser = {};
    for (const tweet of items) {
      //logger.info(JSON.stringify(tweet)+'aaaaa');

      //logger.info(Object.keys(tweet)+'bbbb');
      //logger.info(tweet.user.name+'ccc');
      const username = tweet.user.name;
      if (!username) {
        logger.warn('Tweet found without username:', tweet);
        continue;
      }
      
      if (!tweetsByUser[username]) {
        tweetsByUser[username] = [];
      }
      
      tweetsByUser[username].push(tweet);
    }
    
    logger.info(`Found tweets for ${Object.keys(tweetsByUser).length} users`);
    
    // Write each user's tweets to a separate file
    for (const username of Object.keys(tweetsByUser)) {
      const userTweets = tweetsByUser[username];
      const tweetCount = userTweets.length;
      totalTweetCount += tweetCount;
      
      logger.info(`Processing ${tweetCount} tweets for user ${username}`);
      
      // Prepare the tweet data with indices for filtering
      const tweetData = {
        username: username,
        fetchedAt: new Date().toISOString(),
        params: {
          daysBack,
          includeReplies,
          includeRetweets
        },
        tweets: userTweets,
        tweetsByDay: {}
      };
      
      // Organize tweets by day for easy filtering
      userTweets.forEach((tweet, index) => {

        const tweetDate = new Date(tweet.created_at);
        // Handle potential invalid date values
        let dateKey;
        try {
          // Check if tweetDate is valid before calling toISOString()
          if (isNaN(tweetDate.getTime())) {
            logger.warn(`Invalid date found for tweet: ${tweet.id_str || 'unknown'}`);
            dateKey = 'unknown_date';
          } else {
            dateKey = tweetDate.toISOString().split('T')[0];
          }
        } catch (error) {
          logger.warn(`Error processing tweet date: ${error.message}`);
          dateKey = 'unknown_date';
        }
        
        if (!tweetData.tweetsByDay[dateKey]) {
          tweetData.tweetsByDay[dateKey] = [];
        }
        
        tweetData.tweetsByDay[dateKey].push(index);
      });
      
      // Write user tweets to file
      // Sanitize username to avoid problematic filenames
      const sanitizedUsername = username
        .replace(/[\/\\?%*:|"<>]/g, '_') // Replace filesystem unsafe chars
        .replace(/\s+/g, '_')           // Replace spaces with underscores
        .replace(/^\.+/, '_')           // Replace leading dots
        .trim();
      const userFilePath = path.join(taskDir, `${sanitizedUsername}.json`);
      logger.info(`Writing tweets to file: ${userFilePath}`);
      await fs.writeFile(userFilePath, JSON.stringify(tweetData, null, 2));
      
      // Get earliest and latest tweet dates
      let earliestTweet = null;
      let latestTweet = null;
      
      if (tweetCount > 0) {
        // Sort by date for finding earliest/latest
        const sortedTweets = [...userTweets].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        earliestTweet = sortedTweets[0].createdAt;
        latestTweet = sortedTweets[sortedTweets.length - 1].createdAt;
      }
      
      // Add file reference
      fileReferences[username] = {
        path: `${taskId}/${username}.json`,
        tweetCount,
        lastUpdated: new Date().toISOString(),
        earliestTweet,
        latestTweet
      };
    }
    
    logger.info(`Total tweets processed: ${totalTweetCount}`);
    
    // Calculate tweet stats
    const tweetsPerUser = Object.keys(tweetsByUser).reduce((acc, username) => {
      acc[username] = tweetsByUser[username].length;
      return acc;
    }, {});
    
    // Sort users by tweet count for most active
    const mostActive = Object.keys(tweetsPerUser)
      .sort((a, b) => tweetsPerUser[b] - tweetsPerUser[a])
      .slice(0, 5);
    
    logger.info('Most active users:', mostActive);
    
    // Update the task with file references and stats
    const batchInfo = {
      processedAt: new Date().toISOString(),
      userCount: usernames.length,
      tweetCount: totalTweetCount,
      usernames,
      startIndex: startUserIndex,
      endIndex: endUserIndex,
      apifyRequestParams: input,
      apifyRunId: run.id,
      apifyDatasetId: run.defaultDatasetId
    };
    
    const stats = {
      totalTweets: totalTweetCount,
      tweetsPerUser,
      mostActive
    };
    
    logger.info('Updating task with batch info and stats');
    await updateTaskWithTweetFileReferences(taskId, batchNumber, batchInfo, fileReferences, stats);
    
    // Update request status
    activeRequests.set(requestId, {
      ...activeRequests.get(requestId),
      status: 'completed',
      completedAt: new Date().toISOString()
    });
    
    logger.info(`Request ${requestId} completed successfully`);
    
  } catch (error) {
    logger.error(`Error processing tweets request ${requestId}:`, error);
    
    // Update request status on error
    activeRequests.set(requestId, {
      ...activeRequests.get(requestId),
      status: 'failed',
      error: error.message
    });
    
    logger.info(`Request ${requestId} marked as failed`);
  }
}

async function processAnalysisRequest(requestId, taskId, options) {
  const { 
    model = 'gpt-3.5-turbo', 
    maxUsersToAnalyze = 10, 
    minTweetsRequired = 3, 
    customPrompt = null,
    includeRawTweets = false,
    specificUsernames = []
  } = options;
  
  logger.info(`Starting analysis processing for request ${requestId}`);
  
  try {
    // Track request
    activeRequests.set(requestId, {
      taskId,
      type: 'analysis',
      status: 'processing',
      startTime: new Date()
    });
    
    logger.info('Request tracked in activeRequests');
    
    // Get task data
    logger.info(`Fetching task data for ID: ${taskId}`);
    const task = await getTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    // Check if task has tweet data
    if (!task.tweetsData || !task.tweetsData.tweetFiles || Object.keys(task.tweetsData.tweetFiles).length === 0) {
      throw new Error(`Task ${taskId} has no tweet data. Please fetch tweets first.`);
    }
    
    // Determine which users to analyze
    let usernamesToAnalyze = [];
    
    if (specificUsernames && specificUsernames.length > 0) {
      // Use specific usernames if provided
      usernamesToAnalyze = specificUsernames;
      logger.info(`Using ${usernamesToAnalyze.length} specifically requested usernames for analysis`);
    } else {
      // Otherwise get usernames from tweet files
      usernamesToAnalyze = Object.keys(task.tweetsData.tweetFiles);
      logger.info(`Found ${usernamesToAnalyze.length} usernames with tweet data`);
      
      // Apply limit if specified
      if (maxUsersToAnalyze > 0 && usernamesToAnalyze.length > maxUsersToAnalyze) {
        logger.info(`Limiting to ${maxUsersToAnalyze} users for analysis`);
        usernamesToAnalyze = usernamesToAnalyze.slice(0, maxUsersToAnalyze);
      }
    }
    
    if (usernamesToAnalyze.length === 0) {
      throw new Error('No usernames available for analysis');
    }
    
    logger.info(`Will analyze tweets for ${usernamesToAnalyze.length} users`);
    
    // Ensure analysis directory exists
    const analysisDir = path.join(process.cwd(), 'data', 'tasks', `${taskId}-analysis`);
    logger.info(`Creating analysis directory: ${analysisDir}`);
    await fs.mkdir(analysisDir, { recursive: true });
    
    // Analyze tweets for each user
    const userAnalyses = {};
    const fileReferences = {};
    
    for (const username of usernamesToAnalyze) {
      logger.info(`Processing analysis for user ${username}`);
      
      try {
        // Get tweet file reference
        const tweetFileRef = task.tweetsData.tweetFiles[username];
        if (!tweetFileRef) {
          logger.warn(`No tweet file reference found for ${username}`);
          continue;
        }
        
        // Read tweet file
        const tweetFilePath = path.join(process.cwd(), 'data', 'tasks', tweetFileRef.path.replace(/ /g, '_'));
        logger.info(`Reading tweet file: ${tweetFilePath}`);
        
        const tweetData = JSON.parse(await fs.readFile(tweetFilePath, 'utf8'));
        
        // Check if there are enough tweets
        if (!tweetData.tweets || tweetData.tweets.length < minTweetsRequired) {
          logger.warn(`Not enough tweets for ${username}: ${tweetData.tweets?.length || 0} < ${minTweetsRequired}`);
          userAnalyses[username] = {
            username,
            analyzedAt: new Date().toISOString(),
            tweetCount: tweetData.tweets?.length || 0,
            summary: `Not enough tweets to analyze (minimum ${minTweetsRequired} required).`
          };
          continue;
        }
        
        // Analyze tweets
        logger.info(`Analyzing ${tweetData.tweets.length} tweets for ${username}`);
        const analysis = await analyzeUserTweets(username, tweetData.tweets, {
          model,
          customPrompt,
          includeRawTweets
        });
        
        // Store analysis result
        userAnalyses[username] = analysis;
        
        // Write analysis to file
        const analysisFilePath = path.join(analysisDir, `${username}_analysis.json`);
        logger.info(`Writing analysis to file: ${analysisFilePath}`);
        await fs.writeFile(analysisFilePath, JSON.stringify(analysis, null, 2));
        
        // Add file reference
        fileReferences[username] = {
          path: `${taskId}-analysis/${username}_analysis.json`,
          generatedAt: analysis.analyzedAt,
          tweetCount: analysis.tweetCount,
          summaryPreview: analysis.summary.substring(0, 100) + (analysis.summary.length > 100 ? '...' : '')
        };
      } catch (error) {
        logger.error(`Error processing analysis for ${username}:`, error);
        userAnalyses[username] = {
          username,
          analyzedAt: new Date().toISOString(),
          error: `Analysis failed: ${error.message}`
        };
      }
    }
    
    // Generate overall summary
    logger.info('Generating overall summary');
    const summary = await generateOverallSummary(taskId, userAnalyses, {
      model,
      minTweetsRequired,
      customPrompt
    });
    
    // Write summary to file
    const summaryFilePath = path.join(analysisDir, 'summary.json');
    logger.info(`Writing summary to file: ${summaryFilePath}`);
    await fs.writeFile(summaryFilePath, JSON.stringify(summary, null, 2));
    
    // Update task with analysis references
    const analysisInfo = {
      lastAnalyzedAt: new Date().toISOString(),
      openAIModel: model,
      analysisParams: {
        minTweetsRequired,
        customPrompt
      },
      userAnalyses: fileReferences,
      overallSummary: {
        path: `${taskId}-analysis/summary.json`,
        generatedAt: summary.generatedAt,
        usersAnalyzed: Object.keys(userAnalyses).length,
        totalTweets: summary.statistics.totalTweets,
        topThemes: summary.commonThemes.slice(0, 5).map(t => t.theme)
      }
    };
    
    logger.info('Updating task with analysis references');
    await updateTaskWithAnalysisReferences(taskId, analysisInfo);
    
    // Update request status
    activeRequests.set(requestId, {
      ...activeRequests.get(requestId),
      status: 'completed',
      completedAt: new Date()
    });
    
    logger.info(`Request ${requestId} completed successfully`);
    
  } catch (error) {
    logger.error(`Error processing analysis request ${requestId}:`, error);
    
    // Update request status on error
    activeRequests.set(requestId, {
      ...activeRequests.get(requestId),
      status: 'failed',
      error: error.message
    });
    
    logger.info(`Request ${requestId} marked as failed`);
  }
}

export function getRequestStatus(requestId) {
  return activeRequests.get(requestId) || null;
} 