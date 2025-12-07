/**
 * Multi-Agent System for Nano-YJ AI Assistant
 * 라우터 에이전트 + 전문 에이전트들
 */

const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ============================================
// 1. 라우터 에이전트 - 의도 분류
// ============================================
const ROUTER_PROMPT = `당신은 사용자 질문의 의도를 분류하는 라우터입니다.

다음 중 하나로 분류하세요:
- "interview": YUJIN LEE에 대한 질문 (자기소개, 강점/약점, 경험, 역량 등)
- "project": 프로젝트 관련 질문 (기술 스택, 성과, 구현 방법 등)
- "career": 경력/이력서 관련 질문
- "general": 일반 대화

JSON 형식으로만 응답하세요:
{"intent": "분류결과", "confidence": 0.0~1.0, "sub_topic": "세부주제"}`;

async function routeQuery(message) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: ROUTER_PROMPT },
        { role: 'user', content: message }
      ],
      temperature: 0.1,
      max_tokens: 100
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Router error:', error);
    return { intent: 'general', confidence: 0.5, sub_topic: null };
  }
}

// ============================================
// 2. 면접 에이전트 - STAR 기반 답변
// ============================================
const INTERVIEW_AGENT_PROMPT = `당신은 YUJIN LEE의 면접 대행 에이전트입니다.

## 역할
면접관의 질문에 YUJIN LEE를 1인칭으로 대신하여 STAR 방식으로 답변합니다.

## STAR 구조
- Situation: 상황 설명
- Task: 과제/목표
- Action: 실행한 행동
- Result: 성과/결과 (수치 포함)

## YUJIN LEE 핵심 정보

### 경력
1. ㈜이투온 (2022.05~2024.02): B2G 제안서 기획, 프로세스 표준화
   - 성과: 제안서 작성 시간 20% 단축, 리서치 재사용률 40% 증대
2. 금성출판사 (2021.02~2021.10): AI 수학 플랫폼 운영
   - 성과: 서비스 활용률 15% 향상
3. ㈜드라폼 (2014.01~2014.12): 공연 기획 및 운영

### 프로젝트 (MBC 아카데미 AI+X 과정)
1. MetraForge AI: 금속가공 품질 예측 (PR-AUC 0.9667)
2. SmartStock AI: B2B 수요예측 (WAPE 14.2%)
3. 10-Second Challenge: AI 포즈 인식 (99% 정확도)
4. 아이토리: AI 전래동화 영상 생성 (진행중)

### 강점
- 데이터 기반 의사결정
- 사용자 중심 기획
- 빠른 프로토타이핑

### 약점 및 개선
- 완벽주의 → MVP 접근법으로 개선

## 답변 규칙
1. 2-4문단으로 구체적으로 답변
2. 성과는 수치로 명확히
3. 자연스럽고 자신감 있는 톤
4. 마지막에 관련 증빙자료 언급`;

const INTERVIEW_AGENT_PROMPT_EN = `You are YUJIN LEE's interview agent.

## Role
Answer interview questions on behalf of YUJIN LEE in first person using the STAR method.

## STAR Structure
- Situation: Explain the context
- Task: The goal/challenge
- Action: What was done
- Result: Outcomes with metrics

## YUJIN LEE Key Information

### Career
1. ETUON Inc. (2022.05~2024.02): B2G proposal planning, process standardization
   - Achievements: 20% reduction in proposal writing time, 40% increase in research reuse rate
2. Kumsung Publishing (2021.02~2021.10): AI math platform operations
   - Achievements: 15% improvement in service utilization
3. Draform Inc. (2014.01~2014.12): Performance planning and operations

### Projects (MBC Academy AI+X Course)
1. MetraForge AI: Metal processing quality prediction (PR-AUC 0.9667)
2. SmartStock AI: B2B demand forecasting (WAPE 14.2%)
3. 10-Second Challenge: AI pose recognition (99% accuracy)
4. iTory: AI folktale video generation (In progress)

### Strengths
- Data-driven decision making
- User-centric planning
- Rapid prototyping

## Response Rules
1. Answer in 2-4 paragraphs with specifics
2. Include metrics for achievements
3. Natural, confident tone
4. Respond in English`;

async function interviewAgent(message, context, language = 'ko') {
  const prompt = language === 'en' ? INTERVIEW_AGENT_PROMPT_EN : INTERVIEW_AGENT_PROMPT;
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: message }
    ],
    temperature: 0.7,
    max_tokens: 1500
  });

  return {
    reply: response.choices[0].message.content,
    agent: 'interview',
    followUp: generateFollowUpQuestions(message)
  };
}

