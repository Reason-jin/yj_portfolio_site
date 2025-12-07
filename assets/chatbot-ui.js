/**
 * AI Assistant - Nano-YJ UI & Interactions
 * 챗봇 인터페이스 및 이벤트 처리
 */

class NanoYJUI {
  constructor() {
    this.isOpen = false;
    this.currentFlow = 'intro';
    this.currentMode = 'default'; // default, simulation, rag
    this.scenario = nanoYJScenario;
    this.apiEndpoint = '/api/chat';
    this.interviewHistory = [];

    // 시뮬레이션 상태
    this.simulationState = {
      isActive: false,
      questionCount: 0,
      history: []
    };

    // 타이핑 애니메이션 설정
    this.typingSkipped = false;
    this.typingSpeed = this.getTypingSpeed();
    this.currentSkipButton = null;

    // Rate Limiting 설정
    this.lastApiCall = 0;
    this.apiCooldown = 2000; // 2초 쿨다운
    this.isApiLoading = false;

    // 음성 인식 설정
    this.speechRecognition = null;
    this.isListening = false;

    // 응답 캐싱 설정
    this.responseCache = this.loadCache();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24시간

    // 에러 핸들링 설정
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1초

    // 테마 설정
    this.theme = this.loadTheme();

    // 언어 설정 (URL 경로 기반 감지)
    this.language = this.detectLanguage();

    this.initializeDOM();
    this.attachEventListeners();
    this.loadjsPDF();
    this.loadChartJS();
    this.initSpeechRecognition();
    this.restoreConversation();
    this.applyTheme();

    // 시나리오에 언어 설정 전달
    if (this.scenario && this.scenario.setLanguage) {
      this.scenario.setLanguage(this.language);
    }
  }

  // ============================================
  // 응답 캐싱 시스템
  // ============================================
  loadCache() {
    try {
      const cached = localStorage.getItem('nanoYJ_responseCache');
      if (cached) {
        const data = JSON.parse(cached);
        // 만료된 캐시 정리
        const now = Date.now();
        Object.keys(data).forEach(key => {
          if (data[key].timestamp && now - data[key].timestamp > this.cacheExpiry) {
            delete data[key];
          }
        });
        return data;
      }
    } catch (e) {
      console.error('캐시 로드 실패:', e);
    }
    return {};
  }

  saveCache() {
    try {
      localStorage.setItem('nanoYJ_responseCache', JSON.stringify(this.responseCache));
    } catch (e) {
      console.error('캐시 저장 실패:', e);
    }
  }

