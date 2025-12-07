/**
 * AI Assistant - Nano-YJ Scenarios & State Management
 * 대화 흐름 및 시나리오 정의 (면접 모드 포함)
 */

class NanoYJScenario {
  constructor() {
    this.currentFlow = 'intro';
    this.conversationHistory = [];
    this.userChoices = {
      domain: null,
      priority: null,
      format: null,
      interviewMode: false
    };
    // 언어 설정 (외부에서 주입)
    this.language = 'ko';
  }

  // 언어 설정
  setLanguage(lang) {
    this.language = lang;
  }

  // 프로젝트 매핑
  projectsDB = {
    aitory: {
      name: '아이토리 (iTory)',
      badge: '현재 진행중',
      subtitle: 'AI 기반 인터랙티브 전래동화 영상 생성 플랫폼',
      domain: '플랫폼·SaaS',
      highlights: [
        '5가지 시각 스타일 (실사/2D애니/3D카툰/픽사/수채화)',
        '5막 구조 스토리텔링 (발단/전개/위기/절정/결말)',
        'GPT-4o-mini + DALL-E 3 + Seedance 2.0',
        'Firebase Gen2 서버리스 아키텍처'
      ],
      resources: [
        { type: 'link', title: '시스템 아키텍처', url: 'https://drive.google.com/file/d/1JNPF4smRGib5erz0Xg5EJ0JRZ7LIQyfA/view?usp=drive_link' },
        { type: 'link', title: '기술스택정의서', url: 'https://docs.google.com/spreadsheets/d/1FumutktX6VZcnG2TZGOnX7ONDWDyPiPC2VMnMi0Tbrc/edit?gid=0#gid=0' },
        { type: 'link', title: 'WBS&마일스톤', url: 'https://docs.google.com/spreadsheets/d/1PDs3U1VkHI-x2EYcZHWP-8IPLkDX18dzrWuwcEHjCtA/edit?gid=1845099267#gid=1845099267' }
      ]
    },
    metraforge: {
      name: 'MetraForge AI',
      badge: 'K-AI 경진대회 출품',
      subtitle: 'AI 기반 지능형 금속가공 품질 향상 시스템',
      domain: '제조·물류',
      highlights: [
        'Tabular + TCN 하이브리드 AI',
        'PR-AUC 0.9667 / ROC-AUC 0.9983',
        '≥1분 탐지 리드타임'
      ],
      resources: [
        { type: 'pdf', title: '보고서 다운로드', url: './docs/metraforge_final_report.pdf' },
        { type: 'pdf', title: '발표자료', url: './docs/metraforge_presentation.pdf' }
      ]
    },
    smartstock: {
      name: 'SmartStock AI',
      badge: 'B2B 수요예측 솔루션',
      subtitle: 'AI 수요예측 + 재고정책 통합 솔루션',
      domain: '플랫폼·SaaS',
      highlights: [
        'LSTM+CNN 예측 모델',
        'WAPE 14.2% / Fill Rate 96.3%',
        '업무 시간 70% 절감'
      ],
      resources: [
        { type: 'pdf', title: '보고서 다운로드', url: './docs/smartstock_final_report.pdf' },
        { type: 'pdf', title: '기획서', url: './docs/smartstock_planning.pdf' },
        { type: 'guide', title: '사용자 가이드', url: './docs/smartstock_user_guide.pdf' }
      ]
    },
    tensecond: {
      name: '10-Second Challenge',
      badge: '엔터테인먼트 촬영 프로토타입',
      subtitle: 'AI 기반 포즈 챌린지 촬영 서비스',
      domain: '실험적 프로토타입',
      highlights: [
        'YOLOv8 Pose + MediaPipe 하이브리드',
        '99% 스켈레톤 인식 / 1~4인 동시 지원',
        '사진+영상 결과물 / 게임화 UX'
      ],
      resources: [
        { type: 'pdf', title: '발표자료 다운로드', url: './docs/10sec_presentation.pdf' },
        { type: 'video', title: '데모 영상 보기', url: 'https://drive.google.com/file/d/1L0qhppeYbzSdg99d1-th5aWeSIW-xS54/preview' },
        { type: 'pdf', title: 'R&R & WBS', url: './docs/10sec_WBS_R&R.pdf' }
      ]
    }
  };

