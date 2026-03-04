import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

// Unified Google Gen AI SDK initialization
const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || ""
});

export const generateQuiz = async (req: any, res: any) => {
    try {
        const { topic } = req.body;

        if (!topic) {
            return res.status(400).json({ error: "Topic is required" });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing from environment variables");
            return res.status(500).json({ error: "AI service configuration error (API Key missing)." });
        }

        const prompt = `Generate exactly 15 challenging academic multiple-choice questions for a university student on the topic: "${topic}". 
Follow the engineering exam style of Mumbai University.
Return ONLY a JSON array of objects with this structure:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correctAnswer": number (0-3),
  "explanation": "educational string"
}`;

        console.log(`Starting quiz generation for topic: ${topic}`);

        // Using the new @google/genai SDK syntax
        const result = await genAI.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json"
            }
        });

        console.log("AI Response received");

        let text = result.text || "";

        // Fallback checks for different SDK response shapes
        if (!text && result.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.log("Falling back to candidates access");
            text = result.candidates[0].content.parts[0].text;
        }

        if (!text) {
            console.log("Empty response structure:", JSON.stringify(result, null, 2));
            throw new Error("Empty response from AI - check API key and safety settings");
        }

        console.log("Raw text result prefix:", text.slice(0, 100));

        // Robust parsing
        let questions;
        try {
            questions = JSON.parse(text);
            console.log("JSON parsed successfully, count:", Array.isArray(questions) ? questions.length : "not an array");
        } catch (parseErr) {
            console.error("JSON Parse Error. Full Raw Text length:", text.length);
            // Fallback: try to extract JSON from markdown if AI failed to respect mimeType
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                console.log("Found JSON array via regex fallback");
                questions = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("Failed to parse AI response into JSON array");
            }
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("Invalid response format: an array was expected.");
        }

        // Add IDs and ensure we have enough questions
        const questionsWithIds = questions.map((q, idx) => ({
            ...q,
            id: idx + 1
        }));

        console.log("Sending response to client");
        res.json({ questions: questionsWithIds });
    } catch (err: any) {
        console.error("Quiz Generation Error Details:", err);
        let errorMessage = "AI service error. Please try again.";

        if (err.message) {
            errorMessage = err.message;
        }

        if (errorMessage.includes("API_KEY") || errorMessage.includes("API key")) {
            errorMessage = "AI Authentication failed. Please check backend API Key configuration.";
        }

        res.status(500).json({ error: errorMessage });
    }
};
