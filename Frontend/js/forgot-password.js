document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotPasswordForm");
  const emailInput = document.getElementById("email");
  const emailError = document.getElementById("emailError");
  const codeInput = document.getElementById("code");
  const codeError = document.getElementById("codeError");
  const newPasswordInput = document.getElementById("newPassword");
  const newPasswordError = document.getElementById("newPasswordError");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const confirmPasswordError = document.getElementById("confirmPasswordError");
  const submitBtn = document.getElementById("submitForgot");
  const stepEmail = document.getElementById("stepEmail");
  const stepCode = document.getElementById("stepCode");
  const titleEl = document.getElementById("forgotTitle");
  const subtitleEl = document.getElementById("forgotSubtitle");

  if (!form) return;

  // default langkah pertama: kirim kode ke email
  form.dataset.step = "email";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentStep = form.dataset.step || "email";

    if (currentStep === "email") {
      await handleSendCode();
    } else {
      await handleResetPassword();
    }
  });

  function clearErrors() {
    [emailError, codeError, newPasswordError, confirmPasswordError].forEach(
      (el) => {
        if (el) el.textContent = "";
      }
    );
  }

  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  async function handleSendCode() {
    clearErrors();
    const email = emailInput.value.trim();

    if (!email) {
      emailError.textContent = "Email tidak boleh kosong.";
      return;
    }
    if (!validateEmail(email)) {
      emailError.textContent = "Format email tidak valid.";
      return;
    }

    setLoading(true, "Mengirim kode...");
    try {
      const res = await fetch(
        "http://localhost:3000/api/warga/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();

      alert(data.message || "Jika email terdaftar, kode telah dikirim.");

      // lanjut ke langkah input kode + password baru
      form.dataset.step = "code";
      if (stepEmail) stepEmail.style.display = "none";
      if (stepCode) stepCode.style.display = "block";
      if (titleEl) titleEl.textContent = "Verifikasi Kode";
      if (subtitleEl)
        subtitleEl.textContent =
          "Masukkan kode verifikasi yang dikirim ke email Anda, lalu buat password baru.";
      if (submitBtn) submitBtn.textContent = "Reset Password";
    } catch (error) {
      console.error("Error kirim kode reset:", error);
      alert("Terjadi kesalahan. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    clearErrors();

    const email = emailInput.value.trim();
    const code = (codeInput?.value || "").trim();
    const newPassword = newPasswordInput?.value || "";
    const confirmPassword = confirmPasswordInput?.value || "";

    let valid = true;

    if (!code || code.length !== 6) {
      codeError.textContent = "Kode harus 6 digit.";
      valid = false;
    }

    if (!newPassword || newPassword.length < 8) {
      newPasswordError.textContent = "Password baru minimal 8 karakter.";
      valid = false;
    }

    if (confirmPassword !== newPassword) {
      confirmPasswordError.textContent = "Konfirmasi password tidak sama.";
      valid = false;
    }

    if (!valid) return;

    setLoading(true, "Menyimpan password...");

    try {
      const res = await fetch(
        "http://localhost:3000/api/warga/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, newPassword }),
        }
      );
      const data = await res.json();

      if (data.success) {
        alert(data.message || "Password berhasil direset.");
        window.location.href = "login.html";
      } else {
        alert(data.message || "Reset password gagal.");
      }
    } catch (error) {
      console.error("Error reset password:", error);
      alert("Terjadi kesalahan. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  }

  function setLoading(isLoading, text) {
    if (!submitBtn) return;
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.textContent = text || "Memproses...";
    } else {
      submitBtn.disabled = false;
      // teks akan di-set ulang sesuai step saat ini
      const step = form.dataset.step || "email";
      submitBtn.textContent =
        step === "email" ? "Kirim Kode" : "Reset Password";
    }
  }
});
