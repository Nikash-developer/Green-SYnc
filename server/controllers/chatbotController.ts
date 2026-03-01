export const handleChatOptions = (req: any, res: any) => {
    const { message } = req.body;
    let response = "I don't understand. Could you please clarify?";

    if (message) {
        const msg = message.toLowerCase();
        if (msg.includes("biology")) {
            response = "The Biology syllabus covers cellular biology, genetics, and ecology.";
        } else if (msg.includes("deadline")) {
            response = "Your next assignment is due next Monday 11:59PM.";
        } else if (msg.includes("eco")) {
            response = "You have saved enough paper to prevent 4kg of CO2 today! Keep it up!";
        }
    }

    res.json({ response });
};
