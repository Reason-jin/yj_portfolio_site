# Y.J. LEE — Portfolio Website

AI Product Planner / Junior PM 포트폴리오 웹사이트

- **프론트엔드**: HTML/CSS/JS 정적 페이지 (index, about, projects)
- **백엔드**: Vercel Serverless Functions (Nano-YJ AI 챗봇)
- **배포**: Vercel

## 파일 구조

```
yj_portfolio_site/
├── index.html              # 메인 페이지
├── about.html              # 소개 페이지
├── projects.html           # 프로젝트 페이지
├── assets/
│   ├── styles.css         # 스타일시트
│   ├── script.js          # 프론트엔드 스크립트
│   └── images/            # 이미지 파일
├── docs/                  # PDF 파일 (이력서, 보고서 등)
├── api/                   # Vercel Serverless Functions
│   ├── chat.js           # AI 챗봇 API
│   └── health.js         # 헬스체크 API
├── package.json
├── vercel.json           # Vercel 설정
└── .env                  # 환경변수 (로컬 전용)
```

## 로컬 개발

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env` 파일을 생성하고 OpenAI API 키를 설정하세요:
```
OPENAI_API_KEY=your-api-key-here
```

### 3. 로컬 서버 실행

프론트엔드만 실행:
```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Vercel 로컬 개발 서버 (프론트엔드 + API):
```bash
npx vercel dev
```

## Vercel 배포

### 방법 1: GitHub 연동 (권장)

1. **GitHub 저장소 생성**
   ```bash
   # GitHub에 새 저장소 생성 후
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/yj_portfolio_site.git
   git push -u origin main
   ```

2. **Vercel에서 배포**
   - [Vercel](https://vercel.com)에 로그인
   - "New Project" 클릭
   - GitHub 저장소 선택
   - 환경변수 설정:
     - `OPENAI_API_KEY`: OpenAI API 키 입력
   - "Deploy" 클릭

### 방법 2: Vercel CLI

1. **Vercel CLI 설치**
   ```bash
   npm install -g vercel
   ```

2. **로그인**
   ```bash
   vercel login
   ```

3. **배포**
   ```bash
   vercel
   ```
   - 프로젝트 설정 확인
   - 환경변수는 Vercel 대시보드에서 설정

4. **프로덕션 배포**
   ```bash
   vercel --prod
   ```

### 환경변수 설정 (Vercel)

Vercel 대시보드에서:
1. 프로젝트 선택
2. Settings > Environment Variables
3. 다음 변수 추가:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: OpenAI API 키
   - **Environment**: Production, Preview, Development 모두 선택

## API 엔드포인트

배포 후 사용 가능한 API:

- **챗봇**: `https://your-domain.vercel.app/api/chat`
  - Method: POST
  - Body: `{ "message": "질문", "history": [], "context": {} }`

- **헬스체크**: `https://your-domain.vercel.app/api/health`
  - Method: GET

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express
- **AI**: OpenAI GPT-3.5 Turbo
- **Hosting**: Vercel
- **Dependencies**: express, cors, dotenv, openai

## 주요 기능

- 반응형 디자인
- Nano-YJ AI 챗봇 (면접 시뮬레이션, 프로젝트 추천)
- 프로젝트 포트폴리오 슬라이더
- PDF 문서 다운로드
- 커스텀 커서 & 애니메이션

## 라이센스

MIT
