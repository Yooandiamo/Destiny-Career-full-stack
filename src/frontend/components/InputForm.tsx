import { Calendar, Clock3, KeyRound, MapPin, UserRound } from 'lucide-react';
import { useRef, useState } from 'react';
import type { BaziResult, GenderType, UserBirthInput } from '../../utils/baziCalculator';

interface InputFormProps {
  onSubmit: (birthData: UserBirthInput, baziData: BaziResult) => void;
}

const TIME_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const PROVINCES = ['北京', '上海', '广东', '浙江', '江苏', '四川', '湖北'];
const CITY_MAP: Record<string, string[]> = {
  北京: ['北京'],
  上海: ['上海'],
  广东: ['广州', '深圳', '珠海'],
  浙江: ['杭州', '宁波', '温州'],
  江苏: ['南京', '苏州', '无锡'],
  四川: ['成都', '绵阳', '宜宾'],
  湖北: ['武汉', '襄阳', '宜昌']
};

const CACHE_KEY = 'destiny-career-bazi-cache';

export default function InputForm({ onSubmit }: InputFormProps) {
  const [date, setDate] = useState('1998-08-08');
  const [timeBranch, setTimeBranch] = useState('午');
  const [gender, setGender] = useState<GenderType>('乾造');
  const [province, setProvince] = useState('北京');
  const [city, setCity] = useState('北京');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const validate = () => {
    if (!date) return '请选择出生日期';
    if (!timeBranch) return '请选择出生时辰';
    if (!province || !city) return '请选择出生地';
    return '';
  };

  const handleSubmit = () => {
    if (submitting) return;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }

      setError('');
      setSubmitting(true);

      try {
        const birthData: UserBirthInput = {
          date,
          timeBranch,
          gender,
          province,
          city
        };

        const cacheKey = JSON.stringify(birthData);
        const cacheRaw = localStorage.getItem(CACHE_KEY);

        if (cacheRaw) {
          const cache = JSON.parse(cacheRaw) as { key: string; value: BaziResult; at: number };
          if (cache.key === cacheKey) {
            if (accessCode) {
              localStorage.setItem('destiny-career-access-code', accessCode.trim());
            }
            onSubmit(birthData, cache.value);
            setSubmitting(false);
            return;
          }
        }

        const { calculateBazi } = await import('../../utils/baziCalculator');
        const bazi = calculateBazi(birthData);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            key: cacheKey,
            value: bazi,
            at: Date.now()
          })
        );

        if (accessCode) {
          localStorage.setItem('destiny-career-access-code', accessCode.trim());
        }
        onSubmit(birthData, bazi);
      } catch (e) {
        setError(e instanceof Error ? e.message : '排盘失败，请检查输入');
      } finally {
        setSubmitting(false);
      }
    }, 250);
  };

  const cityOptions = CITY_MAP[province] || ['北京'];

  return (
    <div className="animate-fade-in space-y-4">
      <header className="pt-4 text-center">
        <p className="text-sm text-slate-400">Destiny Career | 天命职场</p>
        <h1 className="mt-2 text-4xl font-black tracking-wide text-amber-400">天命职场</h1>
        <p className="mt-2 text-slate-300">输入出生信息，探索你的本命职业磁场</p>
      </header>

      <section className="glass-card rounded-3xl p-4">
        <label className="mb-2 flex items-center gap-2 text-slate-300">
          <Calendar size={16} /> 出生日期（公历）
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-amber-400"
        />

        <label className="mb-2 mt-4 flex items-center gap-2 text-slate-300">
          <Clock3 size={16} /> 出生时辰
        </label>
        <select
          value={timeBranch}
          onChange={(e) => setTimeBranch(e.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-amber-400"
        >
          {TIME_BRANCHES.map((item) => (
            <option key={item} value={item}>
              {item}时
            </option>
          ))}
        </select>

        <label className="mb-2 mt-4 flex items-center gap-2 text-slate-300">
          <MapPin size={16} /> 出生地（省/市）
        </label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={province}
            onChange={(e) => {
              const p = e.target.value;
              setProvince(p);
              setCity(CITY_MAP[p][0]);
            }}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-amber-400"
          >
            {PROVINCES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-amber-400"
          >
            {cityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <label className="mb-2 mt-4 flex items-center gap-2 text-slate-300">
          <UserRound size={16} /> 性别
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['乾造', '坤造'] as GenderType[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setGender(item)}
              className={`rounded-2xl border px-4 py-3 transition active:scale-[0.98] ${
                gender === item
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <label className="mb-2 mt-4 flex items-center gap-2 text-slate-300">
          <KeyRound size={16} /> 解锁码（可选）
        </label>
        <input
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="可先留空，结果页再输入"
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-amber-400"
        />

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-400 px-4 py-3 font-bold text-slate-900 transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
        >
          {submitting ? '排盘中...' : '进入职业兴趣测试'}
        </button>
      </section>
    </div>
  );
}
