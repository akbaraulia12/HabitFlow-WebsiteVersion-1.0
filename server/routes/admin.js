const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Only allow admin (we check header in auth middleware, or you can add role check here)

router.get('/stats', auth, async (req, res) => {
    try {
        const [userCountRows] = await pool.query('SELECT COUNT(*) as count FROM users');
        const [habitCountRows] = await pool.query('SELECT COUNT(*) as count FROM user_habits');
        const [feedbackRows] = await pool.query('SELECT rating FROM user_experience');
        
        const feedbackCount = feedbackRows.length;
        const avgRating = feedbackCount > 0 
            ? (feedbackRows.reduce((acc, curr) => acc + curr.rating, 0) / feedbackCount).toFixed(1)
            : '0.0';

        const [metricRows] = await pool.query('SELECT metric_type, COUNT(*) as count FROM ux_metrics GROUP BY metric_type');
        const [sessionRows] = await pool.query('SELECT COUNT(*) as total_sessions, AVG(total_duration) as avg_duration FROM ux_sessions');

        res.json({
            userCount: userCountRows[0].count,
            habitCount: habitCountRows[0].count,
            feedbackCount,
            avgRating,
            metrics: metricRows,
            sessions: {
                total: sessionRows[0].total_sessions || 0,
                avgDuration: sessionRows[0].avg_duration ? Math.round(sessionRows[0].avg_duration) : 0
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/users', auth, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/habits', auth, async (req, res) => {
    try {
        const [habits] = await pool.query('SELECT * FROM user_habits ORDER BY created_at DESC');
        res.json(habits);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/feedback', auth, async (req, res) => {
    try {
        const [feedback] = await pool.query('SELECT * FROM user_experience ORDER BY created_at DESC');
        res.json(feedback);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.delete('/:table/:id', auth, async (req, res) => {
    try {
        const { table, id } = req.params;
        const allowedTables = ['users', 'user_habits', 'user_experience'];
        
        if (!allowedTables.includes(table)) {
            return res.status(400).json({ error: 'Invalid table' });
        }
        
        // Parameterized queries don't work for table names, so we interpolate after validation
        await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
        res.json({ message: 'Record deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
