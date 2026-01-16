const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campuscaredb'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Routes

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role, erp, course, adminCode } = req.body;

        // Validate admin code
        if (role === 'admin' && adminCode !== 'ADMIN2025') {
            return res.status(400).json({ error: 'Invalid admin code' });
        }

        // Check if user exists
        const [existing] = await db.promise().query(
            'SELECT id FROM users WHERE email = ? AND role = ?',
            [email, role]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.promise().query(
            'INSERT INTO users (name, email, password, role, erp, course) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, erp || null, course || null]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const [users] = await db.promise().query(
            'SELECT * FROM users WHERE email = ? AND role = ?',
            [email, role]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                erp: user.erp,
                course: user.course
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.promise().query(
            'SELECT id, name, email, role, erp, course FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { name, email, erp, course, password } = req.body;
        let updateData = { name, email, erp, course };
        let query = 'UPDATE users SET name = ?, email = ?, erp = ?, course = ? WHERE id = ?';
        let params = [name, email, erp, course, req.user.id];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
            query = 'UPDATE users SET name = ?, email = ?, erp = ?, course = ?, password = ? WHERE id = ?';
            params = [name, email, erp, course, hashedPassword, req.user.id];
        }

        await db.promise().query(query, params);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Submit complaint/suggestion
app.post('/api/submissions', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { type, category, description, urgent } = req.body;
        const filePath = req.file ? req.file.path : null;

        const [result] = await db.promise().query(
            'INSERT INTO submissions (user_id, type, category, description, urgent, file_path, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, type, category, description, urgent === 'true', filePath, 'new']
        );

        res.status(201).json({ message: 'Submission created successfully', submissionId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create submission' });
    }
});

// Get user submissions
app.get('/api/submissions', authenticateToken, async (req, res) => {
    try {
        let query = 'SELECT * FROM submissions WHERE user_id = ?';
        let params = [req.user.id];

        if (req.query.filter && req.query.filter !== 'all') {
            if (req.query.filter === 'urgent') {
                query += ' AND urgent = 1';
            } else {
                query += ' AND status = ?';
                params.push(req.query.filter);
            }
        }

        query += ' ORDER BY created_at DESC';

        const [submissions] = await db.promise().query(query, params);
        res.json(submissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get submissions' });
    }
});

// Get all submissions (admin only)
app.get('/api/admin/submissions', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        let query = `
            SELECT s.*, u.name as user_name, u.email, u.erp, u.course
            FROM submissions s
            JOIN users u ON s.user_id = u.id
        `;
        let params = [];

        if (req.query.filter && req.query.filter !== 'all') {
            if (req.query.filter === 'urgent') {
                query += ' WHERE s.urgent = 1';
            } else {
                query += ' WHERE s.status = ?';
                params.push(req.query.filter);
            }
        }

        query += ' ORDER BY s.created_at DESC';

        const [submissions] = await db.promise().query(query, params);
        res.json(submissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get submissions' });
    }
});

// Update submission status (admin only)
app.put('/api/admin/submissions/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { status, response } = req.body;
        await db.promise().query(
            'UPDATE submissions SET status = ?, admin_response = ?, updated_at = NOW() WHERE id = ?',
            [status, response, req.params.id]
        );

        // Award points to admin
        if (status === 'resolved') {
            await db.promise().query(
                'UPDATE users SET admin_points = admin_points + 10 WHERE id = ?',
                [req.user.id]
            );
        }

        res.json({ message: 'Submission updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update submission' });
    }
});

// Rate admin response
app.post('/api/rate/:submissionId', authenticateToken, async (req, res) => {
    try {
        const { rating } = req.body;

        await db.promise().query(
            'UPDATE submissions SET rating = ? WHERE id = ? AND user_id = ?',
            [rating, req.params.submissionId, req.user.id]
        );

        res.json({ message: 'Rating submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit rating' });
    }
});

// Get admin stats
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const [stats] = await db.promise().query(`
            SELECT
                COUNT(*) as total_submissions,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_submissions,
                AVG(rating) as average_rating,
                SUM(CASE WHEN urgent = 1 THEN 1 ELSE 0 END) as urgent_submissions
            FROM submissions
        `);

        const [user] = await db.promise().query(
            'SELECT admin_points FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json({
            ...stats[0],
            admin_points: user[0].admin_points
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Password reset request
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const [users] = await db.promise().query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // In a real application, send email with reset token
        // For demo purposes, just return success
        res.json({ message: 'Password reset link sent to your email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});</content>
<parameter name="filePath">c:\Users\hp\OneDrive\Desktop\practice projects\My Sites\final project\server.js