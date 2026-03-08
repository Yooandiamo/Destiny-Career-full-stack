import { Suspense, lazy, useMemo, useState } from 'react';
import InputForm from './components/InputForm';
import type { AssessmentResult, Step } from './types';
import type { BaziResult, UserBirthInput } from '../utils/baziCalculator';

const AssessmentView = lazy(() => import('./components/AssessmentView'));
const ResultsView = lazy(() => import('./components/ResultsView'));

export default function App() {
  const [step, setStep] = useState<Step>('input');
  const [birth, setBirth] = useState<UserBirthInput | null>(null);
  const [bazi, setBazi] = useState<BaziResult | null>(null);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);

  const canShowResult = useMemo(() => Boolean(birth && bazi && assessment), [birth, bazi, assessment]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-4 pb-8 pt-4 text-slate-100">
      {step === 'input' && (
        <InputForm
          onSubmit={(birthData, baziData) => {
            setBirth(birthData);
            setBazi(baziData);
            setStep('assessment');
          }}
        />
      )}

      <Suspense fallback={<div className="pt-10 text-center text-slate-400">页面加载中...</div>}>
        {step === 'assessment' && bazi && birth && (
          <AssessmentView
            onBack={() => setStep('input')}
            onComplete={(result) => {
              setAssessment(result);
              setStep('results');
            }}
          />
        )}

        {step === 'results' && canShowResult && birth && bazi && assessment && (
          <ResultsView
            birth={birth}
            bazi={bazi}
            assessment={assessment}
            onBack={() => setStep('assessment')}
            onRestart={() => {
              setStep('input');
              setAssessment(null);
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
