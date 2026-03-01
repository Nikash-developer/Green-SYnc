import express from 'express';
import { upload, uploadPaper, getPapers } from '../controllers/questionPaperController.ts';

const router = express.Router();

router.get('/question-papers', getPapers);
router.post('/upload-paper', upload.single('file'), uploadPaper);

export default router;
