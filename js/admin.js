// Check if user is admin before proceeding
document.addEventListener('DOMContentLoaded', () => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize initial fetch
    fetchAllStats();
    fetchUsers();
    fetchHabits();
    fetchFeedback();
});

// Admin specific logout (since frontend bypass was used)
function handleAdminLogout(e) {
    e.preventDefault();
    localStorage.removeItem('isAdmin');
    window.location.href = 'login.html';
}

function switchTab(tabId) {
    // Hide all contents and remove animation
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('animate-fade-in');
    });
    
    // Remove active styling from all nav items safely
    document.querySelectorAll('.admin-nav-item').forEach(el => {
        el.classList.remove('bg-[var(--primary)]', 'text-white', 'font-semibold', 'shadow-lg', 'shadow-primary/30');
        el.classList.add('text-[var(--text-muted)]', 'font-medium');
    });
    
    // Show selected content and restart animation
    const selectedContent = document.getElementById(`tab-${tabId}`);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
        // Force browser reflow to restart the fade-in animation
        void selectedContent.offsetWidth;
        selectedContent.classList.add('animate-fade-in');
    }
    
    // Add active styling to selected nav item safely
    const navBtn = document.getElementById(`nav-${tabId}`);
    if (navBtn) {
        navBtn.classList.remove('text-[var(--text-muted)]', 'font-medium');
        navBtn.classList.add('bg-[var(--primary)]', 'text-white', 'font-semibold', 'shadow-lg', 'shadow-primary/30');
    }
}

// ==========================================
// Data Fetching Functions
// ==========================================

async function fetchAllStats() {
    try {
        if (!window.apiClient) return;

        const { data, error } = await window.apiClient.get('/admin/stats');
        if (error) throw error;

        document.getElementById('stat-total-users').innerText = data.userCount || '0';
        document.getElementById('stat-total-habits').innerText = data.habitCount || '0';
        document.getElementById('stat-total-feedback').innerText = data.feedbackCount || '0';
        document.getElementById('stat-avg-rating').innerText = data.avgRating + ' / 5';

        // Add UX stats processing here
        if (data.sessions) {
            document.getElementById('stat-ux-total-sessions').innerText = data.sessions.total || '0';
            document.getElementById('stat-ux-avg-duration').innerText = data.sessions.avgDuration || '0';
        }
        
        if (data.metrics && data.metrics.length > 0) {
            const metricsContainer = document.getElementById('stat-ux-metrics-container');
            metricsContainer.innerHTML = data.metrics.map(m => `
                <div class="flex justify-between items-center border-b border-[var(--border-color)] pb-2 last:border-0">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">${m.metric_type.replace(/_/g, ' ')}</span>
                    <span class="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-md">${m.count}</span>
                </div>
            `).join('');
        } else {
            document.getElementById('stat-ux-metrics-container').innerHTML = '<div class="text-center text-[var(--text-muted)] text-sm py-2">No metrics recorded yet</div>';
        }

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

async function fetchUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-[var(--text-muted)]"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading users...</td></tr>`;

    try {
        const { data, error } = await window.apiClient.get('/admin/users');

        if (error) throw error;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-[var(--text-muted)]">No users found.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(user => `
            <tr class="hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-all group">
                <td class="p-5 font-mono text-xs text-gray-500 dark:text-gray-400 align-middle">
                    <span class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">${String(user.id).substring(0, 8)}...</span>
                </td>
                <td class="p-5 align-middle">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-300 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            ${user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <div class="font-bold text-[var(--text-main)]">${user.full_name || 'No Name'}</div>
                            <div class="text-xs text-[var(--text-muted)] font-medium">@${user.username || 'unknown'}</div>
                        </div>
                    </div>
                </td>
                <td class="p-5 text-[var(--text-muted)] align-middle">${user.email || 'N/A'}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error fetching users:', error);
        tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-red-500">Failed to load users.</td></tr>`;
    }
}

async function fetchHabits() {
    const tbody = document.getElementById('habits-table-body');
    tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-[var(--text-muted)]"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading habits...</td></tr>`;

    try {
        const { data, error } = await window.apiClient.get('/admin/habits');

        if (error) throw error;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-[var(--text-muted)]">No habits found.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(habit => {
            const dateStr = habit.created_at ? new Date(habit.created_at).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'}) : 'Unknown';
            return `
            <tr class="hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-all group">
                <td class="p-5 align-middle">
                    <div class="flex items-center gap-3">
                        <span class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg text-[var(--text-main)] shadow-sm">${habit.icon_html || '★'}</span>
                        <div>
                            <div class="font-bold text-[var(--text-main)]">${habit.name}</div>
                            <div class="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">${habit.evaluation || 'standard'}</div>
                        </div>
                    </div>
                </td>
                <td class="p-5 align-middle">
                    <span class="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 text-xs rounded-full font-bold capitalize shadow-sm">
                        ${habit.category || 'other'}
                    </span>
                </td>
                <td class="p-5 font-mono text-xs text-gray-500 dark:text-gray-400 align-middle">
                    <span class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">${String(habit.user_id).substring(0, 8)}...</span>
                </td>
                <td class="p-5 text-[var(--text-muted)] text-sm font-medium align-middle">${dateStr}</td>
            </tr>
        `}).join('');

    } catch (error) {
        console.error('Error fetching habits:', error);
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Failed to load habits.</td></tr>`;
    }
}

async function fetchFeedback() {
    const tbody = document.getElementById('feedback-table-body');
    tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-[var(--text-muted)]"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading feedback...</td></tr>`;

    try {
        const { data, error } = await window.apiClient.get('/admin/feedback');

        if (error) throw error;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-[var(--text-muted)]">No feedback found.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(fb => {
            const dateStr = fb.created_at ? new Date(fb.created_at).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'Unknown';
            const stars = Array(5).fill(0).map((_, i) => 
                `<i class="fa-solid fa-star ${i < fb.rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'} text-sm drop-shadow-sm"></i>`
            ).join('');
            
            return `
            <tr class="hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-all group">
                <td class="p-5 whitespace-nowrap align-top pt-6 flex gap-0.5">${stars}</td>
                <td class="p-5 align-top pt-6">
                    <div class="text-sm font-medium text-[var(--text-main)] italic relative pl-4 border-l-2 border-[var(--primary)]/50">
                        "${fb.comment || 'No comment provided'}"
                    </div>
                </td>
                <td class="p-5 align-top pt-6">
                    <span class="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] uppercase tracking-wider font-bold rounded-md">
                        ${fb.source || 'App'}
                    </span>
                </td>
                <td class="p-5 text-[var(--text-muted)] text-xs font-medium align-top pt-6">${dateStr}</td>
            </tr>
        `}).join('');

    } catch (error) {
        console.error('Error fetching feedback:', error);
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Failed to load feedback.</td></tr>`;
    }
}


