/**
 * AI Assistant - Nano-YJ UI & Interactions
 * 챗봇 인터페이스 및 이벤트 처리
 */

class NanoYJUI {
  constructor() {
    this.isOpen = false;
    this.currentFlow = 'intro';
    this.scenario = nanoYJScenario;
    this.apiEndpoint = '/api/chat'; // 백엔드 엔드포인트
    this.interviewHistory = []; // 면접 히스토리 저장

    // 타이핑 애니메이션 설정
    this.typingSkipped = false;
    this.typingSpeed = this.getTypingSpeed(); // localStorage에서 속도 불러오기
    this.currentSkipButton = null;

    this.initializeDOM();
    this.attachEventListeners();
    this.loadjsPDF(); // jsPDF 라이브러리 로드
    this.loadChartJS(); // Chart.js 라이브러리 로드
  }

  // jsPDF 라이브러리 동적 로드
  loadjsPDF() {
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        console.log('jsPDF loaded successfully');
      };
      document.head.appendChild(script);
    }
  }

  // Chart.js 라이브러리 동적 로드
  loadChartJS() {
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.onload = () => {
        console.log('Chart.js loaded successfully');
      };
      document.head.appendChild(script);
    }
  }

  // 타이핑 속도 설정 가져오기
  getTypingSpeed() {
    const savedSpeed = localStorage.getItem('nanoYJ_typingSpeed');
    if (savedSpeed) {
      return parseInt(savedSpeed);
    }
    return 20; // 기본값 (보통)
  }

  // 타이핑 속도 설정 저장
  setTypingSpeed(speed) {
    this.typingSpeed = speed;
    localStorage.setItem('nanoYJ_typingSpeed', speed.toString());
  }

  // 통계 추적 - 질문 클릭 기록
  trackQuestionClick(questionKey) {
    try {
      let stats = JSON.parse(localStorage.getItem('nanoYJ_stats') || '{}');

      if (!stats.questions) {
        stats.questions = {};
      }

      if (!stats.questions[questionKey]) {
        stats.questions[questionKey] = {
          count: 0,
          firstAsked: new Date().toISOString(),
          lastAsked: new Date().toISOString()
        };
      }

      stats.questions[questionKey].count++;
      stats.questions[questionKey].lastAsked = new Date().toISOString();

      // 전체 세션 카운트
      stats.totalSessions = (stats.totalSessions || 0);
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
      console.error('통계 로드 오류:', error);
      return {};
    }
  }

  // 인기 질문 TOP 3 표시
  showPopularQuestions() {
    const stats = this.getStats();

    if (!stats.questions || Object.keys(stats.questions).length === 0) {
      return null;
    }

    // 질문을 클릭 수로 정렬
    const sorted = Object.entries(stats.questions)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);

    return sorted.map(([key, data]) => ({
      key,
      count: data.count,
      label: this.getQuestionLabel(key)
    }));
  }

  // 질문 키를 레이블로 변환
  getQuestionLabel(key) {
    const labels = {
      'introduction': '자기소개',
      'strength': '강점',
      'weakness': '약점',
      'motivation': '지원 이유',
      'project_experience': '프로젝트 경험',
      'conflict': '갈등 해결',
      'failure': '실패 경험',
      'future': '미래 비전'
    };
    return labels[key] || key;
  }

  // DOM 초기화 (이미 HTML에 정의되어 있음)
  initializeDOM() {
    this.launcher = document.querySelector('.nano-yj-launch');
    this.overlay = document.querySelector('.nano-overlay');
    this.modal = document.querySelector('.nano-modal');
    this.header = document.querySelector('.nano-header');
    this.headerTitle = document.querySelector('.nano-header .title');
    this.closeBtn = document.querySelector('.nano-close');
    this.body = document.querySelector('.nano-body');
    this.inputContainer = document.querySelector('.nano-input');
    this.inputField = document.querySelector('.nano-input input');
    this.sendBtn = document.querySelector('.nano-input button');
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
    this.currentFlow = 'intro';
    this.scenario.userChoices = { domain: null, priority: null, format: null };
    this.scenario.conversationHistory = [];
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

    this.renderFlow(flowData);
  }

  // 흐름 렌더링
  renderFlow(flowData) {
    this.clearBody();

    // 봇 메시지
    this.addBotMessage(flowData.message);

    // 면접 답변 타입 처리
    if (flowData.type === 'interview_answer') {
      // 질문 표시
      const questionDiv = document.createElement('div');
      questionDiv.className = 'nano-msg bot';
      questionDiv.innerHTML = `<div class="bubble interview-question"><b>Q: ${flowData.question}</b></div>`;
      this.body?.appendChild(questionDiv);

      // 답변 표시 (타이핑 효과)
      const answerDiv = document.createElement('div');
      answerDiv.className = 'nano-msg bot';
      const answerBubble = document.createElement('div');
      answerBubble.className = 'bubble interview-answer fade-in';
      answerDiv.appendChild(answerBubble);
      this.body?.appendChild(answerDiv);

      // 타이핑 효과로 답변 표시
      await this.typeText(answerBubble, flowData.answer, 15);

      // 증빙 자료 표시 (있는 경우만)
      if (flowData.sources && flowData.sources.length > 0) {
        this.renderSources(flowData.sources);
      }

      // 면접 히스토리 저장
      this.interviewHistory.push({
        question: flowData.question,
        answer: flowData.answer,
        timestamp: new Date()
      });
    }
    // 내용별 렌더
    else if (flowData.type === 'result') {
      this.renderProjectCards(flowData.projects);
    } else if (flowData.type === 'resume') {
      this.renderResumePreview(flowData.preview);
    } else if (flowData.type === 'project_detail') {
      this.renderProjectDetail(flowData.project);
    } else if (flowData.type === 'downloads') {
      this.renderDownloads(flowData.resources);
    }

    // 선택지 버튼 또는 입력창
    if (flowData.choices && flowData.choices.length > 0) {
      this.renderChoices(flowData.choices);
    }

    if (flowData.allowFreetext !== false) {
      this.inputContainer?.classList.remove('hidden');
    } else {
      this.inputContainer?.classList.add('hidden');
    }

    // 하단으로 스크롤
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

    // 면접 모드에서 면접 히스토리가 있으면 PDF 다운로드 버튼 추가
    if (this.currentFlow === 'interview_answer' && this.interviewHistory.length > 0) {
      const pdfBtn = document.createElement('button');
      pdfBtn.className = 'nano-chip pdf-download';
      pdfBtn.textContent = '면접 내용 PDF 다운로드';
      pdfBtn.addEventListener('click', () => this.downloadInterviewPDF());
      choicesDiv.appendChild(pdfBtn);
    }

    // 면접 모드에서 설정 버튼 추가
    if (this.currentFlow === 'interview_mode' || this.currentFlow === 'interview_answer') {
      const settingsBtn = document.createElement('button');
      settingsBtn.className = 'nano-chip settings-btn';
      settingsBtn.textContent = '타이핑 속도 설정';
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
        <ul>
          ${project.highlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>
      <div class="detail-section">
        <h4>자료</h4>
        <div class="resource-links">
          ${project.resources.map(r => `
            <a href="${r.url}" target="_blank" class="resource-link" download>
              📎 ${r.title}
            </a>
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
          <a href="${r.url}" target="_blank" class="download-item" download>
            ${r.title}
          </a>
        `).join('')}
      </div>
    `;
    this.body?.appendChild(downloadsDiv);
  }

  // 증빙 자료 렌더링
  renderSources(sources) {
    let sourcesHTML = `<div class="sources-container">`;
    sourcesHTML += `<h4 class="sources-title">증빙 자료 및 출처</h4>`;
    sourcesHTML += `<div class="sources-list">`;

    sources.forEach(source => {
      sourcesHTML += `<div class="source-item source-${source.type}">`;
      sourcesHTML += `<div class="source-content">`;

      if (source.type === 'career') {
        sourcesHTML += `<strong>${source.title}</strong>`;
        if (source.period) sourcesHTML += `<span class="source-period">${source.period}</span>`;
        if (source.verified) sourcesHTML += `<span class="source-badge verified">재직 확인</span>`;
      }
      else if (source.type === 'project') {
        if (source.link) {
          sourcesHTML += `<a href="${source.link}" target="_blank" class="source-link">${source.title}</a>`;
        } else {
          sourcesHTML += `<strong>${source.title}</strong>`;
        }
      }
      else if (source.type === 'metric') {
        sourcesHTML += `<strong>${source.title}</strong>`;
        if (source.value) sourcesHTML += `<span class="source-value">${source.value}</span>`;
        if (source.method) sourcesHTML += `<span class="source-method">측정방법: ${source.method}</span>`;
      }
      else if (source.type === 'document') {
        if (source.link) {
          sourcesHTML += `<a href="${source.link}" target="_blank" class="source-link">${source.title}</a>`;
        } else {
          sourcesHTML += `<strong>${source.title}</strong>`;
        }
      }
      else if (source.type === 'interview') {
        sourcesHTML += `<strong>${source.title}</strong>`;
        if (source.value) sourcesHTML += `<span class="source-value">${source.value}</span>`;
        if (source.period) sourcesHTML += `<span class="source-period">${source.period}</span>`;
      }

      sourcesHTML += `</div>`;
      sourcesHTML += `</div>`;
    });

    sourcesHTML += `</div></div>`;

    const sourcesDiv = document.createElement('div');
    sourcesDiv.className = 'nano-msg bot';
    sourcesDiv.innerHTML = `<div class="bubble sources-bubble">${sourcesHTML}</div>`;
    this.body?.appendChild(sourcesDiv);
    this.scrollToBottom();
  }

  // 선택지 처리
  async handleChoice(choice) {
    this.addUserMessage(choice.label);

    // 면접 모드 관련 액션
    if (choice.action === 'start_interview_mode') {
      this.displayFlow('interview_mode');
      // 세션 카운트
      this.trackSessionStart();
    } else if (choice.action === 'ask_introduction') {
      this.trackQuestionClick('introduction');
      this.displayFlow('interview_answer', { questionKey: 'introduction' });
    } else if (choice.action === 'ask_strength') {
      this.trackQuestionClick('strength');
      this.displayFlow('interview_answer', { questionKey: 'strength' });
    } else if (choice.action === 'ask_weakness') {
      this.trackQuestionClick('weakness');
      this.displayFlow('interview_answer', { questionKey: 'weakness' });
    } else if (choice.action === 'ask_motivation') {
      this.trackQuestionClick('motivation');
      this.displayFlow('interview_answer', { questionKey: 'motivation' });
    } else if (choice.action === 'ask_project_experience') {
      this.trackQuestionClick('project_experience');
      this.displayFlow('interview_answer', { questionKey: 'project_experience' });
    } else if (choice.action === 'ask_conflict') {
      this.trackQuestionClick('conflict');
      this.displayFlow('interview_answer', { questionKey: 'conflict' });
    } else if (choice.action === 'ask_failure') {
      this.trackQuestionClick('failure');
      this.displayFlow('interview_answer', { questionKey: 'failure' });
    } else if (choice.action === 'ask_future') {
      this.trackQuestionClick('future');
      this.displayFlow('interview_answer', { questionKey: 'future' });
    } else if (choice.action === 'continue_interview_mode') {
      this.displayFlow('interview_mode');
    } else if (choice.action === 'show_stats') {
      this.displayStats();
    } else if (choice.action === 'show_competency_analysis') {
      this.displayCompetencyAnalysis();
    }
    // 기존 액션들
    else if (choice.action === 'start_interview') {
      this.displayFlow('interview_q1');
    } else if (choice.action === 'show_resume') {
      this.displayFlow('resume');
    } else if (choice.action === 'show_projects') {
      this.displayFlow('projects');
    } else if (choice.action === 'back_to_intro') {
      this.displayFlow('intro');
    } else if (choice.action === 'back_to_projects') {
      this.displayFlow('projects');
    } else if (choice.action === 'go_to_main') {
      window.location.href = './index.html';
    } else if (choice.action === 'close') {
      setTimeout(() => this.close(), 800);
    } else if (choice.action === 'show_project_detail') {
      // 첫 번째 추천 프로젝트 표시
      const recommended = this.scenario.recommendProjects();
      if (recommended.length > 0) {
        const projectId = Object.keys(this.scenario.projectsDB).find(
          key => this.scenario.projectsDB[key].name === recommended[0].name
        );
        this.displayFlow('project_detail', { projectId });
      }
    } else if (choice.action === 'show_all_projects') {
      this.displayFlow('projects');
    } else if (choice.action === 'select_project') {
      this.displayFlow('project_detail', { projectId: choice.projectId });
    } else if (choice.action === 'show_resume_preview') {
      // 이미 표시됨
    } else if (choice.action === 'download_resume') {
      window.open('./docs/resume_yujin_lee.pdf', '_blank');
    }

    // 인터뷰 질문 응답 처리
    if (['interview_q1', 'interview_q2', 'interview_q3'].includes(this.currentFlow)) {
      this.scenario.recordChoice(
        this.currentFlow.replace('interview_', ''),
        choice.value
      );

      if (this.currentFlow === 'interview_q1') {
        setTimeout(() => this.displayFlow('interview_q2'), 500);
      } else if (this.currentFlow === 'interview_q2') {
        setTimeout(() => this.displayFlow('interview_q3'), 500);
      } else if (this.currentFlow === 'interview_q3') {
        setTimeout(() => this.displayFlow('interview_result'), 500);
      }
    }
  }

  // 사용자 입력 처리
  async handleUserInput() {
    const userInput = this.inputField?.value.trim();
    if (!userInput) return;

    this.addUserMessage(userInput);
    this.inputField.value = '';

    // 백엔드에 전달 및 응답 처리
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          history: this.scenario.conversationHistory,
          context: {
            currentFlow: this.currentFlow,
            userChoices: this.scenario.userChoices
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.addBotMessage(data.reply);
        
        // 이후 액션이 있으면 처리
        if (data.action) {
          setTimeout(() => this.handleChoice({ action: data.action }), 1000);
        }
      }
    } catch (error) {
      console.error('API 요청 실패:', error);
      this.addBotMessage('죄송합니다. 요청을 처리하지 못했습니다.');
    }

    this.scrollToBottom();
  }

  // 본문 비우기
  clearBody() {
    if (this.body) {
      this.body.innerHTML = '';
    }
  }

  // 하단으로 스크롤
  scrollToBottom() {
    setTimeout(() => {
      if (this.body) {
        this.body.scrollTop = this.body.scrollHeight;
      }
    }, 0);
  }

  // 타이핑 애니메이션 효과
  async typeText(element, html, speed = null) {
    // 속도가 지정되지 않으면 설정값 사용
    const actualSpeed = speed !== null ? speed : this.typingSpeed;

    // 즉시 모드 (속도 0)면 타이핑 없이 즉시 표시
    if (actualSpeed === 0) {
      element.innerHTML = html;
      return;
    }

    // HTML 태그를 파싱하기 위해 임시 요소 생성
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // 타이핑 커서 추가
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    element.appendChild(cursor);

    // 스킵 버튼 생성 및 추가
    this.typingSkipped = false;
    const skipButton = this.createSkipButton(() => {
      this.typingSkipped = true;
      if (this.currentSkipButton) {
        this.currentSkipButton.remove();
        this.currentSkipButton = null;
      }
    });
    this.currentSkipButton = skipButton;
    element.parentElement?.appendChild(skipButton);

    // 텍스트와 HTML을 순차적으로 표시
    await this.typeNode(tempDiv, element, cursor, actualSpeed);

    // 스킵되었거나 타이핑 완료 후 스킵 버튼 제거
    if (this.currentSkipButton) {
      this.currentSkipButton.remove();
      this.currentSkipButton = null;
    }

    // 스킵된 경우 전체 내용 즉시 표시
    if (this.typingSkipped) {
      cursor.remove();
      element.innerHTML = html;
    } else {
      // 타이핑 완료 후 커서 제거
      cursor.remove();
    }
  }

  // 스킵 버튼 생성
  createSkipButton(onSkip) {
    const skipBtn = document.createElement('button');
    skipBtn.className = 'typing-skip-btn';
    skipBtn.innerHTML = '스킵';
    skipBtn.addEventListener('click', onSkip);
    return skipBtn;
  }

  // 노드 타이핑 (재귀적으로 처리)
  async typeNode(sourceNode, targetElement, cursor, speed) {
    for (let node of sourceNode.childNodes) {
      // 스킵 플래그 체크
      if (this.typingSkipped) {
        return;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        // 텍스트 노드: 한 글자씩 추가
        const text = node.textContent;
        for (let char of text) {
          // 매 글자마다 스킵 체크
          if (this.typingSkipped) {
            return;
          }
          const textNode = document.createTextNode(char);
          targetElement.insertBefore(textNode, cursor);
          this.scrollToBottom();
          await this.delay(speed);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // 요소 노드: 복제하고 내부를 재귀적으로 처리
        const newElement = document.createElement(node.tagName);

        // 속성 복사
        for (let attr of node.attributes) {
          newElement.setAttribute(attr.name, attr.value);
        }

        targetElement.insertBefore(newElement, cursor);

        // <br> 태그는 내용 없음
        if (node.tagName.toLowerCase() === 'br') {
          await this.delay(speed * 3);
          continue;
        }

        // 재귀적으로 자식 노드 처리
        await this.typeNode(node, newElement, cursor, speed);
      }
    }
  }

  // 딜레이 유틸리티
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // PDF 다운로드 기능
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

      // 한글 폰트 설정 (기본 폰트 사용)
      doc.setFont('helvetica');

      // 제목
      doc.setFontSize(20);
      doc.setTextColor(40);
      doc.text('Interview with YUJIN LEE', 105, 20, { align: 'center' });

      // 날짜
      doc.setFontSize(10);
      doc.setTextColor(100);
      const date = new Date().toLocaleDateString('ko-KR');
      doc.text(`Generated: ${date}`, 105, 30, { align: 'center' });

      // 구분선
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);

      let yPosition = 45;
      const lineHeight = 7;
      const pageHeight = 280;
      const marginBottom = 20;

      // 각 면접 질문과 답변 추가
      this.interviewHistory.forEach((item, index) => {
        // 페이지 넘김 체크
        if (yPosition > pageHeight - marginBottom) {
          doc.addPage();
          yPosition = 20;
        }

        // 질문
        doc.setFontSize(12);
        doc.setTextColor(0, 100, 150);
        doc.setFont('helvetica', 'bold');
        const questionText = `Q${index + 1}: ${this.stripHTML(item.question)}`;
        const questionLines = doc.splitTextToSize(questionText, 170);
        doc.text(questionLines, 20, yPosition);
        yPosition += questionLines.length * lineHeight + 3;

        // 페이지 넘김 체크
        if (yPosition > pageHeight - marginBottom) {
          doc.addPage();
          yPosition = 20;
        }

        // 답변
        doc.setFontSize(10);
        doc.setTextColor(40);
        doc.setFont('helvetica', 'normal');
        const answerText = this.stripHTML(item.answer);
        const answerLines = doc.splitTextToSize(answerText, 170);

        answerLines.forEach(line => {
          if (yPosition > pageHeight - marginBottom) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 20, yPosition);
          yPosition += lineHeight;
        });

        yPosition += 5; // 질문 간 간격
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, 105, pageHeight + 10, { align: 'center' });
        doc.text('Generated by Nano-YJ Assistant', 105, pageHeight + 15, { align: 'center' });
      }

      // PDF 저장
      const filename = `interview_yujinlee_${new Date().getTime()}.pdf`;
      doc.save(filename);

      this.addBotMessage(`PDF 다운로드가 완료되었습니다! (${filename})`);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  }

  // HTML 태그 제거 유틸리티
  stripHTML(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  // 세션 시작 추적
  trackSessionStart() {
    try {
      let stats = JSON.parse(localStorage.getItem('nanoYJ_stats') || '{}');
      stats.totalSessions = (stats.totalSessions || 0) + 1;
      stats.lastSession = new Date().toISOString();
      localStorage.setItem('nanoYJ_stats', JSON.stringify(stats));
    } catch (error) {
      console.error('세션 추적 오류:', error);
    }
  }

  // 통계 화면 표시
  displayStats() {
    const stats = this.getStats();
    const popular = this.showPopularQuestions();

    let statsHTML = `<div style="padding:10px">`;
    statsHTML += `<h3 style="color:#B4A0F0; margin:0 0 10px 0">챗봇 사용 통계</h3>`;
    statsHTML += `<p style="color:rgba(255,255,255,.7); font-size:0.9rem">`;
    statsHTML += `• 전체 세션: ${stats.totalSessions || 0}회<br/>`;
    statsHTML += `• 총 질문 수: ${stats.totalQuestions || 0}개<br/>`;

    if (stats.lastSession) {
      const lastDate = new Date(stats.lastSession).toLocaleDateString('ko-KR');
      statsHTML += `• 마지막 방문: ${lastDate}<br/>`;
    }

    statsHTML += `</p>`;

    if (popular && popular.length > 0) {
      statsHTML += `<h4 style="color:#6BBCC6; margin:15px 0 8px 0">인기 질문 TOP ${popular.length}</h4>`;
      statsHTML += `<ol style="color:rgba(255,255,255,.85); padding-left:20px; font-size:0.9rem">`;
      popular.forEach(q => {
        statsHTML += `<li>${q.label} (${q.count}회)</li>`;
      });
      statsHTML += `</ol>`;
    } else {
      statsHTML += `<p style="color:rgba(255,255,255,.6); font-size:0.85rem">아직 질문 기록이 없습니다.</p>`;
    }

    statsHTML += `</div>`;

    const statsDiv = document.createElement('div');
    statsDiv.className = 'nano-msg bot';
    statsDiv.innerHTML = `<div class="bubble" style="max-width:100%">${statsHTML}</div>`;
    this.body?.appendChild(statsDiv);

    // 돌아가기 버튼
    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'nano-choices';
    const backBtn = document.createElement('button');
    backBtn.className = 'nano-chip';
    backBtn.textContent = '면접 모드로 돌아가기';
    backBtn.addEventListener('click', () => this.displayFlow('interview_mode'));
    choicesDiv.appendChild(backBtn);
    this.body?.appendChild(choicesDiv);

    this.scrollToBottom();
  }

  // 설정 화면 표시
  showSettings() {
    const currentSpeed = this.typingSpeed;
    let currentLabel = '보통';
    if (currentSpeed === 40) currentLabel = '느리게';
    else if (currentSpeed === 5) currentLabel = '빠르게';
    else if (currentSpeed === 0) currentLabel = '즉시';

    let settingsHTML = `<div style="padding:10px">`;
    settingsHTML += `<h3 style="color:#B4A0F0; margin:0 0 10px 0">타이핑 속도 설정</h3>`;
    settingsHTML += `<p style="color:rgba(255,255,255,.7); font-size:0.9rem; margin-bottom:15px">`;
    settingsHTML += `현재 설정: <b style="color:#6BBCC6">${currentLabel}</b><br/>`;
    settingsHTML += `면접 답변이 표시되는 속도를 조절할 수 있습니다.`;
    settingsHTML += `</p></div>`;

    const settingsDiv = document.createElement('div');
    settingsDiv.className = 'nano-msg bot';
    settingsDiv.innerHTML = `<div class="bubble" style="max-width:100%">${settingsHTML}</div>`;
    this.body?.appendChild(settingsDiv);

    // 속도 선택 버튼들
    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'nano-choices';

    const speeds = [
      { label: '느리게 (40ms)', value: 40 },
      { label: '보통 (20ms)', value: 20 },
      { label: '빠르게 (5ms)', value: 5 },
      { label: '즉시 (애니메이션 없음)', value: 0 }
    ];

    speeds.forEach(speed => {
      const btn = document.createElement('button');
      btn.className = 'nano-chip';
      if (speed.value === currentSpeed) {
        btn.className += ' active';
      }
      btn.textContent = speed.label;
      btn.addEventListener('click', () => {
        this.setTypingSpeed(speed.value);
        this.addBotMessage(`타이핑 속도가 <b>${speed.label.split(' ')[0]}</b>로 설정되었습니다.`);
        setTimeout(() => this.displayFlow('interview_mode'), 500);
      });
      choicesDiv.appendChild(btn);
    });

    // 돌아가기 버튼
    const backBtn = document.createElement('button');
    backBtn.className = 'nano-chip';
    backBtn.textContent = '면접 모드로 돌아가기';
    backBtn.addEventListener('click', () => this.displayFlow('interview_mode'));
    choicesDiv.appendChild(backBtn);

    this.body?.appendChild(choicesDiv);
    this.scrollToBottom();
  }

  // 역량 분석 레이더 차트 표시
  displayCompetencyAnalysis() {
    if (!window.Chart) {
      this.addBotMessage('차트 라이브러리를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 역량 데이터 (YUJIN LEE 프로필 기반)
    const competencyData = {
      labels: ['데이터 분석', '프로젝트 관리', '커뮤니케이션', '기술 이해도', '문제 해결'],
      yujin: [90, 85, 82, 88, 87],
      average: [70, 70, 70, 70, 70]
    };

    // 설명 메시지
    let analysisHTML = `<div style="padding:10px">`;
    analysisHTML += `<h3 style="color:#B4A0F0; margin:0 0 10px 0">YUJIN LEE 역량 분석</h3>`;
    analysisHTML += `<p style="color:rgba(255,255,255,.7); font-size:0.9rem; margin-bottom:15px">`;
    analysisHTML += `실제 프로젝트 성과와 경력을 바탕으로 산출한 역량 지표입니다.<br/>`;
    analysisHTML += `<span style="color:#6BBCC6">파란색</span>은 YUJIN, <span style="color:rgba(200,200,200,.8)">회색</span>은 일반 주니어 PM 평균입니다.`;
    analysisHTML += `</p></div>`;

    const analysisDiv = document.createElement('div');
    analysisDiv.className = 'nano-msg bot';
    analysisDiv.innerHTML = `<div class="bubble" style="max-width:100%">${analysisHTML}</div>`;
    this.body?.appendChild(analysisDiv);

    // 차트 캔버스 생성
    const chartContainer = document.createElement('div');
    chartContainer.className = 'competency-chart-container';
    chartContainer.style.cssText = 'background:rgba(30,20,50,.4); padding:20px; border-radius:12px; margin:10px 0; max-width:500px;';

    const canvas = document.createElement('canvas');
    canvas.id = 'competencyChart';
    canvas.width = 400;
    canvas.height = 400;
    chartContainer.appendChild(canvas);
    this.body?.appendChild(chartContainer);

    // Chart.js로 레이더 차트 생성
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: competencyData.labels,
        datasets: [
          {
            label: 'YUJIN LEE',
            data: competencyData.yujin,
            backgroundColor: 'rgba(107, 188, 198, 0.2)',
            borderColor: 'rgba(107, 188, 198, 0.8)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(107, 188, 198, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(107, 188, 198, 1)',
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: '주니어 PM 평균',
            data: competencyData.average,
            backgroundColor: 'rgba(200, 200, 200, 0.1)',
            borderColor: 'rgba(200, 200, 200, 0.5)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(200, 200, 200, 0.8)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(200, 200, 200, 1)',
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
              color: 'rgba(255, 255, 255, 0.6)',
              backdropColor: 'transparent',
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            pointLabels: {
              color: 'rgba(255, 255, 255, 0.85)',
              font: { size: 13, weight: 'bold' }
            },
            angleLines: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.9)',
              font: { size: 12 },
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(30, 20, 50, 0.9)',
            titleColor: '#6BBCC6',
            bodyColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: 'rgba(107, 188, 198, 0.5)',
            borderWidth: 1,
            padding: 10,
            displayColors: true
          }
        }
      }
    });

    // 상세 설명
    let detailHTML = `<div style="padding:10px; margin-top:10px">`;
    detailHTML += `<h4 style="color:#6BBCC6; margin:0 0 10px 0">역량 상세</h4>`;
    detailHTML += `<ul style="color:rgba(255,255,255,.8); font-size:0.85rem; line-height:1.6; padding-left:20px">`;
    detailHTML += `<li><b>데이터 분석 (90점)</b>: 제안서 50건 분석, SmartStock AI WAPE 14.2% 달성</li>`;
    detailHTML += `<li><b>프로젝트 관리 (85점)</b>: 3주 MVP 구축, MetraForge AI K-AI 경진대회 출품</li>`;
    detailHTML += `<li><b>커뮤니케이션 (82점)</b>: 20개 기업 인터뷰, 대외 홍보 콘텐츠 기획</li>`;
    detailHTML += `<li><b>기술 이해도 (88점)</b>: TCN+Tabular 하이브리드, LSTM+CNN 모델 기획</li>`;
    detailHTML += `<li><b>문제 해결 (87점)</b>: 리서치 DB 구축(재사용률 40% 증가), 온보딩 개선(3주 단축)</li>`;
    detailHTML += `</ul></div>`;

    const detailDiv = document.createElement('div');
    detailDiv.className = 'nano-msg bot';
    detailDiv.innerHTML = `<div class="bubble" style="max-width:100%">${detailHTML}</div>`;
    this.body?.appendChild(detailDiv);

    // 돌아가기 버튼
    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'nano-choices';
    const backBtn = document.createElement('button');
    backBtn.className = 'nano-chip';
    backBtn.textContent = '면접 모드로 돌아가기';
    backBtn.addEventListener('click', () => this.displayFlow('interview_mode'));
    choicesDiv.appendChild(backBtn);
    this.body?.appendChild(choicesDiv);

    this.scrollToBottom();
  }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.nanoYJUI = new NanoYJUI();
});
