// Admin Login Page JavaScript

document.addEventListener("DOMContentLoaded", () => {
  initPasswordToggle();
  initLoginForm();
});

// Toggle Password Visibility
function initPasswordToggle() {
  const toggleBtn = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;

      // Update icon
      const icon = toggleBtn.querySelector("i");
      icon.className =
        type === "password" ? "fa-solid fa-eye" : "fa-solid fa-eye-slash";
    });
  }
}

// Initialize Login Form
function initLoginForm() {
  const form = document.getElementById("adminLoginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");

  if (!form || !loginBtn) {
    console.error("Form atau tombol login tidak ditemukan");
    return;
  }

  // Clear errors on input
  emailInput?.addEventListener("input", () => clearError("email"));
  passwordInput?.addEventListener("input", () => clearError("password"));

  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    form.requestSubmit();
  });

  // Form submission (LOGIC UTAMA)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("FORM SUBMITTED"); // debug

    clearAllErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = document.getElementById("rememberMe")?.checked;

    let isValid = true;

    if (!email) {
      showError("email", "Email wajib diisi");
      isValid = false;
    } else if (!isValidEmail(email)) {
      showError("email", "Format email tidak valid");
      isValid = false;
    }

    if (!password) {
      showError("password", "Password wajib diisi");
      isValid = false;
    } else if (password.length < 6) {
      showError("password", "Password minimal 6 karakter");
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        showNotification(data.message || "Email atau password salah", "error");
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminData", JSON.stringify(data.admin));

      showNotification("Login berhasil", "success");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
    } catch (err) {
      showNotification("Tidak dapat terhubung ke server", "error");
    } finally {
      setLoading(false);
    }
  });
}

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Show error message
function showError(field, message) {
  const input = document.getElementById(field);
  const errorEl = document.getElementById(`${field}Error`);

  if (input) input.classList.add("error");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add("show");
  }
}

// Clear error for specific field
function clearError(field) {
  const input = document.getElementById(field);
  const errorEl = document.getElementById(`${field}Error`);

  if (input) input.classList.remove("error");
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.remove("show");
  }
}

// Clear all errors
function clearAllErrors() {
  ["email", "password"].forEach((field) => clearError(field));
}

// Set loading state
function setLoading(isLoading) {
  const loginBtn = document.getElementById("loginBtn");
  const btnText = loginBtn.querySelector(".btn-text");
  const btnLoader = loginBtn.querySelector(".btn-loader");

  loginBtn.disabled = isLoading;
  btnText.style.display = isLoading ? "none" : "inline";
  btnLoader.style.display = isLoading ? "inline-flex" : "none";
}

// Show notification toast
function showNotification(message, type = "success") {
  // Remove existing notifications
  const existing = document.querySelector(".toast-notification");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
        <i class="fa-solid fa-${
          type === "success" ? "check-circle" : "exclamation-circle"
        }"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(toast);

  // Auto remove after delay
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/*
===========================================
BACKEND INTEGRATION GUIDE
===========================================

1. LOGIN API ENDPOINT:
   POST /api/admin/login
   
   Request Body:
   {
       "email": "admin@lapordesa.id",
       "password": "password123",
       "rememberMe": true
   }
   
   Success Response (200):
   {
       "success": true,
       "message": "Login berhasil",
       "token": "jwt_token_here",
       "admin": {
           "id": 1,
           "name": "Admin Desa",
           "email": "admin@lapordesa.id",
           "role": "administrator"
       }
   }
   
   Error Response (401):
   {
       "success": false,
       "message": "Email atau password salah"
   }

2. IMPLEMENTATION STEPS:
   - Remove simulateLogin() function
   - Uncomment the fetch() API call in initLoginForm()
   - Update API endpoint URL as needed
   - Add token to localStorage for session management
   - Implement token verification on dashboard pages

3. SECURITY CONSIDERATIONS:
   - Use HTTPS for all API calls
   - Implement rate limiting on backend
   - Hash passwords with bcrypt
   - Use JWT with short expiration
   - Implement refresh token mechanism

4. SESSION MANAGEMENT:
   - Store JWT in httpOnly cookie (recommended) or localStorage
   - Check token validity on each page load
   - Implement logout endpoint to invalidate tokens
   - Auto-logout on token expiration

===========================================
*/