  // 면접 질문 데이터베이스 (STAR 기반 답변)
  interviewQuestionsDB = {
    introduction: {
      question: '간단히 자기소개 부탁드립니다.',
      answer: `안녕하세요, 이유진입니다. 저는 <b>데이터 기반 의사결정</b>과 <b>사용자 중심 기획</b>을 핵심 역량으로 하는 주니어 Product Manager입니다.<br/><br/>

이투온에서 정부·지자체 AI·데이터 사업 제안서를 총괄 기획하며 <b>제안서 템플릿 표준화로 작성 시간 20% 단축</b>, <b>리서치 DB 구축으로 재사용률 40% 증대</b> 등의 성과를 냈습니다.<br/><br/>

또한 MBC 아카데미 AI+X 융복합 과정에서 학습을 통해 <b>MetraForge AI</b>(K-AI 경진대회 출품, PR-AUC 0.9667), <b>SmartStock AI</b>(LSTM+CNN 수요예측 WAPE 14.2%) 등의 포트폴리오 프로젝트를 PM 역할로 진행하며 기획부터 모델 검증까지 전 과정을 경험했습니다.<br/><br/>

작게 실험하고 빠르게 배우며, 데이터로 검증하는 방식으로 성과를 만드는 PM이 되겠습니다.`,
      sources: [
        { type: 'career', title: '㈜이투온 재직 증명', period: '2022.05 ~ 2024.02', verified: true },
        { type: 'project', title: 'MetraForge AI 프로젝트', link: './docs/metraforge_final_report.pdf' },
        { type: 'project', title: 'SmartStock AI 프로젝트', link: './docs/smartstock_final_report.pdf' },
        { type: 'document', title: '이력서 전문', link: './docs/resume_yujin_lee.pdf' }
      ]
    },
    strength: {
      question: '본인의 가장 큰 강점은 무엇인가요?',
      answer: `제 가장 큰 강점은 <b>"복잡한 문제를 데이터와 구조로 풀어내는 힘"</b>입니다.<br/><br/>

<b>【상황】</b> 이투온에서 매번 제안서를 처음부터 작성하느라 리드타임이 길고, 품질 편차가 컸습니다.<br/><br/>

<b>【과제】</b> 제안서 작성 프로세스를 체계화하여 효율성과 품질을 동시에 확보해야 했습니다.<br/><br/>

<b>【실행】</b> 과거 제안서 50건을 분석해 공통 구조를 도출하고, 섹션별 템플릿을 설계했습니다. 또한 시장·경쟁사 리서치 자료를 DB화하여 재사용 가능하게 만들었습니다.<br/><br/>

<b>【결과】</b> 작성 시간 20% 단축, 리서치 자료 재사용률 40% 증대, 문서 품질 일관성 확보로 팀 전체 생산성이 향상되었습니다.<br/><br/>

이처럼 저는 반복되는 문제를 구조화하고, 데이터로 개선점을 찾아 실행하는 역량을 갖추고 있습니다.`,
      sources: [
        { type: 'career', title: '㈜이투온 사업기획팀', period: '2022.05 ~ 2024.02', verified: true },
        { type: 'metric', title: '작업 시간 단축', value: '평균 20% 감소', method: '전후 비교 분석' },
        { type: 'metric', title: '자료 재사용률', value: '40% 증대', method: '재활용 건수 추적' }
      ]
    },
    weakness: {
      question: '본인의 약점이나 개선이 필요한 부분은 무엇인가요?',
      answer: `제 약점은 <b>"완벽주의 성향으로 인한 의사결정 지연"</b>입니다.<br/><br/>

초기에는 모든 데이터를 완벽하게 분석한 후 결정하려 했으나, 빠른 실행이 필요한 상황에서 병목이 되었습니다.<br/><br/>

<b>【개선 노력】</b><br/>
• <b>MVP 접근법 도입</b>: 최소 기능부터 출시하고 피드백으로 개선<br/>
• <b>80/20 법칙 적용</b>: 핵심 20%에 집중해 80% 성과 달성<br/>
• <b>데드라인 우선</b>: "완벽한 계획"보다 "실행 가능한 계획" 우선<br/><br/>

MBC 아카데미에서 진행한 SmartStock AI 학습 프로젝트에서 완벽한 예측 모델을 기다리기보다, WAPE 15% 목표를 달성한 모델로 먼저 프로토타입을 구축하고, 팀 피드백을 통해 정확도를 14.2%까지 개선했습니다. 또한 10-Second Challenge 학습 프로젝트에서는 2주 만에 하이브리드 포즈 인식 프로토타입을 구축하여 빠른 검증을 우선시했습니다.<br/><br/>

현재는 "완벽보다 실행, 실행하며 개선"을 원칙으로 일하고 있습니다.`
    },
    motivation: {
      question: '우리 회사에 지원한 이유는 무엇인가요?',
      answer: `귀사에 지원한 이유는 세 가지입니다.<br/><br/>

<b>1. 데이터 기반 의사결정 문화</b><br/>
귀사는 A/B 테스트와 데이터 분석을 통해 제품을 개선한다고 들었습니다. 저 역시 학습 프로젝트에서 데이터 분석을 통해 모델 성능을 개선한 경험이 있어, 귀사의 문화와 잘 맞을 것 같습니다.<br/><br/>

<b>2. 실험적 시도를 장려하는 환경</b><br/>
귀사의 "Fail Fast, Learn Faster" 철학은 제가 추구하는 "작게 실험하고 빠르게 배우는" 방식과 일치합니다. MBC 아카데미 학습 과정에서 10-Second Challenge 프로토타입을 2주 만에 구축하며 빠른 실행의 가치를 경험했습니다.<br/><br/>

<b>3. 성장 기회</b><br/>
귀사의 [구체적인 제품/서비스]는 제가 관심 있는 [도메인] 분야이며, [팀/프로젝트]에서 기획 역량을 더욱 성장시킬 수 있을 것으로 기대합니다.<br/><br/>

데이터로 말하고, 빠르게 실험하며, 사용자 가치를 만드는 PM으로 기여하고 싶습니다.`
    },
    project_experience: {
      question: '가장 기억에 남는 프로젝트는 무엇인가요?',
      answer: `실무에서는 <b>이투온에서의 제안서 표준화 프로젝트</b>가 가장 기억에 남습니다. 50건의 제안서를 분석하여 템플릿을 설계하고, 작성 시간 20% 단축이라는 성과를 냈습니다.<br/><br/>

또한 MBC 아카데미 AI+X 융복합 과정에서 학습을 통해 진행한 <b>SmartStock AI</b>도 인상 깊었습니다.<br/><br/>

<b>【배경】</b> 교육 과정에서 중소 제조·유통사의 재고관리 문제를 해결하는 포트폴리오 프로젝트를 진행했습니다.<br/><br/>

<b>【목표】</b> CSV 업로드만으로 AI 수요예측과 최적 재고정책을 제안하는 시스템을 개발하는 것이었습니다.<br/><br/>

<b>【PM 역할로 학습한 내용】</b><br/>
1. <b>문제 정의</b>: 중소기업의 Pain Point 조사 → "데이터 정제"가 핵심 과제임을 파악<br/>
2. <b>기획</b>: 자동 데이터 정제 + LSTM+CNN 예측 + EOQ/ROP/SS 정책 계산을 하나의 플로우로 설계<br/>
3. <b>프로토타입 구축</b>: 3주 만에 핵심 기능 완성<br/>
4. <b>모델 검증</b>: 학습 데이터셋 기준 WAPE 14.2%, Fill Rate 96.3% 달성<br/>
5. <b>문서화</b>: 사용자 가이드, 기획서, 최종 보고서 작성<br/><br/>

<b>【배운 점】</b><br/>
• 데이터 전처리의 중요성 (결측치/이상치 처리)<br/>
• AI 모델 선정 시 정확도와 실행 속도의 트레이드오프<br/>
• 사용자 관점의 UI/UX 설계 경험<br/><br/>

이 학습 프로젝트를 통해 <b>문제 정의 → 기획 → 개발 → 검증</b>의 전체 사이클을 PM 역할로 경험하며 실무에 적용할 역량을 키웠습니다.`,
      sources: [
        { type: 'project', title: 'SmartStock AI 최종 보고서', link: './docs/smartstock_final_report.pdf' },
        { type: 'project', title: 'SmartStock AI 기획서', link: './docs/smartstock_planning.pdf' },
        { type: 'project', title: 'SmartStock AI 사용자 가이드', link: './docs/smartstock_user_guide.pdf' },
        { type: 'metric', title: 'WAPE (예측 정확도)', value: '14.2%', method: '학습 데이터셋 검증' },
        { type: 'metric', title: 'Fill Rate (서비스 수준)', value: '96.3%', method: '학습 데이터셋 검증' },
        { type: 'document', title: 'MBC 아카데미 AI+X 융복합 과정', period: '2024' }
      ]
    },
    conflict: {
      question: '팀원과 갈등이 있었던 경험과 해결 방법을 말씀해주세요.',
      answer: `MBC 아카데미에서 진행한 MetraForge AI 학습 프로젝트에서 팀원과 기획 방향으로 의견 차이가 있었습니다.<br/><br/>

<b>【상황】</b> 팀원은 "모델 정확도 향상"에 집중했고, 저는 "실무 현장에서 사용 가능한 실용성"을 우선했습니다.<br/><br/>

<b>【갈등】</b> 팀원은 더 많은 피처 엔지니어링으로 PR-AUC를 0.98 이상으로 올리자고 했으나, 저는 현재 0.9667로도 충분하며, 대신 "오탐(FP) 최소화"와 "XAI 설명력 강화"가 실무 적용 시 더 중요하다고 판단했습니다.<br/><br/>

<b>【해결】</b><br/>
1. <b>자료 조사로 설득</b>: 제조 현장의 "경보 피로도" 문제에 대한 레퍼런스를 공유하며 Pain Point 설명<br/>
2. <b>공통 목표 재정의</b>: "모델 정확도"가 아닌 "실무 적용 가능성"을 핵심 지표로 합의<br/>
3. <b>실험으로 검증</b>: FP를 최소화한 모델의 실용성을 프로토타입으로 시연<br/><br/>

<b>【결과】</b> 팀원도 납득하고, SHAP 기반 XAI를 추가하여 K-AI 경진대회 출품 시 차별화 포인트로 활용했습니다.<br/><br/>

이를 통해 <b>"의견 차이는 데이터와 사용자 관점으로 풀 수 있다"</b>는 것을 배웠습니다.`
    },
    failure: {
      question: '실패했던 경험과 그로부터 배운 점을 말씀해주세요.',
      answer: `금성출판사에서 <b>온보딩 교육 콘텐츠 개편</b> 프로젝트가 초기에 실패했습니다.<br/><br/>

<b>【상황】</b> AI 수학 서비스 '매쓰클라우드'의 활용률이 낮아, 온보딩 교육을 개선해야 했습니다.<br/><br/>

<b>【실패】</b> 저는 "콘텐츠가 부족하다"고 판단하고, 60페이지 분량의 상세 매뉴얼을 제작했습니다. 하지만 활용률은 오히려 5% 하락했습니다.<br/><br/>

<b>【원인 분석】</b> 사용자 인터뷰 결과, 교사들은 "매뉴얼을 읽을 시간이 없다"고 했고, 실제 병목은 "첫 로그인 후 어디서부터 시작해야 할지 모르겠다"는 UX 문제였습니다.<br/><br/>

<b>【재실행】</b><br/>
1. 60페이지 매뉴얼 → <b>3분 동영상 + 체크리스트</b>로 변경<br/>
2. 첫 로그인 시 <b>"5단계 가이드 투어"</b> 추가<br/>
3. Funnel 분석으로 이탈 구간 파악 → 해당 구간에 툴팁 강화<br/><br/>

<b>【결과】</b> 활용률 15% 상승, 평균 응대 시간 단축<br/><br/>

<b>【배운 점】</b><br/>
• "문제를 가정하지 말고, 사용자에게 직접 물어라"<br/>
• "솔루션을 만들기 전에 Problem-Solution Fit을 검증하라"<br/><br/>

이후 모든 기획에서 <b>사용자 인터뷰 → 가설 검증 → MVP → 피드백</b> 사이클을 필수로 적용하고 있습니다.`
    },
    future: {
      question: '5년 후 본인의 모습은 어떨 것 같나요?',
      answer: `5년 후 저는 <b>"데이터와 사용자 관점으로 제품을 성장시키는 시니어 PM"</b>이 되어 있을 것입니다.<br/><br/>

<b>【단기 (1-2년)】</b><br/>
• 담당 제품의 핵심 지표(MAU, Retention, NPS 등)를 데이터 기반으로 개선<br/>
• A/B 테스트, 사용자 리서치, 데이터 분석 역량을 심화하여 "검증된 기획자"로 성장<br/>
• 개발팀, 디자인팀과의 협업 경험을 쌓아 "실행력 있는 PM"으로 인정받기<br/><br/>

<b>【중기 (3-4년)】</b><br/>
• 0→1 제품 또는 신규 기능을 리드하며 Product-Market Fit 경험<br/>
• 주니어 PM을 멘토링하며 팀 전체의 기획 역량 향상에 기여<br/>
• SQL, Python, 대시보드 구축 등 데이터 분석 스킬을 고도화<br/><br/>

<b>【장기 (5년)】</b><br/>
• 제품 로드맵을 설계하고, 비즈니스 목표와 사용자 가치를 조율하는 시니어 PM<br/>
• "작게 실험하고 빠르게 배우는" 문화를 조직에 전파하는 리더<br/><br/>

궁극적으로는 <b>"기업의 지속 성장을 데이터와 사용자 관점으로 이끄는 PM"</b>이 되고 싶습니다.`
    }
  };

