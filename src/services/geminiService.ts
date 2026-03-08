import { CATEGORIES, type ParsedTransactionData } from '../types';
import { parsedTransactionDataSchema } from '../types/schemas';

const getApiKey = () => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error('未配置 API Key');
  }

  return apiKey;
};

const extractDateWithRegex = (text: string): string | null => {
  const dateRegex = /(\d{4})[-年/.](\d{1,2})[-月/.](\d{1,2})[\sT]+(\d{1,2})[:：](\d{1,2})(:(\d{1,2}))?/;
  const dateMatch = text.match(dateRegex);

  if (!dateMatch) {
    return null;
  }

  try {
    const [, y, m, d, h, minute, , second] = dateMatch;
    const date = new Date(
      Number.parseInt(y, 10),
      Number.parseInt(m, 10) - 1,
      Number.parseInt(d, 10),
      Number.parseInt(h, 10),
      Number.parseInt(minute, 10),
      second ? Number.parseInt(second, 10) : 0,
    );

    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
};

const normalizeResponse = (raw: string, regexDate: string | null): ParsedTransactionData => {
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  const payload = firstBrace >= 0 && lastBrace > firstBrace ? raw.slice(firstBrace, lastBrace + 1) : raw;

  const parsed = JSON.parse(payload) as unknown;
  const validated = parsedTransactionDataSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error('AI 返回格式异常，请重试。');
  }

  const data = validated.data;
  const normalizedDate = regexDate ?? data.date;
  const finalDate = new Date(normalizedDate);

  if (Number.isNaN(finalDate.getTime())) {
    data.date = new Date().toISOString();
  } else {
    data.date = finalDate.toISOString();
  }

  return data;
};

export const parseTransactionWithAI = async (text: string): Promise<ParsedTransactionData> => {
  const apiKey = getApiKey();
  const regexDate = extractDateWithRegex(text);

  const systemInstruction = `
你是一个财务助理。请从 OCR 文本中提取交易信息，优先识别中文商户名称。

规则：
1. 金额：提取实际支付或到账金额，优先带负号金额（如 -9.70），最终返回绝对值。
2. 类型：支出 expense 或 收入 income。
3. 分类：只能从以下分类中选择一个：[${CATEGORIES.join(', ')}]。
   - 出现“蚂蚁财富、基金、证券、股票、理财通”归类为“理财”。
   - 出现“美团、饿了么、麦当劳、肯德基、瑞幸、星巴克”归类为“餐饮”。
   - 出现“滴滴、携程、12306、打车、机票、火车票”归类为“交通”。
4. 商户：优先取最像商户或收款方的一行中文文本。
5. 时间：必须提取；无法确定时返回当前时间。

返回 JSON，格式严格为：
{"amount": number, "type": "expense"|"income", "category": "string", "description": "string", "date": "ISO string"}
`;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`API 请求失败：${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('AI 未返回内容');
  }

  try {
    return normalizeResponse(content, regexDate);
  } catch {
    throw new Error('无法识别账单，请检查截图清晰度后重试。');
  }
};
