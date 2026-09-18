'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import HRMSLayout from '../../components/HRMSLayout';

const API =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type User = {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

type LeaveType = {
  id: number;
  name: string;
  annual_days: number;
  is_paid: boolean;
  created_at?: string;
  updated_at?: string;
};

type MyLeaveBalance = {
  leaveTypeId: number;
  leaveType: string;
  allocated: number;
  used: number;
  pending: number;
  adjustments: number;
  available: number;
};

type LeaveRequest = {
  id: number;
  employee_id: number;
  leave_type_id: number;
  leave_type?: string;
  start_date: string;
  end_date: string;
  days: number | string;
  reason?: string | null;
  status: string;
  approved_by?: number | null;
  created_at: string;
  updated_at: string;

  employee_code?: string;
  employee_first_name?: string;
  employee_last_name?: string;
  employee_email?: string;
  approver_first_name?: string;
  approver_last_name?: string;
};

type LeavePolicy = {
  id: number;
  leave_type_id: number;
  leave_type_name?: string;
  policy_name: string;
  accrual_frequency: string;
  allocation: number | string;
  probation_eligible: boolean;
  minimum_days: number | string;
  maximum_days?: number | string | null;
  max_consecutive_days?: number | null;
  advance_notice_days: number;
  allow_negative_balance: boolean;
  include_weekends: boolean;
  include_holidays: boolean;
  sandwich_rule: boolean;
  carry_forward: boolean;
  carry_forward_expiry_months?: number | null;
  approval_required: boolean;
  approval_levels: number;
  is_active: boolean;
};

type LeaveHoliday = {
  id: number;
  name: string;
  holiday_date: string;
  holiday_type: string;
  location?: string | null;
  is_optional: boolean;
  is_active: boolean;
  description?: string | null;
};

type LeaveAdjustment = {
  id: number;
  employee_id: number;
  leave_type_id: number;
  amount: number | string;
  adjustment_type: string;
  reason: string;
  created_by?: number | null;
  created_at: string;
  employee_code?: string;
  employee_name?: string;
  leave_type_name?: string;
  created_by_name?: string | null;
};

type ApprovalHistoryItem = {
  id: number;
  previous_status?: string | null;
  new_status: string;
  comments?: string | null;
  rejection_reason?: string | null;
  acted_at: string;
  acted_by?: number | null;
  actor_name?: string | null;
};

type ApprovalStep = {
  id: number;
  level: number;
  approver_type: string;
  approver_user_id?: number | null;
  status: string;
  comments?: string | null;
  acted_at?: string | null;
  approver_name?: string | null;
};

type ApprovalHistoryResponse = {
  request: LeaveRequest;
  history: ApprovalHistoryItem[];
  approvalSteps: ApprovalStep[];
};

type Dashboard = {
  totalEmployees: number;
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  approvedDays: number;
  upcomingLeaves: number;
};

type Balance = {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  email?: string;
  department?: string;
  designation?: string;
  balances: {
    leaveTypeId: number;
    leaveType: string;
    allocated: number;
    used: number;
    available: number;
  }[];
};

type CalendarLeave = {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  days: number | string;
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  leave_type?: string;
};

type ReportRow = {
  leave_type?: string;
  status?: string;
  month?: string;
  requests?: number | string;
  days?: number | string;
};

type Reports = {
  byType: ReportRow[];
  byStatus: ReportRow[];
  monthly: ReportRow[];
};

type HRSection =
  | 'dashboard'
  | 'requests'
  | 'approval'
  | 'types'
  | 'balances'
  | 'calendar'
  | 'policies'
  | 'holidays'
  | 'adjustments'
  | 'reports';

type IconName =
  | 'dashboard'
  | 'requests'
  | 'approval'
  | 'types'
  | 'balances'
  | 'calendar'
  | 'policies'
  | 'holidays'
  | 'adjustments'
  | 'reports'
  | 'plus'
  | 'search'
  | 'edit'
  | 'delete'
  | 'check'
  | 'close'
  | 'clock'
  | 'users'
  | 'days'
  | 'arrow';

function Icon({
  name,
  size = 18,
}: {
  name: IconName;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );

    case 'requests':
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 3.5h6" />
          <path d="M9 9h6" />
          <path d="M9 13h6" />
          <path d="M9 17h4" />
        </svg>
      );

    case 'approval':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      );

    case 'types':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );

    case 'balances':
      return (
        <svg {...common}>
          <path d="M4 19h16" />
          <path d="M6 17V9" />
          <path d="M10 17V5" />
          <path d="M14 17v-7" />
          <path d="M18 17V7" />
        </svg>
      );

    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
      );

    case 'policies':
      return (
        <svg {...common}>
          <path d="M6 3h9l4 4v14H6z" />
          <path d="M15 3v5h4M9 12h6M9 16h6" />
        </svg>
      );

    case 'holidays':
      return (
        <svg {...common}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          <path d="m5.6 5.6 2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );

    case 'adjustments':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" />
          <circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
          <circle cx="11" cy="17" r="2" fill="currentColor" stroke="none" />
        </svg>
      );

    case 'reports':
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="m7 15 3-4 3 2 4-6" />
        </svg>
      );

    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );

    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );

    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
      );

    case 'delete':
      return (
        <svg {...common}>
          <path d="M4 7h16M10 11v6M14 11v6" />
          <path d="M6 7l1 14h10l1-14M9 7V4h6v3" />
        </svg>
      );

    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );

    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <path d="M16 5.5a3 3 0 0 1 0 5.8M18 14c1.8.7 3 2.4 3 4.5" />
        </svg>
      );

    case 'days':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case 'arrow':
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );

    default:
      return null;
  }
}

function getStatusClass(status: string) {
  return status.toLowerCase().replace(/\s+/g, '-');
}

function formatDate(value?: string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatMonth(value?: string) {
  if (!value) return '—';

  const date = new Date(`${value}-01T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

function employeeName(request: LeaveRequest) {
  const name = `${request.employee_first_name ?? ''} ${
    request.employee_last_name ?? ''
  }`.trim();

  return name || request.employee_code || `Employee #${request.employee_id}`;
}

function apiHeaders() {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('hrms_token')
      : null;

  return {
    'Content-Type': 'application/json',
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...apiHeaders(),
      ...(options.headers || {}),
    },
  });

  const contentType =
    response.headers.get('content-type') || '';

  const data = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data as T;
}

function PageTitle({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="leave-page-title">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {children && (
        <div className="leave-page-actions">{children}</div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  helper,
  tone = 'blue',
}: {
  icon: IconName;
  label: string;
  value: number | string;
  helper?: string;
  tone?: 'blue' | 'green' | 'orange' | 'purple';
}) {
  return (
    <div className="leave-stat-card">
      <div className={`leave-stat-icon ${tone}`}>
        <Icon name={icon} size={23} />
      </div>

      <div className="leave-stat-content">
        <div className="leave-stat-label">{label}</div>
        <div className="leave-stat-value">{value}</div>
        {helper && (
          <div className="leave-stat-helper">{helper}</div>
        )}
      </div>
    </div>
  );
}

function SectionNavigation({
  active,
  onChange,
}: {
  active: HRSection;
  onChange: (section: HRSection) => void;
}) {
  const items: {
    key: HRSection;
    label: string;
    icon: IconName;
  }[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
    },
    {
      key: 'requests',
      label: 'Requests',
      icon: 'requests',
    },
    {
      key: 'approval',
      label: 'Approval Workflow',
      icon: 'approval',
    },
    {
      key: 'types',
      label: 'Leave Types',
      icon: 'types',
    },
    {
      key: 'balances',
      label: 'Balances',
      icon: 'balances',
    },
    {
      key: 'calendar',
      label: 'Calendar',
      icon: 'calendar',
    },
    {
      key: 'policies',
      label: 'Policies',
      icon: 'policies',
    },
    {
      key: 'holidays',
      label: 'Holidays',
      icon: 'holidays',
    },
    {
      key: 'adjustments',
      label: 'Adjustments',
      icon: 'adjustments',
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: 'reports',
    },
  ];

  return (
    <div className="leave-section-nav">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`leave-nav-button ${
            active === item.key ? 'active' : ''
          }`}
          onClick={() => onChange(item.key)}
        >
          <Icon name={item.icon} size={17} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function LeavePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hrms_user');

      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      setUser(null);
    }
  }, []);

  const isHR =
    user?.role === 'HR_ADMIN' ||
    user?.role === 'SUPER_ADMIN';

  if (!user) {
    return (
      <>
        <style jsx global>{styles}</style>

        <HRMSLayout title="Leave">
          <div className="leave-loading">
            <div className="leave-spinner" />
            Loading Leave Management...
          </div>
        </HRMSLayout>
      </>
    );
  }

  if (isHR) {
    return (
      <>
        <style jsx global>{styles}</style>
        <HRLeaveManagement />
      </>
    );
  }

  return (
    <>
      <style jsx global>{styles}</style>
      <EmployeeLeavePage />
    </>
  );
}

/* =========================================================
   HR MANAGEMENT
========================================================= */

