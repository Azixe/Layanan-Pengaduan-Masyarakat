// Reports Page - Public Transparency
const API_URL = "http://localhost:3000/api/laporan";

// State management
const state = {
  currentPage: 1,
  filters: {
    search: "",
    kategori: "",
    status: "",
    sortBy: "createdAt",
    order: "desc",
  },
  pendingSearch: "",
  searchTimeout: null,
};

// Status mapping
const STATUS_MAP = {
  pending: "Belum dikerjakan",
  "in progress": "Sedang dikerjakan",
  completed: "Selesai",
};

// DOM Elements
const domElements = {
  searchInput: null,
  filterKategori: null,
  filterStatus: null,
  filterSort: null,
  btnApplyFilter: null,
  btnResetFilter: null,
  reportsList: null,
  paginationContainer: null,
};

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

async function initializeApp() {
  try {
    await loadComponents();
    initializeDOMReferences();
    setupEventListeners();
    await loadStatistics();
    await loadReports();
  } catch (error) {
    console.error("Error initializing app:", error);
    showErrorState("Gagal memuat aplikasi");
  }
}

// Load header and footer components
async function loadComponents() {
  try {
    const [headerResponse, footerResponse] = await Promise.all([
      fetch("../components/header.html"),
      fetch("../components/footer.html"),
    ]);

    if (!headerResponse.ok || !footerResponse.ok) {
      throw new Error("Failed to load components");
    }

    const [headerHtml, footerHtml] = await Promise.all([
      headerResponse.text(),
      footerResponse.text(),
    ]);

    document.getElementById("header-placeholder").innerHTML = headerHtml;
    document.getElementById("footer-placeholder").innerHTML = footerHtml;

    setupHeaderNavigation();
  } catch (error) {
    console.error("Error loading components:", error);
    // Fallback: Show minimal navigation
    document.getElementById("header-placeholder").innerHTML = `
      <header>Layanan Pengaduan</header>
    `;
  }
}

// Initialize DOM element references
function initializeDOMReferences() {
  domElements.searchInput = document.getElementById("searchInput");
  domElements.filterKategori = document.getElementById("filterKategori");
  domElements.filterStatus = document.getElementById("filterStatus");
  domElements.filterSort = document.getElementById("filterSort");
  domElements.btnApplyFilter = document.getElementById("btnApplyFilter");
  domElements.btnResetFilter = document.getElementById("btnResetFilter");
  domElements.reportsList = document.getElementById("reportsList");
  domElements.paginationContainer = document.getElementById(
    "paginationContainer"
  );
}

// Setup header navigation for reports page
function setupHeaderNavigation() {
  // Delay to ensure DOM is ready
  setTimeout(() => {
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (["#beranda", "#cara-kerja", "#fitur", "#kontak"].includes(href)) {
        link.setAttribute("href", `../index.html${href}`);
      }
    });

    // Mark reports link as active
    const reportsLink = document.querySelector(
      '.nav-links a[href*="reports.html"]'
    );
    if (reportsLink) {
      reportsLink.setAttribute("href", "reports.html");
      reportsLink.classList.add("active");
    }

    // Setup "Buat Laporan" button
    const buatLaporanBtn = document.getElementById("buatLaporanBtn");
    if (buatLaporanBtn) {
      buatLaporanBtn.addEventListener("click", handleBuatLaporanClick);
    }

    initializeUserMenu();
    setupMobileMenu();
  }, 100);
}

function handleBuatLaporanClick(e) {
  e.preventDefault();
  const token = localStorage.getItem("token");
  window.location.href = token ? "submit.html" : "login.html";
}

// Initialize user menu (profile dropdown and logout)
function initializeUserMenu() {
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("user_name");
  const userMenu = document.getElementById("userMenu");

  if (!token || !userName || !userMenu) return;

  userMenu.style.display = "flex";
  const userNameSpan = document.getElementById("userName");
  if (userNameSpan) {
    userNameSpan.textContent = userName;
  }

  setupDropdown();
  setupProfileNavigation();
  setupLogout();
}

function setupDropdown() {
  const profileBtn = document.getElementById("profileBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");

  if (!profileBtn || !dropdownMenu) return;

  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    const userMenu = document.getElementById("userMenu");
    if (userMenu && !userMenu.contains(e.target)) {
      dropdownMenu.classList.remove("show");
    }
  });
}

function setupProfileNavigation() {
  const profileLink = document.getElementById("profileLink");
  if (profileLink) {
    profileLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "profile.html";
    });
  }
}