  // 질문 데이터베이스 (프로젝트 추천용)
  questionsDB = {
    Q1: {
      text: '어떤 도메인에 관심이 있으신가요?',
      choices: [
        { label: '제조·물류', value: 'domain_manufacturing' },
        { label: '플랫폼·SaaS', value: 'domain_platform' },
        { label: '실험적 프로토타입', value: 'domain_prototype' }
      ]
    },
    Q2: {
      text: '무엇이 더 중요하신가요?',
      choices: [
        { label: '문제정의', value: 'priority_problem' },
        { label: '데이터 인사이트', value: 'priority_insight' },
        { label: '의사결정 자동화', value: 'priority_automation' },
        { label: '협업 프로세스', value: 'priority_collab' }
      ]
    },
    Q3: {
      text: '살펴볼 자료 형태를 골라주세요.',
      choices: [
        { label: '요약 슬라이드', value: 'format_summary' },
        { label: '상세 보고서', value: 'format_report' },
        { label: '목업/대시보드', value: 'format_demo' }
      ]
    }
  };

  // 흐름 시작
  getIntro() {
    if (this.language === 'en') {
      return {
        type: 'intro',
        message: 'Hello, I am <b>Nano-YJ</b>.<br/><br/>Feel free to ask any questions about YUJIN LEE. I can help you with career info, projects, and skills.<br/><br/><span style="color:rgba(255,255,255,0.5); font-size:0.8rem;">Shortcuts: ESC(close) / /(focus) / Ctrl+Shift+L(theme)</span>',
        choices: [
          { label: 'View Career & Resume', action: 'show_resume' },
          { label: 'Explore Projects', action: 'show_projects' },
          { label: 'Core Competencies', action: 'rag_strength' },
          { label: 'Free Question (AI)', action: 'start_rag_mode' },
          { label: 'Toggle Theme', action: 'toggle_theme' },
          { label: 'Settings', action: 'show_settings' }
        ],
        allowFreetext: true
      };
    }
    return {
      type: 'intro',
      message: '안녕하세요, 저는 <b>Nano-YJ</b>입니다.<br/><br/>YUJIN LEE에 대해 궁금한 점을 자유롭게 질문해주세요. 경력, 프로젝트, 역량 등 다양한 정보를 안내해드립니다.<br/><br/><span style="color:rgba(255,255,255,0.5); font-size:0.8rem;">단축키: ESC(닫기) / /(입력) / Ctrl+Shift+L(테마)</span>',
      choices: [
        { label: '경력 및 이력 보기', action: 'show_resume' },
        { label: '프로젝트 탐색', action: 'show_projects' },
        { label: '핵심 역량 소개', action: 'rag_strength' },
        { label: '자유 질문 (AI 검색)', action: 'start_rag_mode' },
        { label: '테마 변경', action: 'toggle_theme' },
        { label: '설정', action: 'show_settings' }
      ],
      allowFreetext: true
    };
  }

