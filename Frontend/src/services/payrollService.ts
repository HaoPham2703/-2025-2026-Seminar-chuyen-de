import { apiFetch } from './api';

export interface PayrollItem {
  name: string;
  amount: number;
}

export interface PayrollPeriod {
  month: number;
  year: number;
}

export interface Payroll {
  id: string;
  period: PayrollPeriod;
  baseSalary: number;
  allowances: PayrollItem[];
  deductions: PayrollItem[];
  allowancesTotal: number;
  deductionsTotal: number;
  netSalary: number;
  status: string;
  approvedAt?: string | null;
  createdAt?: string | null;
}

export async function getMyPayrolls(params?: {
  month?: number;
  year?: number;
}): Promise<Payroll[]> {
  const query = new URLSearchParams();
  if (params?.month) query.set('month', params.month.toString());
  if (params?.year) query.set('year', params.year.toString());
  const queryString = query.toString();

  const response = await apiFetch<{ payrolls: Payroll[] }>(
    `/payrolls/my${queryString ? `?${queryString}` : ''}`
  );

  if (response.success && response.data) {
    return response.data.payrolls || [];
  }

  throw new Error(response.message || 'Failed to load payrolls');
}
