'use client';

import { useEffect, useState } from 'react';
import HRMSLayout from '../../components/HRMSLayout';

type SalaryStructure = {
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  effective_from: string;
};

type PayrollRecord = {
  id: number;
  employee_id: number;
  pay_month: number;
  pay_year: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  status: string;
};

export default function PayrollPage() {
  const [salary, setSalary] = useState<SalaryStructure | null>(null);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    loadPayroll();
  }, []);

  const loadPayroll = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('hrms_token');

      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Get salary structure
      const salaryResponse = await fetch(
        `${API_URL}/payroll/salary-structure/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Get payroll history
      const payrollResponse = await fetch(`${API_URL}/payroll/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!salaryResponse.ok && !payrollResponse.ok) {
        throw new Error('Unable to load payroll information');
      }

      if (salaryResponse.ok) {
        const salaryData = await salaryResponse.json();
        setSalary(salaryData);
      }

      if (payrollResponse.ok) {
        const payrollData = await payrollResponse.json();
        setPayroll(Array.isArray(payrollData) ? payrollData : []);
      }
    } catch (err) {
      console.error('Payroll loading error:', err);
      setError('Unable to load payroll information.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    return `₹${Number(value || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '—';

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('en-US', {
      month: 'long',
    });
  };

  const grossSalary = salary
    ? Number(salary.basic) +
      Number(salary.hra) +
      Number(salary.allowances)
    : 0;

  const netSalary = salary
    ? grossSalary - Number(salary.deductions)
    : 0;

  return (
    <HRMSLayout title="Payroll">
      <div className="payroll-page">
        <div className="page-heading">
          <div>
            <h2>My Payroll</h2>
            <p>View your salary structure and payroll history.</p>
          </div>

          <button className="secondary-button" onClick={loadPayroll}>
            ↻ Refresh
          </button>
        </div>

        {loading && (
          <div className="loading-card">
            Loading payroll information...
          </div>
        )}

        {error && (
          <div className="error-card">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Salary Summary */}
            <div className="payroll-summary-grid">
              <div className="payroll-summary-card">
                <span>Basic Salary</span>
                <strong>
                  {formatCurrency(salary?.basic || 0)}
                </strong>
              </div>

              <div className="payroll-summary-card">
                <span>HRA</span>
                <strong>
                  {formatCurrency(salary?.hra || 0)}
                </strong>
              </div>

              <div className="payroll-summary-card">
                <span>Allowances</span>
                <strong>
                  {formatCurrency(salary?.allowances || 0)}
                </strong>
              </div>

              <div className="payroll-summary-card">
                <span>Deductions</span>
                <strong className="deduction-value">
                  {formatCurrency(salary?.deductions || 0)}
                </strong>
              </div>
            </div>

            {/* Current Salary */}
            <div className="payroll-main-card">
              <div className="payroll-card-header">
                <div>
                  <h3>Current Salary Structure</h3>
                  <p>
                    Effective from{' '}
                    {formatDate(salary?.effective_from || '')}
                  </p>
                </div>

                <span className="status-badge active">
                  ACTIVE
                </span>
              </div>

              {salary ? (
                <div className="salary-details">
                  <div className="salary-row">
                    <span>Basic Salary</span>
                    <strong>
                      {formatCurrency(salary.basic)}
                    </strong>
                  </div>

                  <div className="salary-row">
                    <span>HRA</span>
                    <strong>
                      {formatCurrency(salary.hra)}
                    </strong>
                  </div>

                  <div className="salary-row">
                    <span>Allowances</span>
                    <strong>
                      {formatCurrency(salary.allowances)}
                    </strong>
                  </div>

                  <div className="salary-row gross-row">
                    <span>Gross Salary</span>
                    <strong>
                      {formatCurrency(grossSalary)}
                    </strong>
                  </div>

                  <div className="salary-row">
                    <span>Deductions</span>
                    <strong className="deduction-value">
                      - {formatCurrency(salary.deductions)}
                    </strong>
                  </div>

                  <div className="salary-row net-row">
                    <span>Estimated Net Salary</span>
                    <strong>
                      {formatCurrency(netSalary)}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">💰</div>
                  <h3>No salary structure found</h3>
                  <p>
                    Your salary structure has not been configured yet.
                  </p>
                </div>
              )}
            </div>

            {/* Payroll History */}
            <div className="payroll-main-card">
              <div className="payroll-card-header">
                <div>
                  <h3>Payroll History</h3>
                  <p>Your processed monthly payroll records.</p>
                </div>
              </div>

              {payroll.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📄</div>
                  <h3>No payroll records yet</h3>
                  <p>
                    Monthly payroll records will appear here after
                    payroll is processed.
                  </p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Gross Salary</th>
                        <th>Deductions</th>
                        <th>Net Salary</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {payroll.map((record) => (
                        <tr key={record.id}>
                          <td>
                            <strong>
                              {getMonthName(record.pay_month)}{' '}
                              {record.pay_year}
                            </strong>
                          </td>

                          <td>
                            {formatCurrency(record.gross_salary)}
                          </td>

                          <td className="deduction-value">
                            {formatCurrency(
                              record.total_deductions
                            )}
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(record.net_salary)}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${record.status.toLowerCase()}`}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </HRMSLayout>
  );
}