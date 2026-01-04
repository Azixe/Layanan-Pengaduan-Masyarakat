// Admin Panel - API Configuration
const API_BASE_URL = "http://localhost:3000/api";

// State Management
let allReportsData = [];
let currentPage = 1;
let totalPages = 1;
let currentFilters = {
  status: "",
  kategori: "",
  search: "",
};

const STATUS_META = {
  pending: {
    label: "Belum Dikerjakan",
    badge: "badge-pending",
    variants: ["belum dikerjakan", "pending", "belum diproses"],
  },
  inProgress: {
    label: "Sedang Dikerjakan",
    badge: "badge-progress",
    variants: ["sedang dikerjakan", "sedang diproses", "proses", "in progress"],
  },
  completed: {
    label: "Selesai",
    badge: "badge-resolved",
    variants: ["selesai", "selesai dikerjakan", "resolved", "done"],
  },
};

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  initSidebar();
  initSearch();
  initFilters();
  initClickHandlers();

  // Initialize charts (from charts.js)
  if (typeof initCharts === "function") {
    initCharts();
  }

  // Initialize date filters (from charts.js)
  if (typeof initDateFilters === "function") {
    initDateFilters();
  }

  // Load data from backend
  loadStatistics();
  loadReports();
  loadChartData();
  refreshNotificationBadge();
});

// Sidebar & Mobile Menu
function checkAuth() {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    window.location.href = "login.html";
  }
}

function initSidebar() {
  if (window.innerWidth <= 1024) createMobileMenu();

  window.addEventListener("resize", () => {
    const btn = document.querySelector(".mobile-menu-btn");
    if (window.innerWidth <= 1024 && !btn) {
      createMobileMenu();
    } else if (window.innerWidth > 1024 && btn) {
      btn.remove();
      document.getElementById("sidebar").classList.remove("active");
    }
  });
}

function createMobileMenu() {
  const topBar = document.querySelector(".top-bar");
  const sidebar = document.getElementById("sidebar");

  const btn = document.createElement("button");
  btn.className = "mobile-menu-btn";
  btn.innerHTML = '<i class="fa-solid fa-bars"></i>';

  topBar.insertBefore(btn, topBar.firstChild);

  btn.onclick = () => sidebar.classList.toggle("active");

  document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
      sidebar.classList.remove("active");
    }
  });
}

