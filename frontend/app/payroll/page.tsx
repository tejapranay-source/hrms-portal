
'use client';

import { useEffect, useState } from 'react';
import HRMSLayout from '../../components/HRMSLayout';

type SalaryStructure = {
  basic: number | string;
  hra: number | string;
  allowances: number | string;
  deductions: number | string;
  effective_from: string;
};

type PayrollRecord = {
  id: number;
  employee_id: number;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  pay_month: number;
  pay_year: number;
  gross_salary: number | string;
  total_deductions: number | string;
  net_salary: number | string;
  status: string;
};

type LoggedInUser = {
  id: number;
  email: string;
  role: string;
  employeeId?: number;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

const MANAGEMENT_ROLES = [
  'SUPER_ADMIN',
  'HR_ADMIN',
  'PAYROLL',
];

export default function PayrollPage() {
  const [salary, setSalary] =
    useState<SalaryStructure | null>(null);

  const [payroll, setPayroll] =
    useState<PayrollRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [userRole, setUserRole] =
    useState('');

  useEffect(() => {
    let cancelled = false;

    const loadPayroll = async () => {
      try {
        setLoading(true);
        setError('');

        const token =
          localStorage.getItem('hrms_token');

        const storedUser =
          localStorage.getItem('hrms_user');

        if (!token || !storedUser) {
          window.location.replace('/login');
          return;
        }

        let user: LoggedInUser;

        try {
          user = JSON.parse(storedUser);
        } catch {
          localStorage.removeItem('hrms_token');
          localStorage.removeItem('hrms_user');

          window.location.replace('/login');
          return;
        }

        const role = String(
          user.role || ''
        ).toUpperCase();

        if (cancelled) return;

        setUserRole(role);

        /*
         * =====================================================
         * HR / PAYROLL / SUPER ADMIN
         * =====================================================
         */

        if (MANAGEMENT_ROLES.includes(role)) {
          const response = await fetch(
            `${API_URL}/payroll`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            let message =
              'Unable to load payroll information.';

            try {
              const data =
                await response.json();

              if (data?.message) {
                message = data.message;
              }
            } catch {
              // Ignore invalid response
            }

            throw new Error(message);
          }

          const data =
            await response.json();

          if (cancelled) return;

          setPayroll(
            Array.isArray(data)
              ? data
              : []
          );

          setSalary(null);

          return;
        }

        /*
         * =====================================================
         * EMPLOYEE / MANAGER
         * =====================================================
         */

        const [
          salaryResponse,
          payrollResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/payroll/salary-structure/me`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          ),

          fetch(
            `${API_URL}/payroll/me`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          ),
        ]);

        if (
          !salaryResponse.ok &&
          !payrollResponse.ok
        ) {
          let message =
            'Unable to load payroll information.';

          try {
            const data =
              await payrollResponse.json();

            if (data?.message) {
              message = data.message;
            }
          } catch {
            // Ignore invalid response
          }

          throw new Error(message);
        }

        if (salaryResponse.ok) {
          const salaryData =
            await salaryResponse.json();

          if (!cancelled) {
            setSalary(salaryData);
          }
        } else if (!cancelled) {
          setSalary(null);
        }

        if (payrollResponse.ok) {
          const payrollData =
            await payrollResponse.json();

          if (!cancelled) {
            setPayroll(
              Array.isArray(payrollData)
                ? payrollData
                : []
            );
          }
        } else if (!cancelled) {
          setPayroll([]);
        }
      } catch (err) {
        if (cancelled) return;

        console.error(
          'Payroll loading error:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load payroll information.'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPayroll();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshPayroll = async () => {
    try {
      setRefreshing(true);
      setError('');

      const token =
        localStorage.getItem('hrms_token');

      if (!token) {
        window.location.replace('/login');
        return;
      }

      /*
       * Management users
       */

      if (
        MANAGEMENT_ROLES.includes(
          userRole
        )
      ) {
        const response = await fetch(
          `${API_URL}/payroll`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            'Unable to refresh payroll information.'
          );
        }

        const data =
          await response.json();

        setPayroll(
          Array.isArray(data)
            ? data
            : []
        );

        return;
      }

      /*
       * Employee / Manager
       */

      const [
        salaryResponse,
        payrollResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/payroll/salary-structure/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        fetch(
          `${API_URL}/payroll/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      if (salaryResponse.ok) {
        const salaryData =
          await salaryResponse.json();

        setSalary(salaryData);
      }

      if (payrollResponse.ok) {
        const payrollData =
          await payrollResponse.json();

        setPayroll(
          Array.isArray(payrollData)
            ? payrollData
            : []
        );
      }
    } catch (err) {
      console.error(
        'Payroll refresh error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to refresh payroll information.'
      );
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (
    value: number | string
  ) => {
    return `₹${Number(
      value || 0
    ).toLocaleString(
      'en-IN',
      {
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatDate = (
    date: string
  ) => {
    if (!date) return '—';

    return new Date(
      date
    ).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  const getMonthName = (
    month: number
  ) => {
    return new Date(
      2000,
      month - 1,
      1
    ).toLocaleString(
      'en-US',
      {
        month: 'long',
      }
    );
  };

  const isManagementView =
    MANAGEMENT_ROLES.includes(
      userRole
    );

  const grossSalary =
    salary
      ? Number(salary.basic) +
        Number(salary.hra) +
        Number(salary.allowances)
      : 0;

  const netSalary =
    salary
      ? grossSalary -
        Number(salary.deductions)
      : 0;

  return (
    <HRMSLayout
      title={
        isManagementView
          ? 'Payroll Management'
          : 'Payroll'
      }
    >
      <div className="payroll-page">

        <div className="page-heading">
          <div>
            <h2>
              {isManagementView
                ? 'Payroll Management'
                : 'My Payroll'}
            </h2>

            <p>
              {isManagementView
                ? 'View payroll records for all employees.'
                : 'View your salary structure and payroll history.'}
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={refreshPayroll}
            disabled={loading || refreshing}
          >
            ↻{' '}
            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>

        {loading && (
          <div className="loading-card">
            Loading payroll information...
          </div>
        )}

        {!loading && error && (
          <div className="error-card">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          isManagementView && (
            <div className="payroll-main-card">

              <div className="payroll-card-header">
                <div>
                  <h3>
                    Employee Payroll Records
                  </h3>

                  <p>
                    Payroll records for all employees.
                  </p>
                </div>

                <span className="status-badge active">
                  {payroll.length} RECORDS
                </span>
              </div>

              {payroll.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    📄
                  </div>

                  <h3>
                    No payroll records found
                  </h3>

                  <p>
                    Payroll records will appear
                    here after payroll is processed.
                  </p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Employee Code</th>
                        <th>Month</th>
                        <th>Gross Salary</th>
                        <th>Deductions</th>
                        <th>Net Salary</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {payroll.map(
                        (record) => (
                          <tr
                            key={record.id}
                          >
                            <td>
                              <strong>
                                {record.first_name ||
                                record.last_name
                                  ? `${record.first_name || ''} ${record.last_name || ''}`.trim()
                                  : 'Employee'}
                              </strong>

                              {record.email && (
                                <div
                                  style={{
                                    fontSize: '12px',
                                    opacity: 0.7,
                                    marginTop: '3px',
                                  }}
                                >
                                  {record.email}
                                </div>
                              )}
                            </td>

                            <td>
                              {record.employee_code ||
                                '—'}
                            </td>

                            <td>
                              <strong>
                                {getMonthName(
                                  record.pay_month
                                )}{' '}
                                {record.pay_year}
                              </strong>
                            </td>

                            <td>
                              {formatCurrency(
                                record.gross_salary
                              )}
                            </td>

                            <td className="deduction-value">
                              {formatCurrency(
                                record.total_deductions
                              )}
                            </td>

                            <td>
                              <strong>
                                {formatCurrency(
                                  record.net_salary
                                )}
                              </strong>
                            </td>

                            <td>
                              <span
                                className={`status-badge ${String(
                                  record.status
                                ).toLowerCase()}`}
                              >
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        {!loading &&
          !error &&
          !isManagementView && (
            <>
              <div className="payroll-summary-grid">

                <div className="payroll-summary-card">
                  <span>
                    Basic Salary
                  </span>

                  <strong>
                    {formatCurrency(
                      salary?.basic || 0
                    )}
                  </strong>
                </div>

                <div className="payroll-summary-card">
                  <span>HRA</span>

                  <strong>
                    {formatCurrency(
                      salary?.hra || 0
                    )}
                  </strong>
                </div>

                <div className="payroll-summary-card">
                  <span>
                    Allowances
                  </span>

                  <strong>
                    {formatCurrency(
                      salary?.allowances || 0
                    )}
                  </strong>
                </div>

                <div className="payroll-summary-card">
                  <span>
                    Deductions
                  </span>

                  <strong className="deduction-value">
                    {formatCurrency(
                      salary?.deductions || 0
                    )}
                  </strong>
                </div>

              </div>

              <div className="payroll-main-card">

                <div className="payroll-card-header">
                  <div>
                    <h3>
                      Current Salary Structure
                    </h3>

                    <p>
                      Effective from{' '}
                      {formatDate(
                        salary?.effective_from ||
                          ''
                      )}
                    </p>
                  </div>

                  <span className="status-badge active">
                    ACTIVE
                  </span>
                </div>

                {salary ? (
                  <div className="salary-details">

                    <div className="salary-row">
                      <span>
                        Basic Salary
                      </span>

                      <strong>
                        {formatCurrency(
                          salary.basic
                        )}
                      </strong>
                    </div>

                    <div className="salary-row">
                      <span>HRA</span>

                      <strong>
                        {formatCurrency(
                          salary.hra
                        )}
                      </strong>
                    </div>

                    <div className="salary-row">
                      <span>
                        Allowances
                      </span>

                      <strong>
                        {formatCurrency(
                          salary.allowances
                        )}
                      </strong>
                    </div>

                    <div className="salary-row gross-row">
                      <span>
                        Gross Salary
                      </span>

                      <strong>
                        {formatCurrency(
                          grossSalary
                        )}
                      </strong>
                    </div>

                    <div className="salary-row">
                      <span>
                        Deductions
                      </span>

                      <strong className="deduction-value">
                        -{' '}
                        {formatCurrency(
                          salary.deductions
                        )}
                      </strong>
                    </div>

                    <div className="salary-row net-row">
                      <span>
                        Estimated Net Salary
                      </span>

                      <strong>
                        {formatCurrency(
                          netSalary
                        )}
                      </strong>
                    </div>

                  </div>
                ) : (
                  <div className="empty-state">

                    <div className="empty-icon">
                      💰
                    </div>

                    <h3>
                      No salary structure found
                    </h3>

                    <p>
                      Your salary structure has
                      not been configured yet.
                    </p>

                  </div>
                )}

              </div>

              <div className="payroll-main-card">

                <div className="payroll-card-header">
                  <div>
                    <h3>
                      Payroll History
                    </h3>

                    <p>
                      Your processed monthly
                      payroll records.
                    </p>
                  </div>
                </div>

                {payroll.length === 0 ? (
                  <div className="empty-state">

                    <div className="empty-icon">
                      📄
                    </div>

                    <h3>
                      No payroll records yet
                    </h3>

                    <p>
                      Monthly payroll records
                      will appear here after
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
                        {payroll.map(
                          (record) => (
                            <tr
                              key={record.id}
                            >
                              <td>
                                <strong>
                                  {getMonthName(
                                    record.pay_month
                                  )}{' '}
                                  {record.pay_year}
                                </strong>
                              </td>

                              <td>
                                {formatCurrency(
                                  record.gross_salary
                                )}
                              </td>

                              <td className="deduction-value">
                                {formatCurrency(
                                  record.total_deductions
                                )}
                              </td>

                              <td>
                                <strong>
                                  {formatCurrency(
                                    record.net_salary
                                  )}
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={`status-badge ${String(
                                    record.status
                                  ).toLowerCase()}`}
                                >
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          )
                        )}
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
