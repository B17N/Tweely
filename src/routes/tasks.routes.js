import express from 'express';
import { createTask } from '../controllers/taskController.js';

const router = express.Router();

/**
 * @route POST /api/tasks/create
 * @desc Generate a unique task ID and create a corresponding JSON file
 * @access Public (consider adding authentication middleware)
 */
router.post('/create', createTask);

export default router; 