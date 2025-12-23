// Task Management System

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDragAndDrop();
    initTaskSearch();
    initAssignForm();
});

// Drag and Drop Functionality
function initDragAndDrop() {
    const draggables = document.querySelectorAll('.task-card');
    const taskLists = document.querySelectorAll('.task-list');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            
            // Get the new priority level based on column
            const columnId = draggable.closest('.task-list').id;
            const taskId = draggable.querySelector('.task-id').textContent;
            
            let newPriority;
            if (columnId === 'prioritasTinggi') newPriority = 'Tinggi';
            else if (columnId === 'prioritasSedang') newPriority = 'Sedang';
            else if (columnId === 'prioritasRendah') newPriority = 'Rendah';
            
            // TODO: Call API to update task priority
            // updateTaskPriority(taskId, newPriority);
            
            showNotification(`Laporan ${taskId} dipindahkan ke Prioritas ${newPriority}`, 'success');
            updateTaskCounts();
        });
    });

    taskLists.forEach(list => {
        list.addEventListener('dragover', e => {
            e.preventDefault();
            list.classList.add('drag-over');
            const afterElement = getDragAfterElement(list, e.clientY);
            const dragging = document.querySelector('.dragging');
            
            if (dragging) {
                if (afterElement == null) {
                    list.appendChild(dragging);
                } else {
                    list.insertBefore(dragging, afterElement);
                }
            }
        });

        list.addEventListener('dragenter', e => {
            e.preventDefault();
            list.classList.add('drag-over');
        });

        list.addEventListener('dragleave', e => {
            // Only remove if leaving the list entirely
            if (!list.contains(e.relatedTarget)) {
                list.classList.remove('drag-over');
            }
        });

        list.addEventListener('drop', e => {
            e.preventDefault();
            list.classList.remove('drag-over');
        });
    });

    // Remove drag-over class when drag ends
    document.addEventListener('dragend', () => {
        taskLists.forEach(list => list.classList.remove('drag-over'));
    });
}

