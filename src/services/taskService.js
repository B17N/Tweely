import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export async function createTask(taskData) {
  try {
    const taskId = uuidv4();
    const task = {
      id: taskId,
      ...taskData,
      createdAt: new Date().toISOString(),
      completed: false
    };

    const tasksDir = path.join(process.cwd(), 'data', 'tasks');
    
    // Ensure the directory exists
    await fs.mkdir(tasksDir, { recursive: true });
    
    // Write the task to a JSON file
    await fs.writeFile(
      path.join(tasksDir, `${taskId}.json`),
      JSON.stringify(task, null, 2)
    );

    return task;
  } catch (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
}

// Get a task by ID
export async function getTaskById(taskId) {
  try {
    const tasksDir = path.join(process.cwd(), 'data', 'tasks');
    const filePath = path.join(tasksDir, `${taskId}.json`);
    
    const fileData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    throw error;
  }
}

// Update task with Twitter data
export async function updateTaskWithTwitterData(taskId, twitterData) {
  try {
    const tasksDir = path.join(process.cwd(), 'data', 'tasks');
    const filePath = path.join(tasksDir, `${taskId}.json`);
    
    // Read existing task
    const taskDataStr = await fs.readFile(filePath, 'utf8');
    const taskData = JSON.parse(taskDataStr);
    
    // Update task with Twitter data
    const updatedTask = {
      ...taskData,
      twitterData: {
        ...taskData.twitterData,
        ...twitterData
      },
      updatedAt: new Date().toISOString()
    };
    
    // Write updated task back to file
    await fs.writeFile(filePath, JSON.stringify(updatedTask, null, 2));
    
    return updatedTask;
  } catch (error) {
    throw new Error(`Failed to update task with Twitter data: ${error.message}`);
  }
}

// Update task with tweet file references
export async function updateTaskWithTweetFileReferences(taskId, batchNumber, batchInfo, fileReferences, stats) {
  try {
    const tasksDir = path.join(process.cwd(), 'data', 'tasks');
    const filePath = path.join(tasksDir, `${taskId}.json`);
    
    // Read existing task
    const taskDataStr = await fs.readFile(filePath, 'utf8');
    const taskData = JSON.parse(taskDataStr);
    
    // Initialize tweetsData if it doesn't exist
    if (!taskData.tweetsData) {
      taskData.tweetsData = {
        fetchStartedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        params: {
          daysBack: batchInfo.apifyRequestParams.daysBack || 7,
          includeReplies: batchInfo.apifyRequestParams.includeReplies || true,
          includeRetweets: batchInfo.apifyRequestParams.includeRetweets || true
        },
        batchesProcessed: [],
        batches: {},
        tweetFiles: {},
        stats: {
          totalTweets: 0,
          tweetsPerUser: {},
          mostActive: []
        }
      };
    }
    
    // Update tweetsData with new batch info
    const tweetsData = {
      ...taskData.tweetsData,
      lastUpdatedAt: new Date().toISOString(),
      batchesProcessed: [
        ...new Set([...taskData.tweetsData.batchesProcessed || [], batchNumber])
      ].sort((a, b) => a - b),
      batches: {
        ...taskData.tweetsData.batches,
        [batchNumber]: batchInfo
      },
      tweetFiles: {
        ...taskData.tweetsData.tweetFiles,
        ...fileReferences
      },
      stats: {
        totalTweets: (taskData.tweetsData.stats?.totalTweets || 0) + stats.totalTweets,
        tweetsPerUser: {
          ...taskData.tweetsData.stats?.tweetsPerUser,
          ...stats.tweetsPerUser
        },
        mostActive: stats.mostActive
      }
    };
    
    // Update task with tweets data
    const updatedTask = {
      ...taskData,
      tweetsData,
      updatedAt: new Date().toISOString()
    };
    
    // Write updated task back to file
    await fs.writeFile(filePath, JSON.stringify(updatedTask, null, 2));
    
    return updatedTask;
  } catch (error) {
    throw new Error(`Failed to update task with tweet file references: ${error.message}`);
  }
}

// Update task with analysis references
export async function updateTaskWithAnalysisReferences(taskId, analysisInfo) {
  try {
    // Get current task data
    const task = await getTaskById(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    // Update task with analysis data
    const updatedTask = {
      ...task,
      updatedAt: new Date().toISOString(),
      analysisData: analysisInfo
    };
    
    // Write updated task back to file
    const tasksDir = path.join(process.cwd(), 'data', 'tasks');
    const filePath = path.join(tasksDir, `${taskId}.json`);
    
    await fs.writeFile(filePath, JSON.stringify(updatedTask, null, 2));
    
    return updatedTask;
  } catch (error) {
    console.error(`Error updating task ${taskId} with analysis references:`, error);
    throw error;
  }
} 