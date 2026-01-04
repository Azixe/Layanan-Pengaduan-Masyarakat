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
document.addEventListener("DOMContentLoaded", async () => {
  await loadComponent("header-placeholder", "../components/header.html");
  await loadComponent("footer-placeholder", "../components/footer.html");

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
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      // Kontak tetap di halaman submit (scroll ke footer)
      if (href === "#kontak") {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const footer =
            document.querySelector("footer") ||
            document.getElementById("footer-placeholder");
          if (footer) {
            footer.scrollIntoView({ behavior: "smooth" });
          }
        });
      } else {
        // Link lain kembali ke index page
        link.setAttribute("href", "../index.html" + href);
      }
    });

    // Fix "Daftar Pengaduan" link path
    const reportsLink = document.querySelector(
      '.nav-links a[href*="reports.html"]'
    );
    if (reportsLink) {
      reportsLink.setAttribute("href", "reports.html");
    }

    // Fix "Buat Laporan" button to reload current page
    const createReportBtn = document.getElementById("buatLaporanBtn");
    if (createReportBtn) {
      createReportBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.reload();
      });
    }

    // Initialize user menu for submit page
    initializeUserMenu();

    // Mobile menu toggle
    const hamburger = document.getElementById("hamburger");
    const navLinksContainer = document.querySelector(".nav-links");
    if (hamburger && navLinksContainer) {
      hamburger.addEventListener("click", () => {
        navLinksContainer.classList.toggle("active");
        hamburger.classList.toggle("active");
      });
    }
  }, 100);
}

// Initialize user menu
function initializeUserMenu() {
  const token = localStorage.getItem("token");
  const userMenu = document.getElementById("userMenu");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileLink = document.getElementById("profileLink");

  if (token && userMenu) {
    userMenu.style.display = "block";

    // Fix profile link untuk halaman submit (di folder pages)
    if (profileLink) {
      profileLink.href = "profile.html";
    }

    const userName = localStorage.getItem("user_name");
    if (userName) {
      const userNameSpan = document.getElementById("userName");
      if (userNameSpan) {
        userNameSpan.textContent = userName;
      }
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Apakah Anda yakin ingin keluar?")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user_id");
          localStorage.removeItem("user_name");
          window.location.href = "../index.html";
        }
      });
    }
  }
}

// Character counter for description textarea
function setupCharCounter() {
  const textarea = document.getElementById("description");
  const counterWrapper = document.querySelector(".char-count");
  const counterSpan = document.getElementById("charCount");
  const maxLength = 1000;

  if (textarea && counterWrapper && counterSpan) {
    textarea.addEventListener("input", () => {
      const length = textarea.value.length;
      counterSpan.textContent = length;

      if (length > maxLength * 0.9) {
        counterWrapper.style.color = "#ff4757";
      } else {
        counterWrapper.style.color = "#999";
      }
    });
  }
}