// Search
function initSearch() {
  const input = document.querySelector(".search-box input");
  input.addEventListener(
    "input",
    debounce((e) => {
      currentFilters.search = e.target.value.trim();
      currentPage = 1;
      loadReports();
    }, 500)
  );
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Load Statistics from Backend
async function loadStatistics() {
  try {
    const response = await fetch(`${API_BASE_URL}/laporan/statistics`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load statistics");

    const result = await response.json();
    const stats = result.data || {};
    const total = stats.total || 0;
    const byStatus = stats.byStatus || {};
    let belum = byStatus.pending || 0;
    const proses = byStatus.inProgress || 0;
    const selesai = byStatus.completed || 0;
    const knownTotal = belum + proses + selesai;
    if (knownTotal < total) {
      belum += total - knownTotal;
    }

    document.querySelector(
      ".stats-grid .stat-card:nth-child(1) .stat-value"
    ).textContent = total;
    document.querySelector(
      ".stats-grid .stat-card:nth-child(2) .stat-value"
    ).textContent = belum;
    document.querySelector(
      ".stats-grid .stat-card:nth-child(3) .stat-value"
    ).textContent = proses;
    document.querySelector(
      ".stats-grid .stat-card:nth-child(4) .stat-value"
    ).textContent = selesai;
  } catch (error) {
    console.error("Error loading statistics:", error);
  }
}

// Load Reports from Backend
async function loadReports() {
  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: 9,
      sortBy: "createdAt",
      order: "desc",
    });

    if (currentFilters.status) params.append("status", currentFilters.status);
    if (currentFilters.kategori)
      params.append("kategori", currentFilters.kategori);
    if (currentFilters.search) params.append("search", currentFilters.search);

    const response = await fetch(`${API_BASE_URL}/laporan/all?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load reports");

    const result = await response.json();
    allReportsData = result.data;

    renderReportsTable(result.data);
    renderPagination(result.pagination);
    updateTableInfo(result.pagination);
  } catch (error) {
    console.error("Error loading reports:", error);
    const tbody = document.getElementById("submissionsTable");
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">Gagal memuat data laporan</td></tr>';
    }
  }
}

// Render Reports Table
function renderReportsTable(reports) {
  const tbody = document.getElementById("submissionsTable");

  // Jika elemen tabel tidak ada (misalnya di halaman lain), hentikan tanpa error dan tanpa warning
  if (!tbody) {
    return;
  }

  if (!reports || reports.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center;">Tidak ada laporan</td></tr>';
    return;
  }

  tbody.innerHTML = reports
    .map((report) => {
      const statusKey = normalizeStatusKey(report.status_laporan);
      const statusClass = getStatusBadgeClass(statusKey);
      const statusText = getStatusLabelByKey(statusKey);
      const formattedDate = new Date(report.createdAt).toLocaleDateString(
        "id-ID",
        {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }
      );

      const aiKategori = report.kategori_ai || report.kategori;
      return `
        <tr>
            <td><a href="#" class="id-link" data-id="${report._id}">${report.nomor_laporan}</a></td>
            <td>${report.judul}</td>
            <td>${aiKategori}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td>${formattedDate}</td>
            <td><a href="#" class="action-link" onclick="viewReport('${report._id}'); return false;">View</a></td>
        </tr>
        `;
    })
    .join("");
}

function normalizeStatusKey(status) {
  const normalized = (status || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  const match = Object.entries(STATUS_META).find(([, meta]) =>
    meta.variants.includes(normalized)
  );
  return match ? match[0] : "pending";
}

function getStatusLabelByKey(statusKey) {
  return STATUS_META[statusKey]?.label || STATUS_META.pending.label;
}

function getStatusBadgeClass(status) {
  const key =
    status && STATUS_META[status] ? status : normalizeStatusKey(status);
  return STATUS_META[key]?.badge || STATUS_META.pending.badge;
}

window.normalizeStatusKey = normalizeStatusKey;
window.getStatusLabelByKey = getStatusLabelByKey;
window.getStatusBadgeClass = getStatusBadgeClass;

// Render Pagination
function renderPagination(pagination) {
  currentPage = pagination.page;
  totalPages = pagination.totalPages;

  const paginationDiv = document.querySelector(".pagination");
  if (!paginationDiv) {
    return;
  }
  let paginationHTML = "";

  // Previous button
  paginationHTML += `<button class="pagination-btn" ${
    currentPage === 1 ? "disabled" : ""
  } onclick="changePage(${currentPage - 1})">Previous</button>`;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      paginationHTML += `<button class="pagination-btn ${
        i === currentPage ? "active" : ""
      }" onclick="changePage(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      paginationHTML += `<button class="pagination-btn" disabled>...</button>`;
    }
  }

  // Next button
  paginationHTML += `<button class="pagination-btn" ${
    currentPage === totalPages ? "disabled" : ""
  } onclick="changePage(${currentPage + 1})">Next</button>`;

  paginationDiv.innerHTML = paginationHTML;
}

function changePage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  loadReports();
}

function updateTableInfo(pagination) {
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  const infoEl = document.querySelector(".table-info");
  if (!infoEl) {
    return;
  }
  infoEl.textContent = `Showing ${start} to ${end} of ${pagination.total} entries`;
}

function filterTable(term) {
  const rows = document.querySelectorAll("#submissionsTable tr");
  rows.forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(term)
      ? ""
      : "none";
  });
  updateTableInfo();
}

