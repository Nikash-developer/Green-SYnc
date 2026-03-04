import Message from '../models/Message';

export const sendMessage = async (req: any, res: any) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user._id;

        const message = await Message.create({
            senderId,
            receiverId,
            content
        });

        const io = req.app.get('io');
        if (io) {
            // Emit to both sender and receiver rooms
            io.to(receiverId.toString()).to(senderId.toString()).emit('new_private_message', message);
        }

        res.status(201).json(message);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getMessages = async (req: any, res: any) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: currentUserId, receiverId: userId },
                { senderId: userId, receiverId: currentUserId }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