function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Apakah Anda yakin ingin keluar?")) {
        clearUserSession();
        window.location.href = "../index.html";
      }
    });
  }
}

function clearUserSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_id");
}

function setupMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  const navLinksContainer = document.querySelector(".nav-links");

  if (hamburger && navLinksContainer) {
    hamburger.addEventListener("click", () => {
      navLinksContainer.classList.toggle("active");
      hamburger.classList.toggle("active");
    });
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search input with debounce
  domElements.searchInput.addEventListener("input", handleSearchInput);

  // Apply filters button
  domElements.btnApplyFilter.addEventListener("click", applyFilters);

  // Reset filters button
  domElements.btnResetFilter.addEventListener("click", resetFilters);

  // Set up delegated event listener for report cards
  setupDelegatedEventListeners();
}

function handleSearchInput(e) {
  clearTimeout(state.searchTimeout);
  state.searchTimeout = setTimeout(() => {
    state.pendingSearch = e.target.value.trim();
  }, 300);
}

function applyFilters() {
  state.filters.search =
    state.pendingSearch || domElements.searchInput.value.trim();
  state.filters.kategori = domElements.filterKategori.value;
  state.filters.status = domElements.filterStatus.value;

  const [sortBy, order] = domElements.filterSort.value.split("-");
  state.filters.sortBy = sortBy;
  state.filters.order = order;

  state.currentPage = 1;
  loadReports();
}

function resetFilters() {
  domElements.searchInput.value = "";
  domElements.filterKategori.value = "";
  domElements.filterStatus.value = "";
  domElements.filterSort.value = "createdAt-desc";

  state.pendingSearch = "";
  state.filters = {
    search: "",
    kategori: "",
    status: "",
    sortBy: "createdAt",
    order: "desc",
  };

  state.currentPage = 1;
  loadReports();
}

function setupDelegatedEventListeners() {
  // Report card clicks
  if (domElements.reportsList && !domElements.reportsList._delegationSet) {
    domElements.reportsList.addEventListener("click", handleReportCardClick);
    domElements.reportsList._delegationSet = true;
  }

  // Pagination clicks
  if (
    domElements.paginationContainer &&
    !domElements.paginationContainer._paginationHandlerSet
  ) {
    domElements.paginationContainer.addEventListener(
      "click",
      handlePaginationClick
    );
    domElements.paginationContainer._paginationHandlerSet = true;
  }
}

function handleReportCardClick(e) {
  const card = e.target.closest(".report-card");
  if (!card) return;

  const id = card.getAttribute("data-id");
  if (
    id &&
    (e.target.closest(".btn-detail") ||
      e.target === card ||
      card.contains(e.target))
  ) {
    viewDetail(id);
  }
}

function handlePaginationClick(e) {
  const btn = e.target.closest(".btn-page");
  if (!btn || btn.disabled) return;

  const targetPage = parseInt(btn.getAttribute("data-page"), 10);
  if (!isNaN(targetPage)) changePage(targetPage);
}

// Load statistics
async function loadStatistics() {
  try {
    // Hitung statistik berdasarkan semua laporan warga yang berhasil diambil
    const allReports = await fetchAllReports();

    const stats = {
      total: allReports.length,
      byStatus: {
        pending: 0,
        progress: 0,
        completed: 0,
      },
    };

    allReports.forEach((report) => {
      const status = (report.status_laporan || "").trim().toLowerCase();

      if (status === "belum dikerjakan") {
        stats.byStatus.pending += 1;
      } else if (status === "sedang dikerjakan") {
        stats.byStatus.progress += 1;
      } else if (status.startsWith("selesai")) {
        // Meng-cover "Selesai" atau "Selesai dikerjakan"
        stats.byStatus.completed += 1;
      }
    });

    updateStatisticsUI(stats);
  } catch (error) {
    console.error("Error loading statistics:", error);
  }
}

function updateStatisticsUI(stats) {
  const elements = {
    total: document.getElementById("statTotal"),
    pending: document.getElementById("statPending"),
    progress: document.getElementById("statProgress"),
    completed: document.getElementById("statCompleted"),
  };

  for (const [key, element] of Object.entries(elements)) {
    if (element) {
      if (key === "total") {
        element.textContent = stats.total || 0;
      } else {
        // Ensure we always display 0 if status count is undefined or missing
        element.textContent = (stats.byStatus && stats.byStatus[key]) || 0;
      }
    }
  }
}

