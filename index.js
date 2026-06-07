document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
    
    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // Fade-in scroll animations
  const fadeSections = document.querySelectorAll('.fade-in-section');
  const observerOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeSections.forEach(section => {
    // Add the class first to prepare the state, then observe
    section.classList.add('fade-in-section');
    observer.observe(section);
  });

  // Contact form submission micro-interaction
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      
      submitBtn.innerText = 'SENDING...';
      submitBtn.disabled = true;
      
      // Simulate form sending
      setTimeout(() => {
        submitBtn.innerText = 'MESSAGE SENT';
        submitBtn.style.backgroundColor = '#1b1c1c';
        submitBtn.style.color = '#ffffff';
        
        // Reset form
        contactForm.reset();
        
        setTimeout(() => {
          submitBtn.innerText = originalText;
          submitBtn.disabled = false;
          submitBtn.style.backgroundColor = '';
          submitBtn.style.color = '';
        }, 3000);
      }, 1500);
    });
  }
});
