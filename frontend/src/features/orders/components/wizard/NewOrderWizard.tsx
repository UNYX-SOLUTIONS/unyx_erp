// frontend/src/features/orders/components/wizard/NewOrderWizard.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useNewOrderStore } from '../../stores/newOrder.store';
import { WizardStepper } from './WizardStepper';
import { Step1Client } from './Step1Client';
import { Step2Products } from './Step2Products';
import { Step3Delivery } from './Step3Delivery';
import { Step4Confirm } from './Step4Confirm';

export function NewOrderWizard() {
  const router = useRouter();
  const { currentStep, reset } = useNewOrderStore();

  useEffect(() => {
    reset();
  }, [reset]);

  const handleConfirm = () => {
    toast.success('Pedido reservado', {
      description: 'El pedido quedó pendiente de aprobación de pago.',
    });
    reset();
    router.push('/operations/orders');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Nuevo pedido</h1>
          <p className="mt-1 text-sm text-gray-500">
            Completa la información necesaria para crear el pedido.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <WizardStepper current={currentStep} />

      {/* Steps */}
      {currentStep === 1 && <Step1Client />}
      {currentStep === 2 && <Step2Products />}
      {currentStep === 3 && <Step3Delivery />}
      {currentStep === 4 && <Step4Confirm onConfirm={handleConfirm} />}
    </div>
  );
}