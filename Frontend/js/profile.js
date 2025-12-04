// Profile Management Script
const API_URL = 'http://localhost:3000/api/warga';

// Load Header and Footer Components
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
    }
}

// Check authentication
document.addEventListener('DOMContentLoaded', async () => {
    // Load components first
    await loadComponent('header-placeholder', '../components/header.html');
    await loadComponent('footer-placeholder', '../components/footer.html');

    // Setup navigation after components loaded
    setupProfileNavigation();

    // Check auth and load profile
    checkAuth();
    loadProfile();
    setupFormHandlers();
});

// Setup navigation for profile page
function setupProfileNavigation() {
    setTimeout(() => {
        const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === '#kontak') {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const footer = document.querySelector('footer') || document.getElementById('footer-placeholder');
                    if (footer) {
                        footer.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            } else {
                link.setAttribute('href', '../index.html' + href);
            }
        });

        // Fix header buttons
        const createReportBtn = document.getElementById('buatLaporanBtn');
        if (createReportBtn) {
            createReportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'submit.html';
            });
        }

        // Initialize user menu
        initializeUserMenuProfile();

        // Mobile menu toggle
        const hamburger = document.getElementById('hamburger');
        const navLinksContainer = document.querySelector('.nav-links');
        if (hamburger && navLinksContainer) {
            hamburger.addEventListener('click', () => {
                navLinksContainer.classList.toggle('active');
                hamburger.classList.toggle('active');
            });
        }
    }, 100);
}

// Initialize user menu for profile page
function initializeUserMenuProfile() {
    const token = localStorage.getItem('token');
    const userMenu = document.getElementById('userMenu');
    const logoutBtn = document.getElementById('logoutBtn');

    if (token && userMenu) {
        userMenu.style.display = 'block';

        const userName = localStorage.getItem('user_name');
        if (userName) {
            const userNameSpan = document.getElementById('userName');
            if (userNameSpan) {
                userNameSpan.textContent = userName;
            }
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Apakah Anda yakin ingin keluar?')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user_id');
                    localStorage.removeItem('user_name');
                    window.location.href = '../index.html';
                }
            });
        }
    }
}

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Silakan login terlebih dahulu', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return false;
    }
    return true;
}

// Load user profile data
async function loadProfile() {
    const token = localStorage.getItem('token');

    if (!token) return;

    try {
        showLoading(true);

        const response = await fetch(`${API_URL}/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success && result.data) {
            const user = result.data;

            // Update display name and email
            document.getElementById('displayName').textContent = user.user_warga || 'User';
            document.getElementById('displayEmail').textContent = user.email || '';

            // Fill form fields
            document.getElementById('user_warga').value = user.user_warga || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('alamat').value = user.alamat || '';
            document.getElementById('no_hp').value = user.no_hp || '';

            // Store user ID
            localStorage.setItem('user_id', user._id);
        } else {
            throw new Error(result.message || 'Gagal memuat profil');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Gagal memuat data profil: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Setup form handlers
function setupFormHandlers() {
    const form = document.getElementById('profileForm');

    if (form) {
        form.addEventListener('submit', handleProfileUpdate);
    }

    // Real-time validation
    document.getElementById('user_warga').addEventListener('input', validateName);
    document.getElementById('no_hp').addEventListener('input', validatePhone);
}

// Validate name
function validateName() {
    const nameInput = document.getElementById('user_warga');
    const errorElement = document.getElementById('nameError');
    const name = nameInput.value.trim();

    if (name.length < 3) {
        errorElement.textContent = 'Nama minimal 3 karakter';
        nameInput.style.borderColor = '#ff4757';
        return false;
    }

    errorElement.textContent = '';
    nameInput.style.borderColor = '#e0e0e0';
    return true;
}

// Validate phone number
function validatePhone() {
    const phoneInput = document.getElementById('no_hp');
    const errorElement = document.getElementById('phoneError');
    const phone = phoneInput.value.trim();

    if (phone && !phone.match(/^(08|62)\d{8,12}$/)) {
        errorElement.textContent = 'Format nomor tidak valid (contoh: 08xxxxxxxxxx)';
        phoneInput.style.borderColor = '#ff4757';
        return false;
    }

    errorElement.textContent = '';
    phoneInput.style.borderColor = '#e0e0e0';
    return true;
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();

    // Validate form
    const isNameValid = validateName();
    const isPhoneValid = validatePhone();

    if (!isNameValid || !isPhoneValid) {
        showNotification('Mohon perbaiki kesalahan pada form', 'error');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Sesi habis, silakan login kembali', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    // Get form data
    const formData = {
        user_warga: document.getElementById('user_warga').value.trim(),
        alamat: document.getElementById('alamat').value.trim(),
        no_hp: document.getElementById('no_hp').value.trim()
    };

    const form = document.getElementById('profileForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        // Show loading
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        submitBtn.disabled = true;
        form.classList.add('form-loading');

        const response = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Profil berhasil diperbarui!', 'success');

            // Update display name
            if (result.data) {
                document.getElementById('displayName').textContent = result.data.user_warga;
            }

            // Reload profile data
            setTimeout(() => {
                loadProfile();
            }, 1000);
        } else {
            throw new Error(result.message || 'Gagal memperbarui profil');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Gagal memperbarui profil: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        form.classList.remove('form-loading');
    }
}

// Show loading state
function showLoading(isLoading) {
    const form = document.getElementById('profileForm');
    if (isLoading) {
        form.classList.add('form-loading');
    } else {
        form.classList.remove('form-loading');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icon = type === 'success' ? 'fa-check-circle' :
        type === 'error' ? 'fa-exclamation-circle' :
            'fa-info-circle';

    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
