import express from 'express';
import { gradeSubmission } from '../controllers/assignmentController.ts';
import { protectRoute, authorizeRole } from '../middlewares/authMiddleware.ts';

const router = express.Router();

router.put('/:id/grade', protectRoute, authorizeRole('Faculty', 'Admin'), gradeSubmission);

export default router;
