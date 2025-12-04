// Submit page - All functionality combined
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

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await loadComponent('header-placeholder', '../components/header.html');
    await loadComponent('footer-placeholder', '../components/footer.html');

    // Setup all features
    setupNavigation();
    setupCharCounter();
    setupFileUpload();
    setupFormSubmit();
    setupCancelButton();
});

// Setup navigation and header
function setupNavigation() {
    setTimeout(() => {
        const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            // Kontak tetap di halaman submit (scroll ke footer)
            if (href === '#kontak') {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const footer = document.querySelector('footer') || document.getElementById('footer-placeholder');
                    if (footer) {
                        footer.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            } else {
                // Link lain kembali ke index page
                link.setAttribute('href', '../index.html' + href);
            }
        });

        // Fix "Buat Laporan" button to reload current page
        const createReportBtn = document.getElementById('buatLaporanBtn');
        if (createReportBtn) {
            createReportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.reload();
            });
        }

        // Initialize user menu for submit page
        initializeUserMenu();

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

// Initialize user menu
function initializeUserMenu() {
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

// Character counter for description textarea
function setupCharCounter() {
    const textarea = document.getElementById('description');
    const counter = document.querySelector('.char-count');
    const maxLength = 1000;

    if (textarea && counter) {
        textarea.addEventListener('input', () => {
            const length = textarea.value.length;
            counter.textContent = `${length}/${maxLength}`;

            if (length > maxLength * 0.9) {
                counter.style.color = '#ff4757';
            } else {
                counter.style.color = '#999';
            }
        });
    }
}

// File upload functionality
function setupFileUpload() {
    const uploadArea = document.querySelector('.file-upload-area');
    const fileInput = document.getElementById('fileUpload');
    const previewContainer = document.querySelector('.file-preview');

    if (!uploadArea || !fileInput || !previewContainer) return;

    let uploadedFiles = [];

    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
        uploadArea.style.background = '#f8f9fa';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#e0e0e0';
        uploadArea.style.background = 'transparent';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#e0e0e0';
        uploadArea.style.background = 'transparent';

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });

    // Handle files
    function handleFiles(files) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];

        files.forEach(file => {
            if (file.size > maxSize) {
                showError(`File "${file.name}" terlalu besar. Maksimal 5MB.`);
                return;
            }

            if (!allowedTypes.includes(file.type)) {
                showError(`File "${file.name}" tidak didukung. Hanya PNG, JPG, atau PDF.`);
                return;
            }

            uploadedFiles.push(file);
            displayFile(file);
        });
    }

    // Display file preview
    function displayFile(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileIcon = file.type.includes('pdf') ? 'fa-file-pdf' : 'fa-file-image';
        const fileSize = formatFileSize(file.size);

        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas ${fileIcon}"></i>
                <div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${fileSize}</div>
                </div>
            </div>
            <button type="button" class="file-remove" onclick="removeFile(this, '${file.name}')">
                <i class="fas fa-times"></i>
            </button>
        `;

        previewContainer.appendChild(fileItem);
    }

    // Remove file
    window.removeFile = function (button, fileName) {
        uploadedFiles = uploadedFiles.filter(f => f.name !== fileName);
        button.closest('.file-item').remove();
    };

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Store files reference
    window.getUploadedFiles = function () {
        return uploadedFiles;
    };
}

// Form validation
function validateForm() {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const category = document.getElementById('category').value;

    if (!title) {
        showError('Judul laporan harus diisi');
        document.getElementById('title').focus();
        return false;
    }

    if (title.length < 10) {
        showError('Judul laporan minimal 10 karakter');
        document.getElementById('title').focus();
        return false;
    }

    if (!description) {
        showError('Deskripsi harus diisi');
        document.getElementById('description').focus();
        return false;
    }

    if (description.length < 20) {
        showError('Deskripsi minimal 20 karakter');
        document.getElementById('description').focus();
        return false;
    }

    if (!category) {
        showError('Kategori harus dipilih');
        document.getElementById('category').focus();
        return false;
    }

    return true;
}

// Form submission
function setupFormSubmit() {
    const form = document.getElementById('submissionForm');
    const submitBtn = form?.querySelector('button[type="submit"]');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Check login
        const wargaID = localStorage.getItem('user_id');
        if (!wargaID) {
            showError("Sesi habis. Silakan login kembali.");
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('warga_id', wargaID);
        formData.append('judul', document.getElementById('title').value.trim());
        formData.append('deskripsi', document.getElementById('description').value.trim());
        formData.append('kategori', document.getElementById('category').value);
        formData.append('lokasi', document.getElementById('location').value.trim());

        const files = window.getUploadedFiles();
        if (files && files.length > 0) {
            formData.append('upload_foto', files[0]);
        }

        // UI Loading
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
        submitBtn.disabled = true;
        form.classList.add('form-loading');

        try {
            const response = await fetch(`http://localhost:3000/api/laporan/buatlaporan`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showSuccess(`Laporan Terkirim! Tiket: ${result.nomor_laporan || 'OK'}`);

                setTimeout(() => {
                    form.reset();
                    const preview = document.querySelector('.file-preview');
                    if (preview) preview.innerHTML = '';
                    const counter = document.querySelector('.char-count');
                    if (counter) counter.textContent = '0/1000';
                    window.location.href = '../index.html';
                }, 2000);
            } else {
                throw new Error(result.message || "Gagal memproses di server.");
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            showError(`Gagal mengirim: ${error.message}`);
        } finally {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            form.classList.remove('form-loading');
        }
    });
}

// Cancel button
function setupCancelButton() {
    const cancelBtn = document.querySelector('.btn-secondary');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin membatalkan? Data yang telah diisi akan hilang.')) {
                window.history.back();
            }
        });
    }
}

// Show error message
function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                animation: slideIn 0.3s ease;
            }
            
            .notification.error {
                background: #ff4757;
                color: white;
            }
            
            .notification.success {
                background: #2ecc71;
                color: white;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Show success message
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
