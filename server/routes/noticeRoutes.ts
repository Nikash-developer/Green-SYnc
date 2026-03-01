import express from 'express';
import { getNotices, createNotice, markRead } from '../controllers/noticeController.ts';
import { protectRoute, authorizeRole } from '../middlewares/authMiddleware.ts';

const router = express.Router();

router.route('/')
    .get(protectRoute, getNotices)
    .post(protectRoute, authorizeRole('Faculty', 'Admin'), createNotice);

router.post('/:id/read', protectRoute, markRead);

export default router;
