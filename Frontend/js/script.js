// Load Header and Footer Components
const tokenExist = localStorage.getItem('token');

async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
    }
}

// Load components when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await loadComponent('header-placeholder', 'components/header.html');
    await loadComponent('footer-placeholder', 'components/footer.html');
    
    // Initialize navigation after header is loaded
    initializeNavigation();
    
    // Initialize other features
    initializeAnimations();

    initLaporanButton();
});

// Mobile Navigation Toggle
function initializeNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80; // Account for fixed navbar
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Add animation on scroll
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.feature-card, .preview-item, .testimonial-card');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Button click handlers (placeholders for future functionality)


function initLaporanButton() {
    const applyButtonLapor = document.getElementById('Laporan');
    applyButtonLapor.addEventListener('click', (e) => {
            // Don't follow the link if it's inside an anchor tag
                if (!tokenExist) {
                    window.location.href = 'pages/login.html';
                    alert("Login/Register terlebih dahulu");
                } else {
                    window.location.href = 'pages/submit.html';
                }
        });
}


// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }
});

// Add hover effect to chart bars
document.addEventListener('DOMContentLoaded', () => {
    const chartBars = document.querySelectorAll('.chart-bar');
    
    chartBars.forEach(bar => {
        bar.addEventListener('mouseenter', () => {
            bar.style.opacity = '0.8';
        });
        
        bar.addEventListener('mouseleave', () => {
            bar.style.opacity = '1';
        });
    });
});

// Parallax effect for hero section (subtle)
window.addEventListener('scroll', () => {
    const heroImage = document.querySelector('.hero-image');
    if (heroImage) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.3;
        heroImage.style.transform = `translateY(${rate}px)`;
    }
});

// Counter animation for statistics (if you add them later)
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}

// Log page load
console.log('LaporDesa - Platform Pengaduan Masyarakat loaded successfully');
console.log('Ready to serve the community!');