  // 면접 시뮬레이션 모드
  getSimulationMode() {
    return {
      type: 'simulation',
      message: '<b>면접 시뮬레이션</b>을 시작합니다!<br/><br/>실제 면접처럼 제가 면접관 역할을 하고, 당신이 YUJIN LEE가 되어 답변해보세요.<br/>5개 질문 후 피드백을 드립니다.<br/><br/>준비되셨으면 "시작"이라고 입력하세요.',
      choices: [
        { label: '시작하기', action: 'begin_simulation' },
        { label: '이전으로', action: 'back_to_intro' }
      ],
      allowFreetext: true
    };
  }

  // RAG 문서 검색 모드
  getRAGMode() {
    if (this.language === 'en') {
      return {
        type: 'rag_mode',
        message: '<b>AI Search Mode</b><br/><br/>I search through YUJIN LEE\'s resume and project reports to answer your questions.<br/><br/>Feel free to ask anything!',
        choices: [
          { label: 'MetraForge AI results?', action: 'rag_metraforge' },
          { label: 'SmartStock tech stack?', action: 'rag_smartstock' },
          { label: 'YUJIN\'s strengths?', action: 'rag_strength' },
          { label: 'Career summary', action: 'rag_career' },
          { label: 'Go Back', action: 'back_to_intro' }
        ],
        allowFreetext: true
      };
    }
    return {
      type: 'rag_mode',
      message: '<b>AI 검색 모드</b>입니다.<br/><br/>YUJIN LEE의 이력서, 프로젝트 보고서 등에서 정보를 검색해 답변합니다.<br/><br/>궁금한 내용을 자유롭게 질문하세요!',
      choices: [
        { label: 'MetraForge AI 성과는?', action: 'rag_metraforge' },
        { label: 'SmartStock 기술 스택?', action: 'rag_smartstock' },
        { label: 'YUJIN의 강점?', action: 'rag_strength' },
        { label: '경력 요약', action: 'rag_career' },
        { label: '이전으로', action: 'back_to_intro' }
      ],
      allowFreetext: true
    };
  }

