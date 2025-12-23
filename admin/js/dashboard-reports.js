// Dashboard Reports Management

// Sample report data - Backend will replace with API calls
const reportsData = {
    '8214': {
        id: '8214',
        title: 'Perbaikan Jalan Rusak',
        description: 'Jalan di RT 05 rusak parah dan membahayakan pengendara. Terdapat beberapa lubang besar yang dapat menyebabkan kecelakaan. Perlu segera dilakukan perbaikan untuk keamanan warga.',
        category: 'Keluhan',
        status: 'resolved',
        author: 'Ahmad Santoso',
        email: 'ahmad@email.com',
        location: 'Jl. Merdeka No. 10, RT 05',
        date: '26 Oktober 2023',
        attachments: [
            { name: 'foto-jalan-rusak-1.jpg', size: '2.4 MB' },
            { name: 'foto-jalan-rusak-2.jpg', size: '1.8 MB' }
        ]
    },
    '8213': {
        id: '8213',
        title: 'Lampu Jalan Mati',
        description: 'Lampu jalan di Jl. Merdeka sudah mati 2 minggu, mengurangi keamanan warga di malam hari.',
        category: 'Keluhan',
        status: 'in-progress',
        author: 'Siti Aminah',
        email: 'siti@email.com',
        location: 'Jl. Merdeka, RT 02',
        date: '25 Oktober 2023',
        attachments: [
            { name: 'foto-lampu-mati.jpg', size: '1.2 MB' }
        ]
    },
    '8212': {
        id: '8212',
        title: 'Ide Festival Desa',
        description: 'Usulan untuk mengadakan festival budaya desa yang melibatkan seluruh warga.',
        category: 'Saran',
        status: 'pending',
        author: 'Budi Hartono',
        email: 'budi@email.com',
        location: 'Desa Sukamaju',
        date: '25 Oktober 2023',
        attachments: []
    },
    '8211': {
        id: '8211',
        title: 'Masalah Keamanan Lingkungan',
        description: 'Peningkatan keamanan dengan ronda malam karena sering terjadi pencurian.',
        category: 'Keluhan',
        status: 'resolved',
        author: 'Rudi Setiawan',
        email: 'rudi@email.com',
        location: 'RT 03 RW 01',
        date: '24 Oktober 2023',
        attachments: []
    },
    '8210': {
        id: '8210',
        title: 'Sampah Tidak Diangkut',
        description: 'Sampah di TPS sudah menumpuk 3 hari dan menimbulkan bau tidak sedap.',
        category: 'Keluhan',
        status: 'pending',
        author: 'Dewi Lestari',
        email: 'dewi@email.com',
        location: 'TPS RT 05',
        date: '23 Oktober 2023',
        attachments: [
            { name: 'foto-sampah.jpg', size: '1.5 MB' }
        ]
    },
    '8209': {
        id: '8209',
        title: 'Program Pelatihan Pemuda',
        description: 'Usulan pelatihan kewirausahaan untuk pemuda desa agar mandiri.',
        category: 'Saran',
        status: 'resolved',
        author: 'Linda Wijaya',
        email: 'linda@email.com',
        location: 'Balai Desa',
        date: '22 Oktober 2023',
        attachments: []
    },
    '8208': {
        id: '8208',
        title: 'Pengadaan Air Bersih',
        description: 'Perlu penambahan fasilitas air bersih di RT 03 karena sumber air terbatas.',
        category: 'Keluhan',
        status: 'in-progress',
        author: 'Ahmad Yusuf',
        email: 'yusuf@email.com',
        location: 'RT 03',
        date: '21 Oktober 2023',
        attachments: []
    }
};

// Open Report Modal
function viewReport(reportId) {
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
    let statusText = 'Menunggu';
    
    if (reportData.status === 'in-progress') {
        statusClass = 'badge-progress';
        statusText = 'Sedang Diproses';
    } else if (reportData.status === 'resolved') {
        statusClass = 'badge-resolved';
        statusText = 'Selesai';
    }
    
    statusBadge.className = `report-status badge ${statusClass}`;
    statusBadge.textContent = statusText;
    
    // Populate attachments
    const attachmentsList = document.getElementById('reportAttachments');
    if (reportData.attachments.length > 0) {
        attachmentsList.innerHTML = reportData.attachments.map(att => `
            <a href="#" class="attachment-item">
                <i class="fa-solid fa-file-image"></i>
                <span>${att.name}</span>
                <span class="attachment-size">${att.size}</span>
            </a>
        `).join('');
    } else {
        attachmentsList.innerHTML = '<p style="color: #888; font-size: 0.9rem;">Tidak ada lampiran</p>';
    }
    
    // Open modal
    document.getElementById('reportModal').classList.add('active');
}

// Close Report Modal
function closeReportModal() {
    const modal = document.getElementById('reportModal');
    modal.classList.remove('active');
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    const reportModal = document.getElementById('reportModal');
    if (e.target === reportModal) {
        closeReportModal();
    }
});
