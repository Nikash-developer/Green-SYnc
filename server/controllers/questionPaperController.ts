import multer from 'multer';
import path from 'path';
import fs from 'fs';
import QuestionPaper from '../models/QuestionPaper';

// Configure multer for local storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

export const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

export const uploadPaper = async (req: any, res: any) => {
    try {
        const { subject, year, semester, examType } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate the URL based on local storage path mapped in server.ts
        const fileUrl = `/uploads/${file.filename}`;

        const newPaper = await QuestionPaper.create({
            subject,
            year,
            semester,
            examType,
            fileUrl
        });

        res.status(201).json({
            id: newPaper._id,
            subject: newPaper.subject,
            year: newPaper.year,
            semester: newPaper.semester,
            type: newPaper.examType,
            url: newPaper.fileUrl
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPapers = async (req: any, res: any) => {
    try {
        const papers = await QuestionPaper.find().sort({ createdAt: -1 }).lean();

        // Map database fields back to frontend expected fields for seamless integration
        const formatted = papers.map(p => ({
            id: p._id,
            subject: p.subject,
            year: p.year,
            semester: p.semester,
            type: p.examType,
            url: p.fileUrl
        }));

        res.json(formatted);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
