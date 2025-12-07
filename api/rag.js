/**
 * RAG (Retrieval-Augmented Generation) System
 * 문서 기반 검색 + AI 답변 생성
 */

const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ============================================
// 문서 저장소 (인메모리 - 실제 운영 시 Vector DB 사용)
// ============================================
const documentStore = {
  // 이력서 정보
  resume: {
    id: 'resume',
    title: '이력서',
    content: `
이유진 (YUJIN LEE)
AI Product Planner / 주니어 PM

[연락처]
이메일: yujin2ee@naver.com
GitHub: Reason-jin
포트폴리오: yjportfoliosite.vercel.app

[학력]
MBC 아카데미 AI+X 융복합 과정 (2025.07 - 2025.12 수료 예정)

[자격증]
- 컴퓨터활용능력 2급 (대한상공회의소)
- 워드프로세서 1급 (대한상공회의소)
- FAT 전산회계 2급 (한국세무사회)
- SMAT 서비스경영 2급 (한국생산성본부)

[경력]
1. ㈜이투온 사업기획팀 연구원 (2022.05 ~ 2024.02, 1년 11개월)
   - 정부/지자체 AI·데이터 사업 제안서 기획
   - 제안서 템플릿 표준화로 작성 시간 20% 단축
   - 리서치 DB 구축으로 자료 재사용률 40% 증대

2. 금성출판사 플랫폼비즈니스팀 사원 (2021.02 ~ 2021.10, 9개월)
   - AI 수학 플랫폼 '매쓰클라우드' 운영
   - 온보딩 교육 개선으로 서비스 활용률 15% 향상

3. ㈜드라폼 기획팀 사원 (2014.01 ~ 2014.12, 1년)
   - 드로잉 뮤지컬 '고흐즈' 운영 지원
   - 공연 기획 및 협력기관 커뮤니케이션
`,
    keywords: ['이력서', '경력', '학력', '자격증', '연락처']
  },

  // MetraForge AI 프로젝트
  metraforge: {
    id: 'metraforge',
    title: 'MetraForge AI 프로젝트',
    content: `
MetraForge AI - AI 기반 지능형 금속가공 품질 향상 시스템

[개요]
K-AI 경진대회 출품작 (2025)
금속 압출 공정 불량을 사전 탐지하는 Tabular + TCN 하이브리드 AI 품질보증 시스템

[PM으로서 기획 전략]
1. 현장의 실질적 문제 정의
   - FP(오탐)를 극단적으로 통제하여 현장 경보 피로도 해소
   - 실질적 가치 창출 구조 기획

2. 하이브리드 모델 전략
   - 정적(RandomForest) + 시계열(TCN) 투 트랙 앙상블
   - 예측 정밀도 향상 및 안정성 확보

3. XAI 기반 신뢰도 확보
   - SHAP 기반 로컬 피처 중요도 제시
   - 현장 작업자의 AI 시스템 신뢰도 확보

4. 선제적 리드타임 확보
   - 불량 발생 전 최소 1분 이상 탐지
   - 선제적 대응 가능성 설계

[성과 지표]
- Soft 앙상블 PR-AUC: 0.9667
- Soft 앙상블 ROC-AUC: 0.9983
- 결측률 개선: 1.3% → 0% (품질지수 100%)
- 탐지 리드타임 중앙값: ≥1분

[기술 스택]
- 데이터: PLC 5초 로그, 1.7만행×20열
- 모델: TCN + Tabular Soft·Cascade 앙상블
- 전처리: 이상탐지, 정규화, 결측률 0% 개선
- 개발환경: FastAPI, Streamlit 기반 MVP
`,
    keywords: ['MetraForge', '메트라포지', '금속가공', '품질', 'TCN', 'SHAP', 'XAI', 'K-AI']
  },

  // SmartStock AI 프로젝트
  smartstock: {
    id: 'smartstock',
    title: 'SmartStock AI 프로젝트',
    content: `
SmartStock AI - B2B 제조·유통사를 위한 AI 수요예측 + 재고정책 통합 솔루션

[개요]
AIX 프로젝트 (2025)
ERP/WMS 연동 없이 CSV 업로드만으로 자동정제, 예측, 최적 발주정책 계산

[PM으로서 기획 전략]
1. 경계 없는 솔루션 설계
   - WMS/ERP 연동 없이 CSV 업로드만으로 자동화
   - 중소기업 맞춤형 플랫폼 구조

2. Hyper-Parameter 자동 탐색
   - 안전재고(SS), 발주점(ROP), 발주량(EOQ) 자동 계산
   - AI 모델 예측 결과에 따라 최적값 제안

3. 데이터 품질 자동화
   - 결측치, 이상치, 중복 데이터 자동 감지 및 정제
   - 업로드 즉시 분석 효율성 확보

4. 정책 시뮬레이션 환경
   - AI Copilot으로 자연어 질의
   - 가상 정책 시뮬레이션 수행

[성과 지표]
- WAPE (예측 오차율): 14.2%
- Fill Rate (충족률): 96.3%
- MVP 프로토타입: 3주 구축
- End-to-End 자동화: 데이터 정제 ~ 정책 계산

[기술 스택]
- 프론트엔드: React, TypeScript, D3.js
- 백엔드: FastAPI, MySQL
- AI 엔진: LSTM + CNN Hybrid Forecast
- 핵심 정책: SS, ROP, EOQ, MLflow 추적
`,
    keywords: ['SmartStock', '스마트스톡', '수요예측', '재고', 'LSTM', 'CNN', 'WAPE', 'EOQ', 'ROP']
  },

  // 10-Second Challenge 프로젝트
  tensecond: {
    id: 'tensecond',
    title: '10-Second Challenge 프로젝트',
    content: `
10-Second Challenge - AI 기반 포즈 챌린지 촬영 서비스

[개요]
Rapid Prototype (2025)
포즈 정확도 인식과 자동 촬영으로 게임처럼 즐기는 체험 제공

[서비스 기획 전략]
1. 포즈 챌린지 + 자동 촬영
   - 포즈 정확도 실시간 측정
   - 기준 충족 시 자동 촬영
   - 게임화된 체험 제공

2. 하이브리드 포즈 인식
   - MediaPipe: 실시간/저사양 환경
   - YOLOv8 Pose: 정밀/다인 인식
   - 웹캠 환경에서 99% 인식률 달성

3. 결과물 생성 및 공유
   - 사진+영상 결과물 제공
   - SNS 공유 최적화
   - MZ세대 바이럴 마케팅 효과

4. 엔터테인먼트 UX 설계
   - 게임/챌린지 형식 체험
   - 체험 공간, 행사, 프로모션 부스 활용

[성과 지표]
- 포즈 인식 정확도: 99% (스켈레톤 기준)
- 동시 인식 지원: 1~4인
- 컨셉별 포즈 세트: 5가지
- 결과물: 사진+영상

[기술 스택]
- 개발 환경: Python, Streamlit
- AI 모델: YOLOv8 실시간 포즈 인식
- UX: 게이미피케이션, 리더보드 시스템
- 기능: 세션 기록, 참여자별 성과 추적
- 데이터: 웹캠 스트리밍 데이터
`,
    keywords: ['10-Second', '텐세컨드', '포즈', 'YOLOv8', 'MediaPipe', '촬영', '게이미피케이션']
  },

  // 아이토리 프로젝트
  aitory: {
    id: 'aitory',
    title: '아이토리 (iTory) 프로젝트',
    content: `
아이토리 (iTory) - AI 기반 인터랙티브 전래동화 영상 생성 플랫폼

[개요]
현재 진행중 (2025)
5~11세 아동을 위한 맞춤형 전래동화 영상 생성 플랫폼

[서비스 특징]
- 5가지 시각 스타일: 실사/2D애니/3D카툰/픽사/수채화
- 5막 구조 스토리텔링: 발단/전개/위기/절정/결말
- 전체 영상 생성 시간: 2분 30초

[PM으로서 기획 전략]
1. 5-Style Generation System
   - 동일 스토리를 5가지 화풍으로 재생성
   - 아동의 능동적 참여와 선호도 선택권 보장

2. Firebase Gen2 기반 비용 효율화
   - Cloud Functions Gen2로 트래픽 변동 대응
   - Firestore로 실시간 동기화
   - 서버리스 구조로 비용 최적화

3. 5막 구조 스토리텔링
   - 고전적 서사 구조를 AI 프롬프트에 반영
   - 이야기 완성도 확보

4. 순이익 구조 설계
   - Premium 19,000원 기반 3-tier 수익 구조
   - Y3 흑자 전환 (8.5%)
   - AI 비용 최적화 (35%→20%)
   - Y5 영업이익률 46.8% 목표

[기술 스택]
- 프론트엔드: React 18, TypeScript, React Native
- 백엔드: FastAPI, Firebase Gen2
- AI 서비스: GPT-4o-mini, DALL-E 3, Seedance 2.0
- 인프라: Firestore, Cloud Storage, ElevenLabs TTS
`,
    keywords: ['아이토리', 'iTory', '전래동화', 'DALL-E', 'GPT', 'Firebase', '아동', '영상']
  },

  // 면접 답변 가이드
  interview_guide: {
    id: 'interview_guide',
    title: '면접 답변 가이드',
    content: `
YUJIN LEE 면접 답변 가이드

[자기소개]
안녕하세요, 데이터 기반 의사결정과 사용자 중심 기획을 핵심 역량으로 하는 이유진입니다.
이투온에서 제안서 템플릿 표준화로 작성 시간 20% 단축, 리서치 DB 구축으로 재사용률 40% 증대 성과.
MBC 아카데미에서 MetraForge AI(PR-AUC 0.9667), SmartStock AI(WAPE 14.2%) 등 PM 역할로 프로젝트 진행.
"작게 실험하고 빠르게 배우며 성과를 만드는" PM이 되겠습니다.

[강점]
복잡한 문제를 데이터와 구조로 풀어내는 힘.
이투온에서 제안서 50건 분석 → 공통 구조 도출 → 템플릿 설계 → 작성 시간 20% 단축, 재사용률 40% 증대.

[약점]
완벽주의 성향으로 인한 의사결정 지연.
개선: MVP 접근법, 80/20 법칙, 데드라인 우선 원칙 적용.
SmartStock AI에서 완벽한 모델 대기 대신 WAPE 15% 목표로 먼저 프로토타입 구축, 피드백으로 14.2%까지 개선.

[프로젝트 경험]
실무: 이투온 제안서 표준화 (50건 분석 → 템플릿 설계 → 20% 시간 단축)
학습: SmartStock AI (3주 MVP → WAPE 14.2%, Fill Rate 96.3%)

[갈등 해결]
MetraForge AI에서 팀원과 방향성 갈등.
자료 조사로 설득 + 공통 목표 재정의 + 실험으로 검증.
결과: SHAP 기반 XAI 추가로 K-AI 경진대회 차별화 포인트 확보.

[실패 경험]
금성출판사 온보딩 콘텐츠 개편 실패.
60페이지 매뉴얼 → 활용률 5% 하락.
원인: 사용자 인터뷰 부재.
재실행: 3분 동영상 + 체크리스트 + 가이드 투어 → 활용률 15% 상승.
교훈: "문제를 가정하지 말고 사용자에게 직접 물어라"

[5년 후 비전]
단기: 담당 제품 핵심 지표 개선, A/B 테스트 역량 심화
중기: 0→1 제품 리드, 주니어 멘토링
장기: 데이터와 사용자 관점으로 기업 성장을 이끄는 시니어 PM
`,
    keywords: ['면접', '자기소개', '강점', '약점', '갈등', '실패', '비전', 'STAR']
  }
};