// File upload functionality
function setupFileUpload() {
  const uploadArea = document.querySelector(".file-upload-area");
  const fileInput = document.getElementById("fileUpload");
  const previewContainer = document.querySelector(".file-preview");

  if (!uploadArea || !fileInput || !previewContainer) return;

  // Inject simple animation styles
  if (!document.getElementById("upload-animation-styles")) {
    const style = document.createElement("style");
    style.id = "upload-animation-styles";
    style.textContent = `
      .file-upload-area {
        transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
      }
      .file-upload-area.uploading {
        position: relative;
        border-color: var(--primary-color);
        background: rgba(24, 119, 242, 0.05);
        box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.15);
      }
      .file-upload-area.uploading::after {
        content: "Mengunggah file...";
        position: absolute;
        inset: auto 16px 10px auto;
        font-size: 0.85rem;
        color: var(--primary-color);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        pointer-events: none;
      }
      .file-upload-area.uploading::before {
        content: "";
        position: absolute;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid rgba(24, 119, 242, 0.3);
        border-top-color: var(--primary-color);
        right: 110px;
        bottom: 12px;
        animation: upload-spin 0.7s linear infinite;
      }
      .file-item.upload-anim {
        opacity: 0;
        transform: translateY(6px);
        animation: upload-fade-in 0.35s ease forwards;
      }
      @keyframes upload-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes upload-fade-in {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  let uploadedFiles = [];
  let uploadingTimeout = null;

  function startUploadingAnim() {
    if (!uploadArea.classList.contains("uploading")) {
      uploadArea.classList.add("uploading");
    }
    if (uploadingTimeout) clearTimeout(uploadingTimeout);
  }

  function stopUploadingAnim() {
    if (uploadingTimeout) clearTimeout(uploadingTimeout);
    uploadingTimeout = setTimeout(() => {
      uploadArea.classList.remove("uploading");
    }, 600);
  }

  // Click to upload
  uploadArea.addEventListener("click", () => {
    fileInput.click();
  });

  // Drag and drop
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "var(--primary-color)";
    uploadArea.style.background = "#f8f9fa";
  });

  uploadArea.addEventListener("dragleave", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "#e0e0e0";
    uploadArea.style.background = "transparent";
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "#e0e0e0";
    uploadArea.style.background = "transparent";

    const files = Array.from(e.dataTransfer.files);
    startUploadingAnim();
    handleFiles(files);
    stopUploadingAnim();
  });

  // File input change
  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    startUploadingAnim();
    handleFiles(files);
    stopUploadingAnim();
  });

  // Handle files
  function handleFiles(files) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
    ];

    files.forEach((file) => {
      console.log(
        `[File Validation] File: ${file.name}, Type: ${file.type}, Size: ${(
          file.size /
          1024 /
          1024
        ).toFixed(2)}MB`
      );

      if (file.size > maxSize) {
        showError(`File "${file.name}" terlalu besar. Maksimal 5MB.`);
        console.warn(`[File Validation] File too large: ${file.name}`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        showError(
          `File "${file.name}" tidak didukung. Hanya PNG, JPG, GIF, atau WEBP.`
        );
        console.warn(`[File Validation] Invalid file type: ${file.type}`);
        return;
      }

      console.log(`[File Validation] ✓ File valid: ${file.name}`);
      uploadedFiles.push(file);
      displayFile(file);
    });
  }

  function formatFileSize(size) {
    if (size >= 1024 * 1024) {
      return (size / (1024 * 1024)).toFixed(2) + " MB";
    }
    if (size >= 1024) {
      return (size / 1024).toFixed(2) + " KB";
    }
    return size + " B";
  }

  // Display file preview
  function displayFile(file) {
    const fileItem = document.createElement("div");
    fileItem.className = "file-item upload-anim";

    const fileSize = formatFileSize(file.size);

    let blobUrl = null;
    let previewEl = document.createElement("div");
    previewEl.className = "file-preview-item";

    if (file.type && file.type.startsWith("image/")) {
      blobUrl = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.className = "file-thumb";
      img.src = blobUrl;
      img.alt = file.name;
      img.loading = "lazy";

      img.onerror = () => {
        console.error(`[Image Load] Failed to load preview: ${file.name}`);
        previewEl.innerHTML = `
          <div class="file-error">
            <i class="fas fa-exclamation-circle"></i>
            <p>Gagal memuat preview gambar</p>
          </div>
        `;
      };

      img.onload = () => {
        console.log(`[Image Load] Preview loaded: ${file.name}`);
      };

      previewEl.appendChild(img);
    } else {
      previewEl.innerHTML = `
        <div class="file-icon">
          <i class="fas fa-file-image"></i>
        </div>
      `;
    }

    const infoBlock = document.createElement("div");
    infoBlock.className = "file-info";
    infoBlock.innerHTML = `
        <div>
          <div class="file-name" title="${file.name}">${file.name}</div>
          <div class="file-size">${fileSize}</div>
        </div>
      `;

    if (blobUrl) fileItem.dataset.blob = blobUrl;

    fileItem.appendChild(previewEl);
    fileItem.appendChild(infoBlock);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "file-remove";
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener("click", () => {
      uploadedFiles = uploadedFiles.filter((f) => f.name !== file.name);
      if (fileItem.dataset && fileItem.dataset.blob) {
        try {
          URL.revokeObjectURL(fileItem.dataset.blob);
          console.log(`[Image Cleanup] Blob URL revoked: ${file.name}`);
        } catch (e) {
          console.warn(`[Image Cleanup] Error revoking URL: ${e.message}`);
        }
      }
      fileItem.remove();
      console.log(`[File Remove] File removed: ${file.name}`);
    });

    fileItem.appendChild(removeBtn);
    previewContainer.appendChild(fileItem);
    console.log(`[File Display] File displayed: ${file.name}`);
  }

  // Store files reference
  window.getUploadedFiles = function () {
    return uploadedFiles;
  };
}

// Form validation
function validateForm() {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const topic = document.getElementById("topic").value;

  if (!title) {
    showError("Judul laporan harus diisi");
    document.getElementById("title").focus();
    return false;
  }

  if (title.length < 10) {
    showError("Judul laporan minimal 10 karakter");
    document.getElementById("title").focus();
    return false;
  }

  if (!description) {
    showError("Deskripsi harus diisi");
    document.getElementById("description").focus();
    return false;
  }

  if (description.length < 20) {
    showError("Deskripsi minimal 20 karakter");
    document.getElementById("description").focus();
    return false;
  }

  if (!topic) {
    showError("Topik laporan harus dipilih");
    document.getElementById("topic").focus();
    return false;
  }

  return true;
}

// Form submission
function setupFormSubmit() {
  const form = document.getElementById("submissionForm");
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check login
    const wargaID = localStorage.getItem("user_id");
    if (!wargaID) {
      showError("Sesi habis. Silakan login kembali.");
      setTimeout(function () {
        window.location.href = "login.html";
      }, 1500);
      return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("warga_id", wargaID);
    formData.append("judul", document.getElementById("title").value.trim());
    formData.append(
      "deskripsi",
      document.getElementById("description").value.trim()
    );
    formData.append("kategori", document.getElementById("topic").value);
    formData.append("lokasi", document.getElementById("location").value.trim());
    formData.append("nama_warga", localStorage.getItem("user_name"));

    const files = window.getUploadedFiles();
    if (files && files.length > 0) {
      const file = files[0];
      console.log(
        `[Form Submit] Uploading file: ${file.name}, Type: ${
          file.type
        }, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      );
      formData.append("upload_foto", file);
    } else {
      console.log("[Form Submit] No files uploaded");
    }

    // UI Loading
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    submitBtn.disabled = true;
    form.classList.add("form-loading");
    submitBtn.classList.add("loading");

    try {
      const response = await fetch(
        `http://localhost:3000/api/laporan/buatlaporan`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        const successMessage = "Laporan berhasil dibuat!";
        // show toast
        showSuccess(successMessage);
        // blocking alert
        try {
          alert(successMessage);
        } catch (e) {}

        setTimeout(() => {
          form.reset();
          const preview = document.querySelector(".file-preview");
          if (preview) preview.innerHTML = "";
          const counter = document.querySelector(".char-count");
          if (counter) counter.textContent = "0/1000";
          window.location.href = "../index.html";
        }, 1200);
      } else {
        throw new Error(result.message || "Gagal memproses di server.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showError(`Gagal mengirim: ${error.message}`);
    } finally {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      form.classList.remove("form-loading");
      submitBtn.classList.remove("loading");
    }
  });
}

// Cancel button
function setupCancelButton() {
  const cancelBtn = document.querySelector(".btn-secondary");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (
        confirm(
          "Apakah Anda yakin ingin membatalkan? Data yang telah diisi akan hilang."
        )
      ) {
        window.history.back();
      }
    });
  }
}

// Show error message
function showError(message) {
  const notification = document.createElement("div");
  notification.className = "notification error";
  notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(notification);

  if (!document.getElementById("notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
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

  setTimeout(function () {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(function () {
      notification.remove();
    }, 300);
  }, 4000);
}

// Show success message
function showSuccess(message) {
  const notification = document.createElement("div");
  notification.className = "notification success";
  notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(notification);

  setTimeout(function () {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(function () {
      notification.remove();
    }, 300);
  }, 4000);
}
