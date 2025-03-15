import { createTask as createTaskService } from '../services/taskService.js';

export async function createTask(req, res) {
  try {
    const taskData = req.body;
    
    // Validate input data
    if (!taskData.title) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    
    // Call the service to handle business logic
    const task = await createTaskService(taskData);
    
    return res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
} 