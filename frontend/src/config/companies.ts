// frontend/src/config/companies.ts

export interface CompanyOption {
  id: string;
  name: string;
  logo?: string;
}

export const MOCK_COMPANIES: CompanyOption[] = [
  { id: 'altosa', name: 'Altosa', logo: '/altosa.png' },
];

export const ACTIVE_COMPANY: CompanyOption = MOCK_COMPANIES[0];
