import multer from 'multer';
import Submission from '../models/Submission.ts';
import User from '../models/User.ts';
import { calculateImpact } from '../utils/ecoEngine.ts';

const storage = multer.memoryStorage();
export const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

export const uploadFile = async (req: any, res: any) => {
    try {
        const { assignment_id } = req.body;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        let pageCount = 1;
        if (file.mimetype === 'application/pdf') {
            // Mock page count for Hackathon demo speed and avoiding strict dependencies
            pageCount = Math.floor(Math.random() * 10) + 1;
        }

        const file_url = `/uploads/demo_${Date.now()}_${file.originalname}`;
        const eco_update = calculateImpact(pageCount);
        const plagiarism_score = Math.floor(Math.random() * 16);

        const submission = await Submission.create({
            student_id: req.user._id,
            assignment_id,
            file_url,
            page_count: pageCount,
            plagiarism_score,
            calculated_eco_impact: eco_update,
            status: "submitted"
        });

        await User.findByIdAndUpdate(req.user._id, {
            $inc: {
                'eco_stats.total_pages_saved': eco_update.pages,
                'eco_stats.total_water_saved': eco_update.water_saved,
                'eco_stats.total_co2_prevented': eco_update.co2_prevented
            }
        });

        // Delay to simulate processing 
        setTimeout(() => {
            res.json({ success: true, submission, eco_update, plagiarism_score });
        }, 1000);

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
