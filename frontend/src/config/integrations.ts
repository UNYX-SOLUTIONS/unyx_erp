// frontend/src/config/integrations.ts

export const KOMMO_SUBDOMAIN = process.env.NEXT_PUBLIC_KOMMO_SUBDOMAIN ?? 'altosa';

export function kommoLeadUrl(leadCode: string): string {
  const leadId = leadCode.replace(/\D/g, '');
  return `https://${KOMMO_SUBDOMAIN}.kommo.com/leads/detail/${leadId}`;
}
