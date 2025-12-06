// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(12, 12, 12, 0.98)';
    } else {
        navbar.style.background = 'rgba(12, 12, 12, 0.95)';
    }
});

// Active navigation link highlighting
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Add fade-in class to elements and observe them
const animateElements = document.querySelectorAll('.section-header, .about-content, .skill-item, .project-card, .timeline-item, .contact-content');
animateElements.forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// Typing animation for hero title (disabled to prevent HTML structure issues)
function typeWriter(element, text, speed = 100) {
    // Animation disabled to preserve HTML structure
    return;
}

// Initialize typing animation when page loads (disabled)
window.addEventListener('load', () => {
    // Typing animation disabled to prevent span tag display issues
    console.log('Hero section loaded successfully');
});

// Skill items hover effect
document.querySelectorAll('.skill-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.05)';
    });
    
    item.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Project cards tilt effect
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    });
});

// Floating elements animation
function animateFloatingElements() {
    const floatingElements = document.querySelectorAll('.floating-element');
    
    floatingElements.forEach((element, index) => {
        const delay = index * 1500;
        const duration = 6000 + (index * 500);
        
        setInterval(() => {
            element.style.transform = `translateY(-20px) rotate(${Math.random() * 10 - 5}deg)`;
            setTimeout(() => {
                element.style.transform = `translateY(0px) rotate(0deg)`;
            }, duration / 2);
        }, duration);
    });
}

// Initialize floating animation
window.addEventListener('load', animateFloatingElements);

