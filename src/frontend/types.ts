import type { BaziResult, UserBirthInput } from '../utils/baziCalculator';

export type Step = 'input' | 'assessment' | 'results';

export type DimensionKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface DimensionScore {
  key: DimensionKey;
  name: string;
  score: number;
  percent: number;
}

export interface AssessmentResult {
  scores: Record<DimensionKey, number>;
  ranking: Array<{ key: DimensionKey; name: string; score: number }>;
  percentages: DimensionScore[];
  top2: string[];
}

export interface AIReport {
  favorableElements: string;
  unfavorableElements: string;
  pattern: string;
  coreConclusion: string;
  integratedAnalysis: string;
  painPointRoot: string;
  synthesisLogic: string;
  summary: string;
  topCareer: {
    name: string;
    matchScore: string;
    keywords: string[];
    reason: string;
  };
  otherCareers: Array<{
    name: string;
    matchScore: string;
    reason: string;
  }>;
  actionPlan: string[];
  avoidanceRules: string[];
}

export interface AppPayload {
  birth: UserBirthInput;
  bazi: BaziResult;
  assessment: AssessmentResult;
}
