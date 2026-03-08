import { Router } from 'express';
import { LRUCache } from 'lru-cache';

const REPORT_SCHEMA_HINT = `{
  "favorableElements": "string",
  "unfavorableElements": "string",
  "pattern": "string",
  "coreConclusion": "string",
  "integratedAnalysis": "string",
  "painPointRoot": "string",
  "synthesisLogic": "string",
  "summary": "string",
  "topCareer": {
    "name": "string",
    "matchScore": "string",
    "keywords": ["string"],
    "reason": "string"
  },
  "otherCareers": [
    {
      "name": "string",
      "matchScore": "string",
      "reason": "string"
    }
  ],
  "actionPlan": ["string"],
  "avoidanceRules": ["string"]
}`;

const responseCache = new LRUCache<string, unknown>({
  max: 200,
  ttl: 1000 * 60 * 60
});

interface AnalyzeRequestBody {
  accessCode: string;
  bazi: unknown;
  assessment: unknown;
}

function buildPrompt(payload: { bazi: unknown; assessment: unknown }): string {
  return [
    '你是有10年职业规划+命理解读经验的顾问。',
    '目标用户是小红书年轻人（应届生/职场新人/转行人群），交付9.9元付费报告。',
    '语气接地气、戳痛点、可落地，禁止使用“算命/卜卦/改命/必涨薪”等违规话术。统一使用“天赋匹配/方向参考/避坑建议”。',
    '所有解读必须同时绑定“八字命理+职业兴趣”双维度，禁止拆开分别写。',
    '避免晦涩术语，转换成职场可理解表达。',
    '输出必须是严格JSON，不要Markdown代码块，不要额外解释。',
    'JSON结构严格如下：',
    REPORT_SCHEMA_HINT,
    '额外约束：',
    '1) coreConclusion <=100字，integratedAnalysis约300字，painPointRoot约200字。',
    '2) otherCareers 至少4项。',
    '3) actionPlan 必须3条，avoidanceRules 必须2条。',
    '4) 所有推荐理由必须体现双维度融合证据。',
    '',
    '用户输入数据如下：',
    JSON.stringify(payload, null, 2)
  ].join('\n');
}

function safeJsonParse(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  const blockMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!blockMatch) {
    throw new Error('AI 返回内容不是有效 JSON');
  }

  return JSON.parse(blockMatch[0]);
}

async function callAI(prompt: string) {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
  const model = process.env.AI_MODEL || 'deepseek-chat';

  if (!apiKey) {
    throw new Error('AI_API_KEY 未配置');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.65,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: '你是职业规划与天赋匹配报告生成助手，只输出JSON。'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI 请求失败(${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('AI 返回为空');
    }

    return safeJsonParse(content);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function analyzeRouter() {
  const router = Router();

  router.post('/', async (req, res) => {
    try {
      const { accessCode, bazi, assessment } = req.body as AnalyzeRequestBody;

      if (!accessCode || accessCode !== process.env.ACCESS_CODE) {
        return res.status(401).json({
          message: '解锁码无效，请核对后重新输入'
        });
      }

      const cacheKey = JSON.stringify({ bazi, assessment });
      const cached = responseCache.get(cacheKey);
      if (cached) {
        return res.json({ data: cached, cached: true });
      }

      const prompt = buildPrompt({ bazi, assessment });
      const aiResult = await callAI(prompt);

      responseCache.set(cacheKey, aiResult);
      return res.json({ data: aiResult, cached: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      console.error('/api/analyze error:', message);

      return res.status(500).json({
        message: '系统繁忙，天机解析暂时拥堵，请稍后重试',
        detail: process.env.NODE_ENV === 'development' ? message : undefined
      });
    }
  });

  return router;
}