// Filters
function initFilters() {
  const [statusSelect, kategoriSelect] =
    document.querySelectorAll(".filter-select");

  // helper untuk apply filter lokal (status + kategori_ai)
  function applyLocalFilters() {
    const statusVal = statusSelect?.value || "";
    const kategoriVal = kategoriSelect?.value || "";

    let filtered = allReportsData;

    if (kategoriVal) {
      filtered = filtered.filter((report) => {
        const aiKategori = report.kategori_ai || report.kategori;
        return aiKategori === kategoriVal;
      });
    }

    if (statusVal) {
      filtered = filtered.filter((report) => {
        const statusKey = normalizeStatusKey(report.status_laporan);
        return statusKey === statusVal;
      });
    }

    // jika dua‑duanya kosong, tampilkan semua data di halaman sekarang
    if (!statusVal && !kategoriVal) {
      filtered = allReportsData;
    }

    renderReportsTable(filtered);
    const info = document.querySelector(".table-info");
    if (info) {
      info.textContent = `Showing 1 to ${filtered.length} of ${filtered.length} entries`;
    }
  }

  // Status filter
  if (statusSelect) {
    statusSelect.innerHTML = `
      <option value="">Semua Status</option>
      <option value="pending">Belum dikerjakan</option>
      <option value="inProgress">Sedang dikerjakan</option>
      <option value="completed">Selesai</option>
    `;

    statusSelect.addEventListener("change", applyLocalFilters);
  }

  // Kategori filter (berdasarkan kategori_ai di data yang sudah di-load)
  if (kategoriSelect) {
    kategoriSelect.innerHTML = `
      <option value="">Semua Kategori</option>
      <option value="Infrastruktur">Infrastruktur</option>
      <option value="Sosial">Sosial</option>
      <option value="Pelayanan">Pelayanan</option>
      <option value="Keamanan">Keamanan</option>
      <option value="Kesehatan">Kesehatan</option>
      <option value="Lingkungan">Lingkungan</option>
      <option value="Lainnya">Lainnya</option>
    `;

    kategoriSelect.addEventListener("change", applyLocalFilters);
  }
}

// Filter tabel berdasarkan kategori_ai (atau kategori jika kategori_ai kosong)
function filterByAICategory(kategoriAI) {
  // kalau kosong, tampilkan lagi semua data dari halaman sekarang
  if (!kategoriAI) {
    renderReportsTable(allReportsData);
    document.querySelector(
      ".table-info"
    ).textContent = `Showing 1 to ${allReportsData.length} of ${allReportsData.length} entries`;
    return;
  }

  const filtered = allReportsData.filter((report) => {
    const aiKategori = report.kategori_ai || report.kategori;
    return aiKategori === kategoriAI;
  });

  renderReportsTable(filtered);
  document.querySelector(
    ".table-info"
  ).textContent = `Showing 1 to ${filtered.length} of ${filtered.length} entries (kategori: ${kategoriAI})`;
}

function applyFilters() {
  const [statusFilter, kategoriFilter] = Array.from(
    document.querySelectorAll(".filter-select")
  ).map((s) => s.value);
  currentFilters.status = statusFilter;
  currentFilters.kategori = kategoriFilter;
  currentPage = 1;
  loadReports();
}

// Pagination
function initPagination() {
  document
    .querySelectorAll(".pagination-btn:not([disabled])")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        if (
          !btn.classList.contains("active") &&
          !btn.textContent.includes("...")
        ) {
          document
            .querySelectorAll(".pagination-btn")
            .forEach((b) => b.classList.remove("active"));
          if (!isNaN(btn.textContent)) btn.classList.add("active");
        }
      });
    });
}

// Click Handlers
function initClickHandlers() {
  // Notification
  const notifBtn = document.querySelector(".notification-btn");
  if (notifBtn) {
    notifBtn.addEventListener("click", (event) => {
      event.stopPropagation();

      // Muat data notifikasi jika fungsi tersedia (misalnya di task-management.js)
      if (typeof loadNotifications === "function") {
        loadNotifications();
      }

      const dropdown = document.getElementById("notificationDropdown");
      if (dropdown) {
        dropdown.classList.toggle("active");
      }
    });

    // Tutup dropdown jika klik di luar
    document.addEventListener("click", (e) => {
      const dropdown = document.getElementById("notificationDropdown");
      if (!dropdown) return;
      if (!dropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        dropdown.classList.remove("active");
      }
    });
  }

  // Navigation
  document.querySelectorAll(".nav-item").forEach((link) => {
    link.addEventListener("click", () => {
      document
        .querySelectorAll(".nav-item")
        .forEach((i) => i.classList.remove("active"));
      link.classList.add("active");
    });
  });

  // Table Actions - ID links - use event delegation
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("id-link")) {
      e.preventDefault();
      const reportId = e.target.getAttribute("data-id");
      viewReport(reportId);
    }
  });
}