// ============================================
// 3. 프로젝트 에이전트 - 기술 상세 설명
// ============================================
const PROJECT_AGENT_PROMPT = `당신은 YUJIN LEE의 프로젝트 전문 에이전트입니다.

## 역할
프로젝트의 기술적 세부사항, 아키텍처, 성과 지표를 상세히 설명합니다.

## 프로젝트 상세 정보

### 1. MetraForge AI
- 목적: 금속 압출 공정 불량 사전 탐지
- 아키텍처: TCN + RandomForest 하이브리드 앙상블
- 데이터: PLC 5초 로그, 1.7만행×20열
- 전처리: 이상탐지, 정규화, 결측률 1.3%→0%
- 모델 성능: PR-AUC 0.9667, ROC-AUC 0.9983
- XAI: SHAP 기반 피처 중요도 시각화
- 개발환경: FastAPI, Streamlit

### 2. SmartStock AI
- 목적: 중소 제조·유통사 수요예측 + 재고정책
- 아키텍처: LSTM + CNN 하이브리드
- 핵심 기능: CSV 업로드 → 자동 정제 → 예측 → EOQ/ROP/SS 계산
- 성과: WAPE 14.2%, Fill Rate 96.3%
- AI Copilot: 자연어 질의로 정책 시뮬레이션
- 스택: React, FastAPI, MySQL, MLflow

### 3. 10-Second Challenge
- 목적: 게이미피케이션 포즈 촬영 서비스
- 아키텍처: MediaPipe(실시간) + YOLOv8 Pose(정밀) 하이브리드
- 성과: 99% 스켈레톤 인식, 1~4인 동시 지원
- 결과물: 사진+영상 자동 생성
- 스택: Python, Streamlit, OpenCV

### 4. 아이토리 (iTory)
- 목적: 5~11세 아동용 AI 전래동화 영상 생성
- 5가지 시각 스타일: 실사/2D애니/3D카툰/픽사/수채화
- 5막 구조: 발단/전개/위기/절정/결말
- AI 서비스: GPT-4o-mini, DALL-E 3, Seedance 2.0, ElevenLabs TTS
- 인프라: Firebase Gen2, Firestore, Cloud Storage
- 스택: React 18, TypeScript, React Native, FastAPI

## 답변 규칙
1. 기술적 정확성 유지
2. 아키텍처 다이어그램 설명 시 텍스트로 구조화
3. 성과 지표는 맥락과 함께 설명
4. 관련 문서/보고서 링크 제안`;

async function projectAgent(message, context, language = 'ko') {
  const langInstruction = language === 'en' ? '\n\nRespond in English.' : '';
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: PROJECT_AGENT_PROMPT + langInstruction },
      { role: 'user', content: message }
    ],
    temperature: 0.5,
    max_tokens: 1500
  });

  return {
    reply: response.choices[0].message.content,
    agent: 'project',
    resources: suggestResources(message)
  };
}

// ============================================
// 4. 경력 컨설턴트 에이전트
// ============================================
const CAREER_AGENT_PROMPT = `당신은 YUJIN LEE의 경력 컨설턴트 에이전트입니다.

## 역할
이력서 기반 맞춤 조언, 직무 적합성 분석, 강조 포인트 제안

## YUJIN LEE 경력 요약
- 총 경력: 약 4년
- 핵심 역량: 데이터 기반 기획, 프로세스 표준화, 사용자 리서치
- 강점: 복잡한 문제를 구조화하여 해결
- 현재 학습: MBC 아카데미 AI+X 융복합 과정

## 직무별 강조 포인트 가이드

### PM/기획자 지원 시
- 이투온 제안서 표준화 경험 (20% 시간 단축)
- SmartStock AI MVP 기획 경험
- 데이터 기반 의사결정 역량

### 데이터 분석가 지원 시
- 프로젝트 성과 지표 분석 경험
- WAPE, PR-AUC 등 모델 검증 경험
- Python, SQL 활용 능력

### 서비스 기획자 지원 시
- 사용자 인터뷰 기반 Pain Point 도출
- 금성출판사 UX 개선 경험 (15% 활용률 향상)
- Funnel 분석 경험`;

async function careerAgent(message, context, language = 'ko') {
  const langInstruction = language === 'en' ? '\n\nRespond in English.' : '';
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: CAREER_AGENT_PROMPT + langInstruction },
      { role: 'user', content: message }
    ],
    temperature: 0.6,
    max_tokens: 1000
  });

  return {
    reply: response.choices[0].message.content,
    agent: 'career'
  };
}

// ============================================
// 5. 면접 시뮬레이션 에이전트
// ============================================
const SIMULATION_AGENT_PROMPT = `당신은 면접관 역할을 하는 시뮬레이션 에이전트입니다.

## 역할
1. 실제 면접처럼 질문을 던집니다
2. 답변을 받으면 꼬리 질문을 합니다
3. 3-5개 질문 후 피드백을 제공합니다

## 면접 시뮬레이션 흐름
1. 인사 + 첫 질문 (자기소개)
2. 경험 기반 질문 2-3개
3. 상황 질문 1개
4. 마무리 질문
5. 전체 피드백

## 질문 풀
- 자기소개해주세요
- 왜 이 직무에 지원하셨나요?
- 가장 어려웠던 프로젝트는?
- 팀원과 의견 충돌 시 어떻게 해결하나요?
- 실패 경험과 배운 점은?
- 5년 후 모습은?
- 우리 회사에 대해 아는 것은?
- 마지막으로 하고 싶은 말은?

## 피드백 포인트
- STAR 구조 사용 여부
- 구체적인 수치 언급 여부
- 답변 길이 적절성
- 자신감 있는 표현 사용`;

