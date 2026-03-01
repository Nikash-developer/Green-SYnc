import mongoose from 'mongoose';

const questionPaperSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    year: { type: String, required: true },
    semester: { type: String, required: true },
    examType: { type: String, required: true },
    fileUrl: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('QuestionPaper', questionPaperSchema);
