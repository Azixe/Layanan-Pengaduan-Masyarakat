// Dashboard Reports Management

// Sample report data - Backend will replace with API calls
const reportsData = {
    '8214': {
        id: '8214',
        title: 'Perbaikan Jalan Rusak',
        description: 'Jalan di RT 05 rusak parah dan membahayakan pengendara. Terdapat beberapa lubang besar yang dapat menyebabkan kecelakaan. Perlu segera dilakukan perbaikan untuk keamanan warga.',
        category: 'Complaint',
        status: 'resolved',
        author: 'Ahmad Santoso',
        email: 'ahmad@email.com',
        location: 'Jl. Merdeka No. 10, RT 05',
        date: 'October 26, 2023',
        attachments: [
            { name: 'foto-jalan-rusak-1.jpg', size: '2.4 MB' },
            { name: 'foto-jalan-rusak-2.jpg', size: '1.8 MB' }
        ],
        history: [
            {
                action: 'Report Submitted',
                description: 'Report created by Ahmad Santoso',
                date: 'Oct 26, 2023 - 09:30 AM',
                icon: 'plus',
                status: ''
            },
            {
                action: 'Status Changed to In Progress',
                description: 'Assigned to Budi Santoso',
                date: 'Oct 27, 2023 - 02:15 PM',
                icon: 'hourglass-half',
                status: 'progress'
            },
            {
                action: 'Resolved',
                description: 'Jalan sudah diperbaiki. Material dan tenaga kerja dari dinas PU.',
                date: 'Nov 2, 2023 - 04:45 PM',
                icon: 'check',
                status: 'resolved'
            }
        ]
    },
    '8213': {
        id: '8213',
        title: 'Lampu Jalan Mati',
        description: 'Lampu jalan di Jl. Merdeka sudah mati 2 minggu, mengurangi keamanan warga di malam hari.',
        category: 'Complaint',
        status: 'in-progress',
        author: 'Siti Aminah',
        email: 'siti@email.com',
        location: 'Jl. Merdeka, RT 02',
        date: 'October 25, 2023',
        attachments: [
            { name: 'foto-lampu-mati.jpg', size: '1.2 MB' }
        ],
        history: [
            {
                action: 'Report Submitted',
                description: 'Report created by Siti Aminah',
                date: 'Oct 25, 2023 - 10:45 AM',
                icon: 'plus',
                status: ''
            },
            {
                action: 'Status Changed to In Progress',
                description: 'Assigned to Eko Prasetyo',
                date: 'Oct 26, 2023 - 03:30 PM',
                icon: 'hourglass-half',
                status: 'progress'
            }
        ]
    }
};

// Open Report Modal
function viewReport(reportId) {
    // Get report data (in production, fetch from API)
    // const reportData = await fetch(`/api/reports/${reportId}`).then(r => r.json());
    const reportData = reportsData[reportId] || reportsData['8214'];
    
    // Populate modal fields
    document.getElementById('reportId').textContent = `#${reportData.id}`;
    document.getElementById('reportTitle').textContent = reportData.title;
    document.getElementById('reportDescription').textContent = reportData.description;
    document.getElementById('reportCategory').textContent = reportData.category;
    document.getElementById('reportAuthor').textContent = reportData.author;
    document.getElementById('reportEmail').textContent = reportData.email;
    document.getElementById('reportLocation').textContent = reportData.location;
    document.getElementById('reportDate').textContent = reportData.date;
    
    // Set status badge
    const statusBadge = document.getElementById('reportStatus');
    let statusClass = 'badge-pending';
    let statusText = 'Pending';
    
    if (reportData.status === 'in-progress') {
        statusClass = 'badge-progress';
        statusText = 'In Progress';
    } else if (reportData.status === 'resolved') {
        statusClass = 'badge-resolved';
        statusText = 'Resolved';
    }
    
    statusBadge.className = `report-status badge ${statusClass}`;
    statusBadge.textContent = statusText;
    
    // Populate attachments
    const attachmentsList = document.getElementById('reportAttachments');
    attachmentsList.innerHTML = reportData.attachments.map(att => `
        <a href="#" class="attachment-item">
            <i class="fa-solid fa-file-image"></i>
            <span>${att.name}</span>
            <span class="attachment-size">${att.size}</span>
        </a>
    `).join('');
    
    // Populate history
    const historyContainer = document.querySelector('.history-timeline');
    historyContainer.innerHTML = reportData.history.map(item => `
        <div class="history-item">
            <div class="history-icon ${item.status ? 'status-' + item.status : ''}">
                <i class="fa-solid fa-${item.icon}"></i>
            </div>
            <div class="history-content">
                <strong>${item.action}</strong>
                <p>${item.description}</p>
                <span class="history-date">${item.date}</span>
            </div>
        </div>
    `).join('');
    
    // Store current report ID for updates
    document.getElementById('updateStatusForm').dataset.reportId = reportData.id;
    
    // Open modal
    document.getElementById('reportModal').classList.add('active');
}

