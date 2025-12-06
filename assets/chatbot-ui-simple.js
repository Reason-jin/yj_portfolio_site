/**
 * Nano-YJ 챗봇 - 간소화 버전
 * OpenAI API 연동, 면접 모드, 프로젝트 추천
 */

(function() {
  'use strict';

  // DOM 요소
  const launcher = document.querySelector('.nano-yj-launch');
  const overlay = document.querySelector('.nano-overlay');
  const modal = document.querySelector('.nano-modal');
  const closeBtn = document.querySelector('.nano-close');
  const body = document.querySelector('.nano-body');
  const inputField = document.querySelector('.nano-input input');
  const sendBtn = document.querySelector('.nano-send');

  // 상태
  let currentMode = 'intro';
  let conversationHistory = [];
  const API_ENDPOINT = '/api/chat';

  // 프로젝트 데이터
  const projects = {
    metraforge: {
      name: 'MetraForge AI',
      desc: 'TCN+Tabular 하이브리드, PR-AUC 0.9667',
      link: 'projects.html#metraforge'
    },
    smartstock: {
      name: 'SmartStock AI',
      desc: 'LSTM+CNN 수요예측, WAPE 14.2%',
      link: 'projects.html#smartstock'
    },
    tensecond: {
      name: '10-Second Challenge',
      desc: 'YOLOv8 Pose + MediaPipe, 99% 인식',
      link: 'projects.html#tensecond'
    }
  };

  // 면접 질문
  const interviewQuestions = {
    intro: {
      q: '간단히 자기소개 부탁드립니다.',
      a: `안녕하세요, <b>이유진</b>입니다. 저는 데이터 기반 의사결정과 사용자 중심 기획을 핵심 역량으로 하는 주니어 Product Manager입니다.<br/><br/>

이투온에서 정부·지자체 AI·데이터 사업 제안서를 총괄 기획하며 <b>제안서 템플릿 표준화로 작성 시간 20% 단축</b>, <b>리서치 DB 구축으로 재사용률 40% 증대</b> 등의 성과를 냈습니다.<br/><br/>

또한 MBC 아카데미에서 <b>MetraForge AI</b>(K-AI 경진대회 출품), <b>SmartStock AI</b>(WAPE 14.2%) 등의 프로젝트를 PM 역할로 리드했습니다.<br/><br/>

작게 실험하고 빠르게 배우며, 데이터로 검증하는 방식으로 성과를 만드는 PM이 되겠습니다.`
    },
    strength: {
      q: '본인의 가장 큰 강점은?',
      a: `제 가장 큰 강점은 <b>"복잡한 문제를 데이터와 구조로 풀어내는 힘"</b>입니다.<br/><br/>

<b>【상황】</b> 이투온에서 매번 제안서를 처음부터 작성하느라 리드타임이 길고, 품질 편차가 컸습니다.<br/><br/>

<b>【실행】</b> 과거 제안서 50건을 분석해 공통 구조를 도출하고, 섹션별 템플릿을 설계했습니다. 또한 리서치 자료를 DB화하여 재사용 가능하게 만들었습니다.<br/><br/>

<b>【결과】</b> 작성 시간 20% 단축, 리서치 재사용률 40% 증대, 문서 품질 일관성 확보로 팀 생산성이 향상되었습니다.`
    },
    project: {
      q: '가장 기억에 남는 프로젝트는?',
      a: `<b>SmartStock AI</b> 프로젝트가 가장 기억에 남습니다.<br/><br/>

<b>【목표】</b> CSV 업로드만으로 AI 수요예측과 최적 재고정책을 제안하는 시스템 개발<br/><br/>

<b>【PM 역할】</b><br/>
1. 문제 정의: 중소기업 Pain Point 조사 → "데이터 정제"가 핵심 과제<br/>
2. 기획: 자동 데이터 정제 + LSTM+CNN 예측 + EOQ/ROP/SS 정책 계산<br/>
3. 프로토타입: 3주 만에 핵심 기능 완성<br/>
4. 검증: WAPE 14.2%, Fill Rate 96.3% 달성<br/><br/>

문제 정의부터 검증까지 전체 사이클을 PM 역할로 경험하며 실무 감각을 익혔습니다.`
    }
  };

  // 유틸리티
  function addMessage(html, isUser = false) {
    const div = document.createElement('div');
    div.className = `nano-msg ${isUser ? 'user' : 'bot'}`;
    div.innerHTML = `<div class="bubble">${html}</div>`;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function addChoices(choices) {
    const div = document.createElement('div');
    div.className = 'nano-choices';
    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'nano-chip';
      btn.textContent = choice.label;
      btn.onclick = () => handleChoice(choice);
      div.appendChild(btn);
    });
    body.appendChild(div);
  }

  function clearBody() {
    body.innerHTML = '';
  }

  // 흐름 처리
  function showIntro() {
    currentMode = 'intro';
    clearBody();
    addMessage('안녕하세요, 저는 <b>Nano-YJ</b>입니다. 무엇을 도와드릴까요?');
    addChoices([
      { label: '면접 모드 (면접관처럼 질문하기)', action: 'interview' },
      { label: '프로젝트 추천받기', action: 'projects' },
      { label: '이력서 보기', action: 'resume' }
    ]);
  }

  function showInterviewMode() {
    currentMode = 'interview';
    clearBody();
    addMessage('면접관이 되어 질문해보세요. 아래 질문을 선택하거나 직접 입력하실 수 있습니다.');
    addChoices([
      { label: '간단히 자기소개 부탁드립니다', action: 'q_intro' },
      { label: '본인의 가장 큰 강점은?', action: 'q_strength' },
      { label: '가장 기억에 남는 프로젝트는?', action: 'q_project' },
      { label: '메인으로 돌아가기', action: 'intro' }
    ]);
  }

  function showQuestion(key) {
    const qa = interviewQuestions[key];
    if (!qa) return;

    addMessage(`<b>Q: ${qa.q}</b>`);
    setTimeout(() => {
      addMessage(qa.a);
      addChoices([
        { label: '다른 질문하기', action: 'interview' },
        { label: '프로젝트 보기', action: 'projects' },
        { label: '메인으로', action: 'intro' }
      ]);
    }, 500);
  }

  function showProjects() {
    clearBody();
    addMessage('관심 있는 프로젝트를 선택하세요.');

    Object.values(projects).forEach(p => {
      const card = document.createElement('div');
      card.className = 'nano-project-card';
      card.innerHTML = `
        <h4>${p.name}</h4>
        <p>${p.desc}</p>
        <a href="${p.link}" target="_blank" class="nano-chip">자세히 보기</a>
      `;
      body.appendChild(card);
    });

    addChoices([
      { label: '메인으로 돌아가기', action: 'intro' }
    ]);
  }

  function showResume() {
    clearBody();
    addMessage(`<b>YUJIN LEE - AI Product Planner</b><br/><br/>
      <b>경력:</b><br/>
      • 이투온 - 사업기획팀 (2022.05~2024.02)<br/>
      • 금성출판사 - 플랫폼 비즈니스 (2021.02~2021.10)<br/>
      • 드라폼 - 기획팀 (2014.01~2014.12)<br/><br/>
      <a href="docs/resume_yujin_lee.pdf" target="_blank">📄 이력서 PDF 다운로드</a>
    `);
    addChoices([
      { label: '프로젝트 보기', action: 'projects' },
      { label: '메인으로', action: 'intro' }
    ]);
  }

  async function sendToAI(userMessage) {
    try {
      conversationHistory.push({ role: 'user', content: userMessage });

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: conversationHistory.slice(-10),
          context: { currentFlow: currentMode }
        })
      });

      if (response.ok) {
        const data = await response.json();
        conversationHistory.push({ role: 'assistant', content: data.reply });
        addMessage(data.reply);

        if (currentMode === 'interview') {
          addChoices([
            { label: '다른 질문하기', action: 'interview' },
            { label: '메인으로', action: 'intro' }
          ]);
        }
      } else {
        throw new Error('API 오류');
      }
    } catch (error) {
      console.error('AI 요청 실패:', error);
      addMessage('죄송합니다. 요청을 처리하지 못했습니다. 미리 준비된 질문을 선택해주세요.');
    }
  }

  function handleChoice(choice) {
    const actions = {
      'intro': showIntro,
      'interview': showInterviewMode,
      'projects': showProjects,
      'resume': showResume,
      'q_intro': () => showQuestion('intro'),
      'q_strength': () => showQuestion('strength'),
      'q_project': () => showQuestion('project')
    };

    const action = actions[choice.action];
    if (action) action();
  }

  function handleUserInput() {
    const text = inputField.value.trim();
    if (!text) return;

    addMessage(text, true);
    inputField.value = '';

    if (currentMode === 'interview') {
      sendToAI(text);
    } else {
      addMessage('준비 중인 기능입니다. 버튼을 선택해주세요.');
    }
  }

  // 이벤트 연결
  function open() {
    modal.classList.add('active');
    overlay.classList.add('active');
    if (body.children.length === 0) {
      showIntro();
    }
  }

  function close() {
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }

  launcher?.addEventListener('click', open);
  overlay?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);
  sendBtn?.addEventListener('click', handleUserInput);
  inputField?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserInput();
  });

  console.log('Nano-YJ 챗봇 초기화 완료');
})();
