import express from 'express';
import { gradeSubmission } from '../controllers/assignmentController.ts';
import { protectRoute, authorizeRole } from '../middlewares/authMiddleware.ts';

const router = express.Router();

router.put('/:id/grade', protectRoute, authorizeRole('faculty', 'admin'), gradeSubmission);

export default router;