// Load reports
async function loadReports() {
  showLoadingState();

  try {
    const allReports = await fetchAllReports();
    const filteredReports = applyClientFilters(allReports);
    renderReportsWithPagination(filteredReports);
  } catch (error) {
    console.error("Error loading reports:", error);
    showErrorState("Terjadi kesalahan saat memuat data");
  }
}

async function fetchAllReports() {
  const FETCH_LIMIT = 10000;
  const params = new URLSearchParams({ page: 1, limit: FETCH_LIMIT });

  const response = await fetch(`${API_URL}/public?${params}`);
  if (!response.ok) throw new Error("Failed to fetch reports");

  const result = await response.json();
  return result.success ? (Array.isArray(result.data) ? result.data : []) : [];
}

function showLoadingState() {
  domElements.reportsList.innerHTML = `
    <div class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>Memuat data laporan...</p>
    </div>
  `;
}

function showErrorState(message) {
  domElements.reportsList.innerHTML = `
    <div class="error-state">
      <i class="fa-solid fa-exclamation-triangle"></i>
      <p>${message}</p>
    </div>
  `;
}

// Apply client-side filtering and sorting
function applyClientFilters(reports) {
  if (!Array.isArray(reports)) return [];

  let filtered = [...reports];

  // Apply search filter
  if (state.filters.search) {
    const query = state.filters.search.toLowerCase();
    filtered = filtered.filter((report) => {
      const title = (report.judul || "").toLowerCase();
      const description = (report.deskripsi || "").toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }

  // Apply category filter
  if (state.filters.kategori) {
    const category = state.filters.kategori.toLowerCase();
    filtered = filtered.filter((report) => {
      const reportCategory = (
        (report.kategori_ai && report.kategori_ai) ||
        report.kategori ||
        ""
      )
        .trim()
        .toLowerCase();
      return reportCategory === category;
    });
  }

  // Apply status filter
  if (state.filters.status) {
    const targetStatus =
      STATUS_MAP[state.filters.status] || state.filters.status;
    filtered = filtered.filter((report) => {
      const reportStatus = (report.status_laporan || "").trim().toLowerCase();
      return reportStatus === targetStatus.toLowerCase();
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const { sortBy, order } = state.filters;

    if (sortBy === "judul") {
      const valueA = (a.judul || "").toLowerCase();
      const valueB = (b.judul || "").toLowerCase();
      const comparison = valueA.localeCompare(valueB);
      return order === "asc" ? comparison : -comparison;
    }

    // Default: sort by createdAt
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return order === "asc" ? dateA - dateB : dateB - dateA;
  });

  return filtered;
}

function renderReportsWithPagination(reports) {
  const limit = 9;
  const total = reports.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Adjust current page if out of bounds
  if (state.currentPage > totalPages) state.currentPage = totalPages;
  if (state.currentPage < 1) state.currentPage = 1;

  const start = (state.currentPage - 1) * limit;
  const end = start + limit;
  const pageReports = reports.slice(start, end);

  renderReports(pageReports);
  renderPagination({ page: state.currentPage, totalPages, total });
}

function sensorNama(nama) {
  if (!nama) return "Anonymous";

  return nama
    .split(" ")
    .map((word) => {
      if (word.length <= 2) return word;
      return word[0] + "*".repeat(word.length - 1);
    })
    .join(" ");
}

// Render reports cards
function renderReports(reports) {
  if (reports.length === 0) {
    domElements.reportsList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-inbox"></i>
        <p>Tidak ada laporan yang ditemukan</p>
        <small>Coba ubah filter pencarian Anda</small>
      </div>
    `;
    return;
  }

  domElements.reportsList.innerHTML = reports
    .map((report) => createReportCardHTML(report))
    .join("");
}

function createReportCardHTML(report) {
  const imageHTML = report.gambar
    ? createImageHTML(report.gambar, report.judul)
    : "";

  return `
    <div class="report-card" data-id="${report._id}">
      <div class="report-header">
        <div class="report-meta">
          <span class="report-number">
            <i class="fa-solid fa-hashtag"></i> ${report.nomor_laporan}
          </span>
          <span class="report-date">
            <i class="fa-solid fa-calendar"></i> ${formatDate(report.createdAt)}
          </span>
        </div>
        <span class="status-badge status-${report.status_laporan.replace(
          /\s+/g,
          "-"
        )}">
          ${getStatusIcon(report.status_laporan)} ${report.status_laporan}
        </span>
      </div>
      
      ${imageHTML}
      
      <div class="report-body">
        <h3 class="report-title">${report.judul}</h3>
        <p class="report-description">${truncateText(report.deskripsi, 150)}</p>
        
        <div class="report-tags">
          ${
            report.kategori
              ? createTagHTML(report.kategori, "tag-kategori", "fa-tag")
              : ""
          }
          ${
            report.kategori_ai
              ? createTagHTML(report.kategori_ai, "tag-ai", "fa-robot")
              : ""
          }
          ${
            report.sentimen_ai ? createSentimentTagHTML(report.sentimen_ai) : ""
          }
        </div>
        
        <div class="report-footer">
          <div class="report-author">
            <i class="fa-solid fa-user"></i>
            <span>${sensorNama(report.warga_id?.user_warga)}</span>
          </div>
          ${
            report.lokasi
              ? `
            <div class="report-location">
              <i class="fa-solid fa-location-dot"></i>
              <span>${report.lokasi}</span>
            </div>
          `
              : ""
          }
        </div>
      </div>
      
      <div class="report-action">
        <button class="btn-detail">
          <i class="fa-solid fa-eye"></i> Lihat Detail
        </button>
      </div>
    </div>
  `;
}

function createImageHTML(url, title) {
  return `
    <div class="report-image">
      <img src="${url}" alt="${title}" loading="lazy">
    </div>
  `;
}

function createTagHTML(text, className, icon) {
  return `
    <span class="tag ${className}">
      <i class="fa-solid ${icon}"></i> ${text}
    </span>
  `;
}

function createSentimentTagHTML(sentiment) {
  return `
    <span class="tag tag-sentiment sentiment-${sentiment}">
      ${getSentimentIcon(sentiment)} ${sentiment}
    </span>
  `;
}

// Render pagination
function renderPagination({ page, totalPages, total }) {
  if (!domElements.paginationContainer) return;

  if (totalPages <= 1) {
    domElements.paginationContainer.innerHTML = "";
    domElements.paginationContainer.style.display = "none";
    return;
  }

  domElements.paginationContainer.style.display = "block";
  domElements.paginationContainer.innerHTML = createPaginationHTML(
    page,
    totalPages,
    total
  );
}

function createPaginationHTML(page, totalPages, total) {
  return `
    <div class="pagination-info">
      <p>Menampilkan halaman ${page} dari ${totalPages} (${total} total laporan)</p>
    </div>
    <div class="pagination-controls">
      <button class="btn-page" data-page="${page - 1}" ${
    page === 1 ? "disabled" : ""
  }>
        <i class="fa-solid fa-chevron-left"></i> Sebelumnya
      </button>
      
      ${generatePageNumbers(page, totalPages)}
      
      <button class="btn-page" data-page="${page + 1}" ${
    page === totalPages ? "disabled" : ""
  }>
        Selanjutnya <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  `;
}

function generatePageNumbers(currentPage, totalPages) {
  let pagesHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      pagesHTML += `<button class="btn-page ${
        i === currentPage ? "active" : ""
      }" data-page="${i}">${i}</button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      pagesHTML += '<span class="pagination-ellipsis">...</span>';
    }
  }

  return pagesHTML;
}

