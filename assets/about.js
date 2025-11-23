/**
 * About — particles + tabs + in-view
 * - 먼지 파티클: .dust-layer 안에 .particle 동적 생성(캡처 느낌)
 * - 커리어 탭 (이투온/금성출판사/드라폼)
 * - 인뷰 리빌 애니메이션
 */

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initCareerTabs();
  initInViewAnimations();
});

/* 01) Dust Particles (캡처 유사) */
function initParticles(){
  const layer = document.querySelector('.dust-layer');
  if(!layer) return;
  const COUNT = 50; // 과하지 않게
  const frag = document.createDocumentFragment();

  for(let i=0;i<COUNT;i++){
    const p = document.createElement('div');
    p.className = 'particle';

    const size = 2;                                  // 캡처처럼 2px 고정
    const left = Math.random()*100;
    const top = Math.random()*100;
    const delay = (Math.random()*6).toFixed(3);
    const duration = (3.2 + Math.random()*6.2).toFixed(3); // 3.2s ~ 9.4s

    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${left}%`;
    p.style.top = `${top}%`;
    p.style.animationDelay = `${delay}s`;
    p.style.animationDuration = `${duration}s`;

    frag.appendChild(p);
  }
  layer.appendChild(frag);
}

/* 02) Career Tabs */
function initCareerTabs(){
  const tabList = document.querySelector('.career-tab-list');
  if(!tabList) return;
  const tabs = tabList.querySelectorAll('.career-tab');
  const panels = document.querySelectorAll('.career-tab-panel');

  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      tabs.forEach(t=>{
        t.classList.remove('active');
        t.setAttribute('aria-selected','false');
      });
      panels.forEach(p=>{
        p.classList.add('hidden');
        p.setAttribute('aria-hidden','true');
      });

      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');
      const id = tab.getAttribute('aria-controls');
      const panel = document.getElementById(id);
      if(panel){
        panel.classList.remove('hidden');
        panel.setAttribute('aria-hidden','false');
      }
    });
  });

  if(!tabList.querySelector('.career-tab.active') && tabs.length) tabs[0].click();
}

/* 03) In-view reveal */
function initInViewAnimations(){
  const targets = document.querySelectorAll('.sec-header, .card, .matrix-section, .pill, .triple-grid .card, .step-card');
  if(!targets.length || !('IntersectionObserver' in window)) return;
  targets.forEach(t=>t.classList.add('pre-inview'));

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        entry.target.classList.remove('pre-inview');
        io.unobserve(entry.target);
      }
    });
  },{ rootMargin:'0px 0px -10% 0px', threshold:0.1 });

  targets.forEach(t=>io.observe(t));
}

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initCareerTabs();
  initInViewAnimations();
  initScrollProgress();       // ✅ 추가
});

/* ── Scroll progress bar ───────────────────── */
function initScrollProgress(){
  const bar = document.querySelector('.scroll-progress');
  if(!bar) return;

  const update = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || window.pageYOffset;
    const full = (doc.scrollHeight - window.innerHeight);
    const ratio = full > 0 ? (scrollTop / full) : 0;
    const pct = Math.min(100, Math.max(0, ratio * 100));
    bar.style.width = pct + '%';
    // 맨 위/맨 아래에서 너무 도드라지지 않게 투명도 살짝
    bar.style.opacity = (pct === 0 || pct === 100) ? 0.75 : 1;
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}