// Contact form handling
const contactForm = document.querySelector('.form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const name = this.querySelector('input[placeholder="Your Name"]').value;
        const email = this.querySelector('input[placeholder="Your Email"]').value;
        const subject = this.querySelector('input[placeholder="Subject"]').value;
        const message = this.querySelector('textarea').value;
        
        // Simple validation
        if (!name || !email || !subject || !message) {
            alert('Please fill in all fields');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Create mailto link
        const mailtoLink = `mailto:yujin2ee@naver.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;

        // Open email client
        window.location.href = mailtoLink;
        
        // Show success message
        alert('Thank you for your message! Your email client should open now.');
        
        // Reset form
        this.reset();
    });
}

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    
    if (hero && heroContent) {
        heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Animate elements on load
    setTimeout(() => {
        const elementsToAnimate = document.querySelectorAll('.hero-title, .hero-subtitle, .hero-description, .hero-buttons, .social-links');
        elementsToAnimate.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }, 500);
});

// Smooth reveal animation for sections
const revealElements = document.querySelectorAll('.section-title, .section-subtitle');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.5 });

revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    revealObserver.observe(el);
});

// Add particle effect to hero section
function createParticles() {
    const hero = document.querySelector('.hero');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(102, 126, 234, 0.5);
            border-radius: 50%;
            pointer-events: none;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        hero.appendChild(particle);
    }
}

// Initialize particles
window.addEventListener('load', createParticles);

// Add CSS for particles animation
const style = document.createElement('style');
style.textContent = `
    @keyframes particleFloat {
        0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        50% { transform: translateY(-100px) translateX(50px); }
    }
    
    .particle {
        animation-name: particleFloat !important;
    }
    
    .hero-title, .hero-subtitle, .hero-description, .hero-buttons, .social-links {
        opacity: 1;
        transform: translateY(0);
        transition: all 0.6s ease;
    }
    
    .loaded .hero-title, .loaded .hero-subtitle, .loaded .hero-description, .loaded .hero-buttons, .loaded .social-links {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// Add scroll progress indicator
const scrollProgress = document.createElement('div');
scrollProgress.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    z-index: 9999;
    transition: width 0.1s ease;
`;
document.body.appendChild(scrollProgress);

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    scrollProgress.style.width = scrollPercent + '%';
});

// Add custom cursor effect
const cursor = document.createElement('div');
cursor.className = 'custom-cursor';
cursor.style.cssText = `
    position: fixed;
    width: 20px;
    height: 20px;
    border: 2px solid #667eea;
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    transition: all 0.1s ease;
    mix-blend-mode: difference;
`;
document.body.appendChild(cursor);

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX - 10 + 'px';
    cursor.style.top = e.clientY - 10 + 'px';
});

// Cursor hover effects
document.querySelectorAll('a, button, .skill-item, .project-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(1.5)';
        cursor.style.backgroundColor = 'rgba(102, 126, 234, 0.2)';
    });
    
    el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
        cursor.style.backgroundColor = 'transparent';
    });
});

console.log('Portfolio loaded successfully!');
console.log('© 2025 Yujin Lee. All rights reserved.');

// --- Typing animation for hero sub intro (word-by-word, slower) ---
(function(){
  const el = document.querySelector('.typing-line');
  if(!el) return;

  // 텍스트를 받아와서 단어 단위로 분리
  const text = (el.getAttribute('data-text') || '').trim();
  const words = text.split(' ');
  let i = 0;
  const delay = 20; // 속도 조절 (ms) — 200~300 권장

  el.textContent = ''; // 초기화
  function typeWord() {
    if (i < words.length) {
      // 단어 추가 후 띄어쓰기
      el.textContent += (i > 0 ? ' ' : '') + words[i];
      i++;
      setTimeout(typeWord, delay);
    }
  }
  typeWord();
})();

// ===== Project slider (자동 스크롤 + 버튼 수동 이동) =====
(function(){
  document.querySelectorAll('.slider-wrap').forEach(wrap=>{
    const slider = wrap.querySelector('.slider');
    const track  = wrap.querySelector('.slider-track');
    const slides = wrap.querySelectorAll('.slide');
    const prevBtn = wrap.querySelector('.slider-arrow.prev');
    const nextBtn = wrap.querySelector('.slider-arrow.next');
    if(!slider || !track || !slides.length || !prevBtn || !nextBtn) return;

    const gap = 30;
    let currentIndex = 0;
    let resumeTimer = null;

    // 카드 1개 너비 + gap
    function getStepWidth() {
      return slides[0].offsetWidth + gap;
    }

    // 화면에 보이는 카드 수
    function getVisibleCount() {
      const sliderWidth = slider.offsetWidth;
      return Math.floor((sliderWidth + gap) / getStepWidth());
    }

    // 최대 스크롤 거리 (마지막 카드가 오른쪽 끝에 닿을 때까지만)
    function getMaxScrollDistance() {
      const sliderWidth = slider.offsetWidth;
      const totalTrackWidth = (slides.length * getStepWidth()) - gap; // 마지막 gap 제외
      return Math.max(0, totalTrackWidth - sliderWidth);
    }

    // 자동 스크롤 설정 (여백 없이 마지막 카드까지만)
    function setupAutoScroll() {
      const maxDistance = getMaxScrollDistance();
      const duration = slides.length * 4; // 카드당 4초
      track.style.setProperty('--scroll-distance', `${maxDistance}px`);
      track.style.setProperty('--scroll-duration', `${duration}s`);
    }

    // 수동 모드로 전환하여 특정 위치로 이동
    function goToIndex(index) {
      slider.classList.add('slider--manual');

      const stepWidth = getStepWidth();
      const maxDistance = getMaxScrollDistance();
      let offset = index * stepWidth;

      // 마지막 위치에서 여백이 생기지 않도록 보정
      if (offset > maxDistance) {
        offset = maxDistance;
      }

      track.style.setProperty('--offset', `-${offset}px`);

      // 일정 시간 후 자동 스크롤 재개
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        slider.classList.remove('slider--manual');
        track.style.removeProperty('--offset');
        currentIndex = 0;
      }, 4000);
    }

    function goNext() {
      const visibleCount = getVisibleCount();
      const maxIndex = Math.max(0, slides.length - visibleCount);

      currentIndex++;
      if (currentIndex > maxIndex) {
        currentIndex = 0;
      }
      goToIndex(currentIndex);
    }

    function goPrev() {
      const visibleCount = getVisibleCount();
      const maxIndex = Math.max(0, slides.length - visibleCount);

      currentIndex--;
      if (currentIndex < 0) {
        currentIndex = maxIndex;
      }
      goToIndex(currentIndex);
    }

    prevBtn.addEventListener('click', goPrev);
    nextBtn.addEventListener('click', goNext);

    // 초기 설정
    setupAutoScroll();

    // 윈도우 리사이즈 시 재계산
    window.addEventListener('resize', setupAutoScroll);
  });
})();

