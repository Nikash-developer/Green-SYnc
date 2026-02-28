import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import db from "./db.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Auth
  app.post("/api/login", (req, res) => {
    try {
      const { email, password } = req.body;
      console.log(`Login attempt: ${email}`);
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

      if (user && user.password === password) { // In real app, use bcrypt.compare
        console.log(`Login success: ${email}`);
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      } else {
        console.log(`Login failed: ${email} (Invalid credentials)`);
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (err) {
      console.error(`Login error:`, err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Assignments
  app.get("/api/assignments", (req, res) => {
    const { department, faculty_id } = req.query;
    let query = 'SELECT * FROM assignments';
    const params = [];

    if (department) {
      query += ' WHERE department = ?';
      params.push(department);
    } else if (faculty_id) {
      query += ' WHERE faculty_id = ?';
      params.push(faculty_id);
    }

    const assignments = db.prepare(query).all(...params);
    res.json(assignments);
  });

  app.post("/api/assignments", (req, res) => {
    const { title, description, subject, deadline, max_marks, faculty_id, department } = req.body;
    const info = db.prepare(`
      INSERT INTO assignments (title, description, subject, deadline, max_marks, faculty_id, department)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, subject, deadline, max_marks, faculty_id, department);
    res.json({ id: info.lastInsertRowid });
  });

  // Submissions
  app.get("/api/submissions/:assignmentId", (req, res) => {
    const submissions = db.prepare(`
      SELECT s.*, u.name as student_name, u.avatar as student_avatar 
      FROM submissions s 
      JOIN users u ON s.student_id = u.id 
      WHERE s.assignment_id = ?
    `).all(req.params.assignmentId);
    res.json(submissions);
  });

  app.post("/api/submissions", (req, res) => {
    const { assignment_id, student_id, file_url } = req.body;
    const info = db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, file_url)
      VALUES (?, ?, ?)
    `).run(assignment_id, student_id, file_url);

    // Update impact stats
    const assignment = db.prepare('SELECT department FROM assignments WHERE id = ?').get(assignment_id) as any;
    if (assignment) {
      db.prepare(`
        INSERT INTO impact_stats (department, pages_saved) 
        VALUES (?, 10)
        ON CONFLICT(id) DO UPDATE SET pages_saved = pages_saved + 10
      `).run(assignment.department);
    }

    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/submissions/:id", (req, res) => {
    const { grade, feedback } = req.body;
    db.prepare('UPDATE submissions SET grade = ?, feedback = ? WHERE id = ?')
      .run(grade, feedback, req.params.id);
    res.json({ success: true });
  });

  // Notices
  app.get("/api/notices", (req, res) => {
    const notices = db.prepare('SELECT n.*, u.name as author_name FROM notices n JOIN users u ON n.author_id = u.id ORDER BY publish_date DESC').all();
    res.json(notices);
  });

  app.post("/api/notices", (req, res) => {
    const { title, content, target_department, is_emergency, author_id } = req.body;
    const info = db.prepare(`
      INSERT INTO notices (title, content, target_department, is_emergency, author_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(title, content, target_department, is_emergency ? 1 : 0, author_id);
    res.json({ id: info.lastInsertRowid });
  });

  // Impact Stats
  app.get("/api/impact/summary", (req, res) => {
    const totalPages = db.prepare('SELECT SUM(pages_saved) as total FROM impact_stats').get() as { total: number };
    const deptStats = db.prepare('SELECT department, SUM(pages_saved) as pages FROM impact_stats GROUP BY department').all();
    res.json({
      total_pages: totalPages.total || 0,
      department_stats: deptStats
    });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
