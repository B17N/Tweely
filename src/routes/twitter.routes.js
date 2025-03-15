import express from 'express';
import { fetchFollowingUserHandler, fetchTweetsHandler, analyzeTweetsHandler } from '../controllers/twitterController.js';

const router = express.Router();

router.post('/fetchFollowingUser', fetchFollowingUserHandler);
router.post('/fetchTweets', fetchTweetsHandler);
router.post('/analyzeTweets', analyzeTweetsHandler);

export default router; 