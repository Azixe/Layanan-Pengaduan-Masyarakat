// Frontend/js/signup.js
// Client-side validation for signup form

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('signupForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');

    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const confirmError = document.getElementById('confirmError');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordMinLength = 8;

    function clearErrors() {
        [nameError, emailError, passwordError, confirmError].forEach(el => {
            if (el) el.textContent = '';
        });
    }

    function validate() {
        clearErrors();
        let valid = true;

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirm = confirmInput.value;

        if (!name) {
            nameError.textContent = 'Nama wajib diisi';
            valid = false;
        }

        if (!email) {
            emailError.textContent = 'Email wajib diisi';
            valid = false;
        } else if (!emailRegex.test(email)) {
            emailError.textContent = 'Format email tidak valid';
            valid = false;
        }

        if (!password) {
            passwordError.textContent = 'Password wajib diisi';
            valid = false;
        } else if (password.length < passwordMinLength) {
            passwordError.textContent = `Password minimal ${passwordMinLength} karakter`;
            valid = false;
        } else {
            // require at least one letter and one number
            const hasLetter = /[A-Za-z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            if (!hasLetter || !hasNumber) {
                passwordError.textContent = 'Password harus mengandung huruf dan angka';
                valid = false;
            }
        }

        if (password && confirm !== password) {
            confirmError.textContent = 'Password tidak cocok';
            valid = false;
        }

        return valid;
    }

    // Optional: real-time validation on blur
    [nameInput, emailInput, passwordInput, confirmInput].forEach(input => {
        input.addEventListener('blur', () => {
            validate();
        });
    });

    form.addEventListener('submit', function (e) {
        if (!validate()) {
            e.preventDefault();
            // focus first error field
            const firstError = document.querySelector('.error:not(:empty)');
            if (firstError) {
                const field = firstError.previousElementSibling;
                if (field && field.focus) field.focus();
            }
            return;
        }

        // At this point validation passed. If you have a backend endpoint,
        // here is where you'd POST the form via fetch/AJAX or allow normal submit.
        e.preventDefault();
        // Demo behavior for now
        alert('Akun berhasil terdaftar (demo). Hubungkan endpoint backend untuk penyimpanan nyata.');
    });
});
