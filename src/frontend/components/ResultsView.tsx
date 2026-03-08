import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Radar, Sparkles } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RadarArea,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import type { AIReport, AssessmentResult } from '../types';
import type { BaziResult, UserBirthInput } from '../../utils/baziCalculator';
import { exportElementToPdf } from '../../utils/pdfExporter';

interface ResultsViewProps {
  birth: UserBirthInput;
  bazi: BaziResult;
  assessment: AssessmentResult;
  onBack: () => void;
  onRestart: () => void;
}

const ELM_COLORS: Record<string, string> = {
  金: 'text-slate-100',
  木: 'text-emerald-300',
  水: 'text-sky-300',
  火: 'text-rose-300',
  土: 'text-amber-300'
};

const TOOLTIP_COPY: Record<string, string> = {
  金: '金元素偏强时，决策、规则感和结构能力更突出。',
  木: '木元素偏强时，创意、成长和开拓意识更明显。',
  水: '水元素偏强时，沟通、学习和适应变化能力更好。',
  火: '火元素偏强时，表达、行动力与影响力会更直接。',
  土: '土元素偏强时，稳定、组织和持续推进优势明显。'
};

const fallbackReport: AIReport = {
  favorableElements: '土、金、水',
  unfavorableElements: '火、木',
  pattern: '伤官生财格',
  coreConclusion:
    '你在天赋结构上偏“策略+沟通+落地”组合，最匹配咨询策划、组织管理、业务增长等以解决问题为导向的职业路径。',
  integratedAnalysis:
    '从命盘与兴趣双维度看，你的核心优势是把复杂问题拆解成可执行路径。八字显示你在结构化判断和资源整合上有先天优势，兴趣测试中社会型与企业型靠前，说明你既能理解人，也愿意推动结果。你在团队中常承担“把方向讲清、把节奏带起来”的角色。内耗通常出现在目标不清、反馈滞后或岗位过度重复时。一旦进入需要沟通协同、策略推演与落地复盘的工作场景，你的状态会明显提升，成长速度也会更快。',
  painPointRoot:
    '你迷茫的根源不是能力不足，而是“高潜力配置放错场景”。当工作只要求机械执行、缺少自主空间时，你会快速失去能量，表现为拖延、焦虑和低成就感。双维度都提示你需要“目标清晰+人际协同+持续迭代”的环境，才能避免消耗式努力。',
  synthesisLogic:
    '八字中的稳定决策与兴趣中的社会/企业取向互相验证，指向“策略沟通+业务推动”路径。',
  summary: '优先选择需要问题诊断、沟通协同和方案落地的岗位。',
  topCareer: {
    name: '企业管理咨询师',
    matchScore: '98%',
    keywords: ['战略规划', '团队协同', '问题诊断', '业务增长'],
    reason: '该职业同时需要逻辑分析、组织推进和跨部门沟通，与你的双维度优势高度重合。'
  },
  otherCareers: [
    { name: '人力资源BP', matchScore: '92%', reason: '兼顾组织稳定与沟通协同，适配你的人际与结构化优势。' },
    { name: '市场策略策划', matchScore: '90%', reason: '创意表达与结果导向并重，能发挥你分析与推动能力。' },
    { name: '非营利项目经理', matchScore: '88%', reason: '需要价值驱动与执行落地，符合你助人和组织倾向。' },
    { name: '客户成功经理', matchScore: '86%', reason: '强调关系维护与问题闭环，适配你的沟通和协调能力。' }
  ],
  actionPlan: ['本周筛选20条目标岗位JD，标记高频能力关键词。', '第2周完成1个与目标岗位相关的作品或案例复盘。', '第3-4周投递并约3位从业者做信息访谈，修正求职定位。'],
  avoidanceRules: ['避免长期纯重复、低反馈、无成长路径的岗位。', '避免只靠情绪驱动选岗，必须用岗位能力清单做决策。']
};

function QrCard() {
  return (
    <div className="glass-card rounded-3xl border-emerald-300/25 p-4">
      <p className="text-sm leading-relaxed text-emerald-200">扫码添加专属顾问，免费领取《2026职场旺运避坑指南》</p>
      <div className="mt-3 flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-slate-500 bg-slate-900 text-xs text-slate-400">
        企微二维码
      </div>
    </div>
  );
}

