import { fetchFollowingUser, fetchTweets, getRequestStatus, analyzeTweets } from '../services/twitterService.js';
import { getTaskById } from '../services/taskService.js';
import logger from '../config/logger.js';

export async function fetchFollowingUserHandler(req, res) {
  const { taskId, twitterUsername } = req.body;
  
  // Validate input
  if (!taskId || !twitterUsername) {
    logger.error('Missing required parameters: taskId or twitterUsername');
    return res.status(400).json({ error: 'Both taskId and twitterUsername are required' });
  }
  
  try {
    // Check if task exists
    const task = await getTaskById(taskId);
    if (!task) {
      logger.error(`Task not found: ${taskId}`);
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Start async process
    const requestId = await fetchFollowingUser(taskId, twitterUsername);
    
    return res.status(202).json({
      status: 'processing',
      message: 'Twitter following fetch initiated',
      requestId,
      taskId,
      twitterUsername
    });
  } catch (error) {
    logger.error('Error processing Twitter following request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function fetchTweetsHandler(req, res) {
  const { taskId, batchNumber = 0, batchSize = 25, daysBack = 7, includeReplies = true, includeRetweets = true } = req.body;
  
  logger.info(`Starting tweet fetch for task ${taskId}, batch ${batchNumber}`);
  logger.info('Request parameters:', { batchSize, daysBack, includeReplies, includeRetweets });
  
  // Validate input
  if (!taskId) {
    logger.error('TaskId is required');
    return res.status(400).json({ error: 'TaskId is required' });
  }
  
  // Validate batch size doesn't exceed maximum
  if (batchSize > 25) {
    logger.error(`BatchSize ${batchSize} exceeds maximum of 25`);
    return res.status(400).json({ error: 'BatchSize cannot exceed 25 due to API limitations' });
  }
  
  try {
    // Check if task exists
    logger.info(`Fetching task data for ID: ${taskId}`);
    const task = await getTaskById(taskId);
    if (!task) {
      logger.error(`Task ${taskId} not found`);
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if task has Twitter following data
    if (!task.twitterData || !task.twitterData.following || !task.twitterData.following.length) {
      logger.error(`Task ${taskId} has no Twitter following data`);
      return res.status(400).json({ 
        error: 'Task does not have Twitter following data. Please fetch following users first.' 
      });
    }
    
    // Calculate batch information
    const totalUsers = task.twitterData.following.length;
    const totalBatches = Math.ceil(totalUsers / batchSize);
    
    logger.info(`Task has ${totalUsers} total users, split into ${totalBatches} batches`);
    
    // Validate batch number
    if (batchNumber >= totalBatches) {
      logger.error(`Invalid batch number ${batchNumber} for ${totalBatches} total batches`);
      return res.status(400).json({ 
        error: `Invalid batch number. There are ${totalBatches} batches available (0-${totalBatches - 1}).` 
      });
    }
    
    // Calculate user indices for this batch
    const startUserIndex = batchNumber * batchSize;
    const endUserIndex = Math.min(startUserIndex + batchSize, totalUsers) - 1;
    
    logger.info(`Processing batch ${batchNumber} for users ${startUserIndex}-${endUserIndex}`);
    
    // Get usernames for this batch
    const usernames = task.twitterData.following
      .slice(startUserIndex, endUserIndex + 1)
      .map(user => user.userName || user.username || user.screenName || (user.user ? user.user.username : null));
    
    logger.info(`Extracted ${usernames.length} usernames for batch`);
    logger.info('First 5 usernames:', usernames.slice(0, 5));
    
    // Start async process
    logger.info('Initiating tweet fetch process');
    const requestId = await fetchTweets(taskId, {
      batchNumber,
      batchSize,
      daysBack,
      includeReplies,
      includeRetweets,
      usernames,
      startUserIndex,
      endUserIndex
    });
    
    logger.info(`Tweet fetch process initiated with requestId: ${requestId}`);
    
    const currentTime = new Date();
    const estimatedCompletionTime = new Date(currentTime.getTime() + 3 * 60 * 1000); // Estimate 3 minutes
    
    return res.status(202).json({
      status: 'processing',
      message: `Tweet fetch initiated for batch ${batchNumber} (users ${startUserIndex}-${endUserIndex})`,
      requestId,
      taskId,
      batchInfo: {
        batchNumber,
        batchSize,
        totalUsers,
        totalBatches,
        startUserIndex,
        endUserIndex,
        usernames
      },
      requestedAt: currentTime.toISOString(),
      estimatedCompletionTime: estimatedCompletionTime.toISOString()
    });
  } catch (error) {
    logger.error('Error processing Twitter tweets request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function analyzeTweetsHandler(req, res) {
  const { 
    taskId, 
    model = 'gpt-3.5-turbo', 
    maxUsersToAnalyze = 10, 
    minTweetsRequired = 3, 
    customPrompt = null,
    includeRawTweets = false,
    specificUsernames = []
  } = req.body;
  
  logger.info(`Starting tweet analysis for task ${taskId}`);
  logger.info('Request parameters:', { model, maxUsersToAnalyze, minTweetsRequired, includeRawTweets });
  
  // Validate input
  if (!taskId) {
    logger.error('TaskId is required');
    return res.status(400).json({ error: 'TaskId is required' });
  }
  
  try {
    // Check if task exists
    logger.info(`Fetching task data for ID: ${taskId}`);
    const task = await getTaskById(taskId);
    if (!task) {
      logger.error(`Task ${taskId} not found`);
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if task has Twitter data
    if (!task.twitterData || !task.twitterData.following || !task.twitterData.following.length) {
      logger.error(`Task ${taskId} has no Twitter following data`);
      return res.status(400).json({ 
        error: 'Task does not have Twitter following data. Please fetch following users first.' 
      });
    }
    
    // Check if task has tweet data
    if (!task.tweetsData || !task.tweetsData.tweetFiles || Object.keys(task.tweetsData.tweetFiles).length === 0) {
      logger.error(`Task ${taskId} has no tweet data`);
      return res.status(400).json({ 
        error: 'Task does not have tweet data. Please fetch tweets first.' 
      });
    }
    
    // Determine which users have tweet data
    const availableUsernames = Object.keys(task.tweetsData.tweetFiles);
    logger.info(`Task has tweet data for ${availableUsernames.length} users`);
    
    // Validate specificUsernames if provided
    let usernamesToAnalyze = [];
    if (specificUsernames && specificUsernames.length > 0) {
      // Filter out usernames that don't have tweet data
      usernamesToAnalyze = specificUsernames.filter(username => {
        const exists = availableUsernames.includes(username);
        if (!exists) {
          logger.warn(`Requested username ${username} has no tweet data and will be skipped`);
        }
        return exists;
      });
      
      if (usernamesToAnalyze.length === 0) {
        logger.error('None of the specified usernames have tweet data');
        return res.status(400).json({ 
          error: 'None of the specified usernames have tweet data.' 
        });
      }
    } else {
      // Use all available usernames, limited by maxUsersToAnalyze
      usernamesToAnalyze = availableUsernames;
      if (maxUsersToAnalyze > 0 && usernamesToAnalyze.length > maxUsersToAnalyze) {
        usernamesToAnalyze = usernamesToAnalyze.slice(0, maxUsersToAnalyze);
      }
    }
    
    // Start async process
    logger.info('Initiating tweet analysis process');
    const requestId = await analyzeTweets(taskId, {
      model,
      maxUsersToAnalyze,
      minTweetsRequired,
      customPrompt,
      includeRawTweets,
      specificUsernames: usernamesToAnalyze
    });
    
    // Calculate estimated completion time (approx. 5 seconds per user)
    const now = new Date();
    const estimatedSecondsToComplete = usernamesToAnalyze.length * 5;
    const estimatedCompletionTime = new Date(now.getTime() + estimatedSecondsToComplete * 1000);
    
    // Return 202 Accepted with requestId and info
    return res.status(202).json({
      status: 'processing',
      message: 'Tweet analysis initiated for users from task',
      requestId,
      taskId,
      analysisInfo: {
        totalUsers: usernamesToAnalyze.length,
        usernames: usernamesToAnalyze.slice(0, 5).concat(usernamesToAnalyze.length > 5 ? ['...'] : []),
        estimatedCompletionTime: estimatedCompletionTime.toISOString(),
        modelUsed: model
      },
      requestedAt: now.toISOString()
    });
  } catch (error) {
    logger.error('Error initiating tweet analysis:', error);
    return res.status(500).json({ error: `Failed to initiate tweet analysis: ${error.message}` });
  }
} 