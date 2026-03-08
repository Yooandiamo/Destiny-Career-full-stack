import { Solar } from 'lunar-javascript';

export type GenderType = '乾造' | '坤造';

export interface UserBirthInput {
  date: string;
  timeBranch: string;
  gender: GenderType;
  province: string;
  city: string;
}

export interface BaziResult {
  pillars: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  tenGods: string[];
  dayMaster: string;
  elementCounts: Record<'金' | '木' | '水' | '火' | '土', number>;
  elementPercentages: Array<{ name: '金' | '木' | '水' | '火' | '土'; value: number }>;
  favorableElements: string;
  unfavorableElements: string;
  pattern: string;
  raw: {
    ganZhi: string[];
  };
}

const BRANCH_TO_HOUR: Record<string, number> = {
  子: 23,
  丑: 1,
  寅: 3,
  卯: 5,
  辰: 7,
  巳: 9,
  午: 11,
  未: 13,
  申: 15,
  酉: 17,
  戌: 19,
  亥: 21
};

const STEM_ELEMENT: Record<string, '金' | '木' | '水' | '火' | '土'> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水'
};

const BRANCH_MAIN_ELEMENT: Record<string, '金' | '木' | '水' | '火' | '土'> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水'
};

const ELEMENT_ORDER: Array<'金' | '木' | '水' | '火' | '土'> = ['金', '木', '水', '火', '土'];

function splitPillar(pillar: string): [string, string] {
  return [pillar.charAt(0), pillar.charAt(1)];
}

function inferPattern(dayPillar: string, monthPillar: string): string {
  const dayStem = dayPillar.charAt(0);
  const monthStem = monthPillar.charAt(0);

  if (['丙', '丁'].includes(dayStem) && ['庚', '辛'].includes(monthStem)) {
    return '伤官生财格';
  }
  if (['甲', '乙'].includes(dayStem) && ['丙', '丁'].includes(monthStem)) {
    return '食神生财格';
  }

  return '平衡发展格';
}

function guessFavorableAndUnfavorable(counts: Record<'金' | '木' | '水' | '火' | '土', number>) {
  const sorted = [...ELEMENT_ORDER].sort((a, b) => counts[a] - counts[b]);
  const favorable = `${sorted[0]}、${sorted[1]}`;
  const unfavorable = `${sorted[4]}、${sorted[3]}`;
  return { favorable, unfavorable };
}

export function calculateBazi(input: UserBirthInput): BaziResult {
  const [year, month, day] = input.date.split('-').map((item) => Number(item));
  const hour = BRANCH_TO_HOUR[input.timeBranch] ?? 12;

  const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  const yearPillar = eightChar.getYear();
  const monthPillar = eightChar.getMonth();
  const dayPillar = eightChar.getDay();
  const hourPillar = eightChar.getTime();

  const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];

  const elementCounts: Record<'金' | '木' | '水' | '火' | '土', number> = {
    金: 0,
    木: 0,
    水: 0,
    火: 0,
    土: 0
  };

  for (const pillar of pillars) {
    const [stem, branch] = splitPillar(pillar);
    const stemElement = STEM_ELEMENT[stem];
    const branchElement = BRANCH_MAIN_ELEMENT[branch];

    if (stemElement) {
      elementCounts[stemElement] += 1;
    }
    if (branchElement) {
      elementCounts[branchElement] += 1;
    }
  }

  const total = Object.values(elementCounts).reduce((sum, val) => sum + val, 0) || 1;
  const elementPercentages = ELEMENT_ORDER.map((name) => ({
    name,
    value: Math.round((elementCounts[name] / total) * 100)
  }));

  const { favorable, unfavorable } = guessFavorableAndUnfavorable(elementCounts);

  const maybeTenGods = [
    (eightChar as any).getYearShiShenGan?.(),
    (eightChar as any).getMonthShiShenGan?.(),
    (eightChar as any).getDayShiShenGan?.(),
    (eightChar as any).getTimeShiShenGan?.()
  ].filter(Boolean) as string[];

  const tenGods = maybeTenGods.length ? maybeTenGods : ['比肩', '食神', '正官', '偏印'];

  return {
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar
    },
    tenGods,
    dayMaster: dayPillar.charAt(0),
    elementCounts,
    elementPercentages,
    favorableElements: favorable,
    unfavorableElements: unfavorable,
    pattern: inferPattern(dayPillar, monthPillar),
    raw: {
      ganZhi: pillars
    }
  };
}