  getCachedResponse(query, mode = 'default') {
    const cacheKey = `${mode}:${query.toLowerCase().trim()}`;
    const cached = this.responseCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('캐시 히트:', cacheKey);
      return cached.response;
    }
    return null;
  }

  setCachedResponse(query, mode, response) {
    const cacheKey = `${mode}:${query.toLowerCase().trim()}`;
    this.responseCache[cacheKey] = {
      response: response,
      timestamp: Date.now()
    };
    this.saveCache();
  }

  // ============================================
  // 대화 맥락 유지 (세션 스토리지)
  // ============================================
  saveConversation() {
    try {
      const conversationData = {
        history: this.scenario.conversationHistory,
        currentFlow: this.currentFlow,
        currentMode: this.currentMode,
        interviewHistory: this.interviewHistory,
        simulationState: this.simulationState,
        timestamp: Date.now()
      };
      sessionStorage.setItem('nanoYJ_conversation', JSON.stringify(conversationData));
    } catch (e) {
      console.error('대화 저장 실패:', e);
    }
  }

  restoreConversation() {
    try {
      const saved = sessionStorage.getItem('nanoYJ_conversation');
      if (saved) {
        const data = JSON.parse(saved);
        // 30분 이내의 대화만 복원
        if (Date.now() - data.timestamp < 30 * 60 * 1000) {
          this.scenario.conversationHistory = data.history || [];
          this.interviewHistory = data.interviewHistory || [];
          if (data.simulationState) {
            this.simulationState = data.simulationState;
          }
          console.log('이전 대화 복원됨');
          return true;
        }
      }
    } catch (e) {
      console.error('대화 복원 실패:', e);
    }
    return false;
  }

  clearConversation() {
    sessionStorage.removeItem('nanoYJ_conversation');
    this.scenario.conversationHistory = [];
    this.interviewHistory = [];
    this.simulationState = { isActive: false, questionCount: 0, history: [] };
  }

  // ============================================
  // 테마 시스템 (다크/라이트 모드)
  // ============================================
  loadTheme() {
    return localStorage.getItem('nanoYJ_theme') || 'dark';
  }

  saveTheme(theme) {
    this.theme = theme;
    localStorage.setItem('nanoYJ_theme', theme);
  }

  applyTheme() {
    const modal = document.querySelector('.nano-modal');
    if (modal) {
      modal.classList.remove('theme-dark', 'theme-light');
      modal.classList.add(`theme-${this.theme}`);
    }
  }

  toggleTheme() {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.saveTheme(newTheme);
    this.applyTheme();
    return newTheme;
  }

  // ============================================
  // 다국어 지원 시스템
  // ============================================
  detectLanguage() {
    // 먼저 저장된 언어 설정 확인
    const savedLang = localStorage.getItem('nanoYJ_language');
    if (savedLang) {
      return savedLang;
    }
    // URL 경로에서 언어 감지 (/en/ 포함 시 영문)
    const path = window.location.pathname;
    if (path.includes('/en/') || path.includes('/en')) {
      return 'en';
    }
    return 'ko';
  }

  // 언어 전환
  toggleLanguage() {
    this.language = this.language === 'ko' ? 'en' : 'ko';
    localStorage.setItem('nanoYJ_language', this.language);

    // 시나리오에 언어 설정 전달
    if (this.scenario && this.scenario.setLanguage) {
      this.scenario.setLanguage(this.language);
    }

    // 언어 버튼 텍스트 업데이트
    this.updateLangButton();

    // 입력창 placeholder 업데이트
    const input = document.querySelector('.nano-input input');
    if (input) {
      input.placeholder = this.language === 'ko' ? '메시지를 입력하세요' : 'Type a message';
    }

    // 대화 초기화하고 새 언어로 인트로 표시
    this.clearChatBody();
    this.showIntro();

    // 언어 변경 메시지
    const msg = this.language === 'ko'
      ? '언어가 <b>한국어</b>로 변경되었습니다.'
      : 'Language changed to <b>English</b>.';
    this.addBotMessage(msg);
  }

  updateLangButton() {
    const langBtn = document.querySelector('.nano-lang-btn');
    if (langBtn) {
      langBtn.textContent = this.language === 'ko' ? 'EN' : '한국어';
      langBtn.title = this.language === 'ko' ? 'Switch to English' : '한국어로 변경';
    }
  }

  clearChatBody() {
    const body = document.querySelector('.nano-body');
    if (body) {
      body.innerHTML = '';
    }
  }

  // 다국어 메시지 가져오기
  t(key) {
    const messages = {
      ko: {
        intro: '안녕하세요, 저는 <b>Nano-YJ</b>입니다.<br/><br/>YUJIN LEE에 대해 궁금한 점을 자유롭게 질문해주세요. 경력, 프로젝트, 역량 등 다양한 정보를 안내해드립니다.<br/><br/><span style="color:rgba(255,255,255,0.5); font-size:0.8rem;">단축키: ESC(닫기) / /(입력) / Ctrl+Shift+L(테마)</span>',
        showResume: '경력 및 이력 보기',
        showProjects: '프로젝트 탐색',
        showStrength: '핵심 역량 소개',
        freeQuestion: '자유 질문 (AI 검색)',
        toggleTheme: '테마 변경',
        settings: '설정',
        ragMode: '<b>AI 검색 모드</b>입니다.<br/><br/>YUJIN LEE의 이력서, 프로젝트 보고서 등에서 정보를 검색해 답변합니다.<br/><br/>궁금한 내용을 자유롭게 질문하세요!',
        metraforgeQ: 'MetraForge AI 성과는?',
        smartstockQ: 'SmartStock 기술 스택?',
        strengthQ: 'YUJIN의 강점?',
        careerQ: '경력 요약',
        back: '이전으로',
        themeChanged: (theme) => `테마가 <b>${theme === 'dark' ? '다크' : '라이트'}</b> 모드로 변경되었습니다.`,
        loading: '답변을 생성 중입니다...',
        error: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
        inputPlaceholder: '질문을 입력하세요...'
      },
      en: {
        intro: 'Hello, I am <b>Nano-YJ</b>.<br/><br/>Feel free to ask any questions about YUJIN LEE. I can help you with career info, projects, and skills.<br/><br/><span style="color:rgba(255,255,255,0.5); font-size:0.8rem;">Shortcuts: ESC(close) / /(focus) / Ctrl+Shift+L(theme)</span>',
        showResume: 'View Career & Resume',
        showProjects: 'Explore Projects',
        showStrength: 'Core Competencies',
        freeQuestion: 'Free Question (AI Search)',
        toggleTheme: 'Toggle Theme',
        settings: 'Settings',
        ragMode: '<b>AI Search Mode</b><br/><br/>I search through YUJIN LEE\'s resume and project reports to answer your questions.<br/><br/>Feel free to ask anything!',
        metraforgeQ: 'MetraForge AI results?',
        smartstockQ: 'SmartStock tech stack?',
        strengthQ: 'YUJIN\'s strengths?',
        careerQ: 'Career summary',
        back: 'Go Back',
        themeChanged: (theme) => `Theme changed to <b>${theme === 'dark' ? 'Dark' : 'Light'}</b> mode.`,
        loading: 'Generating response...',
        error: 'Sorry, an error occurred. Please try again.',
        inputPlaceholder: 'Type your question...'
      }
    };
    return messages[this.language]?.[key] || messages['ko'][key];
  }

  // jsPDF 라이브러리 동적 로드
  loadjsPDF() {
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        console.log('jsPDF loaded');
        // 한글 폰트 로드
        this.loadKoreanFont();
      };
      document.head.appendChild(script);
    }
  }

  // 한글 폰트 로드 (Nanum Gothic TTF)
  async loadKoreanFont() {
    try {
      // Google Fonts에서 나눔고딕 TTF 로드
      const fontUrl = 'https://fonts.gstatic.com/s/nanumgothic/v23/PN_3Rfi-oW3hYwmKDpxS7F_z-7r_xFtIsPV5MbNOyrVj67GNc9w.ttf';
      const response = await fetch(fontUrl);
      if (!response.ok) throw new Error('Font fetch failed');
      const arrayBuffer = await response.arrayBuffer();
      const base64 = this.arrayBufferToBase64(arrayBuffer);
      this.koreanFontBase64 = base64;
      this.koreanFontLoaded = true;
      console.log('Korean font (Nanum Gothic) loaded successfully');
    } catch (error) {
      console.error('Failed to load Korean font:', error);
      this.koreanFontLoaded = false;
    }
  }

  // ArrayBuffer to Base64 변환
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Chart.js 라이브러리 동적 로드
  loadChartJS() {
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.onload = () => console.log('Chart.js loaded');
      document.head.appendChild(script);
    }
  }

  // 타이핑 속도 설정 가져오기
  getTypingSpeed() {
    const savedSpeed = localStorage.getItem('nanoYJ_typingSpeed');
    return savedSpeed ? parseInt(savedSpeed) : 20;
  }

  // 타이핑 속도 설정 저장
  setTypingSpeed(speed) {
    this.typingSpeed = speed;
    localStorage.setItem('nanoYJ_typingSpeed', speed.toString());
  }

  // 음성 인식 초기화
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = 'ko-KR';

      this.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (this.inputField) {
          this.inputField.value = transcript;
        }
        this.isListening = false;
        this.updateVoiceButton();
      };

      this.speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        this.updateVoiceButton();
      };

      this.speechRecognition.onend = () => {
        this.isListening = false;
        this.updateVoiceButton();
      };
    }
  }

  // 음성 버튼 상태 업데이트
  updateVoiceButton() {
    const voiceBtn = document.querySelector('.nano-voice-btn');
    if (voiceBtn) {
      voiceBtn.classList.toggle('listening', this.isListening);
      voiceBtn.innerHTML = this.isListening ? 'REC' : 'MIC';
    }
  }

  // 음성 입력 토글
  toggleVoiceInput() {
    if (!this.speechRecognition) {
      this.addBotMessage('이 브라우저에서는 음성 인식을 지원하지 않습니다.');
      return;
    }

    if (this.isListening) {
      this.speechRecognition.stop();
      this.isListening = false;
    } else {
      this.speechRecognition.start();
      this.isListening = true;
    }
    this.updateVoiceButton();
  }

  // 로딩 인디케이터 표시
  showLoading() {
    this.isApiLoading = true;
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'nano-msg bot nano-loading';
    loadingDiv.innerHTML = `
      <div class="bubble loading-bubble">
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
        <span class="loading-text">답변을 생성하고 있습니다...</span>
      </div>
    `;
    this.body?.appendChild(loadingDiv);
    this.scrollToBottom();
  }

  // 로딩 인디케이터 제거
  hideLoading() {
    this.isApiLoading = false;
    const loading = this.body?.querySelector('.nano-loading');
    if (loading) {
      loading.remove();
    }
  }

  // Rate Limiting 체크
  checkRateLimit() {
    const now = Date.now();
    if (now - this.lastApiCall < this.apiCooldown) {
      this.addBotMessage('잠시 후 다시 시도해주세요.');
      return false;
    }
    this.lastApiCall = now;
    return true;
  }

  // 통계 추적 - 질문 클릭 기록
  trackQuestionClick(questionKey) {
    try {
      let stats = JSON.parse(localStorage.getItem('nanoYJ_stats') || '{}');
      if (!stats.questions) stats.questions = {};
      if (!stats.questions[questionKey]) {
        stats.questions[questionKey] = { count: 0, firstAsked: new Date().toISOString() };
      }
      stats.questions[questionKey].count++;
      stats.questions[questionKey].lastAsked = new Date().toISOString();
      stats.totalQuestions = (stats.totalQuestions || 0) + 1;
      localStorage.setItem('nanoYJ_stats', JSON.stringify(stats));
    } catch (error) {
      console.error('통계 저장 오류:', error);
    }
  }

  // 통계 가져오기
  getStats() {
    try {
      return JSON.parse(localStorage.getItem('nanoYJ_stats') || '{}');
    } catch (error) {
      return {};
    }
  }

  // 인기 질문 TOP 3
  showPopularQuestions() {
    const stats = this.getStats();
    if (!stats.questions || Object.keys(stats.questions).length === 0) return null;

    const sorted = Object.entries(stats.questions)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);

    const labels = {
      'introduction': '자기소개', 'strength': '강점', 'weakness': '약점',
      'motivation': '지원 이유', 'project_experience': '프로젝트 경험',
      'conflict': '갈등 해결', 'failure': '실패 경험', 'future': '미래 비전'
    };

    return sorted.map(([key, data]) => ({
      key, count: data.count, label: labels[key] || key
    }));
  }

  // DOM 초기화
  initializeDOM() {
    this.launcher = document.querySelector('.nano-yj-launch');
    this.overlay = document.querySelector('.nano-overlay');
    this.modal = document.querySelector('.nano-modal');
    this.closeBtn = document.querySelector('.nano-close');
    this.body = document.querySelector('.nano-body');
    this.inputContainer = document.querySelector('.nano-input');
    this.inputField = document.querySelector('.nano-input input');
    this.sendBtn = document.querySelector('.nano-send');
  }

  // 이벤트 리스너 연결
  attachEventListeners() {
    this.launcher?.addEventListener('click', () => this.open());
    this.overlay?.addEventListener('click', () => this.close());
    this.closeBtn?.addEventListener('click', () => this.close());
    this.sendBtn?.addEventListener('click', () => this.handleUserInput());
    this.inputField?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleUserInput();
    });

    // 키보드 단축키
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  // ============================================
  // 키보드 단축키 처리
  // ============================================
  handleKeyboardShortcuts(e) {
    // ESC: 챗봇 닫기
    if (e.key === 'Escape' && this.isOpen) {
      e.preventDefault();
      this.close();
    }

    // Ctrl/Cmd + Shift + C: 챗봇 열기/닫기 토글
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    // Ctrl/Cmd + Shift + L: 테마 전환 (Light/Dark)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      if (this.isOpen) {
        const newTheme = this.toggleTheme();
        const themeMsg = this.language === 'en'
          ? `Theme changed to <b>${newTheme === 'dark' ? 'Dark' : 'Light'}</b> mode.`
          : `테마가 <b>${newTheme === 'dark' ? '다크' : '라이트'}</b> 모드로 변경되었습니다.`;
        this.addBotMessage(themeMsg);
        this.scrollToBottom();
      }
    }

    // Ctrl/Cmd + Shift + R: 대화 초기화
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      if (this.isOpen) {
        this.clearConversation();
        this.displayFlow('intro');
      }
    }

    // 챗봇이 열려 있고 입력 필드에 포커스가 없을 때
    if (this.isOpen && document.activeElement !== this.inputField) {
      // / 키: 입력 필드 포커스
      if (e.key === '/') {
        e.preventDefault();
        this.inputField?.focus();
      }
    }
  }

  // 챗봇 열기
  open() {
    this.isOpen = true;
    this.modal?.classList.add('active');
    this.overlay?.classList.add('active');
    this.updateLangButton();
    if (this.currentFlow === 'intro') {
      this.displayFlow('intro');
    }
  }

  // 챗봇 닫기
  close() {
    this.isOpen = false;
    this.modal?.classList.remove('active');
    this.overlay?.classList.remove('active');
  }

  // 흐름 표시
  async displayFlow(flowType, data = {}) {
    this.currentFlow = flowType;
    let flowData;

    switch (flowType) {
      case 'intro':
        this.currentMode = 'default';
        this.simulationState.isActive = false;
        flowData = this.scenario.getIntro();
        break;
      case 'simulation':
        this.currentMode = 'simulation';
        flowData = this.scenario.getSimulationMode();
        break;
      case 'rag_mode':
        this.currentMode = 'rag';
        flowData = this.scenario.getRAGMode();
        break;
      case 'interview_mode':
        flowData = this.scenario.getInterviewMode();
        break;
      case 'interview_answer':
        flowData = this.scenario.getInterviewAnswer(data.questionKey);
        break;
      case 'interview_q1':
        flowData = this.scenario.getInterviewQ1();
        break;
      case 'interview_q2':
        flowData = this.scenario.getInterviewQ2();
        break;
      case 'interview_q3':
        flowData = this.scenario.getInterviewQ3();
        break;
      case 'interview_result':
        flowData = this.scenario.getInterviewResult();
        break;
      case 'resume':
        flowData = this.scenario.getResume();
        break;
      case 'projects':
        flowData = this.scenario.getProjects();
        break;
      case 'project_detail':
        flowData = this.scenario.getProjectDetail(data.projectId);
        break;
      case 'downloads':
        flowData = this.scenario.getDownloads();
        break;
      case 'end':
        flowData = this.scenario.getEnd();
        break;
      default:
        flowData = this.scenario.getIntro();
    }

    await this.renderFlow(flowData);
  }

  // 흐름 렌더링
  async renderFlow(flowData) {
    this.clearBody();
    this.addBotMessage(flowData.message);

    // 면접 답변 타입 처리
    if (flowData.type === 'interview_answer') {
      const questionDiv = document.createElement('div');
      questionDiv.className = 'nano-msg bot';
      questionDiv.innerHTML = `<div class="bubble interview-question"><b>Q: ${flowData.question}</b></div>`;
      this.body?.appendChild(questionDiv);

      const answerDiv = document.createElement('div');
      answerDiv.className = 'nano-msg bot';
      const answerBubble = document.createElement('div');
      answerBubble.className = 'bubble interview-answer fade-in';
      answerDiv.appendChild(answerBubble);
      this.body?.appendChild(answerDiv);

      await this.typeText(answerBubble, flowData.answer, 15);

      if (flowData.sources && flowData.sources.length > 0) {
        this.renderSources(flowData.sources);
      }

      this.interviewHistory.push({
        question: flowData.question,
        answer: flowData.answer,
        timestamp: new Date()
      });
    }
    else if (flowData.type === 'result') {
      this.renderProjectCards(flowData.projects);
    } else if (flowData.type === 'resume') {
      this.renderResumePreview(flowData.preview);
    } else if (flowData.type === 'project_detail') {
      this.renderProjectDetail(flowData.project);
    } else if (flowData.type === 'downloads') {
      this.renderDownloads(flowData.resources);
    } else if (flowData.type === 'simulation') {
      // 시뮬레이션 모드 배지 표시
      this.showAgentBadge('simulation');
    } else if (flowData.type === 'rag_mode') {
      // RAG 모드 배지 표시
      this.showAgentBadge('rag');
    }

    if (flowData.choices && flowData.choices.length > 0) {
      this.renderChoices(flowData.choices);
    }

    if (flowData.allowFreetext !== false) {
      this.inputContainer?.classList.remove('hidden');
    } else {
      this.inputContainer?.classList.add('hidden');
    }

    this.scrollToBottom();
  }

  // 봇 메시지 추가
  addBotMessage(content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'nano-msg bot';
    msgDiv.innerHTML = `<div class="bubble">${content}</div>`;
    this.body?.appendChild(msgDiv);
    this.scenario.addMessage('bot', content);
  }

  // 사용자 메시지 추가
  addUserMessage(content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'nano-msg user';
    msgDiv.innerHTML = `<div class="bubble">${content}</div>`;
    this.body?.appendChild(msgDiv);
    this.scenario.addMessage('user', content);
  }

  // 선택지 렌더
  renderChoices(choices) {
    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'nano-choices';

    choices.forEach(choice => {
      const chip = document.createElement('button');
      chip.className = 'nano-chip';
      chip.textContent = choice.label;
      chip.addEventListener('click', () => this.handleChoice(choice));
      choicesDiv.appendChild(chip);
    });

    this.body?.appendChild(choicesDiv);

    // 면접 모드에서 PDF 다운로드 버튼
    if (this.currentFlow === 'interview_answer' && this.interviewHistory.length > 0) {
      const pdfBtn = document.createElement('button');
      pdfBtn.className = 'nano-chip pdf-download';
      pdfBtn.textContent = '면접 내용 PDF 다운로드';
      pdfBtn.addEventListener('click', () => this.downloadInterviewPDF());
      choicesDiv.appendChild(pdfBtn);
    }

    // 타이핑 속도 설정 버튼
    if (this.currentFlow === 'interview_mode' || this.currentFlow === 'interview_answer') {
      const settingsBtn = document.createElement('button');
      settingsBtn.className = 'nano-chip settings-btn';
      settingsBtn.textContent = '타이핑 속도';
      settingsBtn.addEventListener('click', () => this.showSettings());
      choicesDiv.appendChild(settingsBtn);
    }
  }

  // 프로젝트 카드 렌더
  renderProjectCards(projects) {
    const cardsDiv = document.createElement('div');
    cardsDiv.className = 'nano-project-cards';

    projects.forEach(project => {
      const card = document.createElement('div');
      card.className = 'nano-project-card';
      card.innerHTML = `
        <div class="card-header">
          <h4>${project.name}</h4>
          <span class="card-badge">${project.badge}</span>
        </div>
        <p class="card-subtitle">${project.subtitle}</p>
        <div class="card-highlights">
          ${project.highlights.map(h => `<span class="highlight">• ${h}</span>`).join('')}
        </div>
      `;
      cardsDiv.appendChild(card);
    });

    this.body?.appendChild(cardsDiv);
  }

  // 이력서 미리보기 렌더
  renderResumePreview(preview) {
    const previewDiv = document.createElement('div');
    previewDiv.className = 'nano-resume-preview';
    previewDiv.innerHTML = `
      <div class="resume-card">
        <h3>${preview.title}</h3>
        <p class="resume-subtitle">${preview.subtitle}</p>
        <div class="resume-highlights">
          ${preview.highlights.map(h => `<div class="resume-item">• ${h}</div>`).join('')}
        </div>
      </div>
    `;
    this.body?.appendChild(previewDiv);
  }

  // 프로젝트 상세 렌더
  renderProjectDetail(project) {
    const detailDiv = document.createElement('div');
    detailDiv.className = 'nano-project-detail';
    detailDiv.innerHTML = `
      <div class="detail-header">
        <h3>${project.name}</h3>
        <p class="detail-subtitle">${project.subtitle}</p>
      </div>
      <div class="detail-section">
        <h4>주요 특징</h4>
        <ul>${project.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
      </div>
      <div class="detail-section">
        <h4>자료</h4>
        <div class="resource-links">
          ${project.resources.map(r => `
            <a href="${r.url}" target="_blank" class="resource-link">${r.title}</a>
          `).join('')}
        </div>
      </div>
    `;
    this.body?.appendChild(detailDiv);
  }

  // 공통 자료 렌더
  renderDownloads(resources) {
    const downloadsDiv = document.createElement('div');
    downloadsDiv.className = 'nano-downloads';
    downloadsDiv.innerHTML = `
      <div class="downloads-list">
        ${resources.map(r => `
          <a href="${r.url}" target="_blank" class="download-item">${r.title}</a>
        `).join('')}
      </div>
    `;
    this.body?.appendChild(downloadsDiv);
  }

  // 증빙 자료 렌더링
  renderSources(sources) {
    let html = `<div class="sources-container">
      <h4 class="sources-title">증빙 자료 및 출처</h4>
      <div class="sources-list">`;

    sources.forEach(source => {
      html += `<div class="source-item source-${source.type}"><div class="source-content">`;
      if (source.type === 'career') {
        html += `<strong>${source.title}</strong>`;
        if (source.period) html += `<span class="source-period">${source.period}</span>`;
        if (source.verified) html += `<span class="source-badge verified">재직 확인</span>`;
      } else if (source.link) {
        html += `<a href="${source.link}" target="_blank" class="source-link">${source.title}</a>`;
      } else {
        html += `<strong>${source.title}</strong>`;
        if (source.value) html += `<span class="source-value">${source.value}</span>`;
      }
      html += `</div></div>`;
    });

    html += `</div></div>`;

    const sourcesDiv = document.createElement('div');
    sourcesDiv.className = 'nano-msg bot';
    sourcesDiv.innerHTML = `<div class="bubble sources-bubble">${html}</div>`;
    this.body?.appendChild(sourcesDiv);
  }

  // 선택지 처리
  async handleChoice(choice) {
    // label이 있을 때만 사용자 메시지 추가 (API 호출 시 label 없이 action만 전달되는 경우 방지)
    if (choice.label) {
      this.addUserMessage(choice.label);
    }

    const actionMap = {
      // RAG 모드
      'start_rag_mode': () => this.displayFlow('rag_mode'),
      'rag_metraforge': () => this.sendRAGQuery('MetraForge AI의 성과와 주요 특징을 알려줘'),
      'rag_smartstock': () => this.sendRAGQuery('SmartStock AI의 기술 스택과 아키텍처를 설명해줘'),
      'rag_strength': () => this.sendRAGQuery('YUJIN LEE의 핵심 강점은 무엇인가요?'),
      'rag_career': () => this.sendRAGQuery('YUJIN LEE의 경력을 요약해줘'),

      // 기존 액션들
      'start_interview_mode': () => { this.trackSessionStart(); this.displayFlow('interview_mode'); },
      'ask_introduction': () => { this.trackQuestionClick('introduction'); this.displayFlow('interview_answer', { questionKey: 'introduction' }); },
      'ask_strength': () => { this.trackQuestionClick('strength'); this.displayFlow('interview_answer', { questionKey: 'strength' }); },
      'ask_weakness': () => { this.trackQuestionClick('weakness'); this.displayFlow('interview_answer', { questionKey: 'weakness' }); },
      'ask_motivation': () => { this.trackQuestionClick('motivation'); this.displayFlow('interview_answer', { questionKey: 'motivation' }); },
      'ask_project_experience': () => { this.trackQuestionClick('project_experience'); this.displayFlow('interview_answer', { questionKey: 'project_experience' }); },
      'ask_conflict': () => { this.trackQuestionClick('conflict'); this.displayFlow('interview_answer', { questionKey: 'conflict' }); },
      'ask_failure': () => { this.trackQuestionClick('failure'); this.displayFlow('interview_answer', { questionKey: 'failure' }); },
      'ask_future': () => { this.trackQuestionClick('future'); this.displayFlow('interview_answer', { questionKey: 'future' }); },
      'continue_interview_mode': () => this.displayFlow('interview_mode'),
      'show_stats': () => this.displayStats(),
      'show_competency_analysis': () => this.displayCompetencyAnalysis(),
      'start_interview': () => this.displayFlow('interview_q1'),
      'show_resume': () => this.displayFlow('resume'),
      'show_projects': () => this.displayFlow('projects'),
      'back_to_intro': () => this.displayFlow('intro'),
      'back_to_projects': () => this.displayFlow('projects'),
      'go_to_main': () => { window.location.href = './index.html'; },
      'close': () => setTimeout(() => this.close(), 500),
      'download_resume': () => window.open('./docs/resume_yujin_lee.pdf', '_blank'),
      'select_project': () => this.displayFlow('project_detail', { projectId: choice.projectId }),
      'toggle_theme': () => this.handleThemeToggle(),
      'show_settings': () => this.showGlobalSettings(),
      'clear_cache': () => this.clearCacheWithMessage(),
      'clear_conversation': () => this.clearConversationWithMessage(),
    };

    if (actionMap[choice.action]) {
      actionMap[choice.action]();
    }

    // 인터뷰 질문 응답 처리
    if (['interview_q1', 'interview_q2', 'interview_q3'].includes(this.currentFlow)) {
      this.scenario.recordChoice(this.currentFlow.replace('interview_', ''), choice.value);
      const nextFlow = {
        'interview_q1': 'interview_q2',
        'interview_q2': 'interview_q3',
        'interview_q3': 'interview_result'
      };
      if (nextFlow[this.currentFlow]) {
        setTimeout(() => this.displayFlow(nextFlow[this.currentFlow]), 500);
      }
    }
  }

  // 사용자 입력 처리
  async handleUserInput() {
    const userInput = this.inputField?.value.trim();
    if (!userInput || this.isApiLoading) return;
    if (!this.checkRateLimit()) return;

    this.addUserMessage(userInput);
    this.inputField.value = '';

    // 모드에 따른 처리
    if (this.currentMode === 'simulation' && this.simulationState.isActive) {
      await this.handleSimulationInput(userInput);
    } else if (this.currentMode === 'rag') {
      await this.sendRAGQuery(userInput);
    } else {
      await this.sendDefaultQuery(userInput);
    }
  }

  // 기본 쿼리 전송 (멀티 에이전트) - 캐싱 및 재시도 적용
  async sendDefaultQuery(userInput) {
    // 캐시 확인
    const cached = this.getCachedResponse(userInput, 'default');
    if (cached) {
      if (cached.agent) {
        this.showAgentBadge(cached.agent);
      }
      this.addBotMessage(`<i style="color:#888; font-size:0.8rem">(캐시된 응답)</i><br/>${cached.reply}`);
      this.saveConversation();
      this.scrollToBottom();
      return;
    }

    this.showLoading();

    // 재시도 로직
    let lastError = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userInput,
            history: this.scenario.conversationHistory,
            language: this.language,
            context: { currentFlow: this.currentFlow, userChoices: this.scenario.userChoices }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          this.hideLoading();
          const data = await response.json();

          // 응답 캐싱
          this.setCachedResponse(userInput, 'default', data);

          // 에이전트 정보 표시
          if (data.agent) {
            this.showAgentBadge(data.agent);
          }

          this.addBotMessage(data.reply);

          // 꼬리 질문 표시
          if (data.followUp && data.followUp.length > 0) {
            this.renderFollowUpQuestions(data.followUp);
          }

          // 리소스 링크 표시
          if (data.resources && data.resources.length > 0) {
            this.renderResourceLinks(data.resources);
          }

          // 대화 저장
          this.saveConversation();

          if (data.action) {
            setTimeout(() => this.handleChoice({ action: data.action }), 1000);
          }

          this.scrollToBottom();
          return; // 성공 시 종료
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        lastError = error;
        console.warn(`API 요청 실패 (시도 ${attempt}/${this.maxRetries}):`, error.message);

        if (attempt < this.maxRetries) {
          // 재시도 전 대기
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    // 모든 재시도 실패
    this.hideLoading();
    console.error('API 요청 최종 실패:', lastError);
    this.handleFallbackResponse(userInput);
    this.scrollToBottom();
  }

  // RAG 쿼리 전송 - 캐싱 및 재시도 적용
  async sendRAGQuery(query) {
    // 캐시 확인
    const cached = this.getCachedResponse(query, 'rag');
    if (cached) {
      if (cached.sources && cached.sources.length > 0) {
        this.showRAGSources(cached.sources);
      }
      this.addBotMessage(`<i style="color:#888; font-size:0.8rem">(캐시된 응답)</i><br/>${cached.reply}`);
      this.renderRAGModeButtons();
      this.saveConversation();
      this.scrollToBottom();
      return;
    }

    this.showLoading();

    // 재시도 로직
    let lastError = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            mode: 'rag',
            language: this.language,
            context: { currentFlow: this.currentFlow }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          this.hideLoading();
          const data = await response.json();

          // 응답 캐싱
          this.setCachedResponse(query, 'rag', data);

          // RAG 소스 정보 표시
          if (data.sources && data.sources.length > 0) {
            this.showRAGSources(data.sources);
          }

          this.addBotMessage(data.reply);

          // RAG 모드 유지 버튼
          this.renderRAGModeButtons();

          // 대화 저장
          this.saveConversation();

          this.scrollToBottom();
          return; // 성공 시 종료
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        lastError = error;
        console.warn(`RAG 요청 실패 (시도 ${attempt}/${this.maxRetries}):`, error.message);

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    // 모든 재시도 실패
    this.hideLoading();
    console.error('RAG 요청 최종 실패:', lastError);
    this.addBotMessage('문서 검색에 실패했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.');
    this.renderRAGModeButtons();
    this.scrollToBottom();
  }

  // 면접 시뮬레이션 시작
  startSimulation() {
    this.simulationState = {
      isActive: true,
      questionCount: 0,
      history: []
    };
    this.currentMode = 'simulation';
    this.addBotMessage('<b>면접 시뮬레이션을 시작합니다!</b><br/><br/>안녕하세요, 지원자님. 오늘 면접을 진행하게 된 면접관입니다.<br/>편하게 답변해주시면 됩니다.<br/><br/><b>Q1. 간단히 자기소개 부탁드립니다.</b>');
    this.simulationState.questionCount = 1;
    this.scrollToBottom();
  }

  // 시뮬레이션 입력 처리
  async handleSimulationInput(userInput) {
    this.showLoading();

    // 시뮬레이션 히스토리에 추가
    this.simulationState.history.push({
      role: 'user',
      content: userInput,
      agent: 'simulation'
    });

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          history: this.simulationState.history,
          context: {
            currentFlow: 'simulation',
            simulationState: {
              questionCount: this.simulationState.questionCount
            }
          }
        })
      });

      this.hideLoading();

      if (response.ok) {
        const data = await response.json();

        // 시뮬레이션 히스토리에 답변 추가
        this.simulationState.history.push({
          role: 'assistant',
          content: data.reply,
          agent: 'simulation'
        });

        this.addBotMessage(data.reply);

        // 시뮬레이션 상태 업데이트
        if (data.simulationState) {
          this.simulationState.questionCount = data.simulationState.questionCount;

          if (data.simulationState.isComplete) {
            this.endSimulation();
          }
        } else {
          this.simulationState.questionCount++;

          if (this.simulationState.questionCount > 5) {
            this.endSimulation();
          }
        }
      } else {
        this.addBotMessage('시뮬레이션 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      this.hideLoading();
      console.error('시뮬레이션 오류:', error);
      this.addBotMessage('네트워크 오류가 발생했습니다.');
    }

    this.scrollToBottom();
  }

  // 시뮬레이션 종료
  endSimulation() {
    this.simulationState.isActive = false;

    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'nano-choices';

    const choices = [
      { label: '다시 시작', action: 'start_simulation' },
      { label: '면접 모드로', action: 'start_interview_mode' },
      { label: '메인으로', action: 'back_to_intro' }
    ];

    choices.forEach(choice => {
      const chip = document.createElement('button');
      chip.className = 'nano-chip';
      chip.textContent = choice.label;
      chip.addEventListener('click', () => this.handleChoice(choice));
      choicesDiv.appendChild(chip);
    });

    this.body?.appendChild(choicesDiv);
    this.scrollToBottom();
  }

  // 에이전트 배지 표시
  showAgentBadge(agentType) {
    const badgeMap = {
      'interview': { label: '인물 정보', color: '#B4A0F0' },
      'project': { label: '프로젝트', color: '#6BBCC6' },
      'career': { label: '경력 정보', color: '#F0A0A0' },
      'rag': { label: 'AI 검색', color: '#F0D4A0' },
      'general': { label: 'Nano-YJ', color: '#888' }
    };

    const badge = badgeMap[agentType] || badgeMap['general'];

    const badgeDiv = document.createElement('div');
    badgeDiv.className = 'nano-agent-badge';
    badgeDiv.style.cssText = `
      display: inline-block;
      background: ${badge.color}20;
      color: ${badge.color};
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      margin-bottom: 8px;
      border: 1px solid ${badge.color}40;
    `;
    badgeDiv.textContent = badge.label;
    this.body?.appendChild(badgeDiv);
  }

  // RAG 소스 표시
  showRAGSources(sources) {
    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'nano-rag-sources';
    sourceDiv.style.cssText = `
      background: rgba(240, 212, 160, 0.1);
      border-left: 3px solid #F0D4A0;
      padding: 8px 12px;
      margin-bottom: 10px;
      border-radius: 0 8px 8px 0;
      font-size: 0.8rem;
    `;

    let html = '<b style="color:#F0D4A0;">참조 문서:</b><br/>';
    sources.forEach(src => {
      html += `• ${src.title}<br/>`;
    });

    sourceDiv.innerHTML = html;
    this.body?.appendChild(sourceDiv);
  }

  // 꼬리 질문 렌더링
  renderFollowUpQuestions(questions) {
    const div = document.createElement('div');
    div.className = 'nano-followup';
    div.style.cssText = `
      margin-top: 10px;
      padding: 10px;
      background: rgba(107, 188, 198, 0.1);
      border-radius: 8px;
    `;

    let html = '<b style="color:#6BBCC6; font-size:0.85rem;">관련 질문:</b><br/>';
    questions.forEach(q => {
      html += `<button class="nano-followup-btn" style="
        background: transparent;
        border: 1px solid #6BBCC630;
        color: #6BBCC6;
        padding: 5px 10px;
        margin: 4px 4px 4px 0;
        border-radius: 15px;
        font-size: 0.8rem;
        cursor: pointer;
      ">${q}</button>`;
    });

    div.innerHTML = html;
    this.body?.appendChild(div);

    // 클릭 이벤트 추가
    div.querySelectorAll('.nano-followup-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.inputField.value = btn.textContent;
        this.handleUserInput();
      });
    });
  }

  // 리소스 링크 렌더링
  renderResourceLinks(resources) {
    const div = document.createElement('div');
    div.className = 'nano-resources';
    div.style.cssText = `
      margin-top: 10px;
      padding: 10px;
      background: rgba(180, 160, 240, 0.1);
      border-radius: 8px;
    `;

    let html = '<b style="color:#B4A0F0; font-size:0.85rem;">관련 자료:</b><br/>';
    resources.forEach(r => {
      html += `<a href="${r.url}" target="_blank" style="
        display: inline-block;
        color: #B4A0F0;
        padding: 5px 10px;
        margin: 4px 4px 4px 0;
        border: 1px solid #B4A0F030;
        border-radius: 15px;
        font-size: 0.8rem;
        text-decoration: none;
      ">${r.title}</a>`;
    });

    div.innerHTML = html;
    this.body?.appendChild(div);
  }

  // RAG 모드 버튼
  renderRAGModeButtons() {
    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'nano-choices';

    const choices = [
      { label: '다른 질문하기', action: null },
      { label: '메인으로', action: 'back_to_intro' }
    ];

    choices.forEach(choice => {
      const chip = document.createElement('button');
      chip.className = 'nano-chip';
      chip.textContent = choice.label;
      if (choice.action) {
        chip.addEventListener('click', () => this.handleChoice(choice));
      }
      choicesDiv.appendChild(chip);
    });

    this.body?.appendChild(choicesDiv);
  }

  // Fallback 응답 처리
  handleFallbackResponse(userInput) {
    const input = userInput.toLowerCase();
    const keywords = {
      '자기소개': 'introduction', '소개': 'introduction',
      '강점': 'strength', '장점': 'strength',
      '약점': 'weakness', '단점': 'weakness',
      '프로젝트': 'project_experience',
      '갈등': 'conflict',
      '실패': 'failure',
      '미래': 'future', '5년': 'future', '비전': 'future'
    };

    let matchedKey = null;
    for (const [keyword, key] of Object.entries(keywords)) {
      if (input.includes(keyword)) {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey && this.scenario.interviewQuestionsDB[matchedKey]) {
      const qa = this.scenario.interviewQuestionsDB[matchedKey];
      this.addBotMessage(`<i style="color:#999">(오프라인 응답)</i><br/><br/>${qa.answer}`);
    } else {
      this.addBotMessage('죄송합니다. 현재 AI 서비스에 연결할 수 없습니다. 아래 질문을 선택해주세요.');
      const choicesDiv = document.createElement('div');
      choicesDiv.className = 'nano-choices';
      [
        { label: '자기소개', action: 'ask_introduction' },
        { label: '강점', action: 'ask_strength' },
        { label: '프로젝트 경험', action: 'ask_project_experience' }
      ].forEach(q => {
        const chip = document.createElement('button');
        chip.className = 'nano-chip';
        chip.textContent = q.label;
        chip.addEventListener('click', () => this.handleChoice(q));
        choicesDiv.appendChild(chip);
      });
      this.body?.appendChild(choicesDiv);
    }
  }

  // 본문 비우기
  clearBody() {
    if (this.body) this.body.innerHTML = '';
  }

  // 하단으로 스크롤
  scrollToBottom() {
    setTimeout(() => {
      if (this.body) this.body.scrollTop = this.body.scrollHeight;
    }, 0);
  }

  // 타이핑 애니메이션 효과
  async typeText(element, html, speed = null) {
    const actualSpeed = speed !== null ? speed : this.typingSpeed;
    if (actualSpeed === 0) {
      element.innerHTML = html;
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    element.appendChild(cursor);

    this.typingSkipped = false;
    const skipButton = this.createSkipButton(() => {
      this.typingSkipped = true;
      this.currentSkipButton?.remove();
      this.currentSkipButton = null;
    });
    this.currentSkipButton = skipButton;
    element.parentElement?.appendChild(skipButton);

    await this.typeNode(tempDiv, element, cursor, actualSpeed, true);

    this.currentSkipButton?.remove();
    this.currentSkipButton = null;

    if (this.typingSkipped) {
      cursor.remove();
      element.innerHTML = html;
    } else {
      cursor.remove();
    }
  }

  // 스킵 버튼 생성
  createSkipButton(onSkip) {
    const btn = document.createElement('button');
    btn.className = 'typing-skip-btn';
    btn.textContent = '스킵';
    btn.addEventListener('click', onSkip);
    return btn;
  }

  // 노드 타이핑
  async typeNode(sourceNode, targetElement, cursor, speed, isRoot = true) {
    for (let node of sourceNode.childNodes) {
      if (this.typingSkipped) return;

      if (node.nodeType === Node.TEXT_NODE) {
        for (let char of node.textContent) {
          if (this.typingSkipped) return;
          const textNode = document.createTextNode(char);
          if (isRoot && cursor?.parentNode === targetElement) {
            targetElement.insertBefore(textNode, cursor);
          } else {
            targetElement.appendChild(textNode);
          }
          this.scrollToBottom();
          await this.delay(speed);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const newElement = document.createElement(node.tagName);
        for (let attr of node.attributes) {
          newElement.setAttribute(attr.name, attr.value);
        }
        if (isRoot && cursor?.parentNode === targetElement) {
          targetElement.insertBefore(newElement, cursor);
        } else {
          targetElement.appendChild(newElement);
        }
        if (node.tagName.toLowerCase() === 'br') {
          await this.delay(speed * 3);
          continue;
        }
        await this.typeNode(node, newElement, cursor, speed, false);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // PDF 다운로드
  async downloadInterviewPDF() {
    if (!window.jspdf) {
      alert('PDF 라이브러리를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (this.interviewHistory.length === 0) {
      alert('다운로드할 면접 내용이 없습니다.');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // 한글 폰트 설정
      let useKoreanFont = false;
      if (this.koreanFontLoaded && this.koreanFontBase64) {
        try {
          doc.addFileToVFS('NanumGothic.ttf', this.koreanFontBase64);
          doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
          doc.setFont('NanumGothic');
          useKoreanFont = true;
        } catch (fontError) {
          console.error('Font registration error:', fontError);
        }
      }

      if (!useKoreanFont) {
        doc.setFont('helvetica');
      }

      doc.setFontSize(20);
      doc.text(useKoreanFont ? 'YUJIN LEE 면접 질의응답' : 'Interview with YUJIN LEE', 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(useKoreanFont ? `생성일: ${new Date().toLocaleDateString('ko-KR')}` : `Generated: ${new Date().toLocaleDateString('ko-KR')}`, 105, 30, { align: 'center' });
      doc.line(20, 35, 190, 35);

      let y = 45;
      this.interviewHistory.forEach((item, i) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(0, 100, 150);
        const questionText = this.stripHTML(item.question);
        const qLines = doc.splitTextToSize(`Q${i + 1}: ${questionText}`, 170);
        doc.text(qLines, 20, y);
        y += qLines.length * 7 + 3;

        doc.setFontSize(10);
        doc.setTextColor(40);
        const answerText = this.stripHTML(item.answer);
        const aLines = doc.splitTextToSize(answerText, 170);
        aLines.forEach(line => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, 20, y);
          y += 6;
        });
        y += 8;
      });

      doc.save(`interview_yujinlee_${Date.now()}.pdf`);
      this.addBotMessage('PDF 다운로드가 완료되었습니다!');
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      // 폰트 없이 재시도
      this.downloadInterviewPDFSimple();
    }
  }

  // 간단한 PDF 다운로드 (폰트 문제 시 fallback)
  downloadInterviewPDFSimple() {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFont('helvetica');

      doc.setFontSize(20);
      doc.text('Interview with YUJIN LEE', 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString('ko-KR')}`, 105, 30, { align: 'center' });
      doc.line(20, 35, 190, 35);

      let y = 45;
      this.interviewHistory.forEach((item, i) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(0, 100, 150);
        // 한글을 영문으로 대체하거나 제거
        const questionText = this.stripHTML(item.question);
        doc.text(`Q${i + 1}:`, 20, y);
        y += 7;

        doc.setFontSize(10);
        doc.setTextColor(40);
        const answerText = this.stripHTML(item.answer);
        // 한글이 포함된 경우 간단히 표시
        doc.text('[Korean content - please view in browser]', 20, y);
        y += 15;
      });

      doc.save(`interview_yujinlee_${Date.now()}.pdf`);
      this.addBotMessage('PDF 다운로드가 완료되었습니다. (한글 폰트 미지원으로 일부 내용이 표시되지 않을 수 있습니다)');
    } catch (error) {
      console.error('Simple PDF 생성도 실패:', error);
      alert('PDF 생성에 실패했습니다. 브라우저 콘솔을 확인해주세요.');
    }
  }

  stripHTML(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || '';
  }

  trackSessionStart() {
    try {
      let stats = JSON.parse(localStorage.getItem('nanoYJ_stats') || '{}');
      stats.totalSessions = (stats.totalSessions || 0) + 1;
      stats.lastSession = new Date().toISOString();
      localStorage.setItem('nanoYJ_stats', JSON.stringify(stats));
    } catch (error) {}
  }

  // 통계 화면
  displayStats() {
    const stats = this.getStats();
    const popular = this.showPopularQuestions();

    let html = `<div style="padding:10px">
      <h3 style="color:#B4A0F0; margin:0 0 10px">챗봇 사용 통계</h3>
      <p style="color:rgba(255,255,255,.7); font-size:0.9rem">
        • 전체 세션: ${stats.totalSessions || 0}회<br/>
        • 총 질문 수: ${stats.totalQuestions || 0}개
      </p>`;

    if (popular?.length > 0) {
      html += `<h4 style="color:#6BBCC6; margin:15px 0 8px">인기 질문 TOP 3</h4>
        <ol style="color:rgba(255,255,255,.85); padding-left:20px; font-size:0.9rem">
          ${popular.map(q => `<li>${q.label} (${q.count}회)</li>`).join('')}
        </ol>`;
    }
    html += `</div>`;

    const div = document.createElement('div');
    div.className = 'nano-msg bot';
    div.innerHTML = `<div class="bubble">${html}</div>`;
    this.body?.appendChild(div);

    this.renderBackButton();
  }

  // 설정 화면
  showSettings() {
    const speeds = [
      { label: '느리게', value: 40 },
      { label: '보통', value: 20 },
      { label: '빠르게', value: 5 },
      { label: '즉시', value: 0 }
    ];
    const current = speeds.find(s => s.value === this.typingSpeed)?.label || '보통';

    const html = `<div style="padding:10px">
      <h3 style="color:#B4A0F0; margin:0 0 10px">타이핑 속도 설정</h3>
      <p style="color:rgba(255,255,255,.7); font-size:0.9rem">현재: <b style="color:#6BBCC6">${current}</b></p>
    </div>`;

    const div = document.createElement('div');
    div.className = 'nano-msg bot';
    div.innerHTML = `<div class="bubble">${html}</div>`;
    this.body?.appendChild(div);

    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'nano-choices';
    speeds.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'nano-chip' + (s.value === this.typingSpeed ? ' active' : '');
      btn.textContent = s.label;
      btn.addEventListener('click', () => {
        this.setTypingSpeed(s.value);
        this.addBotMessage(`타이핑 속도가 <b>${s.label}</b>로 설정되었습니다.`);
        setTimeout(() => this.displayFlow('interview_mode'), 500);
      });
      choicesDiv.appendChild(btn);
    });

    const backBtn = document.createElement('button');
    backBtn.className = 'nano-chip';
    backBtn.textContent = '← 돌아가기';
    backBtn.addEventListener('click', () => this.displayFlow('interview_mode'));
    choicesDiv.appendChild(backBtn);

    this.body?.appendChild(choicesDiv);
    this.scrollToBottom();
  }

  renderBackButton() {
    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'nano-choices';
    const btn = document.createElement('button');
    btn.className = 'nano-chip';
    btn.textContent = '← 면접 모드로 돌아가기';
    btn.addEventListener('click', () => this.displayFlow('interview_mode'));
    choicesDiv.appendChild(btn);
    this.body?.appendChild(choicesDiv);
    this.scrollToBottom();
  }

  // 역량 분석 차트
  displayCompetencyAnalysis() {
    if (!window.Chart) {
      this.addBotMessage('차트 라이브러리를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const data = {
      labels: ['데이터 분석', '프로젝트 관리', '커뮤니케이션', '기술 이해도', '문제 해결'],
      yujin: [90, 85, 82, 88, 87],
      average: [70, 70, 70, 70, 70]
    };

    const html = `<div style="padding:10px">
      <h3 style="color:#B4A0F0; margin:0 0 10px">YUJIN LEE 역량 분석</h3>
      <p style="color:rgba(255,255,255,.7); font-size:0.9rem">
        프로젝트 성과 기반 역량 지표입니다.
      </p>
    </div>`;

    const div = document.createElement('div');
    div.className = 'nano-msg bot';
    div.innerHTML = `<div class="bubble">${html}</div>`;
    this.body?.appendChild(div);

    const container = document.createElement('div');
    container.style.cssText = 'background:rgba(30,20,50,.4); padding:20px; border-radius:12px; margin:10px 0; max-width:400px;';
    const canvas = document.createElement('canvas');
    canvas.width = 350;
    canvas.height = 350;
    container.appendChild(canvas);
    this.body?.appendChild(container);

    new Chart(canvas.getContext('2d'), {
      type: 'radar',
      data: {
        labels: data.labels,
        datasets: [
          { label: 'YUJIN LEE', data: data.yujin, backgroundColor: 'rgba(107,188,198,0.2)', borderColor: 'rgba(107,188,198,0.8)', borderWidth: 2, pointRadius: 4 },
          { label: '주니어 PM 평균', data: data.average, backgroundColor: 'rgba(200,200,200,0.1)', borderColor: 'rgba(200,200,200,0.5)', borderWidth: 2, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true,
        scales: {
          r: { beginAtZero: true, max: 100, ticks: { stepSize: 20, color: 'rgba(255,255,255,0.6)' }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: 'rgba(255,255,255,0.85)', font: { size: 11 } } }
        },
        plugins: { legend: { labels: { color: 'rgba(255,255,255,0.9)' } } }
      }
    });

    this.renderBackButton();
  }

  // ============================================
  // 테마 전환 핸들러
  // ============================================
  handleThemeToggle() {
    const newTheme = this.toggleTheme();
    const themeMsg = this.language === 'en'
      ? `Theme changed to <b>${newTheme === 'dark' ? 'Dark' : 'Light'}</b> mode.`
      : `테마가 <b>${newTheme === 'dark' ? '다크' : '라이트'}</b> 모드로 변경되었습니다.`;
    this.addBotMessage(themeMsg);
    this.renderBackToIntro();
  }

  // ============================================
  // 글로벌 설정 화면
  // ============================================
  showGlobalSettings() {
    const cacheCount = Object.keys(this.responseCache).length;
    const historyCount = this.scenario.conversationHistory.length;

    const html = `<div style="padding:10px">
      <h3 style="color:#B4A0F0; margin:0 0 15px">설정</h3>

      <div style="margin-bottom:15px">
        <h4 style="color:#6BBCC6; margin:0 0 8px; font-size:0.95rem">테마</h4>
        <p style="color:rgba(255,255,255,.7); font-size:0.85rem">현재: <b style="color:#6BBCC6">${this.theme === 'dark' ? '다크' : '라이트'}</b> 모드</p>
      </div>

      <div style="margin-bottom:15px">
        <h4 style="color:#6BBCC6; margin:0 0 8px; font-size:0.95rem">캐시</h4>
        <p style="color:rgba(255,255,255,.7); font-size:0.85rem">저장된 응답: <b>${cacheCount}</b>개 (24시간 유효)</p>
      </div>

      <div style="margin-bottom:15px">
        <h4 style="color:#6BBCC6; margin:0 0 8px; font-size:0.95rem">대화 기록</h4>
        <p style="color:rgba(255,255,255,.7); font-size:0.85rem">현재 세션 메시지: <b>${historyCount}</b>개</p>
      </div>

      <div style="margin-bottom:10px; padding:10px; background:rgba(255,255,255,0.05); border-radius:8px;">
        <h4 style="color:#888; margin:0 0 8px; font-size:0.85rem">키보드 단축키</h4>
        <p style="color:rgba(255,255,255,.6); font-size:0.8rem; line-height:1.6">
          <b>ESC</b> - 챗봇 닫기<br/>
          <b>/</b> - 입력창 포커스<br/>
          <b>Ctrl+Shift+C</b> - 챗봇 열기/닫기<br/>
          <b>Ctrl+Shift+L</b> - 테마 전환<br/>
          <b>Ctrl+Shift+R</b> - 대화 초기화
        </p>
      </div>
    </div>`;

    const div = document.createElement('div');
    div.className = 'nano-msg bot';
    div.innerHTML = `<div class="bubble">${html}</div>`;
    this.body?.appendChild(div);

    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'nano-choices';

    const actions = [
      { label: '테마 전환', action: 'toggle_theme' },
      { label: '캐시 삭제', action: 'clear_cache' },
      { label: '대화 초기화', action: 'clear_conversation' },
      { label: '이전으로', action: 'back_to_intro' }
    ];

    actions.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'nano-chip';
      btn.textContent = a.label;
      btn.addEventListener('click', () => this.handleChoice(a));
      choicesDiv.appendChild(btn);
    });

    this.body?.appendChild(choicesDiv);
    this.scrollToBottom();
  }

  // 캐시 삭제 (메시지 포함)
  clearCacheWithMessage() {
    this.responseCache = {};
    this.saveCache();
    this.addBotMessage('응답 캐시가 삭제되었습니다.');
    this.renderBackToIntro();
  }

  // 대화 초기화 (메시지 포함)
  clearConversationWithMessage() {
    this.clearConversation();
    this.addBotMessage('대화 기록이 초기화되었습니다.');
    setTimeout(() => this.displayFlow('intro'), 1000);
  }

  // 이전으로 돌아가기 버튼
  renderBackToIntro() {
    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'nano-choices';
    const btn = document.createElement('button');
    btn.className = 'nano-chip';
    btn.textContent = '이전으로';
    btn.addEventListener('click', () => this.displayFlow('intro'));
    choicesDiv.appendChild(btn);
    this.body?.appendChild(choicesDiv);
    this.scrollToBottom();
  }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.nanoYJUI = new NanoYJUI();
});
