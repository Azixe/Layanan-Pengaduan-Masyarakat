// Admin Panel
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initSearch();
    initFilters();
    initPagination();
    initClickHandlers();
});

// Sidebar & Mobile Menu
function initSidebar() {
    if (window.innerWidth <= 1024) createMobileMenu();
    
    window.addEventListener('resize', () => {
        const btn = document.querySelector('.mobile-menu-btn');
        if (window.innerWidth <= 1024 && !btn) {
            createMobileMenu();
        } else if (window.innerWidth > 1024 && btn) {
            btn.remove();
            document.getElementById('sidebar').classList.remove('active');
        }
    });
}

function createMobileMenu() {
    const topBar = document.querySelector('.top-bar');
    const sidebar = document.getElementById('sidebar');
    
    const btn = document.createElement('button');
    btn.className = 'mobile-menu-btn';
    btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    
    topBar.insertBefore(btn, topBar.firstChild);
    
    btn.onclick = () => sidebar.classList.toggle('active');
    
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

// Search
function initSearch() {
    const input = document.querySelector('.search-box input');
    input.addEventListener('input', (e) => filterTable(e.target.value.toLowerCase()));
}

function filterTable(term) {
    const rows = document.querySelectorAll('#submissionsTable tr');
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
    updateTableInfo();
}

// Filters
function initFilters() {
    document.querySelectorAll('.filter-select').forEach(select => {
        select.addEventListener('change', applyFilters);
    });
}

function applyFilters() {
    const [statusFilter, typeFilter] = Array.from(document.querySelectorAll('.filter-select')).map(s => s.value);
    const rows = document.querySelectorAll('#submissionsTable tr');
    
    rows.forEach(row => {
        const status = row.cells[3]?.textContent.trim();
        const type = row.cells[2]?.textContent.trim();
        const show = (statusFilter === 'All Status' || status?.includes(statusFilter)) &&
                     (typeFilter === 'All Types' || type === typeFilter);
        row.style.display = show ? '' : 'none';
    });
    
    updateTableInfo();
}

function updateTableInfo() {
    const rows = document.querySelectorAll('#submissionsTable tr');
    const visible = Array.from(rows).filter(r => r.style.display !== 'none').length;
    document.querySelector('.table-info').textContent = `Showing 1 to ${visible} of ${rows.length} entries`;
}

// Pagination
function initPagination() {
    document.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.classList.contains('active') && !btn.textContent.includes('...')) {
                document.querySelectorAll('.pagination-btn').forEach(b => b.classList.remove('active'));
                if (!isNaN(btn.textContent)) btn.classList.add('active');
            }
        });
    });
}

// Click Handlers
function initClickHandlers() {
    // Notification
    document.querySelector('.notification-btn')?.addEventListener('click', () => {
        alert('You have 3 new notifications');
    });
    
    // Add New
    document.querySelector('.top-bar-actions .btn-primary')?.addEventListener('click', () => {
        alert('New submission form will open here');
    });
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            link.classList.add('active');
        });
    });
    
    // Table Actions
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('action-link')) {
            e.preventDefault();
            const id = e.target.closest('tr').cells[0].textContent;
            alert(`Viewing details for ${id}`);
        }
        if (e.target.classList.contains('id-link')) {
            e.preventDefault();
            alert(`Opening submission ${e.target.textContent}`);
        }
    });
}

console.log('Admin Panel loaded');
