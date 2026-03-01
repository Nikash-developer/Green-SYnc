import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    urgency_level: { type: String, enum: ['Normal', 'Emergency'], default: 'Normal' },
    target_audience: { type: String },
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    read_receipts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    engagement_rate: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Notice', noticeSchema);
