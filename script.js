// Small interactive helpers for the portfolio site

// Smooth scrolling for internal anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId.length > 1) {
            e.preventDefault();
            const el = document.querySelector(targetId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            // collapse bootstrap navbar on small screens
            const bsCollapse = document.querySelector('.navbar-collapse');
            if (bsCollapse && bsCollapse.classList.contains('show')) {
                new bootstrap.Collapse(bsCollapse).hide();
            }
        }
    });
});

// Update active nav link on scroll
const sections = document.querySelectorAll('section[id]');
function onScroll() {
    const scrollPos = window.scrollY + 90; // account for fixed navbar
    sections.forEach(sec => {
        const top = sec.offsetTop;
        const bottom = top + sec.offsetHeight;
        const navLink = document.querySelector(`.navbar-nav a[href="#${sec.id}"]`);
        if (!navLink) return;
        if (scrollPos >= top && scrollPos < bottom) {
            navLink.classList.add('active');
        } else {
            navLink.classList.remove('active');
        }
    });
}
window.addEventListener('scroll', onScroll);
window.addEventListener('load', onScroll);

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 70,
                behavior: 'smooth'
            });
        }
    });
});

window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
});