function HRLeaveManagement() {
  const [section, setSection] =
    useState<HRSection>('dashboard');

  const [dashboard, setDashboard] =
    useState<Dashboard | null>(null);

  const [requests, setRequests] =
    useState<LeaveRequest[]>([]);

  const [leaveTypes, setLeaveTypes] =
    useState<LeaveType[]>([]);

  const [balances, setBalances] =
    useState<Balance[]>([]);

  const [calendar, setCalendar] =
    useState<CalendarLeave[]>([]);

  const [reports, setReports] =
    useState<Reports>({
      byType: [],
      byStatus: [],
      monthly: [],
    });

  const [policies, setPolicies] =
    useState<LeavePolicy[]>([]);

  const [holidays, setHolidays] =
    useState<LeaveHoliday[]>([]);

  const [adjustments, setAdjustments] =
    useState<LeaveAdjustment[]>([]);

  const [approvalDetails, setApprovalDetails] =
    useState<ApprovalHistoryResponse | null>(null);

  const [approvalDetailsLoading, setApprovalDetailsLoading] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [actionMessage, setActionMessage] =
    useState('');

  const [search, setSearch] =
    useState('');

  const loadDashboard = async () => {
    const data =
      await apiRequest<Dashboard>(
        '/leave/hr/dashboard'
      );

    setDashboard(data);
  };

  const loadRequests = async () => {
    const data =
      await apiRequest<LeaveRequest[]>(
        '/leave/hr/requests'
      );

    setRequests(Array.isArray(data) ? data : []);
  };

  const loadLeaveTypes = async () => {
    const data =
      await apiRequest<LeaveType[]>(
        '/leave/hr/types'
      );

    setLeaveTypes(Array.isArray(data) ? data : []);
  };

  const loadBalances = async () => {
    const data =
      await apiRequest<Balance[]>(
        '/leave/hr/balances'
      );

    setBalances(Array.isArray(data) ? data : []);
  };

  const loadCalendar = async () => {
    const data =
      await apiRequest<CalendarLeave[]>(
        '/leave/hr/calendar'
      );

    setCalendar(Array.isArray(data) ? data : []);
  };

  const loadReports = async () => {
    const data =
      await apiRequest<Reports>(
        '/leave/hr/reports'
      );

    setReports({
      byType: Array.isArray(data?.byType)
        ? data.byType
        : [],
      byStatus: Array.isArray(data?.byStatus)
        ? data.byStatus
        : [],
      monthly: Array.isArray(data?.monthly)
        ? data.monthly
        : [],
    });
  };

  const loadPolicies = async () => {
    const data = await apiRequest<LeavePolicy[]>(
      '/leave-management/policies'
    );
    setPolicies(Array.isArray(data) ? data : []);
  };

  const loadHolidays = async () => {
    const data = await apiRequest<LeaveHoliday[]>(
      '/leave-management/holidays'
    );
    setHolidays(Array.isArray(data) ? data : []);
  };

  const loadAdjustments = async () => {
    const data = await apiRequest<LeaveAdjustment[]>(
      '/leave-management/adjustments'
    );
    setAdjustments(Array.isArray(data) ? data : []);
  };

  const loadApprovalDetails = async (id: number) => {
    try {
      setApprovalDetailsLoading(true);
      setError('');
      const data = await apiRequest<ApprovalHistoryResponse>(
        `/leave-management/requests/${id}/history`
      );
      setApprovalDetails(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load approval details.'
      );
    } finally {
      setApprovalDetailsLoading(false);
    }
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');

      await Promise.all([
        loadDashboard(),
        loadRequests(),
        loadLeaveTypes(),
        loadBalances(),
        loadCalendar(),
        loadReports(),
        loadPolicies(),
        loadHolidays(),
        loadAdjustments(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load leave management data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token =
      localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    loadAll();
  }, []);

  const handleSectionChange = async (
    nextSection: HRSection
  ) => {
    setSection(nextSection);
    setError('');
    setActionMessage('');

    try {
      if (nextSection === 'dashboard') {
        await loadDashboard();
      }

      if (
        nextSection === 'requests' ||
        nextSection === 'approval'
      ) {
        await loadRequests();
      }

      if (nextSection === 'types') {
        await loadLeaveTypes();
      }

      if (nextSection === 'balances') {
        await loadBalances();
      }

      if (nextSection === 'calendar') {
        await loadCalendar();
      }

      if (nextSection === 'reports') {
        await loadReports();
      }

      if (nextSection === 'policies') {
        await loadPolicies();
      }

      if (nextSection === 'holidays') {
        await loadHolidays();
      }

      if (nextSection === 'adjustments') {
        await loadAdjustments();
        await loadBalances();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load this section.'
      );
    }
  };

  const updateStatus = async (
    id: number,
    status: string
  ) => {
    try {
      setError('');
      setActionMessage('');

      let comments: string | undefined;
      let rejectionReason: string | undefined;

      if (status === 'REJECTED') {
        const reason = window.prompt(
          'Enter the rejection reason (required):'
        );

        if (!reason?.trim()) {
          return;
        }

        rejectionReason = reason.trim();
        comments = reason.trim();
      }

      await apiRequest(
        `/leave-management/requests/${id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status,
            comments,
            rejectionReason,
          }),
        }
      );

      await Promise.all([
        loadDashboard(),
        loadRequests(),
        loadBalances(),
        loadCalendar(),
        loadReports(),
      ]);

      setActionMessage(
        `Leave request ${
          status === 'APPROVED'
            ? 'approved'
            : status === 'REJECTED'
              ? 'rejected'
              : status.toLowerCase()
        } successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update leave request.'
      );
    }
  };

  const filteredRequests =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) return requests;

      return requests.filter((request) => {
        const text = [
          employeeName(request),
          request.employee_email,
          request.employee_code,
          request.leave_type,
          request.status,
          request.reason,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return text.includes(value);
      });
    }, [requests, search]);

  if (loading && !dashboard) {
    return (
      <HRMSLayout title="Leave Management">
        <div className="leave-loading">
          <div className="leave-spinner" />
          Loading Leave Management...
        </div>
      </HRMSLayout>
    );
  }

  return (
    <HRMSLayout title="Leave Management">
      <div className="leave-page">
        <PageTitle
          title="Leave Management"
          description="Manage employee leave, approvals, balances and reporting from one place."
        >
          <button
            type="button"
            className="leave-primary-button"
            onClick={() =>
              handleSectionChange('requests')
            }
          >
            <Icon name="requests" size={17} />
            View Requests
          </button>
        </PageTitle>

        {error && (
          <div className="leave-alert error">
            <div>
              <strong>Something went wrong</strong>
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Close"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}

        {actionMessage && (
          <div className="leave-alert success">
            <div>
              <strong>Success</strong>
              <span>{actionMessage}</span>
            </div>

            <button
              type="button"
              onClick={() =>
                setActionMessage('')
              }
              aria-label="Close"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}

        <SectionNavigation
          active={section}
          onChange={handleSectionChange}
        />

        {section === 'dashboard' && (
          <HRDashboardView
            dashboard={dashboard}
            requests={requests}
            onSectionChange={handleSectionChange}
            onStatusUpdate={updateStatus}
          />
        )}

        {section === 'requests' && (
          <HRRequestsView
            requests={filteredRequests}
            search={search}
            onSearch={setSearch}
            onStatusUpdate={updateStatus}
            onApprovalDetails={loadApprovalDetails}
          />
        )}

        {section === 'approval' && (
          <HRApprovalView
            requests={requests.filter(
              (request) =>
                request.status === 'PENDING'
            )}
            onStatusUpdate={updateStatus}
          />
        )}

        {section === 'types' && (
          <HRLeaveTypesView
            types={leaveTypes}
            onRefresh={loadLeaveTypes}
            onError={setError}
            onMessage={setActionMessage}
          />
        )}

        {section === 'balances' && (
          <HRBalancesView
            balances={balances}
            leaveTypes={leaveTypes}
          />
        )}

        {section === 'calendar' && (
          <HRCalendarView
            calendar={calendar}
          />
        )}

        {section === 'policies' && (
          <HRPoliciesView
            policies={policies}
            leaveTypes={leaveTypes}
            onRefresh={loadPolicies}
            onError={setError}
            onMessage={setActionMessage}
          />
        )}

        {section === 'holidays' && (
          <HRHolidaysView
            holidays={holidays}
            onRefresh={loadHolidays}
            onError={setError}
            onMessage={setActionMessage}
          />
        )}

        {section === 'adjustments' && (
          <HRAdjustmentsView
            adjustments={adjustments}
            balances={balances}
            leaveTypes={leaveTypes}
            onRefresh={async () => {
              await Promise.all([
                loadAdjustments(),
                loadBalances(),
              ]);
            }}
            onError={setError}
            onMessage={setActionMessage}
          />
        )}

        {approvalDetails && (
          <ApprovalDetailsModal
            data={approvalDetails}
            loading={approvalDetailsLoading}
            onClose={() => setApprovalDetails(null)}
          />
        )}

        {section === 'reports' && (
          <HRReportsView
            reports={reports}
          />
        )}
      </div>
    </HRMSLayout>
  );
}

/* =========================================================
   HR DASHBOARD
========================================================= */

function HRDashboardView({
  dashboard,
  requests,
  onSectionChange,
  onStatusUpdate,
}: {
  dashboard: Dashboard | null;
  requests: LeaveRequest[];
  onSectionChange: (
    section: HRSection
  ) => void;
  onStatusUpdate: (
    id: number,
    status: string
  ) => void;
}) {
  const recentRequests =
    requests.slice(0, 6);

  return (
    <div className="leave-content">
      <div className="leave-stat-grid">
        <StatCard
          icon="requests"
          label="Total Requests"
          value={dashboard?.totalRequests ?? 0}
          helper="All leave requests"
          tone="blue"
        />

        <StatCard
          icon="clock"
          label="Pending"
          value={dashboard?.pending ?? 0}
          helper="Awaiting approval"
          tone="orange"
        />

        <StatCard
          icon="check"
          label="Approved"
          value={dashboard?.approved ?? 0}
          helper="Approved requests"
          tone="green"
        />

        <StatCard
          icon="days"
          label="Approved Days"
          value={dashboard?.approvedDays ?? 0}
          helper="Total approved leave"
          tone="purple"
        />
      </div>

      <div className="leave-secondary-stats">
        <div className="leave-mini-stat">
          <span>Employees</span>
          <strong>
            {dashboard?.totalEmployees ?? 0}
          </strong>
        </div>

        <div className="leave-mini-stat">
          <span>Rejected</span>
          <strong>
            {dashboard?.rejected ?? 0}
          </strong>
        </div>

        <div className="leave-mini-stat">
          <span>Cancelled</span>
          <strong>
            {dashboard?.cancelled ?? 0}
          </strong>
        </div>

        <div className="leave-mini-stat">
          <span>Upcoming Leaves</span>
          <strong>
            {dashboard?.upcomingLeaves ?? 0}
          </strong>
        </div>
      </div>

      <div className="leave-panel">
        <div className="leave-panel-header">
          <div>
            <h2>Recent Leave Requests</h2>
            <p>
              Review the latest employee leave activity.
            </p>
          </div>

          <button
            type="button"
            className="leave-text-button"
            onClick={() =>
              onSectionChange('requests')
            }
          >
            View all
            <Icon name="arrow" size={15} />
          </button>
        </div>

        {recentRequests.length === 0 ? (
          <EmptyState
            icon="requests"
            title="No leave requests"
            description="There are no leave requests to display."
          />
        ) : (
          <div className="leave-table-wrap">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th className="right">Action</th>
                </tr>
              </thead>

              <tbody>
                {recentRequests.map(
                  (request) => (
                    <tr key={request.id}>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-avatar">
                            {employeeName(
                              request
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {employeeName(
                                request
                              )}
                            </strong>

                            <span>
                              {request.employee_code ||
                                '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {request.leave_type ||
                          '—'}
                      </td>

                      <td>
                        {formatDate(
                          request.start_date
                        )}{' '}
                        –{' '}
                        {formatDate(
                          request.end_date
                        )}
                      </td>

                      <td>
                        {Number(
                          request.days
                        )}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            request.status
                          }
                        />
                      </td>

                      <td className="right">
                        {request.status ===
                          'PENDING' && (
                          <div className="table-actions">
                            <button
                              type="button"
                              className="table-action approve"
                              onClick={() =>
                                onStatusUpdate(
                                  request.id,
                                  'APPROVED'
                                )
                              }
                            >
                              <Icon
                                name="check"
                                size={14}
                              />
                              Approve
                            </button>

                            <button
                              type="button"
                              className="table-action reject"
                              onClick={() =>
                                onStatusUpdate(
                                  request.id,
                                  'REJECTED'
                                )
                              }
                            >
                              <Icon
                                name="close"
                                size={14}
                              />
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   REQUESTS
========================================================= */

function HRRequestsView({
  requests,
  search,
  onSearch,
  onStatusUpdate,
  onApprovalDetails,
}: {
  requests: LeaveRequest[];
  search: string;
  onSearch: (value: string) => void;
  onStatusUpdate: (
    id: number,
    status: string
  ) => void;
  onApprovalDetails: (id: number) => void;
}) {
  return (
    <div className="leave-content">
      <PageTitle
        title="Leave Requests"
        description="View and manage employee leave requests."
      />

      <div className="leave-filter-card">
        <div className="leave-search">
          <label>Search</label>

          <div className="leave-input-icon">
            <Icon name="search" size={18} />

            <input
              value={search}
              onChange={(event) =>
                onSearch(event.target.value)
              }
              placeholder="Employee, code, leave type or status..."
            />
          </div>
        </div>
      </div>

      <div className="leave-panel">
        <div className="leave-panel-header">
          <div>
            <h2>All Leave Requests</h2>
            <p>
              {requests.length} request
              {requests.length === 1
                ? ''
                : 's'} found.
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon="requests"
            title="No requests found"
            description="No leave requests match your current search."
          />
        ) : (
          <div className="leave-table-wrap">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Period</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th className="right">Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map(
                  (request) => (
                    <tr key={request.id}>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-avatar">
                            {employeeName(
                              request
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {employeeName(
                                request
                              )}
                            </strong>

                            <span>
                              {request.employee_email ||
                                request.employee_code ||
                                '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="cell-primary">
                          {request.leave_type ||
                            '—'}
                        </div>

                        {request.leave_type && (
                          <div className="cell-secondary">
                            {request.status ===
                            'APPROVED'
                              ? 'Approved leave'
                              : 'Leave request'}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="cell-primary">
                          {formatDate(
                            request.start_date
                          )}
                        </div>
                        <div className="cell-secondary">
                          to{' '}
                          {formatDate(
                            request.end_date
                          )}
                        </div>
                      </td>

                      <td>
                        <strong>
                          {Number(
                            request.days
                          )}
                        </strong>
                      </td>

                      <td>
                        <div className="reason-cell">
                          {request.reason ||
                            'No reason provided'}
                        </div>
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            request.status
                          }
                        />
                      </td>

                      <td className="right">
                        {request.status ===
                          'PENDING' && (
                          <div className="table-actions">
                            <button
                              type="button"
                              className="table-action approve"
                              onClick={() =>
                                onStatusUpdate(
                                  request.id,
                                  'APPROVED'
                                )
                              }
                            >
                              <Icon
                                name="check"
                                size={14}
                              />
                              Approve
                            </button>

                            <button
                              type="button"
                              className="table-action reject"
                              onClick={() =>
                                onStatusUpdate(
                                  request.id,
                                  'REJECTED'
                                )
                              }
                            >
                              <Icon
                                name="close"
                                size={14}
                              />
                              Reject
                            </button>
                          </div>
                        )}

                        {request.status !==
                          'PENDING' && (
                          <button
                            type="button"
                            className="table-action neutral"
                            onClick={() =>
                              onApprovalDetails(request.id)
                            }
                          >
                            View approval details
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   APPROVAL WORKFLOW
========================================================= */

function HRApprovalView({
  requests,
  onStatusUpdate,
}: {
  requests: LeaveRequest[];
  onStatusUpdate: (
    id: number,
    status: string
  ) => void;
}) {
  return (
    <div className="leave-content">
      <PageTitle
        title="Approval Workflow"
        description="Review pending leave requests and take action."
      />

      <div className="approval-summary">
        <div className="approval-summary-icon">
          <Icon name="clock" size={24} />
        </div>

        <div>
          <strong>
            {requests.length} pending request
            {requests.length === 1
              ? ''
              : 's'}
          </strong>

          <span>
            These requests require HR approval.
          </span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="leave-panel">
          <EmptyState
            icon="check"
            title="Approval queue is clear"
            description="There are no pending leave requests requiring action."
          />
        </div>
      ) : (
        <div className="approval-grid">
          {requests.map(
            (request) => (
              <div
                className="approval-card"
                key={request.id}
              >
                <div className="approval-card-top">
                  <div className="employee-cell">
                    <div className="employee-avatar large">
                      {employeeName(
                        request
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {employeeName(
                          request
                        )}
                      </strong>

                      <span>
                        {request.employee_code ||
                          request.employee_email ||
                          'Employee'}
                      </span>
                    </div>
                  </div>

                  <StatusBadge status="PENDING" />
                </div>

                <div className="approval-details">
                  <div>
                    <span>Leave Type</span>
                    <strong>
                      {request.leave_type ||
                        '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Duration</span>
                    <strong>
                      {Number(
                        request.days
                      )}{' '}
                      day
                      {Number(
                        request.days
                      ) === 1
                        ? ''
                        : 's'}
                    </strong>
                  </div>

                  <div>
                    <span>Start Date</span>
                    <strong>
                      {formatDate(
                        request.start_date
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>End Date</span>
                    <strong>
                      {formatDate(
                        request.end_date
                      )}
                    </strong>
                  </div>
                </div>

                <div className="approval-reason">
                  <span>Reason</span>
                  <p>
                    {request.reason ||
                      'No reason provided.'}
                  </p>
                </div>

                <div className="approval-actions">
                  <button
                    type="button"
                    className="leave-approve-button"
                    onClick={() =>
                      onStatusUpdate(
                        request.id,
                        'APPROVED'
                      )
                    }
                  >
                    <Icon
                      name="check"
                      size={17}
                    />
                    Approve Request
                  </button>

                  <button
                    type="button"
                    className="leave-reject-button"
                    onClick={() =>
                      onStatusUpdate(
                        request.id,
                        'REJECTED'
                      )
                    }
                  >
                    <Icon
                      name="close"
                      size={17}
                    />
                    Reject
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   LEAVE TYPES
========================================================= */

function HRLeaveTypesView({
  types,
  onRefresh,
  onError,
  onMessage,
}: {
  types: LeaveType[];
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
  onMessage: (message: string) => void;
}) {
  const [name, setName] =
    useState('');

  const [annualDays, setAnnualDays] =
    useState('12');

  const [isPaid, setIsPaid] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editName, setEditName] =
    useState('');

  const [editDays, setEditDays] =
    useState('');

  const [editPaid, setEditPaid] =
    useState(true);

  const createLeaveType = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      onError('');

      await apiRequest(
        '/leave/hr/types',
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            annualDays:
              Number(annualDays),
            isPaid,
          }),
        }
      );

      setName('');
      setAnnualDays('12');
      setIsPaid(true);

      await onRefresh();

      onMessage(
        'Leave type created successfully.'
      );
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : 'Unable to create leave type.'
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (
    type: LeaveType
  ) => {
    setEditingId(type.id);
    setEditName(type.name);
    setEditDays(
      String(type.annual_days)
    );
    setEditPaid(type.is_paid);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditDays('');
    setEditPaid(true);
  };

  const saveEditing = async (
    id: number
  ) => {
    try {
      setSaving(true);
      onError('');

      await apiRequest(
        `/leave/hr/types/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: editName,
            annualDays:
              Number(editDays),
            isPaid: editPaid,
          }),
        }
      );

      cancelEditing();
      await onRefresh();

      onMessage(
        'Leave type updated successfully.'
      );
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : 'Unable to update leave type.'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteType = async (
    type: LeaveType
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${type.name}"?`
      );

    if (!confirmed) return;

    try {
      setSaving(true);
      onError('');

      await apiRequest(
        `/leave/hr/types/${type.id}`,
        {
          method: 'DELETE',
        }
      );

      await onRefresh();

      onMessage(
        'Leave type deleted successfully.'
      );
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : 'Unable to delete leave type.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="leave-content">
      <PageTitle
        title="Leave Types"
        description="Configure the leave categories available to employees."
      />

      <div className="leave-create-card">
        <div className="leave-create-header">
          <div className="leave-create-icon">
            <Icon name="plus" size={20} />
          </div>

          <div>
            <h2>Add Leave Type</h2>
            <p>
              Create a new company leave category.
            </p>
          </div>
        </div>

        <form
          className="leave-create-form"
          onSubmit={createLeaveType}
        >
          <div className="field">
            <label>Leave Type Name</label>
            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="e.g. Casual Leave"
              required
            />
          </div>

          <div className="field">
            <label>Annual Days</label>
            <input
              type="number"
              min="0"
              value={annualDays}
              onChange={(event) =>
                setAnnualDays(
                  event.target.value
                )
              }
              required
            />
          </div>

          <label className="paid-checkbox">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(event) =>
                setIsPaid(
                  event.target.checked
                )
              }
            />
            <span>Paid Leave</span>
          </label>

          <button
            type="submit"
            className="leave-primary-button"
            disabled={saving}
          >
            <Icon name="plus" size={17} />
            {saving
              ? 'Adding...'
              : 'Add Leave Type'}
          </button>
        </form>
      </div>

      <div className="leave-panel">
        <div className="leave-panel-header">
          <div>
            <h2>Configured Leave Types</h2>
            <p>
              {types.length} leave type
              {types.length === 1
                ? ''
                : 's'} configured.
            </p>
          </div>
        </div>

        {types.length === 0 ? (
          <EmptyState
            icon="types"
            title="No leave types"
            description="Create the first leave type using the form above."
          />
        ) : (
          <div className="leave-table-wrap">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Annual Entitlement</th>
                  <th>Payment</th>
                  <th>Created</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {types.map(
                  (type) => (
                    <tr key={type.id}>
                      {editingId ===
                      type.id ? (
                        <>
                          <td>
                            <input
                              className="table-input"
                              value={
                                editName
                              }
                              onChange={(
                                event
                              ) =>
                                setEditName(
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </td>

                          <td>
                            <input
                              className="table-input small"
                              type="number"
                              min="0"
                              value={
                                editDays
                              }
                              onChange={(
                                event
                              ) =>
                                setEditDays(
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </td>

                          <td>
                            <label className="inline-checkbox">
                              <input
                                type="checkbox"
                                checked={
                                  editPaid
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditPaid(
                                    event
                                      .target
                                      .checked
                                  )
                                }
                              />
                              Paid
                            </label>
                          </td>

                          <td>
                            {formatDate(
                              type.created_at
                            )}
                          </td>

                          <td className="right">
                            <div className="table-actions">
                              <button
                                type="button"
                                className="table-action approve"
                                onClick={() =>
                                  saveEditing(
                                    type.id
                                  )
                                }
                                disabled={
                                  saving
                                }
                              >
                                <Icon
                                  name="check"
                                  size={14}
                                />
                                Save
                              </button>

                              <button
                                type="button"
                                className="table-action neutral"
                                onClick={
                                  cancelEditing
                                }
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <div className="cell-primary">
                              {type.name}
                            </div>
                          </td>

                          <td>
                            <strong>
                              {
                                type.annual_days
                              }
                            </strong>{' '}
                            days
                          </td>

                          <td>
                            <span
                              className={`payment-badge ${
                                type.is_paid
                                  ? 'paid'
                                  : 'unpaid'
                              }`}
                            >
                              {type.is_paid
                                ? 'Paid'
                                : 'Unpaid'}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              type.created_at
                            )}
                          </td>

                          <td className="right">
                            <div className="table-actions">
                              <button
                                type="button"
                                className="icon-action"
                                onClick={() =>
                                  startEditing(
                                    type
                                  )
                                }
                                title="Edit"
                              >
                                <Icon
                                  name="edit"
                                  size={16}
                                />
                              </button>

                              <button
                                type="button"
                                className="icon-action danger"
                                onClick={() =>
                                  deleteType(
                                    type
                                  )
                                }
                                title="Delete"
                              >
                                <Icon
                                  name="delete"
                                  size={16}
                                />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   BALANCES
========================================================= */

function HRBalancesView({
  balances,
  leaveTypes,
}: {
  balances: Balance[];
  leaveTypes: LeaveType[];
}) {
  const [search, setSearch] =
    useState('');

  const filtered =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) return balances;

      return balances.filter(
        (employee) =>
          employee.employeeName
            .toLowerCase()
            .includes(value) ||
          employee.employeeCode
            .toLowerCase()
            .includes(value) ||
          employee.email
            ?.toLowerCase()
            .includes(value) ||
          employee.department
            ?.toLowerCase()
            .includes(value)
      );
    }, [balances, search]);

  return (
    <div className="leave-content">
      <PageTitle
        title="Leave Balances"
        description="Review employee leave entitlement, usage and available balance."
      />

      <div className="leave-filter-card">
        <div className="leave-search">
          <label>Search Employee</label>

          <div className="leave-input-icon">
            <Icon name="search" size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Name, employee code or department..."
            />
          </div>
        </div>

        <div className="balance-type-count">
          <span>Leave Types</span>
          <strong>
            {leaveTypes.length}
          </strong>
        </div>
      </div>

      <div className="leave-panel">
        <div className="leave-panel-header">
          <div>
            <h2>Employee Balances</h2>
            <p>
              {filtered.length} employee
              {filtered.length === 1
                ? ''
                : 's'} displayed.
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="balances"
            title="No employees found"
            description="There are no employee balances matching your search."
          />
        ) : (
          <div className="leave-table-wrap">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>

                  {leaveTypes.map(
                    (type) => (
                      <th key={type.id}>
                        {type.name}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (employee) => (
                    <tr
                      key={
                        employee.employeeId
                      }
                    >
                      <td>
                        <div className="employee-cell">
                          <div className="employee-avatar">
                            {employee.employeeName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {
                                employee.employeeName
                              }
                            </strong>

                            <span>
                              {
                                employee.employeeCode
                              }
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="cell-primary">
                          {
                            employee.department
                          }
                        </div>

                        <div className="cell-secondary">
                          {
                            employee.designation
                          }
                        </div>
                      </td>

                      {leaveTypes.map(
                        (type) => {
                          const balance =
                            employee.balances.find(
                              (item) =>
                                Number(
                                  item.leaveTypeId
                                ) ===
                                Number(
                                  type.id
                                )
                            );

                          return (
                            <td
                              key={
                                type.id
                              }
                            >
                              <div className="balance-cell">
                                <strong>
                                  {balance
                                    ?.available ??
                                    0}
                                </strong>

                                <span>
                                  /{' '}
                                  {balance
                                    ?.allocated ??
                                    type.annual_days}{' '}
                                  available
                                </span>

                                <small>
                                  Used:{' '}
                                  {balance
                                    ?.used ??
                                    0}
                                </small>
                              </div>
                            </td>
                          );
                        }
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   CALENDAR
========================================================= */

function HRCalendarView({
  calendar,
}: {
  calendar: CalendarLeave[];
}) {
  return (
    <div className="leave-content">
      <PageTitle
        title="Leave Calendar"
        description="View approved employee leave across the organization."
      />

      <div className="leave-stat-grid compact">
        <StatCard
          icon="calendar"
          label="Approved Leaves"
          value={calendar.length}
          helper="Calendar entries"
          tone="blue"
        />

        <StatCard
          icon="days"
          label="Leave Days"
          value={calendar.reduce(
            (sum, item) =>
              sum + Number(item.days || 0),
            0
          )}
          helper="Approved days"
          tone="purple"
        />
      </div>

      <div className="leave-panel">
        <div className="leave-panel-header">
          <div>
            <h2>Approved Leave Schedule</h2>
            <p>
              Approved leave periods are shown below.
            </p>
          </div>
        </div>

        {calendar.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No approved leave"
            description="There are no approved leave entries in the calendar."
          />
        ) : (
          <div className="leave-table-wrap">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                </tr>
              </thead>

              <tbody>
                {calendar.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-avatar">
                            {(
                              `${item.first_name ?? ''} ${
                                item.last_name ?? ''
                              }`.trim() ||
                              item.employee_code ||
                              'E'
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {`${item.first_name ?? ''} ${
                                item.last_name ?? ''
                              }`.trim() ||
                                item.employee_code ||
                                'Employee'}
                            </strong>

                            <span>
                              {item.employee_code ||
                                '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {item.leave_type ||
                          '—'}
                      </td>

                      <td>
                        {formatDate(
                          item.start_date
                        )}
                      </td>

                      <td>
                        {formatDate(
                          item.end_date
                        )}
                      </td>

                      <td>
                        <strong>
                          {Number(
                            item.days
                          )}
                        </strong>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   REPORTS
========================================================= */

function HRReportsView({
  reports,
}: {
  reports: Reports;
}) {
  const totalApproved =
    reports.byType.reduce(
      (sum, row) =>
        sum + Number(row.days || 0),
      0
    );

  const totalRequests =
    reports.byStatus.reduce(
      (sum, row) =>
        sum + Number(row.requests || 0),
      0
    );

  return (
    <div className="leave-content">
      <PageTitle
        title="Leave Reports"
        description="Analyze leave activity, request outcomes and usage trends."
      />

      <div className="leave-stat-grid">
        <StatCard
          icon="reports"
          label="Request Records"
          value={totalRequests}
          helper="Across all statuses"
          tone="blue"
        />

        <StatCard
          icon="check"
          label="Approved Days"
          value={totalApproved}
          helper="Approved leave"
          tone="green"
        />

        <StatCard
          icon="types"
          label="Leave Categories"
          value={reports.byType.length}
          helper="Used in approved requests"
          tone="purple"
        />

        <StatCard
          icon="calendar"
          label="Monthly Records"
          value={reports.monthly.length}
          helper="Available months"
          tone="orange"
        />
      </div>

      <div className="report-grid">
        <div className="leave-panel">
          <div className="leave-panel-header">
            <div>
              <h2>Leave by Type</h2>
              <p>
                Approved request and day distribution.
              </p>
            </div>
          </div>

          {reports.byType.length === 0 ? (
            <EmptyState
              icon="types"
              title="No type report data"
              description="Approved leave data will appear here."
            />
          ) : (
            <div className="report-list">
              {reports.byType.map(
                (row, index) => (
                  <div
                    className="report-row"
                    key={`${row.leave_type}-${index}`}
                  >
                    <div>
                      <strong>
                        {row.leave_type ||
                          'Unknown'}
                      </strong>

                      <span>
                        {Number(
                          row.requests || 0
                        )}{' '}
                        request
                        {Number(
                          row.requests || 0
                        ) === 1
                          ? ''
                          : 's'}
                      </span>
                    </div>

                    <strong className="report-value">
                      {Number(
                        row.days || 0
                      )}{' '}
                      days
                    </strong>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="leave-panel">
          <div className="leave-panel-header">
            <div>
              <h2>Leave by Status</h2>
              <p>
                Current request outcomes.
              </p>
            </div>
          </div>

          {reports.byStatus.length === 0 ? (
            <EmptyState
              icon="reports"
              title="No status report data"
              description="Leave request status data will appear here."
            />
          ) : (
            <div className="report-list">
              {reports.byStatus.map(
                (row, index) => (
                  <div
                    className="report-row"
                    key={`${row.status}-${index}`}
                  >
                    <div className="report-status">
                      <StatusBadge
                        status={
                          row.status ||
                          'UNKNOWN'
                        }
                      />

                      <span>
                        {Number(
                          row.days || 0
                        )}{' '}
                        days
                      </span>
                    </div>

                    <strong className="report-value">
                      {Number(
                        row.requests || 0
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="leave-panel">
        <div className="leave-panel-header">
          <div>
            <h2>Monthly Leave Trend</h2>
            <p>
              Approved leave activity by month.
            </p>
          </div>
        </div>

        {reports.monthly.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No monthly data"
            description="Monthly approved leave data will appear here."
          />
        ) : (
          <div className="monthly-report-grid">
            {reports.monthly.map(
              (row, index) => (
                <div
                  className="monthly-card"
                  key={`${row.month}-${index}`}
                >
                  <span>
                    {formatMonth(
                      row.month
                    )}
                  </span>

                  <strong>
                    {Number(
                      row.days || 0
                    )}
                  </strong>

                  <small>
                    {Number(
                      row.requests || 0
                    )}{' '}
                    request
                    {Number(
                      row.requests || 0
                    ) === 1
                      ? ''
                      : 's'}
                  </small>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   POLICIES / HOLIDAYS / ADJUSTMENTS
========================================================= */

function HRPoliciesView({
  policies,
  leaveTypes,
  onRefresh,
  onError,
  onMessage,
}: {
  policies: LeavePolicy[];
  leaveTypes: LeaveType[];
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
  onMessage: (message: string) => void;
}) {
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [policyName, setPolicyName] = useState('');
  const [allocation, setAllocation] = useState('');
  const [accrualFrequency, setAccrualFrequency] = useState('YEARLY');
  const [probationEligible, setProbationEligible] = useState(true);
  const [minimumDays, setMinimumDays] = useState('1');
  const [maximumDays, setMaximumDays] = useState('');
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState('');
  const [advanceNoticeDays, setAdvanceNoticeDays] = useState('0');
  const [allowNegativeBalance, setAllowNegativeBalance] = useState(false);
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [includeHolidays, setIncludeHolidays] = useState(false);
  const [sandwichRule, setSandwichRule] = useState(false);
  const [carryForward, setCarryForward] = useState(false);
  const [carryForwardExpiryMonths, setCarryForwardExpiryMonths] = useState('');
  const [approvalLevels, setApprovalLevels] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setLeaveTypeId('');
    setPolicyName('');
    setAllocation('');
    setAccrualFrequency('YEARLY');
    setProbationEligible(true);
    setMinimumDays('1');
    setMaximumDays('');
    setMaxConsecutiveDays('');
    setAdvanceNoticeDays('0');
    setAllowNegativeBalance(false);
    setIncludeWeekends(false);
    setIncludeHolidays(false);
    setSandwichRule(false);
    setCarryForward(false);
    setCarryForwardExpiryMonths('');
    setApprovalLevels('1');
    setIsActive(true);
  };

  const editPolicy = (policy: LeavePolicy) => {
    setLeaveTypeId(String(policy.leave_type_id));
    setPolicyName(policy.policy_name || '');
    setAllocation(String(policy.allocation ?? ''));
    setAccrualFrequency(policy.accrual_frequency || 'YEARLY');
    setProbationEligible(Boolean(policy.probation_eligible));
    setMinimumDays(String(policy.minimum_days ?? 1));
    setMaximumDays(policy.maximum_days == null ? '' : String(policy.maximum_days));
    setMaxConsecutiveDays(policy.max_consecutive_days == null ? '' : String(policy.max_consecutive_days));
    setAdvanceNoticeDays(String(policy.advance_notice_days ?? 0));
    setAllowNegativeBalance(Boolean(policy.allow_negative_balance));
    setIncludeWeekends(Boolean(policy.include_weekends));
    setIncludeHolidays(Boolean(policy.include_holidays));
    setSandwichRule(Boolean(policy.sandwich_rule));
    setCarryForward(Boolean(policy.carry_forward));
    setCarryForwardExpiryMonths(policy.carry_forward_expiry_months == null ? '' : String(policy.carry_forward_expiry_months));
    setApprovalLevels(String(policy.approval_levels ?? 1));
    setIsActive(Boolean(policy.is_active));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!leaveTypeId) {
      onError('Select a leave type.');
      return;
    }
    try {
      setSaving(true);
      onError('');
      await apiRequest('/leave-management/policies', {
        method: 'POST',
        body: JSON.stringify({
          leaveTypeId: Number(leaveTypeId),
          policyName,
          allocation: Number(allocation || 0),
          accrualFrequency,
          probationEligible,
          minimumDays: Number(minimumDays || 1),
          maximumDays: maximumDays === '' ? null : Number(maximumDays),
          maxConsecutiveDays: maxConsecutiveDays === '' ? null : Number(maxConsecutiveDays),
          advanceNoticeDays: Number(advanceNoticeDays || 0),
          allowNegativeBalance,
          includeWeekends,
          includeHolidays,
          sandwichRule,
          carryForward,
          carryForwardExpiryMonths: carryForwardExpiryMonths === '' ? null : Number(carryForwardExpiryMonths),
          approvalRequired: true,
          approvalLevels: Math.max(1, Number(approvalLevels || 1)),
          isActive,
        }),
      });
      await onRefresh();
      onMessage('Leave policy saved successfully.');
      resetForm();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to save leave policy.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="leave-content">
      <PageTitle title="Leave Policies" description="Manage company-wide leave rules and approval requirements." />
      <div className="leave-panel leave-management-form-panel">
        <div className="leave-panel-header">
          <div><h2>Create or update policy</h2><p>Select a leave type and configure its rules.</p></div>
        </div>
        <form className="leave-management-form" onSubmit={save}>
          <label>Leave Type<select value={leaveTypeId} onChange={e => setLeaveTypeId(e.target.value)}><option value="">Select leave type</option>{leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label>Policy Name<input value={policyName} onChange={e => setPolicyName(e.target.value)} placeholder="Annual Leave Policy" /></label>
          <label>Allocation<input type="number" min="0" step="0.5" value={allocation} onChange={e => setAllocation(e.target.value)} placeholder="15" /></label>
          <label>Accrual Frequency<select value={accrualFrequency} onChange={e => setAccrualFrequency(e.target.value)}><option value="YEARLY">Yearly</option><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option></select></label>
          <label>Minimum Days<input type="number" min="0.5" step="0.5" value={minimumDays} onChange={e => setMinimumDays(e.target.value)} /></label>
          <label>Maximum Days<input type="number" min="0.5" step="0.5" value={maximumDays} onChange={e => setMaximumDays(e.target.value)} placeholder="No limit" /></label>
          <label>Max Consecutive Days<input type="number" min="1" value={maxConsecutiveDays} onChange={e => setMaxConsecutiveDays(e.target.value)} placeholder="No limit" /></label>
          <label>Advance Notice (days)<input type="number" min="0" value={advanceNoticeDays} onChange={e => setAdvanceNoticeDays(e.target.value)} /></label>
          <label>Approval Levels<input type="number" min="1" value={approvalLevels} onChange={e => setApprovalLevels(e.target.value)} /></label>
          <label>Carry-forward expiry (months)<input type="number" min="1" value={carryForwardExpiryMonths} onChange={e => setCarryForwardExpiryMonths(e.target.value)} placeholder="No expiry" /></label>
          <div className="leave-check-grid">
            {[[probationEligible, setProbationEligible, 'Probation eligible'],[allowNegativeBalance,setAllowNegativeBalance,'Allow negative balance'],[includeWeekends,setIncludeWeekends,'Include weekends'],[includeHolidays,setIncludeHolidays,'Include holidays'],[sandwichRule,setSandwichRule,'Sandwich rule'],[carryForward,setCarryForward,'Carry forward'],[isActive,setIsActive,'Active']] .map(([value,setter,label]) => <label className="leave-checkbox" key={label as string}><input type="checkbox" checked={Boolean(value)} onChange={e => (setter as (v:boolean)=>void)(e.target.checked)} /><span>{label as string}</span></label>)}
          </div>
          <div className="form-actions"><button type="button" className="table-action neutral" onClick={resetForm}>Clear</button><button type="submit" className="leave-primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save Policy'}</button></div>
        </form>
      </div>
      <div className="leave-panel">
        <div className="leave-panel-header"><div><h2>Configured Policies</h2><p>{policies.length} policy record{policies.length === 1 ? '' : 's'}.</p></div></div>
        {policies.length === 0 ? <EmptyState icon="policies" title="No policies configured" description="Create the first company leave policy above." /> : <div className="leave-table-wrap"><table className="leave-table"><thead><tr><th>Leave Type</th><th>Policy</th><th>Allocation</th><th>Accrual</th><th>Notice</th><th>Carry-forward</th><th>Approval</th><th>Status</th><th className="right">Action</th></tr></thead><tbody>{policies.map(p => <tr key={p.id}><td>{p.leave_type_name || '—'}</td><td>{p.policy_name}</td><td>{Number(p.allocation)} days</td><td>{p.accrual_frequency}</td><td>{p.advance_notice_days} day(s)</td><td>{p.carry_forward ? `Yes${p.carry_forward_expiry_months ? ` / ${p.carry_forward_expiry_months} mo` : ''}` : 'No'}</td><td>{p.approval_levels} level</td><td><StatusBadge status={p.is_active ? 'ACTIVE' : 'INACTIVE'} /></td><td className="right"><button type="button" className="table-action neutral" onClick={() => editPolicy(p)}><Icon name="edit" size={14} /> Edit</button></td></tr>)}</tbody></table></div>}
      </div>
    </div>
  );
}

function HRHolidaysView({ holidays, onRefresh, onError, onMessage }: { holidays: LeaveHoliday[]; onRefresh: () => Promise<void>; onError: (message:string)=>void; onMessage:(message:string)=>void; }) {
  const [name,setName]=useState('');
  const [date,setDate]=useState('');
  const [type,setType]=useState('COMPANY');
  const [location,setLocation]=useState('');
  const [optional,setOptional]=useState(false);
  const [description,setDescription]=useState('');
  const [active,setActive]=useState(true);
  const [saving,setSaving]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [downloading,setDownloading]=useState(false);
  const [editingId,setEditingId]=useState<number|null>(null);
  const fileInputRef=useRef<HTMLInputElement|null>(null);
  const formPanelRef=useRef<HTMLDivElement|null>(null);

  const reset=()=>{
    setName('');setDate('');setType('COMPANY');setLocation('');setOptional(false);setDescription('');setActive(true);setEditingId(null);
  };

  const edit=(h:LeaveHoliday)=>{
    setEditingId(h.id);
    setName(h.name);
    setDate(h.holiday_date.slice(0,10));
    setType(h.holiday_type);
    setLocation(h.location||'');
    setOptional(h.is_optional);
    setDescription(h.description||'');
    setActive(h.is_active !== false);
    window.requestAnimationFrame(()=>{
      formPanelRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  };



  const save=async(e:FormEvent)=>{
    e.preventDefault();
    if(!name.trim()||!date){onError('Holiday name and date are required.');return;}
    try{
      setSaving(true);onError('');
      await apiRequest(editingId?`/leave-management/holidays/${editingId}`:'/leave-management/holidays',{
        method:editingId?'PATCH':'POST',
        body:JSON.stringify({name:name.trim(),holidayDate:date,holidayType:type,location:location.trim(),isOptional:optional,description:description.trim(),isActive:active})
      });
      await onRefresh();
      onMessage(editingId?'Holiday updated successfully.':'Holiday added successfully.');
      reset();
    }catch(err){onError(err instanceof Error?err.message:'Unable to save holiday.');}
    finally{setSaving(false);}
  };

  const downloadExcel=async()=>{
    try{
      setDownloading(true);onError('');
      const response=await fetch(`${API}/leave-management/holidays/export`,{
        headers:apiHeaders(),
      });
      if(!response.ok){
        let message=`Download failed with status ${response.status}`;
        try{const data=await response.json();message=data?.message||message;}catch{}
        throw new Error(message);
      }
      const blob=await response.blob();
      const url=URL.createObjectURL(blob);
      const anchor=document.createElement('a');
      anchor.href=url;
      anchor.download='company-holidays.xlsx';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      onMessage('Company holiday Excel downloaded successfully.');
    }catch(err){onError(err instanceof Error?err.message:'Unable to download holidays.');}
    finally{setDownloading(false);}
  };

  const uploadExcel=async(file:File)=>{
    if(!/\.(xlsx|xls)$/i.test(file.name)){
      onError('Please upload an Excel file (.xlsx or .xls).');
      return;
    }

    try{
      setUploading(true);onError('');
      const buffer=await file.arrayBuffer();
      const bytes=new Uint8Array(buffer);
      let binary='';
      const chunkSize=0x8000;
      for(let i=0;i<bytes.length;i+=chunkSize){
        binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunkSize,bytes.length)));
      }
      const fileBase64=btoa(binary);
      const result=await apiRequest<{
        message:string;
        importedCount:number;
        skippedCount:number;
        errorCount:number;
        errors:string[];
      }>('/leave-management/holidays/import',{
        method:'POST',
        body:JSON.stringify({fileBase64}),
      });
      await onRefresh();
      const detail=[
        `${result.importedCount} imported`,
        `${result.skippedCount} already existed`,
        `${result.errorCount} invalid`,
      ].join(' · ');
      onMessage(`${result.message} ${detail}`);
      if(result.errorCount>0){
        onError(`Some rows were not imported: ${result.errors.slice(0,3).join(' | ')}`);
      }
    }catch(err){onError(err instanceof Error?err.message:'Unable to upload holiday Excel.');}
    finally{
      setUploading(false);
      if(fileInputRef.current)fileInputRef.current.value='';
    }
  };

  const chooseFile=()=>fileInputRef.current?.click();

  return <div className="leave-content">
    <PageTitle title="Company Holidays" description="Maintain company, regional and optional holidays used by leave calculations and the calendar." />

    <div className="leave-panel">
      <div className="leave-panel-header">
        <div>
          <h2>Holiday Calendar Import & Export</h2>
          <p>Upload your company holiday Excel file or download the current holiday calendar.</p>
        </div>
        <div className="form-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{display:'none'}}
            onChange={e=>{const file=e.target.files?.[0];if(file)void uploadExcel(file);}}
          />
          <button type="button" className="table-action neutral" onClick={chooseFile} disabled={uploading}>
            {uploading?'Uploading...':'↑ Upload Excel'}
          </button>
          <button type="button" className="leave-primary-button" onClick={downloadExcel} disabled={downloading}>
            {downloading?'Preparing...':'↓ Download Excel'}
          </button>
        </div>
      </div>
      <div style={{padding:'0 24px 22px',color:'#64748b',fontSize:13}}>
        Excel columns: <strong>Holiday Name</strong>, <strong>Date</strong>, <strong>Holiday Type</strong>, <strong>Location / Region</strong>, <strong>Optional Holiday</strong>, <strong>Description</strong>, <strong>Active</strong>.
        Uploaded rows are saved directly to the company holiday calendar. Duplicate name + date rows are skipped.
      </div>
    </div>

    <div ref={formPanelRef} className="leave-panel leave-management-form-panel">
      <div className="leave-panel-header"><div><h2>{editingId?'Edit Holiday':'Add Holiday'}</h2><p>{editingId?'Update or delete this individual holiday record.':'Holiday records are stored centrally for HR and leave planning.'}</p></div></div>
      <form className="leave-management-form" onSubmit={save}>
        <label>Holiday Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Independence Day" /></label>
        <label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>
        <label>Holiday Type<select value={type} onChange={e=>setType(e.target.value)}><option value="COMPANY">Company</option><option value="PUBLIC">Public</option><option value="REGIONAL">Regional</option><option value="OPTIONAL">Optional</option></select></label>
        <label>Location / Region<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="All locations / Hyderabad" /></label>
        <label className="span-two">Description<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Holiday details" /></label>
        <label className="leave-checkbox"><input type="checkbox" checked={optional} onChange={e=>setOptional(e.target.checked)} /><span>Optional holiday</span></label>
        <label>Holiday Status<select value={active ? 'ACTIVE' : 'INACTIVE'} onChange={e=>setActive(e.target.value === 'ACTIVE')}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
        <div className="form-actions">
          <button type="button" className="table-action neutral" onClick={reset}>Cancel</button>
          {editingId && (
            <button
              type="button"
              className="table-action danger"
              onClick={async ()=>{
                const holiday = holidays.find(h => h.id === editingId);
                if (!holiday?.id) return;

                const confirmed = window.confirm(
                  `Delete "${holiday.name}"? This holiday will be permanently removed.`
                );
                if (!confirmed) return;

                try {
                  setSaving(true);
                  onError('');
                  await apiRequest(`/leave-management/holidays/${holiday.id}`, {
                    method: 'DELETE',
                  });
                  await onRefresh();
                  reset();
                  onMessage('Holiday deleted successfully.');
                } catch (err) {
                  onError(
                    err instanceof Error
                      ? err.message
                      : 'Unable to delete holiday.'
                  );
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              <Icon name="delete" size={14}/> Delete Holiday
            </button>
          )}
          <button type="submit" className="leave-primary-button" disabled={saving}>
            {saving?'Saving...':editingId?'Update Holiday':'Add Holiday'}
          </button>
        </div>
      </form>
    </div>

    <div className="leave-panel">
      <div className="leave-panel-header"><div><h2>Holiday Calendar</h2><p>{holidays.length} holiday record{holidays.length===1?'':'s'}.</p></div></div>
      {holidays.length===0?<EmptyState icon="holidays" title="No holidays configured" description="Add a holiday manually or upload the company Excel calendar above."/>:<div className="leave-table-wrap"><table className="leave-table"><thead><tr><th>Holiday</th><th>Date</th><th>Type</th><th>Location</th><th>Optional</th><th>Status</th><th className="right">Action</th></tr></thead><tbody>{holidays.map(h=><tr key={h.id}><td><div className="cell-primary">{h.name}</div>{h.description&&<div className="cell-secondary">{h.description}</div>}</td><td>{formatDate(h.holiday_date)}</td><td>{h.holiday_type}</td><td>{h.location||'All locations'}</td><td>{h.is_optional?'Yes':'No'}</td><td><StatusBadge status={h.is_active?'ACTIVE':'INACTIVE'}/></td><td className="right"><button type="button" className="table-action neutral" onClick={()=>edit(h)}><Icon name="edit" size={14}/> Edit</button></td></tr>)}</tbody></table></div>}
    </div>
  </div>;
}

function HRAdjustmentsView({ adjustments, balances, leaveTypes, onRefresh, onError, onMessage }: { adjustments: LeaveAdjustment[]; balances: Balance[]; leaveTypes: LeaveType[]; onRefresh:()=>Promise<void>; onError:(message:string)=>void; onMessage:(message:string)=>void; }) {
  const [employeeId,setEmployeeId]=useState(''); const [leaveTypeId,setLeaveTypeId]=useState(''); const [amount,setAmount]=useState(''); const [adjustmentType,setAdjustmentType]=useState('CREDIT'); const [reason,setReason]=useState(''); const [saving,setSaving]=useState(false);
  const employees=useMemo(()=>balances.map(b=>({id:b.employeeId,code:b.employeeCode,name:b.employeeName})).filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i),[balances]);
  const save=async(e:FormEvent)=>{e.preventDefault();const value=Number(amount);if(!employeeId||!leaveTypeId||!Number.isFinite(value)||value<=0||!reason.trim()){onError('Employee, leave type, positive days and reason are required.');return;}try{setSaving(true);onError('');await apiRequest('/leave-management/adjustments',{method:'POST',body:JSON.stringify({employeeId:Number(employeeId),leaveTypeId:Number(leaveTypeId),amount:adjustmentType==='DEBIT'?-value:value,adjustmentType,reason:reason.trim()})});await onRefresh();onMessage('Leave balance adjustment saved successfully.');setAmount('');setReason('');}catch(err){onError(err instanceof Error?err.message:'Unable to save adjustment.');}finally{setSaving(false);}};
  return <div className="leave-content"><PageTitle title="Leave Adjustments" description="Correct or manually credit employee leave balances with a complete HR audit trail."/><div className="leave-panel leave-management-form-panel"><div className="leave-panel-header"><div><h2>New balance adjustment</h2><p>Credits add days; debits deduct days from the employee's balance.</p></div></div><form className="leave-management-form" onSubmit={save}><label>Employee<select value={employeeId} onChange={e=>setEmployeeId(e.target.value)}><option value="">Select employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name} — {e.code}</option>)}</select></label><label>Leave Type<select value={leaveTypeId} onChange={e=>setLeaveTypeId(e.target.value)}><option value="">Select leave type</option>{leaveTypes.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Adjustment Type<select value={adjustmentType} onChange={e=>setAdjustmentType(e.target.value)}><option value="CREDIT">Credit / Add</option><option value="DEBIT">Debit / Deduct</option><option value="CORRECTION">Correction</option><option value="CARRY_FORWARD">Carry Forward</option></select></label><label>Days<input type="number" min="0.5" step="0.5" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="1" /></label><label className="span-two">Reason<input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Annual entitlement correction" /></label><div className="form-actions"><button type="submit" className="leave-primary-button" disabled={saving}>{saving?'Saving...':'Apply Adjustment'}</button></div></form></div><div className="leave-panel"><div className="leave-panel-header"><div><h2>Adjustment History</h2><p>{adjustments.length} adjustment record{adjustments.length===1?'':'s'}.</p></div></div>{adjustments.length===0?<EmptyState icon="adjustments" title="No adjustments yet" description="Manual leave balance changes will appear here."/>:<div className="leave-table-wrap"><table className="leave-table"><thead><tr><th>Employee</th><th>Leave Type</th><th>Change</th><th>Type</th><th>Reason</th><th>Created By</th><th>Date</th></tr></thead><tbody>{adjustments.map(a=><tr key={a.id}><td><div className="cell-primary">{a.employee_name||a.employee_code||`Employee #${a.employee_id}`}</div><div className="cell-secondary">{a.employee_code||'—'}</div></td><td>{a.leave_type_name||'—'}</td><td><strong>{Number(a.amount)>0?'+':''}{Number(a.amount)}</strong> days</td><td>{a.adjustment_type}</td><td>{a.reason}</td><td>{a.created_by_name||'—'}</td><td>{formatDate(a.created_at)}</td></tr>)}</tbody></table></div>}</div></div>;
}

function ApprovalDetailsModal({ data, loading, onClose }: { data: ApprovalHistoryResponse; loading: boolean; onClose:()=>void; }) {
  return <div className="leave-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="leave-modal" role="dialog" aria-modal="true" aria-label="Approval details"><div className="leave-modal-header"><div><h2>Approval Details</h2><p>Complete approval and audit history for this leave request.</p></div><button type="button" className="leave-modal-close" onClick={onClose}><Icon name="close" size={18}/></button></div><div className="leave-modal-summary"><div><span>Employee</span><strong>{employeeName(data.request)}</strong></div><div><span>Leave Type</span><strong>{data.request.leave_type||'—'}</strong></div><div><span>Period</span><strong>{formatDate(data.request.start_date)} – {formatDate(data.request.end_date)}</strong></div><div><span>Days</span><strong>{Number(data.request.days)}</strong></div><div><span>Status</span><StatusBadge status={data.request.status}/></div><div><span>Applied</span><strong>{formatDate(data.request.created_at)}</strong></div></div><div className="approval-timeline"><h3>Approval History</h3>{loading?<div className="leave-loading compact"><div className="leave-spinner"/>Loading history...</div>:data.history.length===0?<div className="empty-inline">No approval action has been recorded yet.</div>:data.history.map((h,i)=><div className="approval-timeline-item" key={h.id}><div className="approval-timeline-dot"><Icon name={h.new_status==='APPROVED'?'check':h.new_status==='REJECTED'?'close':'clock'} size={14}/></div><div className="approval-timeline-content"><div className="timeline-top"><strong>{h.new_status}</strong><span>{formatDate(h.acted_at)} · {new Date(h.acted_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span></div><div className="cell-secondary">Action by: {h.actor_name||'User #'+(h.acted_by??'—')}</div>{h.comments&&<p>{h.comments}</p>}{h.rejection_reason&&<p><strong>Rejection reason:</strong> {h.rejection_reason}</p>}</div></div>)}</div><div className="approval-timeline"><h3>Approval Steps</h3>{data.approvalSteps.length===0?<div className="empty-inline">No separate approval steps were configured.</div>:data.approvalSteps.map(step=><div className="approval-step-row" key={step.id}><div><strong>Level {step.level}</strong><span>{step.approver_type}{step.approver_name?` · ${step.approver_name}`:''}</span></div><StatusBadge status={step.status}/><div className="cell-secondary">{step.acted_at?`${formatDate(step.acted_at)} · ${new Date(step.acted_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`:'Awaiting action'}</div></div>)}</div></div></div>;
}

function HRComingSoonView({
  icon,
  title,
  description,
  items,
}: {
  icon: IconName;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="leave-content">
      <PageTitle
        title={title}
        description={description}
      />

      <div className="leave-feature-card">
        <div className="leave-feature-icon">
          <Icon name={icon} size={28} />
        </div>

        <div className="leave-feature-content">
          <h2>{title}</h2>

          <p>
            This section is prepared in the Leave
            Management interface. Persistent
            company-wide management for this area
            requires the corresponding database and
            backend endpoints.
          </p>

          <div className="feature-list">
            {items.map((item) => (
              <div
                className="feature-list-item"
                key={item}
              >
                <span>
                  <Icon
                    name="check"
                    size={14}
                  />
                </span>

                {item}
              </div>
            ))}
          </div>

          <div className="feature-note">
            <Icon
              name="clock"
              size={16}
            />
            Backend/database support will be added
            before these records are treated as
            company-wide persistent data.
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EMPLOYEE LEAVE PAGE
========================================================= */

function EmployeeLeavePage() {
  const [leaveTypes, setLeaveTypes] =
    useState<LeaveType[]>([]);

  const [balances, setBalances] =
    useState<MyLeaveBalance[]>([]);

  const [requests, setRequests] =
    useState<LeaveRequest[]>([]);

  const [selectedType, setSelectedType] =
    useState('');

  const [startDate, setStartDate] =
    useState('');

  const [endDate, setEndDate] =
    useState('');

  const [reason, setReason] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        types,
        myBalances,
        myRequests,
      ] = await Promise.all([
        apiRequest<LeaveType[]>(
          '/leave/types'
        ),
        apiRequest<MyLeaveBalance[]>(
          '/leave/me/balances'
        ),
        apiRequest<LeaveRequest[]>(
          '/leave/me'
        ),
      ]);

      setLeaveTypes(
        Array.isArray(types)
          ? types
          : []
      );

      setBalances(
        Array.isArray(myBalances)
          ? myBalances
          : []
      );

      setRequests(
        Array.isArray(myRequests)
          ? myRequests
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load leave data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token =
      localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    loadData();
  }, []);

  const calculatedDays =
    startDate && endDate
      ? calculateDays(
          startDate,
          endDate
        )
      : 0;

  const applyLeave = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setMessage('');

      if (!selectedType) {
        throw new Error(
          'Please select a leave type.'
        );
      }

      if (!startDate || !endDate) {
        throw new Error(
          'Please select the start and end dates.'
        );
      }

      const days =
        calculateDays(
          startDate,
          endDate
        );

      if (days <= 0) {
        throw new Error(
          'End date cannot be before start date.'
        );
      }

      await apiRequest(
        '/leave',
        {
          method: 'POST',
          body: JSON.stringify({
            leaveTypeId:
              Number(
                selectedType
              ),
            startDate,
            endDate,
            days,
            reason,
          }),
        }
      );

      setSelectedType('');
      setStartDate('');
      setEndDate('');
      setReason('');

      await loadData();

      setMessage(
        'Leave request submitted successfully.'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit leave request.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <HRMSLayout title="Leave">
        <div className="leave-loading">
          <div className="leave-spinner" />
          Loading Leave...
        </div>
      </HRMSLayout>
    );
  }

  const pendingCount =
    requests.filter(
      (item) =>
        item.status === 'PENDING'
    ).length;

  const approvedCount =
    requests.filter(
      (item) =>
        item.status === 'APPROVED'
    ).length;

  const approvedDays =
    requests
      .filter(
        (item) =>
          item.status === 'APPROVED'
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.days || 0),
        0
      );

  return (
    <HRMSLayout title="Leave">
      <div className="leave-page">
        <PageTitle
          title="Leave"
          description="Manage your leave requests and view your leave history."
        />

        {error && (
          <div className="leave-alert error">
            <div>
              <strong>Something went wrong</strong>
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() => setError('')}
            >
              <Icon
                name="close"
                size={16}
              />
            </button>
          </div>
        )}

        {message && (
          <div className="leave-alert success">
            <div>
              <strong>Success</strong>
              <span>{message}</span>
            </div>

            <button
              type="button"
              onClick={() =>
                setMessage('')
              }
            >
              <Icon
                name="close"
                size={16}
              />
            </button>
          </div>
        )}

        <div className="leave-stat-grid">
          <StatCard
            icon="requests"
            label="My Requests"
            value={requests.length}
            helper="Total requests"
            tone="blue"
          />

          <StatCard
            icon="clock"
            label="Pending"
            value={pendingCount}
            helper="Awaiting approval"
            tone="orange"
          />

          <StatCard
            icon="check"
            label="Approved"
            value={approvedCount}
            helper="Approved requests"
            tone="green"
          />

          <StatCard
            icon="days"
            label="Approved Days"
            value={approvedDays}
            helper="Total approved days"
            tone="purple"
          />
        </div>


        <div className="employee-leave-grid">
          <div className="leave-panel">
            <div className="leave-panel-header">
              <div>
                <h2>Apply for Leave</h2>
                <p>
                  Submit a new leave request.
                </p>
              </div>
            </div>

            <form
              className="employee-leave-form"
              onSubmit={applyLeave}
            >
              <div className="field">
                <label>Leave Type</label>

                <select
                  value={selectedType}
                  onChange={(event) =>
                    setSelectedType(
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select leave type
                  </option>

                  {leaveTypes.map(
                    (type) => (
                      <option
                        value={type.id}
                        key={type.id}
                      >
                        {type.name} —{' '}
                        {type.annual_days}{' '}
                        days
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-two-column">
                <div className="field">
                  <label>Start Date</label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(
                      event
                    ) =>
                      setStartDate(
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="field">
                  <label>End Date</label>

                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(
                      event
                    ) =>
                      setEndDate(
                        event.target.value
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>Reason</label>

                <textarea
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value
                    )
                  }
                  placeholder="Enter the reason for your leave..."
                  rows={4}
                />
              </div>

              {calculatedDays > 0 && (
                <div className="leave-duration-box">
                  <div>
                    <Icon
                      name="calendar"
                      size={18}
                    />
                  </div>

                  <div>
                    <span>Leave Duration</span>
                    <strong>
                      {calculatedDays}{' '}
                      day
                      {calculatedDays ===
                      1
                        ? ''
                        : 's'}
                    </strong>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="leave-primary-button full"
                disabled={saving}
              >
                <Icon
                  name="plus"
                  size={17}
                />
                {saving
                  ? 'Submitting...'
                  : 'Submit Leave Request'}
              </button>
            </form>
          </div>

          <div className="leave-panel employee-balance-panel">
            <div className="leave-panel-header">
              <div>
                <h2>My Leave Balances</h2>
                <p>
                  Your current available leave after approved, pending and HR adjustments.
                </p>
              </div>
            </div>

            {balances.length === 0 ? (
              <EmptyState
                icon="balances"
                title="No leave balances"
                description="No leave balance information is available yet."
              />
            ) : (
              <div className="leave-table-wrap employee-balance-table-wrap">
                <table className="leave-table">
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Allocated</th>
                      <th>Used</th>
                      <th>Pending</th>
                      <th>HR Adjustment</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((balance) => (
                      <tr key={balance.leaveTypeId}>
                        <td>
                          <div className="cell-primary">
                            {balance.leaveType}
                          </div>
                        </td>
                        <td>{balance.allocated}</td>
                        <td>{balance.used}</td>
                        <td>{balance.pending}</td>
                        <td>
                          <strong>
                            {balance.adjustments > 0 ? '+' : ''}
                            {balance.adjustments}
                          </strong>
                        </td>
                        <td>
                          <strong>{balance.available}</strong> days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="leave-panel">
          <div className="leave-panel-header">
            <div>
              <h2>My Leave Requests</h2>
              <p>
                Track your submitted leave requests.
              </p>
            </div>
          </div>

          {requests.length === 0 ? (
            <EmptyState
              icon="requests"
              title="No leave requests"
              description="Your submitted leave requests will appear here."
            />
          ) : (
            <div className="leave-table-wrap">
              <table className="leave-table">
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map(
                    (request) => (
                      <tr
                        key={
                          request.id
                        }
                      >
                        <td>
                          <strong>
                            {request.leave_type ||
                              '—'}
                          </strong>
                        </td>

                        <td>
                          {formatDate(
                            request.start_date
                          )}
                        </td>

                        <td>
                          {formatDate(
                            request.end_date
                          )}
                        </td>

                        <td>
                          <strong>
                            {Number(
                              request.days
                            )}
                          </strong>
                        </td>

                        <td>
                          <div className="reason-cell">
                            {request.reason ||
                              '—'}
                          </div>
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              request.status
                            }
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </HRMSLayout>
  );
}

/* =========================================================
   SHARED COMPONENTS
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toUpperCase();

  return (
    <span
      className={`status-badge ${getStatusClass(
        normalized
      )}`}
    >
      <span className="status-dot" />
      {normalized}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <div className="leave-empty">
      <div className="leave-empty-icon">
        <Icon name={icon} size={24} />
      </div>

      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function calculateDays(
  start: string,
  end: string
) {
  const startDate =
    new Date(
      `${start}T00:00:00`
    );

  const endDate =
    new Date(
      `${end}T00:00:00`
    );

  if (
    Number.isNaN(
      startDate.getTime()
    ) ||
    Number.isNaN(
      endDate.getTime()
    )
  ) {
    return 0;
  }

  if (endDate < startDate) {
    return 0;
  }

  const difference =
    endDate.getTime() -
    startDate.getTime();

  return (
    Math.floor(
      difference /
        (1000 *
          60 *
          60 *
          24)
    ) + 1
  );
}

/* =========================================================
   STYLES
   Designed to match the existing Employees module:
   clean, professional, light background, white cards,
   blue actions and consistent spacing.
========================================================= */

const styles = `
  .leave-page {
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    padding: 30px 0 60px;
    color: #10213f;
  }

  .leave-page-title {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 28px;
  }

  .leave-page-title h1 {
    margin: 0;
    color: #10213f;
    font-size: 32px;
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: -0.6px;
  }

  .leave-page-title p {
    margin: 8px 0 0;
    color: #70809b;
    font-size: 16px;
    line-height: 1.5;
  }

  .leave-page-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .leave-primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 0 18px;
    border: 1px solid #2864e8;
    border-radius: 10px;
    background: #2864e8;
    color: #fff;
    font-size: 14px;
    font-weight: 650;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .leave-primary-button:hover {
    background: #1f57d4;
    border-color: #1f57d4;
    transform: translateY(-1px);
  }

  .leave-primary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .leave-primary-button.full {
    width: 100%;
  }

  .leave-section-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 26px;
  }

  .leave-nav-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 15px;
    border: 1px solid #e1e7f1;
    border-radius: 10px;
    background: #fff;
    color: #344563;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
    box-shadow: 0 1px 2px rgba(16, 33, 63, 0.02);
  }

  .leave-nav-button:hover {
    border-color: #c9d8f8;
    background: #f7f9ff;
    color: #225bd2;
  }

  .leave-nav-button.active {
    background: #edf3ff;
    border-color: #d9e5ff;
    color: #215ed9;
  }

  .leave-content {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .leave-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
  }

  .leave-stat-grid.compact {
    margin-bottom: 2px;
  }

  .leave-stat-card {
    min-height: 136px;
    display: flex;
    align-items: center;
    gap: 17px;
    padding: 22px;
    border: 1px solid #e1e7f0;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 3px 12px rgba(16, 33, 63, 0.035);
  }

  .leave-stat-icon {
    width: 54px;
    height: 54px;
    flex: 0 0 54px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
  }

  .leave-stat-icon.blue {
    background: #edf4ff;
    color: #2864e8;
  }

  .leave-stat-icon.green {
    background: #eafaf4;
    color: #15956a;
  }

  .leave-stat-icon.orange {
    background: #fff5e8;
    color: #e28a19;
  }

  .leave-stat-icon.purple {
    background: #f1efff;
    color: #7056d9;
  }

  .leave-stat-content {
    min-width: 0;
  }

  .leave-stat-label {
    color: #557092;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 5px;
  }

  .leave-stat-value {
    color: #0d2142;
    font-size: 28px;
    line-height: 1.15;
    font-weight: 700;
  }

  .leave-stat-helper {
    margin-top: 5px;
    color: #8a97ab;
    font-size: 12px;
  }

  .leave-secondary-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    overflow: hidden;
    background: #fff;
  }

  .leave-mini-stat {
    min-height: 78px;
    padding: 16px 20px;
    border-right: 1px solid #e7ebf2;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .leave-mini-stat:last-child {
    border-right: 0;
  }

  .leave-mini-stat span {
    color: #74839b;
    font-size: 12px;
    margin-bottom: 4px;
  }

  .leave-mini-stat strong {
    color: #13284a;
    font-size: 20px;
  }

  .leave-panel,
  .leave-create-card,
  .leave-filter-card,
  .leave-feature-card {
    border: 1px solid #e1e7f0;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 3px 12px rgba(16, 33, 63, 0.03);
  }

  .leave-panel {
    overflow: hidden;
  }

  .leave-panel-header {
    min-height: 82px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    border-bottom: 1px solid #e9edf3;
  }

  .leave-panel-header h2 {
    margin: 0;
    color: #122746;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.2px;
  }

  .leave-panel-header p {
    margin: 5px 0 0;
    color: #7a899f;
    font-size: 13px;
  }

  .leave-text-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 12px;
    border: 0;
    background: transparent;
    color: #2864e8;
    font-size: 13px;
    font-weight: 650;
    cursor: pointer;
  }

  .leave-text-button:hover {
    text-decoration: underline;
  }

  .leave-filter-card {
    padding: 20px 22px;
    display: flex;
    align-items: flex-end;
    gap: 24px;
  }

  .leave-search {
    width: min(560px, 100%);
  }

  .leave-search label,
  .field label {
    display: block;
    margin-bottom: 8px;
    color: #344c70;
    font-size: 13px;
    font-weight: 650;
  }

  .leave-input-icon {
    height: 46px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 13px;
    border: 1px solid #d7e0ed;
    border-radius: 9px;
    background: #fff;
    color: #8290a5;
  }

  .leave-input-icon:focus-within {
    border-color: #7ea2ed;
    box-shadow: 0 0 0 3px rgba(40, 100, 232, 0.08);
  }

  .leave-input-icon input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: #172d50;
    font-size: 14px;
  }

  .leave-input-icon input::placeholder {
    color: #9aa6b8;
  }

  .balance-type-count {
    min-width: 140px;
    margin-left: auto;
    padding: 11px 16px;
    border-radius: 10px;
    background: #f6f8fc;
    display: flex;
    flex-direction: column;
  }

  .balance-type-count span {
    color: #7a899f;
    font-size: 12px;
  }

  .balance-type-count strong {
    margin-top: 2px;
    color: #173056;
    font-size: 19px;
  }

  .leave-table-wrap {
    width: 100%;
    overflow-x: auto;
  }

  .leave-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
  }

  .leave-table th {
    padding: 14px 20px;
    border-bottom: 1px solid #e7ebf1;
    background: #fafbfd;
    color: #60728f;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .leave-table td {
    padding: 16px 20px;
    border-bottom: 1px solid #edf0f4;
    color: #334967;
    font-size: 13px;
    vertical-align: middle;
  }

  .leave-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .leave-table tbody tr:hover {
    background: #fbfcfe;
  }

  .leave-table th.right,
  .leave-table td.right {
    text-align: right;
  }

  .employee-cell {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 180px;
  }

  .employee-avatar {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #e9f1ff;
    color: #255fdb;
    font-size: 14px;
    font-weight: 700;
  }

  .employee-avatar.large {
    width: 46px;
    height: 46px;
    flex-basis: 46px;
    font-size: 16px;
  }

  .employee-cell > div:last-child {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .employee-cell strong {
    color: #172d50;
    font-size: 13px;
    font-weight: 650;
  }

  .employee-cell span {
    margin-top: 3px;
    color: #8a97aa;
    font-size: 11px;
  }

  .cell-primary {
    color: #263e60;
    font-weight: 600;
  }

  .cell-secondary {
    margin-top: 3px;
    color: #8a97aa;
    font-size: 11px;
  }

  .reason-cell {
    max-width: 220px;
    color: #64758f;
    line-height: 1.45;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding: 0 9px;
    border-radius: 7px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .status-badge.pending {
    background: #fff5e6;
    color: #c97a10;
  }

  .status-badge.approved {
    background: #eaf8f1;
    color: #15865f;
  }

  .status-badge.rejected {
    background: #fff0f0;
    color: #cf4444;
  }

  .status-badge.cancelled {
    background: #f0f2f5;
    color: #707b8d;
  }

  .status-badge.unknown {
    background: #f0f3f7;
    color: #69788e;
  }

  .table-actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 7px;
  }

  .table-action {
    min-height: 31px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0 9px;
    border: 1px solid #dce3ec;
    border-radius: 7px;
    background: #fff;
    color: #536680;
    font-size: 11px;
    font-weight: 650;
    cursor: pointer;
  }

  .table-action:hover {
    background: #f8fafc;
  }

  .table-action.approve {
    border-color: #c9eadb;
    background: #f0fbf6;
    color: #16845d;
  }

  .table-action.reject {
    border-color: #f0cccc;
    background: #fff7f7;
    color: #c64b4b;
  }

  .table-action.neutral {
    background: #f6f8fb;
    color: #5f6e84;
  }

  .icon-action {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e0e5ed;
    border-radius: 8px;
    background: #fff;
    color: #55708f;
    cursor: pointer;
  }

  .icon-action:hover {
    background: #f4f7fc;
    color: #2864e8;
  }

  .icon-action.danger:hover {
    color: #d34848;
    border-color: #efcece;
    background: #fff8f8;
  }

  .muted-action {
    color: #98a3b3;
    font-size: 11px;
  }

  .leave-empty {
    min-height: 250px;
    padding: 35px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .leave-empty-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: #edf4ff;
    color: #2864e8;
  }

  .leave-empty h3 {
    margin: 0;
    color: #243b5e;
    font-size: 16px;
  }

  .leave-empty p {
    max-width: 420px;
    margin: 7px 0 0;
    color: #8a97aa;
    font-size: 13px;
    line-height: 1.5;
  }

  .leave-alert {
    min-height: 52px;
    padding: 11px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    border-radius: 10px;
    font-size: 13px;
  }

  .leave-alert > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .leave-alert strong {
    font-size: 13px;
  }

  .leave-alert span {
    font-size: 12px;
  }

  .leave-alert button {
    width: 30px;
    height: 30px;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  .leave-alert.error {
    border: 1px solid #f1cccc;
    background: #fff7f7;
    color: #a83d3d;
  }

  .leave-alert.success {
    border: 1px solid #c9e9da;
    background: #f3fbf7;
    color: #187652;
  }

  .approval-summary {
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    border: 1px solid #dce6f7;
    border-radius: 12px;
    background: #f7faff;
  }

  .approval-summary-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: #eaf2ff;
    color: #2864e8;
  }

  .approval-summary div:last-child {
    display: flex;
    flex-direction: column;
  }

  .approval-summary strong {
    color: #20385d;
    font-size: 14px;
  }

  .approval-summary span {
    margin-top: 4px;
    color: #7788a2;
    font-size: 12px;
  }

  .approval-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  .approval-card {
    padding: 22px;
    border: 1px solid #e1e7f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 3px 12px rgba(16, 33, 63, 0.03);
  }

  .approval-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    padding-bottom: 18px;
    border-bottom: 1px solid #edf0f4;
  }

  .approval-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 19px 0;
  }

  .approval-details div {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .approval-details span,
  .approval-reason > span {
    color: #8995a7;
    font-size: 11px;
  }

  .approval-details strong {
    color: #263e60;
    font-size: 13px;
  }

  .approval-reason {
    padding: 15px;
    border-radius: 9px;
    background: #f8fafc;
  }

  .approval-reason p {
    margin: 6px 0 0;
    color: #60718c;
    font-size: 12px;
    line-height: 1.5;
  }

  .approval-actions {
    display: flex;
    gap: 9px;
    margin-top: 18px;
  }

  .leave-approve-button,
  .leave-reject-button {
    flex: 1;
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 650;
    cursor: pointer;
  }

  .leave-approve-button {
    border: 1px solid #bfe5d4;
    background: #effaf5;
    color: #14835b;
  }

  .leave-reject-button {
    border: 1px solid #efcccc;
    background: #fff6f6;
    color: #c74646;
  }

  .leave-create-card {
    padding: 22px;
  }

  .leave-create-header {
    display: flex;
    align-items: center;
    gap: 13px;
    margin-bottom: 21px;
  }

  .leave-create-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 11px;
    background: #edf4ff;
    color: #2864e8;
  }

  .leave-create-header h2 {
    margin: 0;
    color: #233a5c;
    font-size: 17px;
  }

  .leave-create-header p {
    margin: 4px 0 0;
    color: #8794a8;
    font-size: 12px;
  }

  .leave-create-form {
    display: grid;
    grid-template-columns: 1.4fr 0.7fr auto auto;
    align-items: end;
    gap: 16px;
  }

  .field input,
  .field select,
  .field textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #d7e0ed;
    border-radius: 9px;
    background: #fff;
    color: #233a5c;
    outline: none;
    font-family: inherit;
    font-size: 14px;
  }

  .field input,
  .field select {
    height: 46px;
    padding: 0 12px;
  }

  .field textarea {
    padding: 12px;
    resize: vertical;
  }

  .field input:focus,
  .field select:focus,
  .field textarea:focus {
    border-color: #7ea2ed;
    box-shadow: 0 0 0 3px rgba(40, 100, 232, 0.08);
  }

  .paid-checkbox {
    height: 46px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #536780;
    font-size: 13px;
    white-space: nowrap;
  }

  .paid-checkbox input,
  .inline-checkbox input {
    width: 16px;
    height: 16px;
    accent-color: #2864e8;
  }

  .inline-checkbox {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #60718b;
    font-size: 12px;
  }

  .payment-badge {
    display: inline-flex;
    align-items: center;
    min-height: 25px;
    padding: 0 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 650;
  }

  .payment-badge.paid {
    background: #eaf8f2;
    color: #16815d;
  }

  .payment-badge.unpaid {
    background: #f1f3f6;
    color: #6e7b8f;
  }

  .table-input {
    width: 100%;
    max-width: 190px;
    height: 36px;
    padding: 0 9px;
    box-sizing: border-box;
    border: 1px solid #d7e0ed;
    border-radius: 7px;
    outline: 0;
    font-size: 12px;
  }

  .table-input.small {
    max-width: 90px;
  }

  .balance-cell {
    display: flex;
    flex-direction: column;
    min-width: 90px;
  }

  .balance-cell strong {
    color: #1f3a60;
    font-size: 16px;
  }

  .balance-cell span {
    color: #8290a5;
    font-size: 10px;
  }

  .balance-cell small {
    margin-top: 3px;
    color: #a0a9b7;
    font-size: 10px;
  }

  .report-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  .report-list {
    padding: 4px 22px;
  }

  .report-row {
    min-height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border-bottom: 1px solid #edf0f4;
  }

  .report-row:last-child {
    border-bottom: 0;
  }

  .report-row > div:first-child {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .report-row strong {
    color: #2a4162;
    font-size: 13px;
  }

  .report-row span {
    color: #8b98aa;
    font-size: 11px;
  }

  .report-value {
    color: #2864e8 !important;
    white-space: nowrap;
  }

  .report-status {
    align-items: flex-start !important;
  }

  .monthly-report-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 13px;
    padding: 22px;
  }

  .monthly-card {
    padding: 17px;
    border: 1px solid #e6ebf2;
    border-radius: 10px;
    background: #fafbfd;
  }

  .monthly-card span {
    display: block;
    color: #75849b;
    font-size: 11px;
    font-weight: 600;
  }

  .monthly-card strong {
    display: block;
    margin-top: 7px;
    color: #17325a;
    font-size: 23px;
  }

  .monthly-card small {
    display: block;
    margin-top: 2px;
    color: #9aa5b5;
    font-size: 10px;
  }

  .leave-feature-card {
    display: flex;
    gap: 25px;
    padding: 30px;
  }

  .leave-feature-icon {
    width: 58px;
    height: 58px;
    flex: 0 0 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: #edf4ff;
    color: #2864e8;
  }

  .leave-feature-content {
    max-width: 850px;
  }

  .leave-feature-content h2 {
    margin: 0;
    color: #193354;
    font-size: 21px;
  }

  .leave-feature-content > p {
    margin: 9px 0 20px;
    color: #72819a;
    font-size: 13px;
    line-height: 1.65;
  }

  .feature-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .feature-list-item {
    display: flex;
    align-items: center;
    gap: 9px;
    color: #4e627f;
    font-size: 12px;
  }

  .feature-list-item > span {
    width: 23px;
    height: 23px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: #eaf8f2;
    color: #16815d;
  }

  .feature-note {
    margin-top: 22px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #e3e9f1;
    border-radius: 8px;
    background: #f8fafc;
    color: #7b899e;
    font-size: 11px;
  }

  .employee-leave-grid {
    display: grid;
    grid-template-columns: 1.25fr 0.75fr;
    gap: 20px;
  }

  .employee-leave-form {
    padding: 23px;
    display: flex;
    flex-direction: column;
    gap: 17px;
  }

  .form-two-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .leave-duration-box {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 15px;
    border: 1px solid #dce6f7;
    border-radius: 9px;
    background: #f7faff;
    color: #2864e8;
  }

  .leave-duration-box > div:last-child {
    display: flex;
    flex-direction: column;
  }

  .leave-duration-box span {
    color: #7d8da6;
    font-size: 11px;
  }

  .leave-duration-box strong {
    margin-top: 2px;
    color: #28466f;
    font-size: 15px;
  }

  .leave-type-cards {
    padding: 10px 22px 22px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .employee-leave-type-card {
    min-height: 70px;
    padding: 12px;
    display: grid;
    grid-template-columns: 40px 1fr auto;
    align-items: center;
    gap: 11px;
    border: 1px solid #e6ebf2;
    border-radius: 10px;
    background: #fafbfd;
  }

  .leave-type-card-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    background: #edf4ff;
    color: #2864e8;
  }

  .employee-leave-type-card > div:nth-child(2) {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .employee-leave-type-card strong {
    color: #2b4263;
    font-size: 13px;
  }

  .employee-leave-type-card span {
    color: #8996a8;
    font-size: 11px;
  }

  .employee-leave-type-card .payment-badge {
    color: inherit;
  }

  .leave-loading {
    min-height: 450px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #687993;
    font-size: 14px;
  }

  .leave-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #dbe5f5;
    border-top-color: #2864e8;
    border-radius: 50%;
    animation: leave-spin 0.8s linear infinite;
  }

  @keyframes leave-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1200px) {
    .leave-stat-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .employee-leave-grid {
      grid-template-columns: 1fr;
    }

    .leave-create-form {
      grid-template-columns: 1fr 1fr;
    }

    .approval-grid,
    .report-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 850px) {
    .leave-page {
      padding: 22px 0 45px;
    }

    .leave-page-title {
      flex-direction: column;
    }

    .leave-section-nav {
      overflow-x: auto;
      flex-wrap: nowrap;
      padding-bottom: 5px;
    }

    .leave-nav-button {
      white-space: nowrap;
    }

    .leave-secondary-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .leave-mini-stat:nth-child(2) {
      border-right: 0;
    }

    .leave-mini-stat:nth-child(-n + 2) {
      border-bottom: 1px solid #e7ebf2;
    }

    .leave-create-form {
      grid-template-columns: 1fr;
    }

    .feature-list {
      grid-template-columns: 1fr;
    }

    .monthly-report-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .leave-filter-card {
      flex-direction: column;
      align-items: stretch;
    }

    .balance-type-count {
      margin-left: 0;
    }
  }

  @media (max-width: 600px) {
    .leave-page-title h1 {
      font-size: 27px;
    }

    .leave-page-title p {
      font-size: 14px;
    }

    .leave-stat-grid {
      grid-template-columns: 1fr;
    }

    .leave-secondary-stats {
      grid-template-columns: 1fr;
    }

    .leave-mini-stat,
    .leave-mini-stat:nth-child(2) {
      border-right: 0;
      border-bottom: 1px solid #e7ebf2;
    }

    .leave-mini-stat:last-child {
      border-bottom: 0;
    }

    .form-two-column {
      grid-template-columns: 1fr;
    }

    .approval-grid {
      grid-template-columns: 1fr;
    }

    .approval-actions {
      flex-direction: column;
    }

    .leave-feature-card {
      flex-direction: column;
      padding: 22px;
    }

    .monthly-report-grid {
      grid-template-columns: 1fr;
    }

    .leave-panel-header {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  .leave-management-form-panel { margin-bottom: 18px; }
  .leave-management-form { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; padding:20px; }
  .leave-management-form label { display:flex; flex-direction:column; gap:7px; font-size:12px; font-weight:600; }
  .leave-management-form input, .leave-management-form select { width:100%; border:1px solid rgba(100,90,150,.18); border-radius:10px; padding:10px 12px; background:#fff; color:inherit; font:inherit; font-weight:400; }
  .leave-management-form .span-two { grid-column:span 2; }
  .leave-check-grid { grid-column:1/-1; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; padding:4px 0; }
  .leave-checkbox { flex-direction:row !important; align-items:center; gap:8px !important; font-weight:500 !important; }
  .leave-checkbox input { width:16px; height:16px; }
  .form-actions { grid-column:1/-1; display:flex; justify-content:flex-end; gap:10px; align-items:center; }
  .leave-modal-backdrop { position:fixed; inset:0; z-index:1000; background:rgba(18,15,35,.48); display:flex; align-items:center; justify-content:center; padding:24px; }
  .leave-modal { width:min(900px,100%); max-height:90vh; overflow:auto; background:#fff; border-radius:18px; box-shadow:0 24px 80px rgba(30,20,60,.25); }
  .leave-modal-header { display:flex; justify-content:space-between; align-items:flex-start; padding:22px 24px; border-bottom:1px solid rgba(100,90,150,.12); }
  .leave-modal-header h2 { margin:0 0 4px; }
  .leave-modal-header p { margin:0; opacity:.65; }
  .leave-modal-close { border:0; background:transparent; cursor:pointer; padding:6px; }
  .leave-modal-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; padding:20px 24px; background:rgba(120,90,220,.035); }
  .leave-modal-summary div { display:flex; flex-direction:column; gap:5px; }
  .leave-modal-summary span { font-size:11px; opacity:.58; text-transform:uppercase; letter-spacing:.04em; }
  .approval-timeline { padding:20px 24px; border-top:1px solid rgba(100,90,150,.1); }
  .approval-timeline h3 { margin:0 0 16px; }
  .approval-timeline-item { display:flex; gap:12px; position:relative; padding-bottom:18px; }
  .approval-timeline-item:not(:last-child)::before { content:''; position:absolute; left:11px; top:28px; bottom:0; width:1px; background:rgba(100,90,150,.18); }
  .approval-timeline-dot { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(100,90,150,.2); flex:0 0 24px; background:#fff; }
  .approval-timeline-content { flex:1; }
  .timeline-top { display:flex; justify-content:space-between; gap:12px; }
  .timeline-top span { font-size:12px; opacity:.6; }
  .approval-timeline-content p { margin:6px 0 0; font-size:13px; }
  .approval-step-row { display:grid; grid-template-columns:1.3fr auto 1fr; gap:14px; align-items:center; padding:13px 0; border-bottom:1px solid rgba(100,90,150,.1); }
  .approval-step-row > div:first-child { display:flex; flex-direction:column; gap:3px; }
  .approval-step-row span { font-size:12px; opacity:.65; }
  .empty-inline { padding:12px 0; opacity:.65; font-size:13px; }
  .leave-loading.compact { min-height:80px; }
  @media (max-width:900px) { .leave-management-form{grid-template-columns:repeat(2,minmax(0,1fr));} .leave-check-grid{grid-template-columns:repeat(2,minmax(0,1fr));} .leave-modal-summary{grid-template-columns:repeat(2,1fr);} .approval-step-row{grid-template-columns:1fr;} }
  @media (max-width:600px) { .leave-management-form{grid-template-columns:1fr;} .leave-management-form .span-two{grid-column:auto;} .leave-check-grid{grid-template-columns:1fr;} .leave-modal-summary{grid-template-columns:1fr;} .timeline-top{flex-direction:column;gap:4px;} }
`;