// ============================================
// 텍스트 유사도 계산 (간단한 키워드 매칭)
// ============================================
function calculateRelevance(query, document) {
  const queryLower = query.toLowerCase();
  const keywords = document.keywords || [];

  let score = 0;

  // 키워드 매칭
  keywords.forEach(keyword => {
    if (queryLower.includes(keyword.toLowerCase())) {
      score += 10;
    }
  });

  // 제목 매칭
  if (queryLower.includes(document.title.toLowerCase())) {
    score += 20;
  }

  // 내용에서 직접 검색
  const contentLower = document.content.toLowerCase();
  const queryWords = queryLower.split(/\s+/);
  queryWords.forEach(word => {
    if (word.length > 2 && contentLower.includes(word)) {
      score += 2;
    }
  });

  return score;
}

// ============================================
// 관련 문서 검색
// ============================================
function searchDocuments(query, topK = 3) {
  const results = [];

  for (const [key, doc] of Object.entries(documentStore)) {
    const relevance = calculateRelevance(query, doc);
    if (relevance > 0) {
      results.push({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        relevance: relevance
      });
    }
  }

  // 관련도 순으로 정렬
  results.sort((a, b) => b.relevance - a.relevance);

  return results.slice(0, topK);
}

// ============================================
// RAG 기반 답변 생성
// ============================================
async function generateRAGResponse(query, context, language = 'ko') {
  // 1. 관련 문서 검색
  const relevantDocs = searchDocuments(query);

  if (relevantDocs.length === 0) {
    const noDataMsg = language === 'en'
      ? 'No relevant information found. Please try a different question.'
      : '관련 정보를 찾지 못했습니다. 다른 질문을 해주세요.';
    return {
      reply: noDataMsg,
      sources: [],
      agent: 'rag'
    };
  }

  // 2. 컨텍스트 구성
  const contextText = relevantDocs
    .map(doc => `[${doc.title}]\n${doc.content}`)
    .join('\n\n---\n\n');

  // 3. 언어별 시스템 프롬프트
  const systemPrompt = language === 'en'
    ? `You are YUJIN LEE's AI assistant.
Answer questions accurately based on the document information below.

## Reference Documents
${contextText}

## Rules
1. Only use information from the documents
2. Mention specific numbers and achievements
3. Connect to relevant projects or career experience
4. Answer in 2-3 paragraphs in English`
    : `당신은 YUJIN LEE의 AI 어시스턴트입니다.
아래 문서 정보를 바탕으로 질문에 정확하게 답변하세요.

## 참고 문서
${contextText}

## 규칙
1. 문서에 있는 정보만 사용
2. 구체적인 수치와 성과 언급
3. 관련 프로젝트나 경력 연결
4. 2-3문단으로 답변`;

  // 4. GPT로 답변 생성
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ],
    temperature: 0.5,
    max_tokens: 1000
  });

  return {
    reply: response.choices[0].message.content,
    sources: relevantDocs.map(doc => ({
      id: doc.id,
      title: doc.title,
      relevance: doc.relevance
    })),
    agent: 'rag'
  };
}

// ============================================
// 특정 문서 조회
// ============================================
function getDocument(documentId) {
  return documentStore[documentId] || null;
}

// ============================================
// 모든 문서 목록
// ============================================
function listDocuments() {
  return Object.values(documentStore).map(doc => ({
    id: doc.id,
    title: doc.title,
    keywords: doc.keywords
  }));
}

module.exports = {
  searchDocuments,
  generateRAGResponse,
  getDocument,
  listDocuments,
  documentStore
};