  // 면접 모드 시작
  getInterviewMode() {
    return {
      type: 'interview_mode',
      message: '면접관이 되어 이유진님에게 질문해보세요. 일반적인 면접 질문을 선택하거나, 직접 질문을 입력하실 수 있습니다.',
      choices: [
        { label: '자기소개 부탁드립니다', action: 'ask_introduction' },
        { label: '가장 큰 강점은?', action: 'ask_strength' },
        { label: '약점이나 개선점은?', action: 'ask_weakness' },
        { label: '지원 이유는?', action: 'ask_motivation' },
        { label: '기억에 남는 프로젝트는?', action: 'ask_project_experience' },
        { label: '팀원과 갈등 경험은?', action: 'ask_conflict' },
        { label: '실패 경험과 배운 점은?', action: 'ask_failure' },
        { label: '5년 후 모습은?', action: 'ask_future' },
        { label: '역량 분석 보기', action: 'show_competency_analysis' },
        { label: '통계 보기', action: 'show_stats' },
        { label: '이전으로', action: 'back_to_intro' }
      ],
      allowFreetext: true
    };
  }

  // 면접 질문 답변
  getInterviewAnswer(questionKey) {
    const qa = this.interviewQuestionsDB[questionKey];
    if (!qa) return this.getInterviewMode();

    return {
      type: 'interview_answer',
      message: '',
      question: qa.question,
      answer: qa.answer,
      sources: qa.sources || [],
      choices: [
        { label: '다른 질문하기', action: 'continue_interview_mode' },
        { label: '프로젝트 보기', action: 'show_projects' },
        { label: '이력서 다운로드', action: 'download_resume' },
        { label: '이전으로', action: 'back_to_intro' }
      ],
      allowFreetext: true
    };
  }

