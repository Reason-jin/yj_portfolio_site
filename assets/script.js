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

console.log('🚀 Portfolio loaded successfully!');
console.log('© 2025 Yujin Lee. All rights reserved.');


// ---- Nano-YJ Assistant (UI-only demo) ----
(function(){
  const openBtn = document.querySelector('.nano-yj-launch');
  const overlay = document.querySelector('.nano-overlay');
  const modal = document.querySelector('.nano-modal');
  const closeBtns = document.querySelectorAll('.nano-close');
  const body = document.querySelector('.nano-body');
  const input = document.querySelector('.nano-input input');
  const send = document.querySelector('.nano-send');
  function open(){ if(overlay) overlay.style.display='block'; if(modal) modal.style.display='block'; intro(); }
  function close(){ if(overlay) overlay.style.display='none'; if(modal) modal.style.display='none'; if(body) body.innerHTML=''; }
  if(openBtn){ openBtn.addEventListener('click', open); }
  closeBtns.forEach(b=>b.addEventListener('click', close));
  if(overlay){ overlay.addEventListener('click', close); }
  function addMsg(text, who='bot'){
    const wrap = document.createElement('div'); wrap.className = 'nano-msg ' + who;
    const b = document.createElement('div'); b.className = 'bubble'; b.innerHTML = text;
    wrap.appendChild(b); body.appendChild(wrap); body.scrollTop = body.scrollHeight;
  }
  function addChoices(btns){
    const row = document.createElement('div'); row.className='nano-choices';
    btns.forEach(({label, id})=>{
      const chip = document.createElement('button'); chip.className='nano-chip'; chip.textContent = label;
      chip.addEventListener('click', ()=> handleIntent(id));
      row.appendChild(chip);
    });
    body.appendChild(row); body.scrollTop = body.scrollHeight;
  }
  function intro(){
    body.innerHTML='';
    addMsg("안녕하세요, 저는 <b>Nano-YJ</b>입니다. 짧은 인터뷰로 YUJIN LEE의 기획 역량을 ‘체험’해보시겠어요?");
    addChoices([{label:"네, 시작할게요", id:"start"},{label:"이력서 볼래요", id:"resume"},{label:"프로젝트 볼래요", id:"projects"}]);
  }
  function handleIntent(id){
    if(id==='start'){
      q1();
    } else if(id==='resume'){
      addMsg("간단 미리보기와 함께 다운로드 링크를 제공해드릴게요.");
      addChoices([{label:"미리보기", id:"resume_preview"},{label:"PDF 다운로드", id:"resume_dl"}]);
    } else if(id==='resume_preview'){
      addMsg("<b>최근 경력 하이라이트</b><br/>• React KPI 대시보드·문서 통합 총괄<br/>• GPT-4 어시스턴트 UI 초안 설계<br/><a href='docs/resume_yujin_lee.pdf' target='_blank'>자세히 보기(PDF)</a>");
      addChoices([{label:"프로젝트 보러가기", id:"projects"},{label:"닫기", id:"close"}]);
    } else if(id==='resume_dl'){
      window.open('docs/resume_yujin_lee.pdf','_blank');
    } else if(id==='projects'){
      addMsg("관심 있는 프로젝트를 선택하세요.");
      addChoices([{label:"MetraForge AI", id:"p_metra"},{label:"SmartStock AI", id:"p_smart"},{label:"10-Second Challenge", id:"p_10sec"}]);
    } else if(id==='p_metra'){
      addMsg("<b>MetraForge AI</b><br/>• TCN+Tabular 하이브리드 품질보증<br/>• PR-AUC 0.9667, ROC-AUC 0.9983<br/><a href='docs/metraforge_final_report.pdf' target='_blank'>최종보고서</a> · <a href='docs/metraforge_presentation.pdf' target='_blank'>발표자료</a>");
    } else if(id==='p_smart'){
      addMsg("<b>SmartStock AI</b><br/>• LSTM+CNN 수요예측·EOQ/ROP/SS<br/>• WAPE ≤15%, Fill Rate ≥95% 목표<br/><a href='docs/smartstock_final_report.pdf' target='_blank'>최종보고서</a> · <a href='docs/smartstock_user_guide.pdf' target='_blank'>유저가이드</a>");
    } else if(id==='p_10sec'){
      addMsg("<b>10-Second Challenge</b><br/>• 포즈 인식·자동촬영·점수 피드백<br/><a href='docs/10sec_presentation.pdf' target='_blank'>발표자료</a>");
    } else if(id==='close'){
      close();
    }
  }
  function q1(){
    addMsg("<b>Q1.</b> 어떤 도메인에 관심이 있으신가요?");
    addChoices([{label:"제조·물류", id:"d1"},{label:"플랫폼·SaaS", id:"d2"},{label:"실험적 프로토타입", id:"d3"}]);
    window.__answers = {domain:null, priority:null, format:null};
  }
  function q2(){
    addMsg("<b>Q2.</b> 무엇이 더 중요하신가요?");
    addChoices([{label:"문제정의", id:"p1"},{label:"데이터→인사이트", id:"p2"},{label:"의사결정 자동화", id:"p3"},{label:"협업 프로세스", id:"p4"}]);
  }
  function q3(){
    addMsg("<b>Q3.</b> 살펴볼 자료 형태를 골라주세요.");
    addChoices([{label:"요약 슬라이드", id:"f1"},{label:"상세 보고서", id:"f2"},{label:"목업/대시보드", id:"f3"}]);
  }
  function result(){
    const a = window.__answers;
    addMsg("선택 기반 추천입니다. 아래 프로젝트를 권합니다:");
    const list = document.createElement('div'); list.className='nano-choices';
    [
      {label:"MetraForge AI — 품질보증", link:"projects.html#metraforge"},
      {label:"SmartStock AI — 수요·정책", link:"projects.html#smartstock"},
      {label:"10-Second Challenge — 프로토타입", link:"projects.html#tensec"}
    ].forEach(x=>{
      const chip=document.createElement('a'); chip.className='nano-chip'; chip.textContent=x.label; chip.href=x.link; chip.target="_blank"; list.appendChild(chip);
    });
    body.appendChild(list);
    const foot = document.createElement('div'); foot.className='nano-footer';
    const btnAll=document.createElement('button'); btnAll.className='nano-close'; btnAll.textContent='전체 보기'; btnAll.addEventListener('click',()=>{window.open('projects.html','_blank')});
    const btnClose=document.createElement('button'); btnClose.className='nano-primary'; btnClose.textContent='닫기'; btnClose.addEventListener('click', ()=>{document.querySelector('.nano-close').click();});
    foot.append(btnAll, btnClose); body.appendChild(foot);
  }
  document.addEventListener('click', (e)=>{
    if(e.target.classList.contains('nano-chip')){
      const id=e.target.textContent;
    }
  });
  document.addEventListener('click', (e)=>{
    const id=e.target && e.target.getAttribute('data-id');
    if(!id) return;
  });
  if(send){
    send.addEventListener('click', ()=>{
      const v=(input.value||'').trim(); if(!v) return;
      addMsg(v,'user'); input.value='';
      setTimeout(()=> addMsg('준비 중인 기능입니다. 선택지를 사용해보세요.'), 400);
    });
  }
  // map chip ids
  document.addEventListener('click', (e)=>{
    if(!e.target.classList.contains('nano-chip')) return;
    const t=e.target.textContent;
    const map = {
 
      "이력서 볼래요":()=>handleIntent('resume'),
      "프로젝트 볼래요":()=>handleIntent('projects'),
      "미리보기":()=>handleIntent('resume_preview'),
      "PDF 다운로드":()=>handleIntent('resume_dl'),
      "MetraForge AI":()=>handleIntent('p_metra'),
      "SmartStock AI":()=>handleIntent('p_smart'),
      "10-Second Challenge":()=>handleIntent('p_10sec'),
    };
    if(map[t]) return map[t]();
    // Interview chips
    const a = window.__answers || (window.__answers={});
    if(['제조·물류','플랫폼·SaaS','실험적 프로토타입'].includes(t)){ a.domain=t; return q2(); }
    if(['문제정의','데이터→인사이트','의사결정 자동화','협업 프로세스'].includes(t)){ a.priority=t; return q3(); }
    if(['요약 슬라이드','상세 보고서','목업/대시보드'].includes(t)){ a.format=t; return result(); }
  });
})();


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

