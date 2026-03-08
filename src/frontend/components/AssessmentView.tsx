import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { AssessmentResult, DimensionKey } from '../types';

interface AssessmentViewProps {
  onBack: () => void;
  onComplete: (result: AssessmentResult) => void;
}

const DIMENSIONS: Record<DimensionKey, string> = {
  R: '现实型',
  I: '研究型',
  A: '艺术型',
  S: '社会型',
  E: '企业型',
  C: '常规型'
};

const OPTIONS = [
  { label: '非常符合', score: 5 },
  { label: '比较符合', score: 4 },
  { label: '部分符合', score: 3 },
  { label: '不太符合', score: 2 },
  { label: '完全不符合', score: 1 }
];

const QUESTIONS: Array<{ id: number; dimension: DimensionKey; title: string; hint: string }> = [
  { id: 1, dimension: 'R', title: '我喜欢动手解决真实问题，比如搭建、修理、实操。', hint: '执行、落地、实操' },
  { id: 2, dimension: 'I', title: '遇到复杂问题时，我会先分析逻辑再行动。', hint: '分析、推理、洞察' },
  { id: 3, dimension: 'A', title: '我擅长用内容、设计或表达方式打动别人。', hint: '创意、表达、审美' },
  { id: 4, dimension: 'S', title: '我愿意倾听他人，并帮助对方梳理思路。', hint: '助人、共情、沟通' },
  { id: 5, dimension: 'E', title: '我愿意主动推动项目，影响团队朝目标前进。', hint: '决策、领导、结果' },
  { id: 6, dimension: 'C', title: '我对流程、规范、细节准确性有天然要求。', hint: '结构、秩序、复盘' },
  { id: 7, dimension: 'R', title: '我更喜欢“做出来”，而不是只讨论想法。', hint: '实操、执行、反馈' },
  { id: 8, dimension: 'I', title: '我会主动查资料和验证结论，不轻信直觉。', hint: '研究、验证、证据' },
  { id: 9, dimension: 'A', title: '面对同一任务，我常能想到不同创意方案。', hint: '创意、灵感、变化' },
  { id: 10, dimension: 'S', title: '团队冲突时，我常能做协调者。', hint: '协同、沟通、关系' },
  { id: 11, dimension: 'E', title: '我喜欢设目标、拆计划、推动达成。', hint: '目标、推进、影响力' },
  { id: 12, dimension: 'C', title: '我习惯用清单和节奏管理任务优先级。', hint: '条理、节奏、稳健' },
  { id: 13, dimension: 'R', title: '在高压项目里，我能稳定交付可执行成果。', hint: '抗压、交付、执行' },
  { id: 14, dimension: 'I', title: '我对行业趋势和底层规律有持续好奇心。', hint: '认知、趋势、学习' },
  { id: 15, dimension: 'A', title: '我喜欢把复杂信息变得更有吸引力。', hint: '叙事、内容、体验' },
  { id: 16, dimension: 'S', title: '我在培训、分享、带新人时比较有耐心。', hint: '指导、成长、连接' },
  { id: 17, dimension: 'E', title: '我在谈判或资源协调时通常比较主动。', hint: '协商、整合、推动' },
  { id: 18, dimension: 'C', title: '我对数据、文档和流程闭环比较敏感。', hint: '规范、质量、复盘' }
];

export default function AssessmentView({ onBack, onComplete }: AssessmentViewProps) {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<Record<DimensionKey, number>>({
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
    C: 0
  });
  const [selected, setSelected] = useState<string>('');

  const current = QUESTIONS[index];

  const progress = useMemo(() => Math.round(((index + 1) / QUESTIONS.length) * 100), [index]);

  const handleAnswer = (score: number, optionLabel: string) => {
    setSelected(optionLabel);

    const nextScores = {
      ...scores,
      [current.dimension]: scores[current.dimension] + score
    };

    setTimeout(() => {
      if (index === QUESTIONS.length - 1) {
        const ranking = Object.entries(nextScores)
          .map(([key, value]) => ({ key: key as DimensionKey, name: DIMENSIONS[key as DimensionKey], score: value }))
          .sort((a, b) => b.score - a.score);

        const total = Object.values(nextScores).reduce((sum, val) => sum + val, 0) || 1;
        const percentages = ranking.map((item) => ({
          key: item.key,
          name: item.name,
          score: item.score,
          percent: Math.round((item.score / total) * 100)
        }));

        onComplete({
          scores: nextScores,
          ranking,
          percentages,
          top2: ranking.slice(0, 2).map((item) => item.name)
        });
        return;
      }

      setScores(nextScores);
      setSelected('');
      setIndex((prev) => prev + 1);
    }, 300);
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between pt-4">
        <button onClick={onBack} className="rounded-full border border-slate-700 bg-slate-900/70 p-2 text-slate-200">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-3xl font-black text-amber-400">职业兴趣测试</h2>
        <div className="w-9" />
      </div>

      <section className="glass-card rounded-3xl p-4">
        <div className="mb-2 flex items-center justify-between text-slate-300">
          <span>{index + 1}/{QUESTIONS.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800">
          <div
            style={{ width: `${progress}%` }}
            className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
          />
        </div>

        <p className="mt-5 inline-flex rounded-2xl border border-slate-700 bg-slate-900 px-3 py-1 text-amber-300">
          {DIMENSIONS[current.dimension]}
        </p>
        <h3 className="mt-4 text-3xl font-bold leading-relaxed text-slate-100">{current.title}</h3>
        <p className="mt-2 text-slate-400">考察维度：{current.hint}</p>

        <div className="mt-5 space-y-3">
          {OPTIONS.map((option) => (
            <button
              key={option.label}
              onClick={() => handleAnswer(option.score, option.label)}
              className={`w-full rounded-2xl border px-4 py-4 text-left text-xl transition active:scale-[0.99] ${
                selected === option.label
                  ? 'border-emerald-300 bg-gradient-to-r from-amber-500/20 to-emerald-400/20 text-emerald-200'
                  : 'border-slate-700 bg-slate-900/70 text-slate-100 hover:border-slate-500'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
