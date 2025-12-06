/**
 * AI Assistant - Nano-YJ UI & Interactions
 * 챗봇 인터페이스 및 이벤트 처리
 */

class NanoYJUI {
  constructor() {
    this.isOpen = false;
    this.currentFlow = 'intro';
    this.scenario = nanoYJScenario;
    this.apiEndpoint = '/api/chat';
    this.interviewHistory = [];

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

    this.initializeDOM();
    this.attachEventListeners();
    this.loadjsPDF();
    this.loadChartJS();
    this.initSpeechRecognition();
  }

  // jsPDF 라이브러리 동적 로드
  loadjsPDF() {
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => console.log('jsPDF loaded');
      document.head.appendChild(script);
    }
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
      voiceBtn.innerHTML = this.isListening ? '🔴' : '🎤';
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
  }

  // 챗봇 열기
  open() {
    this.isOpen = true;
    this.modal?.classList.add('active');
    this.overlay?.classList.add('active');
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
        flowData = this.scenario.getIntro();
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
      settingsBtn.textContent = '⚙️ 타이핑 속도';
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
            <a href="${r.url}" target="_blank" class="resource-link">📎 ${r.title}</a>
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
      <h4 class="sources-title">📎 증빙 자료 및 출처</h4>
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
    this.showLoading();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          history: this.scenario.conversationHistory,
          context: { currentFlow: this.currentFlow, userChoices: this.scenario.userChoices }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.hideLoading();

      if (response.ok) {
        const data = await response.json();
        this.addBotMessage(data.reply);
        if (data.action) {
          setTimeout(() => this.handleChoice({ action: data.action }), 1000);
        }
      } else {
        this.handleFallbackResponse(userInput);
      }
    } catch (error) {
      this.hideLoading();
      console.error('API 요청 실패:', error);
      this.handleFallbackResponse(userInput);
    }

    this.scrollToBottom();
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
    btn.textContent = '스킵 ⏭️';
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
        const qLines = doc.splitTextToSize(`Q${i + 1}: ${this.stripHTML(item.question)}`, 170);
        doc.text(qLines, 20, y);
        y += qLines.length * 7 + 3;

        doc.setFontSize(10);
        doc.setTextColor(40);
        const aLines = doc.splitTextToSize(this.stripHTML(item.answer), 170);
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
      alert('PDF 생성 중 오류가 발생했습니다.');
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
      <h3 style="color:#B4A0F0; margin:0 0 10px">📊 챗봇 사용 통계</h3>
      <p style="color:rgba(255,255,255,.7); font-size:0.9rem">
        • 전체 세션: ${stats.totalSessions || 0}회<br/>
        • 총 질문 수: ${stats.totalQuestions || 0}개
      </p>`;

    if (popular?.length > 0) {
      html += `<h4 style="color:#6BBCC6; margin:15px 0 8px">🏆 인기 질문</h4>
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
      <h3 style="color:#B4A0F0; margin:0 0 10px">⚙️ 타이핑 속도 설정</h3>
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
      <h3 style="color:#B4A0F0; margin:0 0 10px">📈 YUJIN LEE 역량 분석</h3>
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
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.nanoYJUI = new NanoYJUI();
});