// ===== Project slider arrows (outside controls, auto 유지 + 수동 이동) =====
(function(){
  document.querySelectorAll('.slider-wrap').forEach(wrap=>{
    const slider = wrap.querySelector('.slider');
    const track  = wrap.querySelector('.slider-track');
    const slides = wrap.querySelectorAll('.slide');
    const prevBtn = wrap.querySelector('.slider-arrow.prev');
    const nextBtn = wrap.querySelector('.slider-arrow.next');
    if(!slider || !track || !slides.length || !prevBtn || !nextBtn) return;

    // 한 칸 이동폭 계산 (카드 폭 + gap)
    const rect1 = slides[0].getBoundingClientRect();
    const rect2 = slides[1] ? slides[1].getBoundingClientRect() : null;
    const gap   = rect2 ? Math.round(rect2.left - (rect1.left + rect1.width)) : 30;
    const step  = Math.round(rect1.width + gap);

    let offset = 0;
    let timer  = null;
    const RESUME_AFTER = 2000; // 수동 조작 후 자동복귀(ms)

    function go(dir){ // dir: +1 next, -1 prev
      slider.classList.add('slider--manual');
      offset += (dir * -step);              // next → 음수, prev → 양수
      track.style.setProperty('--offset', offset + 'px');

      clearTimeout(timer);
      timer = setTimeout(()=>{
        slider.classList.remove('slider--manual');
        track.style.removeProperty('--offset');
        offset = 0;
      }, RESUME_AFTER);
    }

    prevBtn.addEventListener('click', ()=> go(-1));
    nextBtn.addEventListener('click', ()=> go(+1));
  });
})();