  // 인터뷰 흐름 (프로젝트 추천)
  getInterviewQ1() {
    return {
      type: 'question',
      questionId: 'Q1',
      message: this.questionsDB.Q1.text,
      choices: this.questionsDB.Q1.choices,
      allowFreetext: false
    };
  }

  getInterviewQ2() {
    return {
      type: 'question',
      questionId: 'Q2',
      message: this.questionsDB.Q2.text,
      choices: this.questionsDB.Q2.choices,
      allowFreetext: false
    };
  }

  getInterviewQ3() {
    return {
      type: 'question',
      questionId: 'Q3',
      message: this.questionsDB.Q3.text,
      choices: this.questionsDB.Q3.choices,
      allowFreetext: false
    };
  }

  // 인터뷰 결과 - 프로젝트 추천
  getInterviewResult() {
    const recommended = this.recommendProjects();
    return {
      type: 'result',
      message: `선택하신 기준에 맞는 프로젝트를 추천드립니다:`,
      projects: recommended,
      choices: [
        { label: '프로젝트 상세보기', action: 'show_project_detail' },
        { label: '전체 프로젝트', action: 'show_all_projects' },
        { label: '닫기', action: 'close' }
      ]
    };
  }

  // 이력서 미리보기
  getResume() {
    return {
      type: 'resume',
      message: '간단 미리보기와 함께 다운로드 링크를 제공해드릴게요.',
      preview: {
        title: 'YUJIN LEE',
        subtitle: 'AI Product Planner',
        highlights: [
          '이투온 - 사업기획팀 연구원 (2022.05~2024.02)',
          '금성출판사 - AI 수학 플랫폼 운영 (2021.02~2021.10)',
          '드라폼 - 기획팀 사원 (2014.01~2014.12)'
        ]
      },
      choices: [
        { label: 'PDF 다운로드', action: 'download_resume' },
        { label: '이전으로', action: 'back_to_intro' }
      ]
    };
  }

