import express from 'express';
import { getAssignments, createAssignment, updateAssignment, getSubmissions } from '../controllers/assignmentController.ts';
import { protectRoute, authorizeRole } from '../middlewares/authMiddleware.ts';

const router = express.Router();

router.route('/')
    .get(protectRoute, getAssignments)
    .post(protectRoute, authorizeRole('Faculty', 'Admin'), createAssignment);

router.route('/:id')
    .put(protectRoute, authorizeRole('Faculty', 'Admin'), updateAssignment);

router.get('/:id/submissions', protectRoute, authorizeRole('Faculty', 'Admin'), getSubmissions);

export default router;