export default function ResultsView({ birth, bazi, assessment, onBack, onRestart }: ResultsViewProps) {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const [accessCode, setAccessCode] = useState(localStorage.getItem('destiny-career-access-code') || '');
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [pdfProgress, setPdfProgress] = useState('');
  const [report, setReport] = useState<AIReport | null>(null);
  const [error, setError] = useState('');
  const [hasScannedQr, setHasScannedQr] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const currentReport = report || fallbackReport;
  const hideTail = !hasScannedQr;

  const fetchReport = async () => {
    setError('');
    setLoading(true);
    setLoadingProgress(15);

    const timer = window.setInterval(() => {
      setLoadingProgress((prev) => (prev < 90 ? prev + 7 : prev));
    }, 350);

    try {
      const response = await fetch(`${apiBaseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: accessCode.trim(),
          bazi,
          assessment
        })
      });

      const json = (await response.json()) as { data?: AIReport; message?: string };

      if (!response.ok) {
        throw new Error(json.message || '解析失败');
      }

      setReport(json.data || fallbackReport);
      localStorage.setItem('destiny-career-access-code', accessCode.trim());
      setLoadingProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败');
    } finally {
      window.clearInterval(timer);
      setTimeout(() => setLoading(false), 350);
    }
  };

  const exportPdf = async () => {
    if (!reportRef.current) return;

    try {
      setPdfProgress('正在生成PDF... 10%');
      await exportElementToPdf(reportRef.current, {
        filename: '天命职场-完整报告.pdf',
        onProgress: (percent) => {
          setPdfProgress(`正在生成PDF... ${percent}%`);
        }
      });
      setTimeout(() => setPdfProgress(''), 1200);
    } catch (e) {
      setPdfProgress(e instanceof Error ? e.message : '导出失败，请重试');
    }
  };

  const radarData = useMemo(
    () => bazi.elementPercentages.map((item) => ({ element: item.name, value: item.value })),
    [bazi.elementPercentages]
  );

  if (!report) {
    return (
      <div className="animate-fade-in space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="rounded-full border border-slate-700 bg-slate-900/70 p-2 text-slate-200">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-3xl font-black text-amber-400">命运罗盘</h2>
          <div className="w-9" />
        </div>

        <section className="glass-card rounded-3xl p-4">
          <p className="text-center text-3xl font-black text-amber-400">正在连通天机</p>
          <p className="mt-3 text-center text-slate-300">系统正在进行多维分析... 50% 八字命理排盘 · 50% 职业兴趣图谱</p>

          {loading && (
            <div className="mt-4 h-2 rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          )}

          <input
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="请输入解锁码"
            className="mt-5 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-center text-2xl text-slate-100 outline-none focus:border-amber-400"
          />

          <button
            onClick={fetchReport}
            disabled={loading || !accessCode.trim()}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-400 px-4 py-3 text-lg font-bold text-slate-900 disabled:opacity-50"
          >
            {loading ? `解析中... ${loadingProgress}%` : '解锁完整报告'}
          </button>

          {error && <p className="mt-3 text-center text-sm text-rose-300">{error}</p>}
        </section>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="rounded-full border border-slate-700 bg-slate-900/70 p-2 text-slate-200">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-3xl font-black text-amber-400">命运罗盘</h2>
        <button
          onClick={exportPdf}
          className="inline-flex items-center gap-1 rounded-full border border-amber-400/70 bg-amber-500/20 px-3 py-1 text-sm text-amber-200"
        >
          <Download size={14} /> 导出
        </button>
      </div>

      {pdfProgress && <p className="text-center text-sm text-amber-200">{pdfProgress}</p>}

      <div ref={reportRef} className="space-y-4 pb-8">
        <QrCard />

        <section className="glass-card rounded-3xl p-4">
          <p className="text-center text-slate-400">命运启示</p>
          <p className="mt-1 text-center text-xl text-slate-200">
            日主（本命）：<span className="font-black text-amber-300">{bazi.dayMaster}</span>
          </p>

          <h3 className="mt-5 text-2xl font-bold text-amber-300">八字基础盘</h3>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[
              { label: '年柱', value: bazi.pillars.year },
              { label: '月柱', value: bazi.pillars.month },
              { label: '日柱', value: bazi.pillars.day },
              { label: '时柱', value: bazi.pillars.hour }
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className={`mt-1 text-3xl font-black ${ELM_COLORS[item.value.charAt(0)] || 'text-slate-100'}`}>
                  {item.value.charAt(0)}
                </p>
                <p className={`text-3xl font-black ${ELM_COLORS[item.value.charAt(1)] || 'text-slate-100'}`}>{item.value.charAt(1)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-3xl p-4">
          <h3 className="inline-flex items-center gap-2 text-2xl font-bold text-amber-300">
            <Radar size={20} /> 能量雷达图
          </h3>

          <div className="mt-3 h-72 w-full">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="element" stroke="#94a3b8" />
                <PolarRadiusAxis stroke="#475569" />
                <RadarArea dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.35} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as { element: string; value: number };
                    return (
                      <div className="rounded-xl border border-slate-600 bg-slate-900/95 p-2 text-xs text-slate-200">
                        <p>{item.element}元素占比 {item.value}%</p>
                        <p className="mt-1 text-slate-400">{TOOLTIP_COPY[item.element]}</p>
                      </div>
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
            {bazi.elementPercentages.map((item) => (
              <p key={item.name}>
                {item.name}: {item.value}%
              </p>
            ))}
          </div>
        </section>

        <QrCard />

        <section className="glass-card rounded-3xl p-4">
          <h3 className="inline-flex items-center gap-2 text-2xl font-bold text-emerald-300">
            <Sparkles size={20} /> AI深度解析
          </h3>
          <p className="mt-3 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-3 leading-relaxed text-emerald-100">
            {currentReport.coreConclusion}
          </p>
          <p className="mt-3 leading-relaxed text-slate-200">{currentReport.integratedAnalysis}</p>
          <p className="mt-3 leading-relaxed text-slate-300">{currentReport.painPointRoot}</p>
          <p className="mt-3 text-sm text-slate-400">双重验证逻辑：{currentReport.synthesisLogic}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-emerald-200">
              喜用：{currentReport.favorableElements}
            </span>
            <span className="rounded-full border border-rose-300/40 bg-rose-500/10 px-3 py-1 text-rose-200">
              忌神：{currentReport.unfavorableElements}
            </span>
            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-amber-200">格局：{currentReport.pattern}</span>
          </div>
        </section>

        <section className="glass-card rounded-3xl p-4">
          <h3 className="text-center text-2xl font-black text-emerald-300">发现你的“天选职业”</h3>
          <p className="mt-2 text-center text-6xl font-black text-emerald-300">{currentReport.topCareer.matchScore}</p>
          <p className="mt-1 text-center text-4xl font-black">{currentReport.topCareer.name}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {currentReport.topCareer.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-slate-200">
                {keyword}
              </span>
            ))}
          </div>

          <p className="mt-3 leading-relaxed text-slate-200">{currentReport.topCareer.reason}</p>
        </section>

        <section className="glass-card rounded-3xl p-4">
          <h3 className="text-2xl font-bold text-amber-300">其他推荐职业</h3>
          <div className="mt-3 space-y-3">
            {currentReport.otherCareers.slice(0, 4).map((career) => (
              <div key={career.name} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold">{career.name}</p>
                  <p className="text-xl font-bold text-emerald-300">{career.matchScore}</p>
                </div>
                <p className="mt-2 leading-relaxed text-slate-300">{career.reason}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-3xl p-4">
          <h3 className="text-2xl font-bold text-amber-300">30天可落地行动清单</h3>
          {!hideTail ? (
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-200">
              {currentReport.actionPlan.slice(0, 3).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-emerald-300/40 bg-slate-900/60 p-4 text-sm text-slate-300">
              当前仅展示70%内容。扫码添加顾问后，点击下方“我已扫码”解锁行动清单与避坑红线。
            </div>
          )}

          <h3 className="mt-5 text-2xl font-bold text-rose-300">职场避坑红线</h3>
          {!hideTail ? (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-200">
              {currentReport.avoidanceRules.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-slate-400">扫码后解锁完整避坑建议。</p>
          )}

          {hideTail && (
            <button
              onClick={() => setHasScannedQr(true)}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-400 px-4 py-3 font-bold text-slate-900"
            >
              我已扫码，解锁完整版
            </button>
          )}
        </section>

        <QrCard />

        <section className="rounded-3xl border border-amber-300/30 bg-amber-400/10 p-4 text-center">
          <p className="text-amber-200">分享报告到小红书/朋友圈，截图发给顾问，免费升级完整版报告</p>
          <p className="mt-3 text-sm text-slate-400">
            用户画像：{birth.gender} · {birth.province}{birth.city} · 兴趣倾向 {assessment.top2.join(' / ')}
          </p>
        </section>
      </div>

      <div className="sticky bottom-3 z-10 grid grid-cols-2 gap-2">
        <button
          onClick={exportPdf}
          className="rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-400 px-4 py-3 font-bold text-slate-900"
        >
          一键导出完整报告
        </button>
        <button onClick={onRestart} className="rounded-2xl border border-slate-600 bg-slate-900/80 px-4 py-3 text-slate-200">
          重新测试
        </button>
      </div>
    </div>
  );
}
