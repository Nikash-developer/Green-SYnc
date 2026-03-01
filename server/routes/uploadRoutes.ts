import express from 'express';
import { upload, uploadFile } from '../controllers/uploadController.ts';
import { protectRoute, authorizeRole } from '../middlewares/authMiddleware.ts';

const router = express.Router();

router.post('/', protectRoute, authorizeRole('Student'), upload.single('file'), uploadFile);

export default router;
