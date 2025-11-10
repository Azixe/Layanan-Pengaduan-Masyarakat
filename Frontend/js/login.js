document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const userInput = document.getElementById("user");
    const passwordInput = document.getElementById("password");
    const toggleBtn = document.getElementById("togglePwd");
    const userError = document.getElementById("userError");
    const passwordError = document.getElementById("passwordError");
    const submitBtn = document.getElementById("submitBtn");

    toggleBtn.addEventListener("click", () => {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        toggleBtn.textContent = type === "password" ? "Show" : "Hide";
    });


    form.addEventListener("submit", (e) => {
        e.preventDefault();

        let valid = true;
        userError.textContent = "";
        passwordError.textContent = "";


        if (!userInput.value.trim()) {
            userError.textContent = "Email tidak boleh kosong.";
            valid = false;
        } else if (!validateEmail(userInput.value.trim())) {
            userError.textContent = "Format email tidak valid.";
            valid = false;
        }

        if (!passwordInput.value.trim()) {
            passwordError.textContent = "Password tidak boleh kosong.";
            valid = false;
        } else if (passwordInput.value.length < 6) {
            passwordError.textContent = "Password minimal 6 karakter.";
            valid = false;
        }

        if (!valid) return;

        submitBtn.disabled = true;
        submitBtn.textContent = "Signing In...";

        setTimeout(() => {
            alert("Login berhasil! (Simulasi)");
            submitBtn.disabled = false;
            submitBtn.textContent = "Sign In";
            form.reset();
        }, 1500);
    });

    // === Fungsi validasi email sederhana ===
    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
});
