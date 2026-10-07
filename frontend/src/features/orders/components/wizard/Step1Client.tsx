// frontend/src/features/orders/components/wizard/Step1Client.tsx

'use client';

import { Search, UserPlus, Lock, CheckCircle2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNewOrderStore } from '../../stores/newOrder.store';
import { MOCK_CURRENT_CUSTOMER, MOCK_LEADS } from '../../data/mock';

export function Step1Client() {
  const router = useRouter();
  const { customer, lead, setCustomer, setLead, nextStep, reset, canProceed } =
    useNewOrderStore();

  const handleSelectCustomer = () => {
    setCustomer(MOCK_CURRENT_CUSTOMER);
  };

  const handleChangeCustomer = () => {
    setCustomer(null);
    setLead(null);
  };

  const handleCancel = () => {
    reset();
    router.push('/operations/orders');
  };

  const handleSelectLead = (leadId: string) => {
    const found = MOCK_LEADS.find((l) => l.id === leadId);
    if (found && found.status === 'AVAILABLE') {
      setLead(found);
    }
  };

  const leadsInAttention = MOCK_LEADS.filter((l) => l.status === 'IN_ATTENTION').length;

  return (
    <div className="space-y-6">
      {/* Cliente */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Cliente
          </h2>
          <Button variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        </div>

        {!customer ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 py-8">
            <Search className="mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500">Selecciona un cliente para continuar</p>
            <Button onClick={handleSelectCustomer} className="mt-4">
              Buscar cliente
            </Button>
          </div>
        ) : (
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900">
                    {customer.name}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span>{customer.ruc}</span>
                  <span>·</span>
                  <span>{customer.contactName}</span>
                  <span>·</span>
                  <span>{customer.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {customer.linkedToKommo && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Vinculado con Kommo
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleChangeCustomer}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Cambiar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Leads */}
      {customer && (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Lead
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Selecciona el lead de Kommo asociado a este pedido.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo lead
            </Button>
          </div>

          <div className="overflow-hidden rounded-md border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Selección', 'Lead', 'Nombre', 'Etapa', 'Total', 'Responsable', 'Acción'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {MOCK_LEADS.map((l) => {
                  const isSelected = lead?.id === l.id;
                  const isLocked = l.status === 'IN_ATTENTION';

                  return (
                    <tr
                      key={l.id}
                      className={cn(
                        'border-t border-gray-100',
                        isLocked && 'opacity-60',
                      )}
                    >
                      <td className="px-3 py-3">
                        <button
                          disabled={isLocked}
                          onClick={() => handleSelectLead(l.id)}
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-full border-2',
                            isSelected
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300 bg-white',
                            isLocked && 'cursor-not-allowed',
                          )}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-blue-600">{l.code}</td>
                      <td className="px-3 py-3 text-sm text-gray-900">{l.name}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700">
                          {l.stage}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900">
                        ${l.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700">
                            {l.responsibleInitials}
                          </div>
                          <span className="text-sm text-gray-700">{l.responsibleName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Seleccionado
                          </span>
                        ) : isLocked ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">
                            En atención
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectLead(l.id)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            Seleccionar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {leadsInAttention > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Lock className="h-3 w-3" />
              {leadsInAttention} leads están siendo atendidos por otras asesoras.
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <Button variant="ghost" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button
          disabled={!canProceed()}
          onClick={nextStep}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          Continuar a productos
          <span>→</span>
        </Button>
      </div>
    </div>
  );
}