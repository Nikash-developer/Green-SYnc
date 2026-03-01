import express from 'express';
import { handleChatOptions } from '../controllers/chatbotController.ts';
import { protectRoute } from '../middlewares/authMiddleware.ts';

const router = express.Router();

router.post('/', protectRoute, handleChatOptions);

export default router;
