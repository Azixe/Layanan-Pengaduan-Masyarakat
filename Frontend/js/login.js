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

    if (document.querySelector(".login-container")) {
        initLoginButton();
    }

    // === Fungsi validasi email sederhana ===
    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    function validateForm() {
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
        return valid;
    }

    function initLoginButton() {
        if (form) {
            form.addEventListener("submit", loginUser);
        }
    }

    async function loginUser(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const email = userInput.value;
        const password = passwordInput.value;

        try{
            const response = await fetch(`http://localhost:3000/api/warga/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email:email, password:password})
        });

        const data = await response.json();

        if(data.success) {
            localStorage.setItem("token", data.token);
            if (data.warga && data.warga._id) {
                    localStorage.setItem("user_id", data.warga._id);
                } else {
                    console.warn("Backend tidak mengirim data.warga._id!");
                }
            console.log("ISI DATA USER:", data.warga);
            alert("Login berhasil");
            window.location.href = "../index.html";
        } else {
            alert('Login gagal ' + data.message);
        }
        } catch (error) {
            console.error("Fetch error", error);
            alert("Terjadi kesalahan. Silahkan coba lagi nanti.");
        }
        
    }
});
