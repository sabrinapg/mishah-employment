// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
}

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
}

// Services page tabs
const tabButtons = document.querySelectorAll('.tab-btn');
if (tabButtons.length) {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });
}

// Contact page audience switch (job seeker / employer)
const switchButtons = document.querySelectorAll('.switch-btn');
const roleField = document.getElementById('role-field');
if (switchButtons.length) {
  switchButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (roleField) roleField.value = btn.dataset.role;
      const posField = document.getElementById('position-label');
      if (posField) {
        posField.textContent = btn.dataset.role === 'employer' ? 'Type of help you need' : 'What kind of placement are you looking for';
      }
    });
  });
}

// Contact form submit — posts to the backend (/api/contact)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('contact-error');
    const submitBtn = document.getElementById('contact-submit');
    errorBox.classList.remove('show');

    const payload = {
      name: document.getElementById('name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      position: document.getElementById('position').value.trim(),
      message: document.getElementById('message').value.trim(),
      role: document.getElementById('role-field').value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    try {
      await apiFetch('/contact', { method: 'POST', body: JSON.stringify(payload) });
      contactForm.style.display = 'none';
      document.querySelector('.form-success').classList.add('show');
    } catch (err) {
      errorBox.textContent = err.message || 'Something went wrong — please try again.';
      errorBox.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
    }
  });
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
