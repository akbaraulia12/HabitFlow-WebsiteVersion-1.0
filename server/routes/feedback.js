const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// SUBMIT FEEDBACK
router.post('/', auth, async (req, res) => {
    try {
        const { rating, comment, source, app_version } = req.body;
        
        await pool.query(
            'INSERT INTO user_experience (user_id, rating, comment, source, app_version) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, rating, comment, source, app_version]
        );
        
        res.json({ message: 'Feedback submitted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