// Change page
function changePage(page) {
  state.currentPage = page;
  loadReports();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// View detail
async function viewDetail(id) {
  try {
    const response = await fetch(`${API_URL}/public/${id}`);
    if (!response.ok) throw new Error("Failed to fetch report details");

    const result = await response.json();
    if (result.success) {
      showDetailModal(result.data);
    } else {
      alert("Gagal memuat detail laporan");
    }
  } catch (error) {
    console.error("Error loading detail:", error);
    alert("Terjadi kesalahan saat memuat detail");
  }
}

// Show detail modal
function showDetailModal(laporan) {
  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");

  if (!modal || !modalBody) return;

  modalBody.innerHTML = createDetailModalHTML(laporan);

  modal.style.display = "flex";
  setupModalEventListeners(modal);
}

function createDetailModalHTML(laporan) {
  const attachmentHTML = laporan.gambar
    ? createAttachmentHTML(laporan.gambar, laporan.judul)
    : "";
  const aiAnalysisHTML = createAiAnalysisHTML(laporan);

  return `
    <div class="detail-container">
      <div class="detail-header-section">
        <div class="detail-status-row">
          <span class="status-badge status-${laporan.status_laporan.replace(
            /\s+/g,
            "-"
          )}">
            ${getStatusIcon(laporan.status_laporan)} ${laporan.status_laporan}
          </span>
          <span class="detail-number">${laporan.nomor_laporan}</span>
        </div>
        <h2>${laporan.judul}</h2>
        <div class="detail-meta">
          <span><i class="fa-solid fa-user"></i> ${
            laporan.warga_id?.user_warga || "Anonymous"
          }</span>
          <span><i class="fa-solid fa-calendar"></i> ${formatDate(
            laporan.createdAt
          )}</span>
          ${
            laporan.lokasi
              ? `<span><i class="fa-solid fa-location-dot"></i> ${laporan.lokasi}</span>`
              : ""
          }
        </div>
      </div>
      
      ${attachmentHTML}
      
      <div class="detail-content-section">
        <h3><i class="fa-solid fa-file-lines"></i> Deskripsi Laporan</h3>
        <p class="detail-description">${laporan.deskripsi}</p>
      </div>
      
      ${aiAnalysisHTML}
      
      ${laporan.komentar ? createAdminResponseHTML(laporan.komentar) : ""}
    </div>
  `;
}

function createAttachmentHTML(url, title) {
  return `
    <div class="detail-image-section">
      <img src="${url}" alt="${title}" loading="lazy">
    </div>
  `;
}

function createAiAnalysisHTML(laporan) {
  const hasAiAnalysis =
    laporan.kategori_ai ||
    laporan.sentimen_ai ||
    (laporan.keywords_ai && laporan.keywords_ai.length > 0);

  if (!hasAiAnalysis) return "";

  return `
    <div class="detail-ai-section">
      <h3></i> Analisis</h3>
      <div class="ai-tags">
        ${
          laporan.kategori
            ? createAiItemHTML(
                "Topik:",
                laporan.kategori,
                "tag-kategori",
                "fa-tag"
              )
            : ""
        }
        ${
          laporan.kategori_ai
            ? createAiItemHTML(
                "Kategori Otomatis:",
                laporan.kategori_ai,
                "tag-ai",
                "fa-robot"
              )
            : ""
        }
        ${
          laporan.sentimen_ai
            ? createSentimentItemHTML(laporan.sentimen_ai)
            : ""
        }
        ${createKeywordsHTML(laporan.keywords_ai)}
      </div>
    </div>
  `;
}

function createAiItemHTML(label, value, className, icon) {
  return `
    <div class="ai-item">
      <label>${label}</label>
      <span class="tag ${className}">
        <i class="fa-solid ${icon}"></i> ${value}
      </span>
    </div>
  `;
}

function createSentimentItemHTML(sentiment) {
  return `
    <div class="ai-item">
      <label>Sentimen:</label>
      <span class="tag tag-sentiment sentiment-${sentiment}">
        ${getSentimentIcon(sentiment)} ${sentiment}
      </span>
    </div>
  `;
}

function createKeywordsHTML(keywords) {
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) return "";

  return `
    <div class="ai-item keywords-item">
      <label>Keywords:</label>
      <div class="keywords-list">
        ${keywords
          .map((keyword) => `<span class="keyword-tag">${keyword}</span>`)
          .join("")}
      </div>
    </div>
  `;
}

function createAdminResponseHTML(comment) {
  return `
    <div class="detail-response-section">
      <h3><i class="fa-solid fa-comment-dots"></i> Tanggapan Admin</h3>
      <div class="response-box">
        <p>${comment}</p>
      </div>
    </div>
  `;
}

function setupModalEventListeners(modal) {
  // Close modal handlers
  document.getElementById("closeModal").onclick = () => {
    modal.style.display = "none";
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  };
}

// Helper functions
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Tanggal tidak tersedia";
  }
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function getStatusIcon(status) {
  const icons = {
    "Belum dikerjakan": '<i class="fa-solid fa-clock"></i>',
    "Sedang dikerjakan": '<i class="fa-solid fa-spinner"></i>',
    Selesai: '<i class="fa-solid fa-check-circle"></i>',
  };
  return icons[status] || '<i class="fa-solid fa-circle"></i>';
}

function getSentimentIcon(sentiment) {
  const icons = {
    positif: '<i class="fa-solid fa-face-smile"></i>',
    negatif: '<i class="fa-solid fa-face-frown"></i>',
    netral: '<i class="fa-solid fa-face-meh"></i>',
  };
  return icons[sentiment] || '<i class="fa-solid fa-circle"></i>';
}
