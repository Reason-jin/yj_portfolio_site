/**
 * Vercel Serverless Function for Nano-YJ AI Assistant
 * API Endpoint: /api/chat
 *
 * 멀티 에이전트 + RAG 통합 버전
 */

const { orchestrate } = require('./agents');
const { generateRAGResponse, searchDocuments } = require('./rag');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { message, history, context, mode, language } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // 언어 설정 (기본값: ko)
    const lang = language || 'ko';

    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        message: 'Please set OPENAI_API_KEY environment variable in Vercel'
      });
    }

    let result;

    // 모드에 따른 처리
    if (mode === 'rag') {
      // RAG 모드: 문서 검색 기반 답변
      result = await generateRAGResponse(message, context, lang);
    } else if (mode === 'search') {
      // 검색 모드: 문서 검색만
      const docs = searchDocuments(message, 5);
      return res.status(200).json({
        documents: docs,
        query: message
      });
    } else {
      // 기본 모드: 멀티 에이전트 오케스트레이션
      result = await orchestrate(message, history, context, lang);
    }

    // 응답 구성
    const response = {
      reply: result.reply,
      agent: result.agent,
      routing: result.routing,
      sources: result.sources || [],
      followUp: result.followUp || [],
      resources: result.resources || [],
      action: result.action || null,
      timestamp: result.timestamp || new Date().toISOString()
    };

    // 시뮬레이션 모드 추가 정보
    if (result.agent === 'simulation') {
      response.simulationState = {
        questionCount: result.questionCount,
        isComplete: result.isComplete
      };
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Error:', error);

    // OpenAI API 에러 구체적 처리
    if (error.status === 401) {
      return res.status(401).json({
        error: 'API_KEY_INVALID',
        message: 'OpenAI API 키가 유효하지 않습니다.'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      });
    }

    if (error.status === 500 || error.status === 503) {
      return res.status(503).json({
        error: 'OPENAI_SERVICE_ERROR',
        message: 'OpenAI 서비스에 일시적인 문제가 있습니다.'
      });
    }

    // 네트워크 에러
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        error: 'NETWORK_ERROR',
        message: '네트워크 연결에 문제가 있습니다.'
      });
    }

    // 기타 에러
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: '서버 내부 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
