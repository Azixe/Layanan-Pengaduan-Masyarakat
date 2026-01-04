// Dashboard Reports Management - Backend Integration
// API_BASE_URL is defined in admin.js

// Open Report Modal - Fetch from Backend
async function viewReport(reportId) {
  try {
    const response = await fetch(`${API_BASE_URL}/laporan/${reportId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load report details");

    const result = await response.json();
    const report = result.data;

    // Populate modal fields
    document.getElementById("reportId").textContent = report.nomor_laporan;
    document.getElementById("reportTitle").textContent = report.judul;
    document.getElementById("reportDescription").textContent = report.deskripsi;
    document.getElementById("reportCategory").textContent = report.kategori;
    document.getElementById("reportAuthor").textContent =
      report.nama_warga || report.warga_id?.user_warga || "N/A";
    document.getElementById("reportEmail").textContent =
      report.warga_id?.email || "N/A";
    document.getElementById("reportLocation").textContent = report.lokasi;

    const formattedDate = new Date(report.createdAt).toLocaleDateString(
      "id-ID",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    document.getElementById("reportDate").textContent = formattedDate;

    const statusKey =
      typeof normalizeStatusKey === "function"
        ? normalizeStatusKey(report.status_laporan)
        : report.status_laporan;
    const statusBadge = document.getElementById("reportStatus");
    const statusClass =
      typeof getStatusBadgeClass === "function"
        ? getStatusBadgeClass(statusKey)
        : "badge-pending";
    const statusLabel =
      typeof getStatusLabelByKey === "function"
        ? getStatusLabelByKey(statusKey)
        : report.status_laporan;
    statusBadge.className = `report-status badge ${statusClass}`;
    statusBadge.textContent = statusLabel;

    // Populate attachments
    const attachmentsList = document.getElementById("reportAttachments");
    if (report.gambar) {
      attachmentsList.innerHTML = `
                <a href="${report.gambar}" target="_blank" class="attachment-item">
                    <i class="fa-solid fa-file-image"></i>
                    <span>Foto Laporan</span>
                    <span class="attachment-size">View</span>
                </a>
            `;
    } else {
      attachmentsList.innerHTML =
        '<p style="color: #888; font-size: 0.9rem;">Tidak ada lampiran</p>';
    }

    // Add AI Analysis section if available
    if (report.kategori_ai || report.sentimen_ai || report.keywords_ai) {
      addAIAnalysisSection(report);
    }

    // Open modal
    document.getElementById("reportModal").classList.add("active");
  } catch (error) {
    console.error("Error loading report:", error);
    alert("Gagal memuat detail laporan");
  }
}

function addAIAnalysisSection(report) {
  const modalBody = document.querySelector(
    ".modal-body .report-detail-section"
  );
  if (!modalBody) return;

  // Remove existing AI section if any
  const existingAI = document.getElementById("aiAnalysisSection");
  if (existingAI) existingAI.remove();

  const aiSection = document.createElement("div");
  aiSection.id = "aiAnalysisSection";
  aiSection.className = "report-description";
  aiSection.innerHTML = `
        <label><i class="fa-solid fa-brain"></i> Analisis AI</label>
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-top: 0.5rem;">
            ${
              report.kategori_ai
                ? `<p><strong>Kategori AI:</strong> ${report.kategori_ai}</p>`
                : ""
            }
            ${
              report.sentimen_ai
                ? `<p><strong>Sentimen:</strong> ${report.sentimen_ai}</p>`
                : ""
            }
            ${
              Array.isArray(report.keywords_ai) && report.keywords_ai.length > 0
                ? `
                <p><strong>Keywords:</strong> ${report.keywords_ai.join(
                  ", "
                )}</p>
            `
                : ""
            }
        </div>
    `;

  // Insert before attachments section
  const attachmentsSection = document.querySelector(".report-attachments");
  if (attachmentsSection) {
    modalBody.insertBefore(aiSection, attachmentsSection);
  } else {
    modalBody.appendChild(aiSection);
  }
}

// Close Report Modal
function closeReportModal() {
  const modal = document.getElementById("reportModal");
  modal.classList.remove("active");
}

// Close modal on outside click
window.addEventListener("click", (e) => {
  const reportModal = document.getElementById("reportModal");
  if (e.target === reportModal) {
    closeReportModal();
  }
});
