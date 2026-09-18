'use client';

import { useEffect, useMemo, useState } from 'react';
import HRMSLayout from '../../components/HRMSLayout';

type AttendanceRecord = {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  break_minutes: number;
  worked_minutes: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AttendanceSummary = {
  date: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
  holiday: number;
  weekOff: number;
  averageWorkedMinutes: number;
  averageWorkedTime?: string;
  notPresent?: number;
  presentRate?: number;
  records?: AttendanceRecord[];
  counts?: Record<string, number>;
};

type IconName =
  | 'users'
  | 'check'
  | 'x'
  | 'clock'
  | 'half'
  | 'calendar'
  | 'calendarDays'
  | 'calendarOff'
  | 'timer'
  | 'arrowIn'
  | 'arrowOut'
  | 'alert';

function Icon({
  name,
  size = 18,
}: {
  name: IconName;
  size?: number;
}) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  };

  switch (name) {
    case 'users':
      return (
        <svg {...commonProps}>
          <path
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="9"
            cy="7"
            r="4"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'check':
      return (
        <svg {...commonProps}>
          <path
            d="m5 12 4 4L19 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'x':
      return (
        <svg {...commonProps}>
          <path
            d="M6 6l12 12M18 6 6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'clock':
      return (
        <svg {...commonProps}>
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'half':
      return (
        <svg {...commonProps}>
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 3a9 9 0 0 0 0 18"
            fill="currentColor"
          />
        </svg>
      );

    case 'calendar':
      return (
        <svg {...commonProps}>
          <rect
            x="3"
            y="4"
            width="18"
            height="17"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16 2v4M8 2v4M3 10h18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'calendarDays':
      return (
        <svg {...commonProps}>
          <rect
            x="3"
            y="4"
            width="18"
            height="17"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16 2v4M8 2v4M3 10h18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'calendarOff':
      return (
        <svg {...commonProps}>
          <path
            d="M3 10h18M8 2v4M16 2v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect
            x="3"
            y="4"
            width="18"
            height="17"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="m5 5 14 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'timer':
      return (
        <svg {...commonProps}>
          <circle
            cx="12"
            cy="13"
            r="8"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 9v4l2.5 1.5M9 2h6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'arrowIn':
      return (
        <svg {...commonProps}>
          <path
            d="M12 3v13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="m7 11 5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 21h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'arrowOut':
      return (
        <svg {...commonProps}>
          <path
            d="M12 21V8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="m7 13 5-5 5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 3h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'alert':
      return (
        <svg {...commonProps}>
          <path
            d="M12 3 2.8 19a1.5 1.5 0 0 0 1.3 2.2h15.8A1.5 1.5 0 0 0 21.2 19L12 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M12 9v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="12"
            cy="17"
            r="1"
            fill="currentColor"
          />
        </svg>
      );

    default:
      return null;
  }
}

function getLocalDateString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getRecordDate(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 10);
}

function formatTime(value: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value: string) {
  const rawDate = getRecordDate(value);

  if (!rawDate) {
    return '—';
  }

  const parts = rawDate.split('-');

  if (parts.length !== 3) {
    return '—';
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatWorkedTime(minutes: number | null | undefined) {
  const safeMinutes = Number(minutes || 0);

  if (!Number.isFinite(safeMinutes) || safeMinutes <= 0) {
    return '0h 0m';
  }

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] =
    useState<AttendanceSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    'check-in' | 'check-out' | null
  >(null);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [mounted, setMounted] = useState(false);
  const [isManagement, setIsManagement] = useState(false);

  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const tokenParts = token.split('.');

      if (tokenParts.length < 2) {
        setIsManagement(false);
        return;
      }

      let encodedPayload = tokenParts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      while (encodedPayload.length % 4 !== 0) {
        encodedPayload += '=';
      }

      const payload = JSON.parse(
        window.atob(encodedPayload)
      );

      const role = String(
        payload?.role || ''
      ).toUpperCase();

      setIsManagement(
        ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(
          role
        )
      );
    } catch (err) {
      console.error('Unable to read attendance user role:', err);
      setIsManagement(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    loadAttendance();
  }, [mounted, isManagement]);

  async function parseResponse(response: Response) {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        message: text,
      };
    }
  }

  async function loadAttendance() {
    const token = localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isManagement) {
        const today = getLocalDateString();

        const response = await fetch(
          `http://localhost:5000/api/attendance/summary?date=${today}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          }
        );

        const data = await parseResponse(response);

        if (response.status === 401) {
          localStorage.removeItem('hrms_token');
          window.location.href = '/login';
          return;
        }

        if (!response.ok) {
          setError(
            data?.message ||
              'Unable to load attendance dashboard.'
          );
          return;
        }

        setSummary(data as AttendanceSummary);
        return;
      }

      const response = await fetch(
        'http://localhost:5000/api/attendance/me',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }
      );

      const data = await parseResponse(response);

      if (response.status === 401) {
        localStorage.removeItem('hrms_token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        setError(
          data?.message ||
            'Unable to load attendance.'
        );
        return;
      }

      if (Array.isArray(data)) {
        setAttendance(data);
      } else if (Array.isArray(data?.attendance)) {
        setAttendance(data.attendance);
      } else if (data?.attendance) {
        setAttendance([data.attendance]);
      } else {
        setAttendance([]);
      }
    } catch (err) {
      console.error('Attendance loading error:', err);

      setError(
        'Unable to connect to the HRMS server.'
      );
    } finally {
      setLoading(false);
    }
  }

  const today = useMemo(() => {
    if (!mounted) {
      return '';
    }

    return getLocalDateString();
  }, [mounted]);

  const todayRecord = useMemo(() => {
    if (!today) {
      return undefined;
    }

    return attendance.find((record) => {
      return (
        getRecordDate(record.attendance_date) ===
        today
      );
    });
  }, [attendance, today]);

  const hasCheckedIn = Boolean(
    todayRecord?.check_in
  );

  const hasCheckedOut = Boolean(
    todayRecord?.check_out
  );

  const totalWorkedMinutes = useMemo(() => {
    return attendance.reduce(
      (total, record) =>
        total + Number(record.worked_minutes || 0),
      0
    );
  }, [attendance]);

  const presentDays = useMemo(() => {
    return attendance.filter(
      (record) =>
        String(record.status).toUpperCase() ===
        'PRESENT'
    ).length;
  }, [attendance]);

  const absentDays = useMemo(() => {
    return attendance.filter(
      (record) =>
        String(record.status).toUpperCase() ===
        'ABSENT'
    ).length;
  }, [attendance]);

  function formatTodayDate() {
    if (!mounted) {
      return '';
    }

    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function clearNotifications() {
    setError('');
    setMessage('');
  }

  async function handleCheckIn() {
    if (actionLoading) {
      return;
    }

    const token = localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    if (hasCheckedIn) {
      setError(
        'You have already checked in today.'
      );
      return;
    }

    try {
      setActionLoading('check-in');
      clearNotifications();

      const response = await fetch(
        'http://localhost:5000/api/attendance/check-in',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      const data = await parseResponse(response);

      if (response.status === 401) {
        localStorage.removeItem('hrms_token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        setError(
          data?.message ||
            'Unable to check in.'
        );
        return;
      }

      setMessage(
        data?.message ||
          'Check-in successful.'
      );

      await loadAttendance();
    } catch (err) {
      console.error('Check-in error:', err);

      setError(
        'Unable to connect to the HRMS server.'
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCheckOut() {
    if (actionLoading) {
      return;
    }

    const token = localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    /*
     * This is only a frontend safety check.
     * The backend remains the final authority.
     */
    if (!todayRecord?.check_in) {
      setError(
        'No active check-in was found for today. Please refresh the page and try again.'
      );
      return;
    }

    if (todayRecord.check_out) {
      setError(
        'You have already checked out today.'
      );
      return;
    }

    try {
      setActionLoading('check-out');
      clearNotifications();

      const response = await fetch(
        'http://localhost:5000/api/attendance/check-out',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      const data = await parseResponse(response);

      if (response.status === 401) {
        localStorage.removeItem('hrms_token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        setError(
          data?.message ||
            'Unable to check out.'
        );
        return;
      }

      const workedMinutes =
        Number(
          data?.workedMinutes ??
            data?.attendance?.worked_minutes ??
            0
        );

      setMessage(
        data?.message ||
          `Check-out successful. Worked ${workedMinutes} minutes.`
      );

      await loadAttendance();
    } catch (err) {
      console.error('Check-out error:', err);

      setError(
        'Unable to connect to the HRMS server.'
      );
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusClass(status: string) {
    return String(status || 'UNKNOWN')
      .toLowerCase()
      .replace(/_/g, '-');
  }

  function getStatusIcon(
    status: string
  ): IconName {
    const normalized = String(
      status || ''
    ).toUpperCase();

    if (normalized === 'PRESENT') {
      return 'check';
    }

    if (normalized === 'ABSENT') {
      return 'x';
    }

    if (normalized === 'HALF_DAY') {
      return 'half';
    }

    if (normalized === 'ON_LEAVE') {
      return 'calendar';
    }

    if (normalized === 'HOLIDAY') {
      return 'calendarDays';
    }

    if (normalized === 'WEEK_OFF') {
      return 'calendarOff';
    }

    if (normalized === 'LATE') {
      return 'clock';
    }

    return 'clock';
  }

  if (isManagement) {
    const notPresent =
      summary?.notPresent ??
      Math.max(
        0,
        (summary?.total ?? 0) -
          (summary?.present ?? 0)
      );

    const presentRate =
      summary?.presentRate ??
      (summary?.total
        ? Math.round(
            (summary.present /
              summary.total) *
              100
          )
        : 0);

    return (
      <HRMSLayout title="Attendance">
        <div className="attendance-container">
          <section className="attendance-page-header">
            <div>
              <p className="eyebrow attendance-eyebrow">
                TIME & ATTENDANCE
              </p>

              <h2>Attendance Dashboard</h2>

              <p>
                Monitor today&apos;s attendance
                across your employees.
              </p>
            </div>

            <div className="attendance-date-card">
              <span>Today</span>

              <strong>
                {mounted
                  ? formatTodayDate()
                  : ''}
              </strong>
            </div>
          </section>

          {error && (
            <div className="attendance-error-message">
              <span>
                <Icon
                  name="alert"
                  size={18}
                />
              </span>

              {error}
            </div>
          )}

          <section className="attendance-summary-grid">
            <div className="attendance-summary-card">
              <div className="attendance-summary-icon blue">
                <Icon
                  name="users"
                  size={21}
                />
              </div>

              <div>
                <span>
                  Total Employees
                </span>

                <strong>
                  {loading
                    ? '...'
                    : summary?.total ?? 0}
                </strong>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="attendance-summary-icon green">
                <Icon
                  name="check"
                  size={21}
                />
              </div>

              <div>
                <span>Present</span>

                <strong>
                  {loading
                    ? '...'
                    : summary?.present ?? 0}
                </strong>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="attendance-summary-icon orange">
                <Icon
                  name="x"
                  size={21}
                />
              </div>

              <div>
                <span>Absent</span>

                <strong>
                  {loading
                    ? '...'
                    : summary?.absent ?? 0}
                </strong>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="attendance-summary-icon purple">
                <Icon
                  name="clock"
                  size={21}
                />
              </div>

              <div>
                <span>Late</span>

                <strong>
                  {loading
                    ? '...'
                    : summary?.late ?? 0}
                </strong>
              </div>
            </div>
          </section>

          <section className="attendance-summary-grid">
            <div className="attendance-summary-card">
              <div className="attendance-summary-icon blue">
                <Icon
                  name="half"
                  size={21}
                />
              </div>

              <div>
                <span>Half Day</span>

                <strong>
                  {loading
                    ? '...'
                    : summary?.halfDay ?? 0}
                </strong>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="attendance-summary-icon green">
                <Icon
                  name="calendar"
                  size={21}
                />
              </div>

              <div>
                <span>On Leave</span>

                <strong>
                  {loading
                    ? '...'
                    : summary?.onLeave ?? 0}
                </strong>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="attendance-summary-icon orange">
                <Icon
                  name="calendarDays"
                  size={21}
                />
              </div>

              <div>
                <span>Holiday</span>

                <strong>
                  {loading
                    ? '...'
                    : summary?.holiday ?? 0}
                </strong>
              </div>
            </div>

            <div className="attendance-summary-card">
              <div className="attendance-summary-icon purple">
                <Icon
                  name="calendarOff"
                  size={21}
                />
              </div>

              <div>
                <span>Weekly Off</span>

                <strong>
                  {loading
                    ? '...'
                    : summary?.weekOff ?? 0}
                </strong>
              </div>
            </div>
          </section>

          <section className="today-attendance-card">
            <div className="today-attendance-header">
              <div>
                <h3>
                  Today&apos;s Attendance
                  Overview
                </h3>

                <p>
                  Current attendance summary
                  for active employees.
                </p>
              </div>

              <span className="today-status-badge present">
                {loading
                  ? 'Loading...'
                  : `${
                      summary?.total ?? 0
                    } employees`}
              </span>
            </div>

            <div className="today-attendance-content">
              <div className="attendance-time-box">
                <div className="attendance-time-icon worked">
                  <Icon
                    name="timer"
                    size={20}
                  />
                </div>

                <div>
                  <span>
                    Average Worked Time
                  </span>

                  <strong>
                    {loading
                      ? '...'
                      : formatWorkedTime(
                          summary?.averageWorkedMinutes ??
                            0
                        )}
                  </strong>
                </div>
              </div>

              <div className="attendance-time-box">
                <div className="attendance-time-icon">
                  <Icon
                    name="check"
                    size={20}
                  />
                </div>

                <div>
                  <span>
                    Present Rate
                  </span>

                  <strong>
                    {loading
                      ? '...'
                      : `${presentRate}%`}
                  </strong>
                </div>
              </div>

              <div className="attendance-time-box">
                <div className="attendance-time-icon checkout">
                  <Icon
                    name="x"
                    size={20}
                  />
                </div>

                <div>
                  <span>
                    Not Present
                  </span>

                  <strong>
                    {loading
                      ? '...'
                      : notPresent}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        </div>
      </HRMSLayout>
    );
  }

  return (
    <HRMSLayout title="Attendance">
      <div className="attendance-container">
        <section className="attendance-page-header">
          <div>
            <p className="eyebrow attendance-eyebrow">
              TIME & ATTENDANCE
            </p>

            <h2>Attendance</h2>

            <p>
              Track your daily attendance,
              working hours and attendance
              history.
            </p>
          </div>

          <div className="attendance-date-card">
            <span>Today</span>

            <strong>
              {mounted
                ? formatTodayDate()
                : ''}
            </strong>
          </div>
        </section>

        {message && (
          <div className="attendance-success-message">
            <span>
              <Icon
                name="check"
                size={18}
              />
            </span>

            {message}
          </div>
        )}

        {error && (
          <div className="attendance-error-message">
            <span>
              <Icon
                name="alert"
                size={18}
              />
            </span>

            {error}
          </div>
        )}

        <section className="attendance-summary-grid">
          <div className="attendance-summary-card">
            <div className="attendance-summary-icon blue">
              <Icon
                name="clock"
                size={21}
              />
            </div>

            <div>
              <span>
                Today&apos;s Status
              </span>

              <strong>
                {loading
                  ? '...'
                  : todayRecord?.status ||
                    'NOT MARKED'}
              </strong>
            </div>
          </div>

          <div className="attendance-summary-card">
            <div className="attendance-summary-icon green">
              <Icon
                name="check"
                size={21}
              />
            </div>

            <div>
              <span>Present Days</span>

              <strong>
                {loading
                  ? '...'
                  : presentDays}
              </strong>
            </div>
          </div>

          <div className="attendance-summary-card">
            <div className="attendance-summary-icon orange">
              <Icon
                name="x"
                size={21}
              />
            </div>

            <div>
              <span>Absent Days</span>

              <strong>
                {loading
                  ? '...'
                  : absentDays}
              </strong>
            </div>
          </div>

          <div className="attendance-summary-card">
            <div className="attendance-summary-icon purple">
              <Icon
                name="timer"
                size={21}
              />
            </div>

            <div>
              <span>Total Worked</span>

              <strong>
                {loading
                  ? '...'
                  : formatWorkedTime(
                      totalWorkedMinutes
                    )}
              </strong>
            </div>
          </div>
        </section>

        <section className="today-attendance-card">
          <div className="today-attendance-header">
            <div>
              <h3>
                Today&apos;s Attendance
              </h3>

              <p>
                Record your check-in and
                check-out for today.
              </p>
            </div>

            <span
              className={`today-status-badge ${
                todayRecord?.status ===
                'PRESENT'
                  ? 'present'
                  : todayRecord
                    ? 'other'
                    : 'not-marked'
              }`}
            >
              {todayRecord?.status ||
                'NOT MARKED'}
            </span>
          </div>

          <div className="today-attendance-content">
            <div className="attendance-time-box">
              <div className="attendance-time-icon">
                <Icon
                  name="arrowIn"
                  size={20}
                />
              </div>

              <div>
                <span>Check In</span>

                <strong>
                  {formatTime(
                    todayRecord?.check_in ||
                      null
                  )}
                </strong>
              </div>
            </div>

            <div className="attendance-time-box">
              <div className="attendance-time-icon checkout">
                <Icon
                  name="arrowOut"
                  size={20}
                />
              </div>

              <div>
                <span>Check Out</span>

                <strong>
                  {formatTime(
                    todayRecord?.check_out ||
                      null
                  )}
                </strong>
              </div>
            </div>

            <div className="attendance-time-box">
              <div className="attendance-time-icon worked">
                <Icon
                  name="timer"
                  size={20}
                />
              </div>

              <div>
                <span>Worked Time</span>

                <strong>
                  {formatWorkedTime(
                    todayRecord?.worked_minutes ||
                      0
                  )}
                </strong>
              </div>
            </div>
          </div>

          <div className="attendance-actions">
            <button
              type="button"
              className="attendance-checkin-button"
              onClick={handleCheckIn}
              disabled={
                actionLoading !== null ||
                hasCheckedIn
              }
            >
              {actionLoading ===
              'check-in' ? (
                'Processing...'
              ) : hasCheckedIn ? (
                <>
                  <Icon
                    name="check"
                    size={17}
                  />
                  Checked In
                </>
              ) : (
                <>
                  <Icon
                    name="arrowIn"
                    size={17}
                  />
                  Check In
                </>
              )}
            </button>

            <button
              type="button"
              className="attendance-checkout-button"
              onClick={handleCheckOut}
              disabled={
                actionLoading !== null ||
                hasCheckedOut
              }
            >
              {actionLoading ===
              'check-out' ? (
                'Processing...'
              ) : hasCheckedOut ? (
                <>
                  <Icon
                    name="check"
                    size={17}
                  />
                  Checked Out
                </>
              ) : (
                <>
                  <Icon
                    name="arrowOut"
                    size={17}
                  />
                  Check Out
                </>
              )}
            </button>
          </div>

          {!hasCheckedIn && (
            <p className="attendance-helper-text">
              Click <strong>Check In</strong>{' '}
              when you start your working day.
            </p>
          )}

          {hasCheckedIn &&
            !hasCheckedOut && (
              <p className="attendance-helper-text">
                You are currently checked
                in. Remember to check out when
                your working day is complete.
              </p>
            )}

          {hasCheckedIn &&
            hasCheckedOut && (
              <p className="attendance-helper-text success">
                Today&apos;s attendance has
                been completed successfully.
              </p>
            )}
        </section>

        <section className="attendance-history-card">
          <div className="attendance-history-header">
            <div>
              <h3>
                Attendance History
              </h3>

              <p>
                Review your previous
                attendance records.
              </p>
            </div>

            <span className="attendance-record-count">
              {attendance.length}{' '}
              {attendance.length === 1
                ? 'record'
                : 'records'}
            </span>
          </div>

          {loading ? (
            <div className="attendance-loading">
              <div className="loading-spinner"></div>

              <p>
                Loading attendance...
              </p>
            </div>
          ) : attendance.length ===
            0 ? (
            <div className="attendance-empty">
              <div className="attendance-empty-icon">
                <Icon
                  name="clock"
                  size={28}
                />
              </div>

              <h3>
                No attendance records
              </h3>

              <p>
                Your attendance history
                will appear here after you
                check in.
              </p>
            </div>
          ) : (
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Break</th>
                    <th>Worked</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {attendance.map(
                    (record) => (
                      <tr
                        key={record.id}
                      >
                        <td>
                          <strong>
                            {formatDate(
                              record.attendance_date
                            )}
                          </strong>
                        </td>

                        <td>
                          {formatTime(
                            record.check_in
                          )}
                        </td>

                        <td>
                          {formatTime(
                            record.check_out
                          )}
                        </td>

                        <td>
                          {Number(
                            record.break_minutes ||
                              0
                          )}{' '}
                          min
                        </td>

                        <td>
                          <span className="worked-time">
                            {formatWorkedTime(
                              record.worked_minutes
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`attendance-status ${getStatusClass(
                              record.status
                            )}`}
                          >
                            <span className="status-circle">
                              <Icon
                                name={getStatusIcon(
                                  record.status
                                )}
                                size={12}
                              />
                            </span>

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
        </section>
      </div>
    </HRMSLayout>
  );
}