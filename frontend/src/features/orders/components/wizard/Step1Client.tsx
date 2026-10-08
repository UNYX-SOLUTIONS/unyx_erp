// frontend/src/features/orders/components/wizard/Step1Client.tsx

'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Search, UserPlus, Lock, CheckCircle2, Plus, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNewOrderStore } from '../../stores/newOrder.store';
import { MOCK_CUSTOMERS, MOCK_LEADS } from '../../data/mock';
import type { OrderCustomer } from '../../types/order.types';

const EMPTY_CUSTOMER_FORM = {
  name: '',
  ruc: '',
  email: '',
  contactName: '',
  phone: '',
  address: '',
  city: '',
};

const FIELD_LABEL_CLASS =
  'mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400';

export function Step1Client() {
  const router = useRouter();
  const {
    customer,
    customers: createdCustomers,
    lead,
    setCustomer,
    addCustomer,
    setLead,
    nextStep,
    reset,
    canProceed,
  } = useNewOrderStore();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState(EMPTY_CUSTOMER_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const customers = [...createdCustomers, ...MOCK_CUSTOMERS];

  const normalizedQuery = query.trim().toLowerCase();
  const results = normalizedQuery
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(normalizedQuery) ||
          c.ruc.toLowerCase().includes(normalizedQuery)
      )
    : [];

  const handleSelectCustomer = (selected: OrderCustomer) => {
    setCustomer(selected);
    setQuery('');
    setOpen(false);
  };

  const handleChangeCustomer = () => {
    setCustomer(null);
    setLead(null);
    setQuery('');
  };

  const handleCreateCustomer = () => {
    setOpen(false);
    setFormError(null);
    setCreateOpen(true);
  };

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newCustomer.name.trim();
    const ruc = newCustomer.ruc.trim();

    if (name.length < 2) {
      setFormError('Ingresa el nombre o razón social del cliente.');
      return;
    }
    if (!/^\d{10,13}$/.test(ruc)) {
      setFormError('El RUC debe tener entre 10 y 13 dígitos.');
      return;
    }
    if (newCustomer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email.trim())) {
      setFormError('Ingresa un correo electrónico válido.');
      return;
    }

    const created: OrderCustomer = {
      id: `c-${Date.now()}`,
      name,
      ruc,
      email: newCustomer.email.trim() || undefined,
      contactName: newCustomer.contactName.trim() || undefined,
      phone: newCustomer.phone.trim() || undefined,
      address: newCustomer.address.trim() || undefined,
      city: newCustomer.city.trim() || undefined,
      linkedToKommo: false,
    };

    addCustomer(created);
    setCustomer(created);
    setLead(null);
    setQuery('');
    setCreateOpen(false);
    setNewCustomer(EMPTY_CUSTOMER_FORM);
    setFormError(null);
    toast.success('Cliente creado', {
      description: `${created.name} quedó seleccionado para este pedido.`,
    });
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
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            Cliente
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleCreateCustomer}
          >
            <UserPlus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        </div>

        {!customer ? (
          <div className="relative">
            <div className="relative">
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                placeholder="Buscar cliente por nombre o RUC..."
                className="pl-9"
                autoComplete="off"
              />
            </div>

            {open && normalizedQuery.length > 0 && (
              <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {results.length > 0 ? (
                  <ul className="max-h-72 overflow-auto">
                    {results.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectCustomer(c);
                          }}
                          className="flex w-full flex-col items-start gap-0.5 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                        >
                          <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                            {c.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            {c.ruc} · {c.email ?? 'Sin correo'}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                    No se encontraron clientes.
                  </p>
                )}

                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCreateCustomer();
                  }}
                  className="flex w-full items-center gap-1.5 border-t border-gray-100 px-4 py-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-slate-800 dark:text-blue-400 dark:hover:bg-blue-500/10"
                >
                  <Plus className="h-4 w-4" />
                  Crear nuevo cliente
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {customer.name}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                  <span>{customer.ruc}</span>
                  {customer.contactName && (
                    <>
                      <span>·</span>
                      <span>{customer.contactName}</span>
                    </>
                  )}
                  {customer.phone && (
                    <>
                      <span>·</span>
                      <span>{customer.phone}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {customer.linkedToKommo && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Vinculado con Kommo
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleChangeCustomer}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Cambiar{' '}
                  <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Leads */}
      {customer && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Lead
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Selecciona el lead de Kommo asociado a este pedido.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo lead
            </Button>
          </div>

          <div className="overflow-hidden rounded-md border border-gray-200 dark:border-slate-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  {['Selección', 'Lead', 'Nombre', 'Etapa', 'Total', 'Responsable', 'Acción'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400"
                      >
                        {h}
                      </th>
                    )
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
                        'border-t border-gray-100 dark:border-slate-800',
                        isLocked && 'opacity-60'
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
                              : 'border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-900',
                            isLocked && 'cursor-not-allowed'
                          )}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                        {l.code}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-slate-100">
                        {l.name}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-300">
                          {l.stage}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-slate-100">
                        ${l.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                            {l.responsibleInitials}
                          </div>
                          <span className="text-sm text-gray-700 dark:text-slate-300">
                            {l.responsibleName}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Seleccionado
                          </span>
                        ) : isLocked ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-500/15 dark:text-yellow-300">
                            En atención
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectLead(l.id)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
              <Lock className="h-3 w-3" />
              {leadsInAttention} leads están siendo atendidos por otras asesoras.
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <Button variant="ghost" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button
          disabled={!canProceed()}
          onClick={nextStep}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-gray-50 dark:text-slate-100"
        >
          Continuar a productos
          <span>→</span>
        </Button>
      </div>

      {/* Dialog nuevo cliente */}
      <Dialog
        open={createOpen}
        onOpenChange={(isOpen) => {
          setCreateOpen(isOpen);
          if (!isOpen) {
            setFormError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
            <DialogDescription>
              Crea el cliente y quedará seleccionado para este pedido.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="nc-name" className={FIELD_LABEL_CLASS}>
                  Nombre / Razón social *
                </label>
                <Input
                  id="nc-name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Ej. Distribuidora Andina S.A."
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="nc-ruc" className={FIELD_LABEL_CLASS}>
                  RUC *
                </label>
                <Input
                  id="nc-ruc"
                  inputMode="numeric"
                  value={newCustomer.ruc}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      ruc: e.target.value.replace(/\D/g, '').slice(0, 13),
                    })
                  }
                  placeholder="13 dígitos"
                />
              </div>
              <div>
                <label htmlFor="nc-phone" className={FIELD_LABEL_CLASS}>
                  Teléfono
                </label>
                <Input
                  id="nc-phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+593 99 000 0000"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="nc-email" className={FIELD_LABEL_CLASS}>
                  Correo
                </label>
                <Input
                  id="nc-email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="contacto@empresa.com"
                />
              </div>
              <div>
                <label htmlFor="nc-contact" className={FIELD_LABEL_CLASS}>
                  Nombre de contacto
                </label>
                <Input
                  id="nc-contact"
                  value={newCustomer.contactName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, contactName: e.target.value })}
                  placeholder="Ej. María González"
                />
              </div>
              <div>
                <label htmlFor="nc-city" className={FIELD_LABEL_CLASS}>
                  Ciudad
                </label>
                <Input
                  id="nc-city"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  placeholder="Guayaquil"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="nc-address" className={FIELD_LABEL_CLASS}>
                  Dirección
                </label>
                <Input
                  id="nc-address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Av. Principal 123"
                />
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:space-x-0">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-gray-50 dark:text-slate-100"
              >
                <UserPlus className="h-4 w-4" />
                Crear cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
