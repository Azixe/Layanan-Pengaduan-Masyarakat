// Load header and footer components
async function loadComponents() {
    try {
        // Get the repository name for GitHub Pages
        const pathParts = window.location.pathname.split('/');
        const repoName = pathParts[1]; // e.g., 'Layanan-Pengaduan-Masyarakat'
        
        // Check if we're on GitHub Pages or local
        const isGitHubPages = window.location.hostname.includes('github.io');
        
        let headerPath, footerPath;
        
        if (isGitHubPages) {
            // GitHub Pages: use absolute path from repo root
            headerPath = `/${repoName}/Frontend/components/header.html`;
            footerPath = `/${repoName}/Frontend/components/footer.html`;
        } else {
            // Local: use relative path
            const basePath = window.location.pathname.includes('/pages/') ? '..' : '.';
            headerPath = `${basePath}/components/header.html`;
            footerPath = `${basePath}/components/footer.html`;
        }
        
        const headerResponse = await fetch(headerPath);
        const footerResponse = await fetch(footerPath);
        
        if (headerResponse.ok) {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = await headerResponse.text();
            }
        }
        
        if (footerResponse.ok) {
            const footerPlaceholder = document.getElementById('footer-placeholder');
            if (footerPlaceholder) {
                footerPlaceholder.innerHTML = await footerResponse.text();
            }
        }
    } catch (error) {
        console.error('Error loading components:', error);
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
    const fileInput = document.getElementById('file-upload');
    const previewContainer = document.querySelector('.file-preview');
    
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
            // Validate file size
            if (file.size > maxSize) {
                showError(`File "${file.name}" terlalu besar. Maksimal 5MB.`);
                return;
            }
            
            // Validate file type
            if (!allowedTypes.includes(file.type)) {
                showError(`File "${file.name}" tidak didukung. Hanya PNG, JPG, atau PDF.`);
                return;
            }
            
            // Add to uploaded files
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
    window.removeFile = function(button, fileName) {
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
    
    // Store files reference for form submission
    window.getUploadedFiles = function() {
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
    const form = document.getElementById('submission-form');
    const submitBtn = document.querySelector('.btn-primary');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Get form data
        const formData = new FormData();
        formData.append('title', document.getElementById('title').value.trim());
        formData.append('description', document.getElementById('description').value.trim());
        formData.append('category', document.getElementById('category').value);
        formData.append('location', document.getElementById('location').value.trim());
        formData.append('contactName', document.getElementById('contact-name').value.trim());
        formData.append('contactEmail', document.getElementById('contact-email').value.trim());
        formData.append('contactPhone', document.getElementById('contact-phone').value.trim());
        
        // Add files
        const files = window.getUploadedFiles();
        files.forEach(file => {
            formData.append('files', file);
        });
        
        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        form.classList.add('form-loading');
        
        try {
            // TODO: Replace with actual API endpoint
            // const response = await fetch('/api/submissions', {
            //     method: 'POST',
            //     body: formData
            // });
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show success message
            showSuccess('Laporan berhasil dikirim! Tim kami akan segera meninjau laporan Anda.');
            
            // Reset form after 2 seconds
            setTimeout(() => {
                form.reset();
                document.querySelector('.file-preview').innerHTML = '';
                document.querySelector('.char-count').textContent = '0/1000';
                window.history.back();
            }, 2000);
            
        } catch (error) {
            console.error('Error submitting form:', error);
            showError('Terjadi kesalahan saat mengirim laporan. Silakan coba lagi.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            form.classList.remove('form-loading');
        }
    });
}

// Cancel button
function setupCancelButton() {
    const cancelBtn = document.querySelector('.btn-secondary');
    cancelBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin membatalkan? Data yang telah diisi akan hilang.')) {
            window.history.back();
        }
    });
}

// Show error message
function showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Add styles if not already present
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
    
    // Remove after 4 seconds
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

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadComponents();
    setupCharCounter();
    setupFileUpload();
    setupFormSubmit();
    setupCancelButton();
});