async function simulationAgent(message, context, history) {
  const simulationHistory = history?.filter(h => h.agent === 'simulation') || [];
  const questionCount = simulationHistory.filter(h => h.role === 'assistant').length;

  let systemContent = SIMULATION_AGENT_PROMPT;

  // 시뮬레이션 진행 상태에 따른 조정
  if (questionCount === 0) {
    systemContent += '\n\n현재: 면접 시작. 인사와 첫 질문을 해주세요.';
  } else if (questionCount >= 4) {
    systemContent += '\n\n현재: 마무리 단계. 마지막 질문 후 전체 피드백을 제공하세요.';
  } else {
    systemContent += `\n\n현재: ${questionCount}번째 질문 완료. 답변을 평가하고 다음 질문을 하세요.`;
  }

  const messages = [
    { role: 'system', content: systemContent }
  ];

  // 시뮬레이션 대화 히스토리 추가
  if (simulationHistory.length > 0) {
    simulationHistory.forEach(h => {
      messages.push({ role: h.role, content: h.content });
    });
  }

  messages.push({ role: 'user', content: message });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages,
    temperature: 0.7,
    max_tokens: 800
  });

  return {
    reply: response.choices[0].message.content,
    agent: 'simulation',
    questionCount: questionCount + 1,
    isComplete: questionCount >= 5
  };
}

// ============================================
// 6. 일반 대화 에이전트
// ============================================
async function generalAgent(message, context, language = 'ko') {
  const systemPrompt = language === 'en'
    ? `You are Nano-YJ, YUJIN LEE's AI assistant.
        Be friendly and professional, providing information about YUJIN LEE.
        Respond concisely in 2-3 sentences in English.`
    : `당신은 YUJIN LEE의 AI 어시스턴트 Nano-YJ입니다.
        친근하고 전문적으로 대화하며, YUJIN LEE에 대한 정보를 안내합니다.
        간결하게 2-3문장으로 답변하세요.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ],
    temperature: 0.8,
    max_tokens: 500
  });

  return {
    reply: response.choices[0].message.content,
    agent: 'general'
  };
}

// ============================================
// 헬퍼 함수들
// ============================================
function generateFollowUpQuestions(message) {
  const followUps = {
    '자기소개': ['그럼 가장 큰 성과는 뭔가요?', '왜 PM 직무를 선택하셨나요?'],
    '강점': ['그 강점을 발휘한 구체적 사례는?', '약점은 뭔가요?'],
    '약점': ['개선을 위해 어떤 노력을 하셨나요?'],
    '프로젝트': ['어떤 기술 스택을 사용했나요?', 'PM으로서 어떤 역할을 하셨나요?'],
    '갈등': ['결과는 어땠나요?', '다시 한다면 다르게 하실 점은?'],
    '실패': ['그 경험에서 배운 점은?', '이후 어떻게 개선하셨나요?']
  };

  for (const [keyword, questions] of Object.entries(followUps)) {
    if (message.includes(keyword)) {
      return questions;
    }
  }
  return ['더 궁금한 점이 있으신가요?'];
}

function suggestResources(message) {
  const resources = [];

  if (message.includes('MetraForge') || message.includes('메트라포지')) {
    resources.push({ title: 'MetraForge AI 보고서', url: './docs/metraforge_final_report.pdf' });
  }
  if (message.includes('SmartStock') || message.includes('스마트스톡')) {
    resources.push({ title: 'SmartStock AI 기획서', url: './docs/smartstock_planning.pdf' });
    resources.push({ title: 'SmartStock AI 보고서', url: './docs/smartstock_final_report.pdf' });
  }
  if (message.includes('10-Second') || message.includes('텐세컨드') || message.includes('포즈')) {
    resources.push({ title: '10-Second Challenge 발표자료', url: './docs/10sec_presentation.pdf' });
  }

  return resources;
}

// ============================================
// 메인 오케스트레이터
// ============================================
async function orchestrate(message, history, context, language = 'ko') {
  // 1. 의도 분류
  const routing = await routeQuery(message);
  console.log('Routing result:', routing);

  // 2. 적절한 에이전트로 라우팅
  let result;

  switch (routing.intent) {
    case 'interview':
      result = await interviewAgent(message, context, language);
      break;
    case 'project':
      result = await projectAgent(message, context, language);
      break;
    case 'career':
      result = await careerAgent(message, context, language);
      break;
    default:
      result = await generalAgent(message, context, language);
  }

  // 3. 메타데이터 추가
  result.routing = routing;
  result.timestamp = new Date().toISOString();

  return result;
}

module.exports = {
  orchestrate,
  routeQuery,
  interviewAgent,
  projectAgent,
  careerAgent,
  generalAgent
};
