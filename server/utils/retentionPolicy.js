const db = require('../db');

/**
 * Deletes UX metrics and sessions older than 30 days to prevent database overload.
 */
async function cleanOldUXData() {
    try {
        // Delete records older than 30 days directly using SQL INTERVAL
        const queryMetrics = `DELETE FROM ux_metrics WHERE created_at < NOW() - INTERVAL 30 DAY`;
        const [metricsResult] = await db.query(queryMetrics);
        
        const querySessions = `DELETE FROM ux_sessions WHERE started_at < NOW() - INTERVAL 30 DAY`;
        const [sessionsResult] = await db.query(querySessions);
        
        // Log the cleanup result only if rows were deleted to avoid console spam
        if (metricsResult.affectedRows > 0 || sessionsResult.affectedRows > 0) {
            console.log(`[Data Retention] Cleaned up ${metricsResult.affectedRows} old UX metrics and ${sessionsResult.affectedRows} old UX sessions.`);
        }
    } catch (error) {
        console.error('[Data Retention] Failed to clean old UX data:', error);
    }
}

/**
 * Initializes the automated cleanup schedule.
 */
function initRetentionPolicy() {
    // Run once on startup
    cleanOldUXData();
    
    // Run periodically every 24 hours (24 hours * 60 mins * 60 secs * 1000 ms)
    setInterval(cleanOldUXData, 24 * 60 * 60 * 1000);
    console.log('[Data Retention] Automated UX data cleanup scheduled (runs every 24 hours).');
}

module.exports = { initRetentionPolicy };
