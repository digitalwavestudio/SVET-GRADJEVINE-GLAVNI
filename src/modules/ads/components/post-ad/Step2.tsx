import React from 'react';
import { Step2Company } from '@/src/modules/ads/components/post-ad/step2/Step2Company';
import { Step2Accommodation } from '@/src/modules/ads/components/post-ad/step2/Step2Accommodation';
import { Step2Plot } from '@/src/modules/ads/components/post-ad/step2/Step2Plot';
import { Step2Catering } from '@/src/modules/ads/components/post-ad/step2/Step2Catering';
import { Step2Marketplace } from '@/src/modules/ads/components/post-ad/step2/Step2Marketplace';
import { Step2Machines } from '@/src/modules/ads/components/post-ad/step2/Step2Machines';

export function Step2({
  selectedCategory,
  nextStep,
  prevStep,
}: {
  selectedCategory: string;
  nextStep?: () => void;
  prevStep?: () => void;
}) {
  return (
    <>
      {selectedCategory === 'company' && <Step2Company nextStep={nextStep} prevStep={prevStep} />}
      {selectedCategory === 'accommodation' && <Step2Accommodation nextStep={nextStep} prevStep={prevStep} />}
      {selectedCategory === 'plot' && <Step2Plot nextStep={nextStep} prevStep={prevStep} />}
      {selectedCategory === 'catering' && <Step2Catering nextStep={nextStep} prevStep={prevStep} />}
      {selectedCategory === 'marketplace' && <Step2Marketplace nextStep={nextStep} prevStep={prevStep} />}
      {selectedCategory === 'machines' && <Step2Machines nextStep={nextStep} prevStep={prevStep} />}
    </>
  );
}
