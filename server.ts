import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// MongoDB setup
import { connectDB } from './server/config/db.ts';
import { seedDB } from './server/seed.ts';

// Route imports
import authRoutes from './server/routes/authRoutes.ts';
import assignmentRoutes from './server/routes/assignmentRoutes.ts';
import submissionRoutes from './server/routes/submissionRoutes.ts';
import uploadRoutes from './server/routes/uploadRoutes.ts';
import noticeRoutes from './server/routes/noticeRoutes.ts';
import chatbotRoutes from './server/routes/chatbotRoutes.ts';
import questionPaperRoutes from './server/routes/questionPaperRoutes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

async function setupApp() {
  await connectDB();
  // Seed DB if not in production or for the first time
  if (process.env.NODE_ENV !== "production") {
    await seedDB();
  }

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  app.set('io', io);

  app.use(cors());
  app.use(express.json());

  io.on('connection', (socket) => {
    console.log('A user connected via Socket.io');
    socket.on('disconnect', () => {
      console.log('User disconnected from SIO');
    });
  });

  // --- API ROUTES ---
  app.use('/api/auth', authRoutes);
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/notices', noticeRoutes);
  app.use('/api/chatbot', chatbotRoutes);
  app.use('/api', questionPaperRoutes);
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // This part is only for local dev (Vite-mode) or when explicitly running as a standalone server
  if (process.env.VERCEL !== "1") {
    server.listen(PORT as number, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setupApp();

export default app;
