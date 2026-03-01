import express from 'express';
import { login, signup, getMe } from '../controllers/authController.ts';
import { protectRoute } from '../middlewares/authMiddleware.ts';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protectRoute, getMe);

export default router;
