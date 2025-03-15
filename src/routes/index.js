import express from 'express';
import tasksRoutes from './tasks.routes.js';
import twitterRoutes from './twitter.routes.js';

const router = express.Router();

// Define routes
router.use('/tasks', tasksRoutes);
router.use('/twitter', twitterRoutes);

router.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

export default router;