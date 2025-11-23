/**
 * Projects Page - Tab Navigation & Interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    initProjectTabs();
    initStickyNavigation(); // Sticky Navigation 초기화 함수 호출
});

/**
 * Initialize Project Tab Functionality (MetraForge, SmartStock, 10-Second)
 */
function initProjectTabs() {
    const tabButtons = document.querySelectorAll('.project-tab-btn');
    const projectItems = document.querySelectorAll('.project-item');

    tabButtons.forEach((button) => {
        button.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project');

            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));

            // Remove active class from all project items
            projectItems.forEach(item => item.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Add active class to corresponding project item
            const activeProject = document.querySelector(`.project-item[data-project="${projectId}"]`);
            if (activeProject) {
                activeProject.classList.add('active');
                // 프로젝트가 바뀔 때 Sticky Nav의 첫 번째 항목을 활성화
                const firstStickyNav = activeProject.querySelector('.sticky-nav-item');
                if (firstStickyNav) {
                    document.querySelectorAll('.sticky-nav-item').forEach(item => item.classList.remove('active'));
                    firstStickyNav.classList.add('active');
                }
            }
        });
    });
}

/**
 * Initialize Sticky Navigation (설계 전략, 주요 성과, 기술 구성)
 */
function initStickyNavigation() {
    document.querySelectorAll('.sticky-nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); 
            const targetId = this.getAttribute('href'); 
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // 부드러운 스크롤 애니메이션 적용
                // Sticky Nav 높이(60px) + Navbar 높이(70px) = 130px + 여백 20px. 총 150px
                window.scrollTo({
                    top: targetElement.offsetTop - 150, 
                    behavior: 'smooth'
                });

                // 클릭 시 active 상태 변경
                const currentProject = this.closest('.project-item');
                currentProject.querySelectorAll('.sticky-nav-item').forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // 스크롤 시 섹션 위치에 따라 Sticky Nav active 상태 변경
    window.addEventListener('scroll', throttle(checkActiveSection, 100));
    checkActiveSection(); // 초기 로드 시 한 번 실행

    function checkActiveSection() {
        const currentProject = document.querySelector('.project-item.active');
        if (!currentProject) return;

        const navItems = currentProject.querySelectorAll('.sticky-nav-item');
        let currentSectionId = '';
        
        // 상단 바 높이(130px) + 여백을 고려한 오프셋
        const offset = 150; 

        navItems.forEach(item => {
            const targetId = item.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // 현재 스크롤 위치(window.scrollY)가 섹션 시작 지점보다 크거나 같으면 해당 섹션을 현재 섹션으로 지정
                if (window.scrollY >= targetElement.offsetTop - offset) {
                    currentSectionId = targetElement.id;
                }
            }
        });

        // 활성 상태 업데이트
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === currentSectionId) {
                item.classList.add('active');
            }
        });

        // 스크롤이 가장 위에 있을 경우 (첫 번째 섹션 활성화)
        const firstPlanningSection = currentProject.querySelector('.project-planning');
        if (firstPlanningSection && window.scrollY < firstPlanningSection.offsetTop - offset) {
             navItems.forEach(item => item.classList.remove('active'));
             if (navItems.length > 0) {
                 navItems[0].classList.add('active');
             }
        }
    }

    // 쓰로틀링 함수 (성능 최적화)
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const context = this;
            const args = arguments;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
}