// Load Chart Data
async function loadChartData() {
  try {
    const response = await fetch(`${API_BASE_URL}/laporan/all?limit=1000`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load chart data");

    const result = await response.json();

    // Call updateChartsWithData from charts.js
    if (typeof updateChartsWithData === "function") {
      updateChartsWithData(result.data);
    }
  } catch (error) {
    console.error("Error loading chart data:", error);
  }
}
// === Notifikasi Dashboard (lonceng di header) ===

async function refreshNotificationBadge() {
  const badge = document.querySelector(".notification-badge");
  if (!badge) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications/unread-count?recipientType=admin`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to load unread notifications");

    const result = await response.json();
    const count = result?.data?.count || 0;
    badge.textContent = count;
  } catch (error) {
    console.error("Error loading unread notifications:", error);
    badge.textContent = "0";
  }
}

async function loadNotifications() {
  const listEl = document.getElementById("notificationList");
  if (!listEl) {
    return;
  }

  listEl.innerHTML =
    '<div class="notification-empty">Memuat notifikasi...</div>';

  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications?recipientType=admin&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to load notifications");

    const result = await response.json();
    const notifications = Array.isArray(result.data) ? result.data : [];

    if (!notifications.length) {
      listEl.innerHTML =
        '<div class="notification-empty">Belum ada notifikasi</div>';
      return;
    }

    const itemsHTML = notifications
      .map((notif) => buildNotificationItemHTML(notif))
      .join("");
    listEl.innerHTML = itemsHTML;

    // pasang handler klik untuk setiap item
    listEl.querySelectorAll(".notification-item").forEach((itemEl) => {
      itemEl.addEventListener("click", async () => {
        const notifId = itemEl.dataset.id;
        const laporanId = itemEl.dataset.laporanId;

        // Di dashboard: jika fungsi viewReport tersedia, buka detail laporan
        if (laporanId && typeof viewReport === "function") {
          try {
            await viewReport(laporanId);
          } catch (e) {
            console.warn("Gagal membuka detail laporan dari notifikasi:", e);
          }
        }

        if (notifId) {
          try {
            await fetch(`${API_BASE_URL}/notifications/${notifId}/read`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
              },
            });
            await refreshNotificationBadge();
          } catch (e) {
            console.warn("Gagal menandai notifikasi sebagai dibaca:", e);
          }
        }

        const dropdown = document.getElementById("notificationDropdown");
        if (dropdown) {
          dropdown.classList.remove("active");
        }
      });
    });
  } catch (error) {
    console.error("Gagal memuat notifikasi:", error);
    listEl.innerHTML =
      '<div class="notification-empty">Gagal memuat notifikasi</div>';
  }
}

// Formatter tanggal sederhana untuk tampilan notifikasi di Dashboard
if (typeof formatDateTime !== "function") {
  function formatDateTime(date) {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

// Bangun HTML 1 item notifikasi pada dropdown Dashboard
function buildNotificationItemHTML(notification) {
  const isUnread = notification.isRead === false;
  const laporanId =
    notification.laporan ||
    (notification.metadata && notification.metadata.laporanId) ||
    "";
  const createdAt = notification.createdAt || notification.updatedAt;
  const timeText = formatDateTime(createdAt);

  const safeTitle = notification.title || "Notifikasi";
  const safeMessage = notification.message || "";

  return `
    <button type="button"
      class="notification-item ${isUnread ? "notification-item-unread" : ""}"
      data-id="${notification._id || ""}"
      data-laporan-id="${laporanId}">
      <div class="notification-item-title">${safeTitle}</div>
      <div class="notification-item-message">${safeMessage}</div>
      <div class="notification-item-meta">${timeText}</div>
    </button>
  `;
}

// Logout Function
function logout() {
  if (confirm("Apakah Anda yakin ingin keluar?")) {
    // Clear any stored session/token
    localStorage.removeItem("adminToken");
    sessionStorage.clear();

    // Redirect to login page
    window.location.href = "login.html";
  }
}
