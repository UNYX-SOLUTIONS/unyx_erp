// frontend/src/features/orders/components/wizard/Step1Client.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Search,
  UserPlus,
  Lock,
  CircleAlert,
  CheckCircle2,
  Circle,
  Plus,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNewOrderStore } from '../../stores/newOrder.store';
import { useNewOrderPanelStore } from '../../stores/new-order-panel.store';
import { kommoLeadUrl } from '@/config/integrations';
import { MOCK_CUSTOMERS, MOCK_LEADS } from '../../data/mock';
import type { OrderCustomer, OrderLead } from '../../types/order.types';

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

const EMPTY_LEAD_FORM: {
  name: string;
  stage: OrderLead['stage'];
  total: string;
  responsible: string;
} = {
  name: '',
  stage: 'Negociación',
  total: '',
  responsible: '',
};

const LEAD_STAGES: OrderLead['stage'][] = [
  'Negociación',
  'Cotización',
  'Propuesta',
  'Ganada',
  'Perdida',
];

const STAGE_COLORS: Record<OrderLead['stage'], string> = {
  Negociación:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300',
  Cotización:
    'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-500/15 dark:text-yellow-300',
  Propuesta:
    'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-300',
  Ganada:
    'border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-300',
  Perdida:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300',
};

function initialsFromName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '—';
}

type CustomerField = keyof typeof EMPTY_CUSTOMER_FORM;