// Close Report Modal
function closeReportModal() {
    const modal = document.getElementById('reportModal');
    modal.classList.remove('active');
    document.getElementById('updateStatusForm').reset();
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    const reportModal = document.getElementById('reportModal');
    if (e.target === reportModal) {
        closeReportModal();
    }
});

// Update Status Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const updateForm = document.getElementById('updateStatusForm');
    
    if (updateForm) {
        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const reportId = updateForm.dataset.reportId;
            const formData = {
                reportId: reportId,
                status: document.getElementById('updateStatus').value,
                assignee: document.getElementById('updateAssignee').value,
                notes: document.getElementById('updateNotes').value,
                notifyReporter: document.getElementById('notifyReporter').checked
            };
            
            // Validate
            if (!formData.status) {
                showNotification('Please select a status', 'error');
                return;
            }
            
            // Show loading
            const submitBtn = updateForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
            submitBtn.disabled = true;
            
            try {
                // TODO: Call API to update report status
                // await fetch(`/api/reports/${reportId}/status`, {
                //     method: 'PATCH',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(formData)
                // });
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Show success notification
                if (formData.notifyReporter) {
                    showNotification('Status updated and notification sent to reporter!', 'success');
                } else {
                    showNotification('Status updated successfully!', 'success');
                }
                
                // Update UI - in production, refresh data from API
                updateReportInTable(reportId, formData.status);
                
                // Close modal
                setTimeout(() => {
                    closeReportModal();
                }, 1000);
                
            } catch (error) {
                console.error('Error updating report:', error);
                showNotification('Failed to update status. Please try again.', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// Update report status in table
function updateReportInTable(reportId, newStatus) {
    const table = document.getElementById('submissionsTable');
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const idLink = row.querySelector('.id-link');
        if (idLink && idLink.textContent === `#${reportId}`) {
            const statusCell = row.querySelector('.badge');
            
            // Update badge
            statusCell.classList.remove('badge-pending', 'badge-progress', 'badge-resolved');
            
            if (newStatus === 'pending') {
                statusCell.classList.add('badge-pending');
                statusCell.textContent = 'Pending';
            } else if (newStatus === 'in-progress') {
                statusCell.classList.add('badge-progress');
                statusCell.textContent = 'In Progress';
            } else if (newStatus === 'resolved') {
                statusCell.classList.add('badge-resolved');
                statusCell.textContent = 'Resolved';
            }
        }
    });
}

// Delete Report
function deleteReport() {
    const reportId = document.getElementById('reportId').textContent;
    
    if (!confirm(`Are you sure you want to delete report ${reportId}? This action cannot be undone.`)) {
        return;
    }
    
    // Show loading
    const deleteBtn = document.querySelector('.btn-danger');
    const originalText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';
    deleteBtn.disabled = true;
    
    // TODO: Call API to delete report
    // fetch(`/api/reports/${reportId.replace('#', '')}`, { method: 'DELETE' })
    
    setTimeout(() => {
        showNotification(`Report ${reportId} deleted successfully`, 'success');
        closeReportModal();
        
        // Remove from table
        const table = document.getElementById('submissionsTable');
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const idLink = row.querySelector('.id-link');
            if (idLink && idLink.textContent === reportId) {
                row.remove();
            }
        });
    }, 1000);
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    
    let bgColor, icon;
    switch (type) {
        case 'success':
            bgColor = '#51cf66';
            icon = 'check-circle';
            break;
        case 'error':
            bgColor = '#ff4757';
            icon = 'exclamation-circle';
            break;
        case 'info':
            bgColor = '#4dabf7';
            icon = 'info-circle';
            break;
        default:
            bgColor = '#51cf66';
            icon = 'check-circle';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <i class="fa-solid fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Backend Integration Guide
/*
===========================================
API ENDPOINTS FOR BACKEND IMPLEMENTATION
===========================================

1. GET Report Details:
   GET /api/reports/:id
   Response: {
       id, title, description, category, status, author, 
       email, location, date, attachments, history
   }

2. UPDATE Report Status:
   PATCH /api/reports/:id/status
   Body: {
       status: 'pending' | 'in-progress' | 'resolved' | 'rejected',
       assignee: string (optional),
       notes: string (optional),
       notifyReporter: boolean
   }

3. DELETE Report:
   DELETE /api/reports/:id

4. SEND Notification:
   POST /api/notifications/send
   Body: {
       recipientEmail: string,
       type: 'status_update',
       reportId: string,
       message: string
   }

Usage Example:
--------------
async function viewReport(reportId) {
    const response = await fetch(`/api/reports/${reportId}`);
    const reportData = await response.json();
    // ... populate modal with data
}

async function updateStatus(reportId, formData) {
    const response = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });
    return response.json();
}
*/
