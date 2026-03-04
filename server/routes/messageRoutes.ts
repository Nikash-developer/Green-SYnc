import express from 'express';
import { sendMessage, getMessages } from '../controllers/messageController';
import { protectRoute } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/send', protectRoute, sendMessage);
router.get('/chat/:userId', protectRoute, getMessages);

export default router;