  // 프로젝트 목록
  getProjects() {
    return {
      type: 'projects',
      message: '관심 있는 프로젝트를 선택하세요.',
      projects: Object.keys(this.projectsDB),
      choices: Object.keys(this.projectsDB).map(key => ({
        label: this.projectsDB[key].name,
        action: 'select_project',
        projectId: key
      })).concat([
        { label: '이전으로', action: 'back_to_intro' }
      ]),
      allowFreetext: false
    };
  }

  // 프로젝트 상세
  getProjectDetail(projectId) {
    const project = this.projectsDB[projectId];
    if (!project) return this.getIntro();

    return {
      type: 'project_detail',
      projectId: projectId,
      project: project,
      choices: [
        { label: '다른 프로젝트', action: 'back_to_projects' },
        { label: '이전으로', action: 'back_to_intro' }
      ]
    };
  }

  // 공통 자료
  getDownloads() {
    return {
      type: 'downloads',
      message: '관련 문서를 한 번에 확인하세요.',
      resources: [
        { project: 'metraforge', title: 'MetraForge AI 발표자료', url: './docs/metraforge_presentation.pdf' },
        { project: 'smartstock', title: 'SmartStock AI 보고서', url: './docs/smartstock_final_report.pdf' },
        { project: 'tensecond', title: '10-Second Challenge 발표자료', url: './docs/10sec_presentation.pdf' }
      ],
      choices: [
        { label: '이전으로', action: 'back_to_intro' },
        { label: '닫기', action: 'close' }
      ]
    };
  }

  // 종료
  getEnd() {
    return {
      type: 'end',
      message: '방문해주셔서 감사합니다. 언제든 다시 불러주세요!',
      choices: [
        { label: '메인으로', action: 'go_to_main' },
        { label: '닫기', action: 'close' }
      ]
    };
  }

  // 프로젝트 추천 로직
  recommendProjects() {
    const domainMap = {
      'domain_manufacturing': 'metraforge',
      'domain_platform': 'smartstock',
      'domain_prototype': 'tensecond'
    };

    const recommended = [];
    const primary = domainMap[this.userChoices.domain];

    // 1차: 도메인 매칭
    if (primary) {
      recommended.push(this.projectsDB[primary]);
    }

    // 2차: 우선순위 매칭
    const allProjects = Object.keys(this.projectsDB);
    for (let key of allProjects) {
      if (key !== primary && recommended.length < 3) {
        recommended.push(this.projectsDB[key]);
      }
    }

    return recommended.slice(0, 3);
  }

  // 사용자 선택 저장
  recordChoice(questionId, value) {
    if (questionId === 'Q1') {
      this.userChoices.domain = value;
    } else if (questionId === 'Q2') {
      this.userChoices.priority = value;
    } else if (questionId === 'Q3') {
      this.userChoices.format = value;
    }
  }

  // 대화 히스토리 추가
  addMessage(role, content) {
    // OpenAI API는 'assistant' role을 사용 (bot -> assistant 변환)
    const apiRole = role === 'bot' ? 'assistant' : role;
    this.conversationHistory.push({ role: apiRole, content, timestamp: new Date() });
  }
}

// 전역 시나리오 매니저
const nanoYJScenario = new NanoYJScenario();