// Update task counts after drag
function updateTaskCounts() {
    const tinggi = document.querySelectorAll('#prioritasTinggi .task-card').length;
    const sedang = document.querySelectorAll('#prioritasSedang .task-card').length;
    const rendah = document.querySelectorAll('#prioritasRendah .task-card').length;
    const total = tinggi + sedang + rendah;
    
    // Update column counts
    document.querySelector('#prioritasTinggi').closest('.task-column').querySelector('.task-count').textContent = tinggi;
    document.querySelector('#prioritasSedang').closest('.task-column').querySelector('.task-count').textContent = sedang;
    document.querySelector('#prioritasRendah').closest('.task-column').querySelector('.task-count').textContent = rendah;
    
    // Update stats cards
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 4) {
        statValues[0].textContent = total;
        statValues[1].textContent = tinggi;
        statValues[2].textContent = sedang;
        statValues[3].textContent = rendah;
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Task Search
function initTaskSearch() {
    const searchInput = document.getElementById('taskSearch');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const taskCards = document.querySelectorAll('.task-card');
        
        taskCards.forEach(card => {
            const title = card.querySelector('.task-title').textContent.toLowerCase();
            const description = card.querySelector('.task-description').textContent.toLowerCase();
            const id = card.querySelector('.task-id').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm) || id.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Modal Functions
function openAssignModal() {
    const modal = document.getElementById('assignModal');
    modal.classList.add('active');
}

function closeAssignModal() {
    const modal = document.getElementById('assignModal');
    modal.classList.remove('active');
    document.getElementById('assignTaskForm').reset();
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    const assignModal = document.getElementById('assignModal');
    const viewModal = document.getElementById('viewModal');
    const editModal = document.getElementById('editModal');
    
    if (e.target === assignModal) {
        closeAssignModal();
    }
    if (e.target === viewModal) {
        closeViewModal();
    }
    if (e.target === editModal) {
        closeEditModal();
    }
});

// View Modal Functions
function closeViewModal() {
    const modal = document.getElementById('viewModal');
    modal.classList.remove('active');
}

function openEditModalFromView() {
    const taskId = document.getElementById('viewTaskId').textContent.replace('#', '');
    closeViewModal();
    editTask(taskId);
}

// Edit Modal Functions
function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.classList.remove('active');
    document.getElementById('editTaskForm').reset();
}

// Assign Form Submission
function initAssignForm() {
    const assignForm = document.getElementById('assignTaskForm');
    const editForm = document.getElementById('editTaskForm');
    
    // Assign Form
    assignForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            reportId: document.getElementById('reportSelect').value,
            assignee: document.getElementById('assigneeSelect').value,
            priority: document.getElementById('prioritySelect').value,
            dueDate: document.getElementById('dueDate').value,
            notes: document.getElementById('taskNotes').value,
            sendNotification: document.getElementById('sendNotification').checked
        };
        
        // Validate
        if (!formData.reportId || !formData.assignee || !formData.priority) {
            showNotification('Harap isi semua field yang wajib diisi', 'error');
            return;
        }
        
        // Show loading
        const submitBtn = assignForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menugaskan...';
        submitBtn.disabled = true;
        
        try {
            // TODO: Call API to assign task
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Get assignee name
            const assigneeSelect = document.getElementById('assigneeSelect');
            const assigneeName = assigneeSelect.options[assigneeSelect.selectedIndex].text;
            
            // Show success notification
            if (formData.sendNotification) {
                showNotification(`Laporan ditugaskan ke ${assigneeName}. Notifikasi terkirim!`, 'success');
            } else {
                showNotification(`Laporan ditugaskan ke ${assigneeName}`, 'success');
            }
            
            closeAssignModal();
            
        } catch (error) {
            console.error('Error assigning task:', error);
            showNotification('Gagal menugaskan laporan. Silakan coba lagi.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // Edit Form
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            taskId: document.getElementById('editTaskId').value,
            title: document.getElementById('editTaskTitle').value,
            description: document.getElementById('editTaskDescription').value,
            assignee: document.getElementById('editAssigneeSelect').value,
            status: document.getElementById('editStatusSelect').value,
            priority: document.getElementById('editPrioritySelect').value,
            dueDate: document.getElementById('editDueDate').value,
            notes: document.getElementById('editTaskNotes').value,
            sendNotification: document.getElementById('editSendNotification').checked
        };
        
        // Show loading
        const submitBtn = editForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        submitBtn.disabled = true;
        
        try {
            // TODO: Call API to update task
            // await fetch(`/api/tasks/${formData.taskId}`, {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Update card in DOM based on new priority (move to correct column)
            updateTaskCardInDOM(formData);
            
            showNotification('Laporan berhasil diperbarui!', 'success');
            closeEditModal();
            
        } catch (error) {
            console.error('Error updating task:', error);
            showNotification('Gagal memperbarui laporan. Silakan coba lagi.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Update task card in DOM after edit
function updateTaskCardInDOM(formData) {
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
        const idEl = card.querySelector('.task-id');
        if (idEl && idEl.textContent === `#${formData.taskId}`) {
            // Update card content
            card.querySelector('.task-title').textContent = formData.title;
            card.querySelector('.task-description').textContent = formData.description;
            
            // Update status badge
            const statusEl = card.querySelector('.task-status');
            const statusLabels = { 'belum': 'Belum Dikerjakan', 'sedang': 'Sedang Dikerjakan', 'selesai': 'Selesai Dikerjakan' };
            const statusClasses = { 'belum': 'status-pending', 'sedang': 'status-progress', 'selesai': 'status-done' };
            statusEl.className = `task-status ${statusClasses[formData.status] || 'status-pending'}`;
            statusEl.textContent = statusLabels[formData.status] || 'Belum Dikerjakan';
            
            // Update assignee
            const assigneeEl = card.querySelector('.task-assignee span');
            const assigneeSelect = document.getElementById('editAssigneeSelect');
            if (assigneeEl && assigneeSelect) {
                assigneeEl.textContent = assigneeSelect.options[assigneeSelect.selectedIndex].text;
            }
            
            // Move to correct priority column if changed
            const priorityColumns = { 'tinggi': 'prioritasTinggi', 'sedang': 'prioritasSedang', 'rendah': 'prioritasRendah' };
            const targetColumnId = priorityColumns[formData.priority];
            const currentColumn = card.closest('.task-list');
            
            if (targetColumnId && currentColumn && currentColumn.id !== targetColumnId) {
                const targetColumn = document.getElementById(targetColumnId);
                if (targetColumn) {
                    targetColumn.appendChild(card);
                }
            }
        }
    });
}

// Task Actions
function viewTask(taskId) {
    // Sample data - replace with API call
    const taskData = {
        '8214': {
            id: '8214',
            title: 'Perbaikan Jalan Rusak',
            description: 'Jalan di RT 05 rusak parah dan membahayakan pengendara. Terdapat beberapa lubang besar yang dapat menyebabkan kecelakaan. Perlu segera dilakukan perbaikan untuk keamanan warga.',
            assignee: 'Budi Santoso',
            priority: 'tinggi', // Level prioritas: tinggi, sedang, rendah
            status: 'belum', // Status kerja: belum, sedang, selesai
            category: 'Keluhan',
            created: 'December 4, 2025',
            due: 'December 10, 2025',
            notes: 'Koordinasi dengan dinas PU untuk material perbaikan. Budget sudah disetujui.'
        },
        '8213': {
            id: '8213',
            title: 'Lampu Jalan Mati',
            description: 'Lampu jalan di Jl. Merdeka sudah mati 2 minggu',
            assignee: 'Eko Prasetyo',
            priority: 'tinggi',
            status: 'sedang',
            category: 'Keluhan',
            created: 'December 5, 2025',
            due: 'December 12, 2025',
            notes: 'Perlu koordinasi dengan PLN.'
        },
        '8212': {
            id: '8212',
            title: 'Ide Festival Desa',
            description: 'Usulan festival budaya untuk memperkenalkan produk lokal',
            assignee: 'Linda Wijaya',
            priority: 'sedang',
            status: 'belum',
            category: 'Saran',
            created: 'December 3, 2025',
            due: 'January 15, 2026',
            notes: 'Rencana dilaksanakan akhir Januari.'
        },
        '8211': {
            id: '8211',
            title: 'Masalah Keamanan Lingkungan',
            description: 'Peningkatan keamanan dengan ronda malam',
            assignee: 'Rudi Hartono',
            priority: 'tinggi',
            status: 'selesai',
            category: 'Keluhan',
            created: 'November 30, 2025',
            due: 'December 5, 2025',
            notes: 'Jadwal ronda sudah diatur.'
        },
        '8210': {
            id: '8210',
            title: 'Sampah Tidak Diangkut',
            description: 'Sampah di RT 03 tidak diangkut sudah 5 hari',
            assignee: 'Ahmad Yusuf',
            priority: 'sedang',
            status: 'sedang',
            category: 'Keluhan',
            created: 'December 1, 2025',
            due: 'December 8, 2025',
            notes: 'Koordinasi dengan dinas kebersihan.'
        }
    };
    
    const task = taskData[taskId] || taskData['8214'];
    
    // Populate modal
    document.getElementById('viewTaskId').textContent = `#${task.id}`;
    document.getElementById('viewTaskTitle').textContent = task.title;
    document.getElementById('viewTaskDescription').textContent = task.description;
    document.getElementById('viewTaskAssignee').textContent = task.assignee;
    document.getElementById('viewTaskCreated').textContent = task.created;
    document.getElementById('viewTaskDue').textContent = task.due;
    document.getElementById('viewTaskCategory').textContent = task.category;
    document.getElementById('viewTaskNotes').textContent = task.notes;
    
    // Set priority badge (level prioritas: tinggi, sedang, rendah)
    const priorityBadge = document.getElementById('viewTaskPriority');
    const priorityLabels = { 'tinggi': 'Prioritas Tinggi', 'sedang': 'Prioritas Sedang', 'rendah': 'Prioritas Rendah' };
    const priorityClasses = { 'tinggi': 'priority-high', 'sedang': 'priority-medium', 'rendah': 'priority-low' };
    priorityBadge.className = `detail-priority ${priorityClasses[task.priority] || 'priority-medium'}`;
    priorityBadge.textContent = priorityLabels[task.priority] || 'Prioritas Sedang';
    
    // Set status badge (status kerja: belum, sedang, selesai dikerjakan)
    const statusBadge = document.getElementById('viewTaskStatus');
    const statusLabels = { 'belum': 'Belum Dikerjakan', 'sedang': 'Sedang Dikerjakan', 'selesai': 'Selesai Dikerjakan' };
    const statusClasses = { 'belum': 'badge-pending', 'sedang': 'badge-progress', 'selesai': 'badge-resolved' };
    statusBadge.className = `detail-status badge ${statusClasses[task.status] || 'badge-pending'}`;
    statusBadge.textContent = statusLabels[task.status] || 'Belum Dikerjakan';
    
    // Open modal
    document.getElementById('viewModal').classList.add('active');
}

function editTask(taskId) {
    // Sample data - replace with API call
    const taskData = {
        '8214': { id: '8214', title: 'Perbaikan Jalan Rusak', description: 'Jalan di RT 05 rusak parah dan membahayakan pengendara', assignee: 'budi', priority: 'tinggi', status: 'belum', dueDate: '2025-12-10', notes: 'Koordinasi dengan dinas PU untuk material perbaikan.' },
        '8213': { id: '8213', title: 'Lampu Jalan Mati', description: 'Lampu jalan di Jl. Merdeka sudah mati 2 minggu', assignee: 'eko', priority: 'tinggi', status: 'sedang', dueDate: '2025-12-12', notes: 'Perlu koordinasi dengan PLN.' },
        '8212': { id: '8212', title: 'Ide Festival Desa', description: 'Usulan festival budaya untuk memperkenalkan produk lokal', assignee: 'linda', priority: 'sedang', status: 'belum', dueDate: '2026-01-15', notes: 'Rencana dilaksanakan akhir Januari.' },
        '8211': { id: '8211', title: 'Masalah Keamanan Lingkungan', description: 'Peningkatan keamanan dengan ronda malam', assignee: 'rudi', priority: 'tinggi', status: 'selesai', dueDate: '2025-12-05', notes: 'Jadwal ronda sudah diatur.' },
        '8210': { id: '8210', title: 'Sampah Tidak Diangkut', description: 'Sampah di RT 03 tidak diangkut sudah 5 hari', assignee: 'ahmad', priority: 'sedang', status: 'sedang', dueDate: '2025-12-08', notes: 'Koordinasi dengan dinas kebersihan.' }
    };
    
    const task = taskData[taskId] || { id: taskId, title: '', description: '', assignee: '', priority: 'sedang', status: 'belum', dueDate: '', notes: '' };
    
    // Populate form
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editAssigneeSelect').value = task.assignee;
    document.getElementById('editStatusSelect').value = task.status;
    document.getElementById('editPrioritySelect').value = task.priority;
    document.getElementById('editDueDate').value = task.dueDate;
    document.getElementById('editTaskNotes').value = task.notes;
    
    // Open modal
    document.getElementById('editModal').classList.add('active');
}

function deleteTask(taskId) {
    if (!confirm(`Apakah Anda yakin ingin menghapus laporan #${taskId}?`)) {
        return;
    }
    
    // TODO: Call API to delete task
    // fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    
    // Remove task card from DOM
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
        const idEl = card.querySelector('.task-id');
        if (idEl && idEl.textContent === `#${taskId}`) {
            card.remove();
            showNotification(`Laporan #${taskId} berhasil dihapus`, 'success');
        }
    });
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
    
    // Add animation styles if not present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
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

// API Integration Examples for Backend Developer
/*
// Fetch tasks by status
async function fetchTasks(status) {
    const response = await fetch(`/api/tasks?status=${status}`);
    const tasks = await response.json();
    return tasks;
}

// Update task status
async function updateTaskStatus(taskId, newStatus) {
    const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    return response.json();
}

// Assign task
async function assignTask(data) {
    const response = await fetch('/api/tasks/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}

// Send notification
async function sendNotification(userId, message) {
    const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message })
    });
    return response.json();
}
*/
