
const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3000;

app.use(express.json());

const db = new Database("internships.db");

// Create database table
db.exec(`
    CREATE TABLE IF NOT EXISTS internships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        domain TEXT NOT NULL,
        duration TEXT NOT NULL
    )
`);

// Add sample data if table is empty
const count = db.prepare("SELECT COUNT(*) AS count FROM internships").get();

if (count.count === 0) {
    const insert = db.prepare(`
        INSERT INTO internships (title, company, domain, duration)
        VALUES (?, ?, ?, ?)
    `);

    insert.run("Frontend Developer", "Tech Solutions", "Web Development", "3 Months");
    insert.run("Python Developer", "Code Labs", "Python", "2 Months");
    insert.run("Java Developer", "Digital Works", "Java", "3 Months");
}

// GET all internships with pagination
app.get("/api/internships", (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const internships = db.prepare(`
        SELECT * FROM internships LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare(
        "SELECT COUNT(*) AS count FROM internships"
    ).get().count;

    res.json({
        page,
        limit,
        total,
        internships
    });
});

// GET internship by ID
app.get("/api/internships/:id", (req, res) => {
    const internship = db.prepare(
        "SELECT * FROM internships WHERE id = ?"
    ).get(req.params.id);

    if (!internship) {
        return res.status(404).json({ error: "Internship not found" });
    }

    res.json(internship);
});

// POST create internship
app.post("/api/internships", (req, res) => {
    const { title, company, domain, duration } = req.body;

    if (![title, company, domain, duration].every(
        value => typeof value === "string" && value.trim()
    )) {
        return res.status(400).json({
            error: "All fields are required"
        });
    }

    const result = db.prepare(`
        INSERT INTO internships (title, company, domain, duration)
        VALUES (?, ?, ?, ?)
    `).run(title.trim(), company.trim(), domain.trim(), duration.trim());

    res.status(201).json({
        message: "Internship created",
        id: result.lastInsertRowid
    });
});

// PUT update internship
app.put("/api/internships/:id", (req, res) => {
    const { title, company, domain, duration } = req.body;

    if (![title, company, domain, duration].every(
        value => typeof value === "string" && value.trim()
    )) {
        return res.status(400).json({
            error: "All fields are required"
        });
    }

    const result = db.prepare(`
        UPDATE internships
        SET title = ?, company = ?, domain = ?, duration = ?
        WHERE id = ?
    `).run(title.trim(), company.trim(), domain.trim(),
        duration.trim(), req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: "Internship not found" });
    }

    res.json({ message: "Internship updated" });
});

// DELETE internship
app.delete("/api/internships/:id", (req, res) => {
    const result = db.prepare(
        "DELETE FROM internships WHERE id = ?"
    ).run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: "Internship not found" });
    }

    res.json({ message: "Internship deleted" });
});

// Handle invalid routes
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