function validateCustomerForm(
  form: typeof EMPTY_CUSTOMER_FORM
): Partial<Record<CustomerField, string>> {
  const errors: Partial<Record<CustomerField, string>> = {};
  const name = form.name.trim();
  const ruc = form.ruc.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const contactName = form.contactName.trim();
  const city = form.city.trim();
  const address = form.address.trim();

  if (name.length < 2) {
    errors.name = 'Ingresa el nombre o razón social (mínimo 2 caracteres).';
  }
  if (!/^(\d{10}|\d{13})$/.test(ruc)) {
    errors.ruc = 'El RUC debe tener 10 o 13 dígitos.';
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }
  if (phone && (!/^[+]?[\d\s()-]{7,16}$/.test(phone) || (phone.match(/\d/g) ?? []).length < 7)) {
    errors.phone = 'Ingresa un teléfono válido (mínimo 7 dígitos).';
  }
  if (contactName && contactName.length < 3) {
    errors.contactName = 'El nombre del contacto es muy corto.';
  }
  if (city && city.length < 2) {
    errors.city = 'Ingresa una ciudad válida.';
  }
  if (address && address.length < 5) {
    errors.address = 'Ingresa una dirección más completa.';
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{message}</p>;
}

export function Step1Client() {
  const router = useRouter();
  const isPanelOpen = useNewOrderPanelStore((state) => state.isOpen);
  const closePanel = useNewOrderPanelStore((state) => state.close);
  const {
    customer,
    customers: createdCustomers,
    lead,
    leads: createdLeads,
    setCustomer,
    addCustomer,
    setLead,
    addLead,
    nextStep,
    reset,
    canProceed,
  } = useNewOrderStore();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState(EMPTY_CUSTOMER_FORM);
  const [customerErrors, setCustomerErrors] = useState<Partial<Record<CustomerField, string>>>({});
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [newLead, setNewLead] = useState(EMPTY_LEAD_FORM);
  const [leadFormError, setLeadFormError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const focusSearchRef = useRef(false);

  useEffect(() => {
    if (!customer && focusSearchRef.current) {
      focusSearchRef.current = false;
      searchInputRef.current?.focus();
    }
  }, [customer]);

  const customers = [...createdCustomers, ...MOCK_CUSTOMERS];

  const normalizedQuery = query.trim().toLowerCase();
  const visibleCustomers = normalizedQuery
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(normalizedQuery) ||
          c.ruc.toLowerCase().includes(normalizedQuery)
      )
    : customers.slice(0, 5);

  const handleSelectCustomer = (selected: OrderCustomer) => {
    setCustomer(selected);
    setQuery('');
    setOpen(false);
  };

  const handleChangeCustomer = () => {
    focusSearchRef.current = true;
    setCustomer(null);
    setLead(null);
    setQuery('');
  };

  const handleCreateCustomer = () => {
    setOpen(false);
    setCustomerErrors({});
    setCreateOpen(true);
  };

  const updateCustomerField = (field: CustomerField, value: string) => {
    setNewCustomer((prev) => ({ ...prev, [field]: value }));
    setCustomerErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateCustomerForm(newCustomer);
    if (Object.keys(errors).length > 0) {
      setCustomerErrors(errors);
      return;
    }

    const created: OrderCustomer = {
      id: `c-${Date.now()}`,
      name: newCustomer.name.trim(),
      ruc: newCustomer.ruc.trim(),
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
    setCustomerErrors({});
    toast.success('Cliente creado', {
      description: `${created.name} quedó seleccionado para este pedido.`,
    });
  };

  const handleCancel = () => {
    reset();
    if (isPanelOpen) {
      closePanel();
      return;
    }
    router.push('/operations/orders');
  };

  const leads = [...createdLeads, ...MOCK_LEADS];

  const handleSelectLead = (leadId: string) => {
    const found = leads.find((l) => l.id === leadId);
    if (found && found.status === 'AVAILABLE') {
      setLead(found);
    }
  };

  const handleCreateLead = () => {
    setLeadFormError(null);
    setCreateLeadOpen(true);
  };

  const handleCreateLeadSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newLead.name.trim();

    if (name.length < 2) {
      setLeadFormError('Ingresa el nombre del lead.');
      return;
    }

    let total = 0;
    if (newLead.total.trim()) {
      const parsed = Number(newLead.total);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setLeadFormError('Ingresa un monto válido.');
        return;
      }
      total = parsed;
    }

    const maxCode = leads.reduce(
      (acc, l) => Math.max(acc, Number(l.code.replace(/\D/g, '')) || 0),
      0
    );
    const responsibleName = newLead.responsible.trim() || 'Sin asignar';

    const created: OrderLead = {
      id: `l-${Date.now()}`,
      code: `#${maxCode + 1}`,
      name,
      stage: newLead.stage,
      total,
      responsibleInitials: initialsFromName(responsibleName),
      responsibleName,
      status: 'AVAILABLE',
    };

    addLead(created);
    setLead(created);
    setCreateLeadOpen(false);
    setNewLead(EMPTY_LEAD_FORM);
    setLeadFormError(null);
    toast.success('Lead creado', {
      description: `${created.code} quedó seleccionado para este pedido.`,
    });
  };

  const leadsInAttention = leads.filter((l) => l.status === 'IN_ATTENTION').length;

  return (
    <div className="space-y-6">
      {/* Cliente */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            Cliente
          </h2>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleCreateCustomer}>
            <UserPlus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        </div>

        {!customer ? (
          <div className="relative">
            <Input
              ref={searchInputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              placeholder="Buscar cliente por nombre o RUC..."
              autoComplete="off"
            />

            {open && (
              <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {!normalizedQuery && (
                  <p className="px-4 pb-0.5 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                    Recientes
                  </p>
                )}
                {visibleCustomers.length > 0 ? (
                  <ul className="max-h-72 overflow-auto">
                    {visibleCustomers.map((c) => (
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {customer.name}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-slate-400">
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
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cambiar
                  <div className="flex-shrink-0 rotate-90 ">
                    <Search className="h-3.5 w-3.5" />
                  </div>
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
            <Button variant="outline" size="sm" className="gap-2" onClick={handleCreateLead}>
              <Plus className="h-4 w-4" />
              Nuevo lead
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-slate-700">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  {['Lead', 'Nombre', 'Etapa', 'Total', 'Responsable', 'Acción'].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const isSelected = lead?.id === l.id;
                  const isLocked = l.status === 'IN_ATTENTION';

                  return (
                    <tr
                      key={l.id}
                      onClick={() => {
                        if (!isLocked) {
                          handleSelectLead(l.id);
                        }
                      }}
                      className={cn(
                        'border-t border-gray-100 dark:border-slate-800',
                        isLocked
                          ? 'opacity-60'
                          : 'cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60',
                        isSelected && 'bg-blue-50/70 dark:bg-blue-500/10'
                      )}
                    >
                      <td className="px-3 py-3">
                        <a
                          href={kommoLeadUrl(l.code)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir en Kommo"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {l.code}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 dark:text-slate-100">
                        {l.name}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'rounded-md border px-2 py-0.5 text-xs',
                            STAGE_COLORS[l.stage]
                          )}
                        >
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
                            <CheckCircle2 className="h-4 w-4 text-blue-700 dark:text-blue-500 animate-in -translate-y-0.5 font-bold" />
                        ) : isLocked ? (
                          // Si el lead está siendo atendido por otra asesora, mostrar un candado y no permitir seleccionarlo
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  tabIndex={0}
                                  aria-label="Lead en atención"
                                  className="inline-flex items-center justify-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/60"
                                >
                                  <CircleAlert className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="left"
                                align="center"
                                className="max-w-[220px] text-center text-xs leading-snug border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-500/15 dark:text-yellow-300"
                              >
                                Este lead está siendo atendido por otra asesora
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Circle className="h-4 w-4 text-blue-500 dark:text-blue-300" />
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <Button variant="ghost" onClick={handleCancel}>
          Cancelar
        </Button>
        {/* Si hay un Cliente y un lead seleccionado continuar a productos, caso contrario mostrar "Seleccione un cliente" o "Seleccionar lead" sea cual sea el caso  */}
        <Button
          disabled={!canProceed()}
          onClick={nextStep}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-gray-50 dark:text-slate-100"
        >
          {customer && lead ? (
            <>
              Continuar a productos
              <ArrowRight className="h-4 w-4" />
            </>
          ) : !customer ? (
            'Seleccione un cliente'
          ) : (
            'Seleccione un lead'
          )}
        </Button>
      </div>

      {/* Dialog nuevo cliente */}
      <Dialog
        open={createOpen}
        onOpenChange={(isOpen) => {
          setCreateOpen(isOpen);
          if (!isOpen) {
            setCustomerErrors({});
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
                  Nombre / Razón social <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="nc-name"
                  value={newCustomer.name}
                  aria-required
                  aria-invalid={Boolean(customerErrors.name)}
                  onChange={(e) => updateCustomerField('name', e.target.value)}
                  placeholder="Ej. Distribuidora Andina S.A."
                  autoFocus
                />
                <FieldError message={customerErrors.name} />
              </div>
              <div>
                <label htmlFor="nc-ruc" className={FIELD_LABEL_CLASS}>
                  CEDULA / RUC <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="nc-ruc"
                  inputMode="numeric"
                  value={newCustomer.ruc}
                  aria-required
                  aria-invalid={Boolean(customerErrors.ruc)}
                  onChange={(e) =>
                    updateCustomerField('ruc', e.target.value.replace(/\D/g, '').slice(0, 13))
                  }
                  placeholder="13 dígitos"
                />
                <FieldError message={customerErrors.ruc} />
              </div>
              <div>
                <label htmlFor="nc-phone" className={FIELD_LABEL_CLASS}>
                  Teléfono
                </label>
                <Input
                  id="nc-phone"
                  value={newCustomer.phone}
                  aria-invalid={Boolean(customerErrors.phone)}
                  onChange={(e) => updateCustomerField('phone', e.target.value)}
                  placeholder="+593 99 000 0000"
                />
                <FieldError message={customerErrors.phone} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="nc-email" className={FIELD_LABEL_CLASS}>
                  Correo
                </label>
                <Input
                  id="nc-email"
                  type="email"
                  value={newCustomer.email}
                  aria-invalid={Boolean(customerErrors.email)}
                  onChange={(e) => updateCustomerField('email', e.target.value)}
                  placeholder="contacto@empresa.com"
                />
                <FieldError message={customerErrors.email} />
              </div>
              <div>
                <label htmlFor="nc-contact" className={FIELD_LABEL_CLASS}>
                  Nombre de contacto
                </label>
                <Input
                  id="nc-contact"
                  value={newCustomer.contactName}
                  aria-invalid={Boolean(customerErrors.contactName)}
                  onChange={(e) => updateCustomerField('contactName', e.target.value)}
                  placeholder="Ej. María González"
                />
                <FieldError message={customerErrors.contactName} />
              </div>
              <div>
                <label htmlFor="nc-city" className={FIELD_LABEL_CLASS}>
                  Ciudad
                </label>
                <Input
                  id="nc-city"
                  value={newCustomer.city}
                  aria-invalid={Boolean(customerErrors.city)}
                  onChange={(e) => updateCustomerField('city', e.target.value)}
                  placeholder="Guayaquil"
                />
                <FieldError message={customerErrors.city} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="nc-address" className={FIELD_LABEL_CLASS}>
                  Dirección
                </label>
                <Input
                  id="nc-address"
                  value={newCustomer.address}
                  aria-invalid={Boolean(customerErrors.address)}
                  onChange={(e) => updateCustomerField('address', e.target.value)}
                  placeholder="Av. Principal 123"
                />
                <FieldError message={customerErrors.address} />
              </div>
            </div>

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

      {/* Dialog nuevo lead */}
      <Dialog
        open={createLeadOpen}
        onOpenChange={(isOpen) => {
          setCreateLeadOpen(isOpen);
          if (!isOpen) {
            setLeadFormError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo lead</DialogTitle>
            <DialogDescription>
              Crea el lead en Kommo y quedará seleccionado para este pedido.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLeadSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="nl-name" className={FIELD_LABEL_CLASS}>
                  Nombre del lead *
                </label>
                <Input
                  id="nl-name"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="Ej. Venta mobiliario oficina"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="nl-stage" className={FIELD_LABEL_CLASS}>
                  Etapa *
                </label>
                <select
                  id="nl-stage"
                  value={newLead.stage}
                  onChange={(e) =>
                    setNewLead({ ...newLead, stage: e.target.value as OrderLead['stage'] })
                  }
                  className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {LEAD_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="nl-total" className={FIELD_LABEL_CLASS}>
                  Total estimado
                </label>
                <Input
                  id="nl-total"
                  inputMode="decimal"
                  value={newLead.total}
                  onChange={(e) => setNewLead({ ...newLead, total: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="nl-responsible" className={FIELD_LABEL_CLASS}>
                  Responsable
                </label>
                <Input
                  id="nl-responsible"
                  value={newLead.responsible}
                  onChange={(e) => setNewLead({ ...newLead, responsible: e.target.value })}
                  placeholder="Ej. Rodrigo Vega"
                />
              </div>
            </div>

            {leadFormError && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{leadFormError}</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:space-x-0">
              <Button type="button" variant="ghost" onClick={() => setCreateLeadOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-gray-50 dark:text-slate-100"
              >
                <Plus className="h-4 w-4" />
                Crear lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
