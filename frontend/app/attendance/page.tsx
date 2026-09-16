
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

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadAttendance();
  }, []);

  async function loadAttendance() {
    const token = localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        'http://localhost:5000/api/attendance/me',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Unable to load attendance.');
        return;
      }

      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Attendance loading error:', err);
      setError('Unable to connect to the HRMS server.');
    } finally {
      setLoading(false);
    }
  }

  const today = useMemo(() => {
    if (!mounted) {
      return '';
    }

    const now = new Date();

    return now.toLocaleDateString('en-CA');
  }, [mounted]);

  const todayRecord = useMemo(() => {
    if (!today) {
      return undefined;
    }

    return attendance.find((record) => {
      const recordDate = new Date(
        record.attendance_date
      ).toLocaleDateString('en-CA');

      return recordDate === today;
    });
  }, [attendance, today]);

  const totalWorkedMinutes = useMemo(() => {
    return attendance.reduce(
      (total, record) => total + (record.worked_minutes || 0),
      0
    );
  }, [attendance]);

  const presentDays = useMemo(() => {
    return attendance.filter(
      (record) => record.status === 'PRESENT'
    ).length;
  }, [attendance]);

  const absentDays = useMemo(() => {
    return attendance.filter(
      (record) => record.status === 'ABSENT'
    ).length;
  }, [attendance]);

  function formatTime(value: string | null) {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatWorkedTime(minutes: number | null) {
    if (!minutes || minutes <= 0) {
      return '0h 0m';
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
  }

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

  async function handleCheckIn() {
    const token = localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setMessage('');

      const response = await fetch(
        'http://localhost:5000/api/attendance/check-in',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Unable to check in.');
        return;
      }

      setMessage(data.message || 'Check-in successful.');

      await loadAttendance();
    } catch (err) {
      console.error('Check-in error:', err);
      setError('Unable to connect to the HRMS server.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    const token = localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setMessage('');

      const response = await fetch(
        'http://localhost:5000/api/attendance/check-out',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Unable to check out.');
        return;
      }

      setMessage(
        data.message ||
          `Check-out successful. Worked ${
            data.workedMinutes || 0
          } minutes.`
      );

      await loadAttendance();
    } catch (err) {
      console.error('Check-out error:', err);
      setError('Unable to connect to the HRMS server.');
    } finally {
      setActionLoading(false);
    }
  }

  const hasCheckedIn = Boolean(todayRecord?.check_in);
  const hasCheckedOut = Boolean(todayRecord?.check_out);

  return (
    <HRMSLayout title="Attendance">
      <div className="attendance-container">

        {/* Header */}
        <section className="attendance-page-header">
          <div>
            <p className="eyebrow attendance-eyebrow">
              TIME & ATTENDANCE
            </p>

            <h2>Attendance</h2>

            <p>
              Track your daily attendance, working hours and
              attendance history.
            </p>
          </div>

          <div className="attendance-date-card">
            <span>Today</span>

            <strong>
              {mounted ? formatTodayDate() : ''}
            </strong>
          </div>
        </section>

        {/* Messages */}
        {message && (
          <div className="attendance-success-message">
            <span>✓</span>
            {message}
          </div>
        )}

        {error && (
          <div className="attendance-error-message">
            <span>!</span>
            {error}
          </div>
        )}

        {/* Summary */}
        <section className="attendance-summary-grid">

          <div className="attendance-summary-card">
            <div className="attendance-summary-icon blue">
              ◷
            </div>

            <div>
              <span>Today's Status</span>

              <strong>
                {loading
                  ? '...'
                  : todayRecord?.status || 'NOT MARKED'}
              </strong>
            </div>
          </div>

          <div className="attendance-summary-card">
            <div className="attendance-summary-icon green">
              ✓
            </div>

            <div>
              <span>Present Days</span>

              <strong>
                {loading ? '...' : presentDays}
              </strong>
            </div>
          </div>

          <div className="attendance-summary-card">
            <div className="attendance-summary-icon orange">
              !
            </div>

            <div>
              <span>Absent Days</span>

              <strong>
                {loading ? '...' : absentDays}
              </strong>
            </div>
          </div>

          <div className="attendance-summary-card">
            <div className="attendance-summary-icon purple">
              ⏱
            </div>

            <div>
              <span>Total Worked</span>

              <strong>
                {loading
                  ? '...'
                  : formatWorkedTime(totalWorkedMinutes)}
              </strong>
            </div>
          </div>

        </section>

        {/* Today's Attendance */}
        <section className="today-attendance-card">

          <div className="today-attendance-header">
            <div>
              <h3>Today's Attendance</h3>

              <p>
                Record your check-in and check-out for today.
              </p>
            </div>

            <span
              className={`today-status-badge ${
                todayRecord?.status === 'PRESENT'
                  ? 'present'
                  : todayRecord
                    ? 'other'
                    : 'not-marked'
              }`}
            >
              {todayRecord?.status || 'NOT MARKED'}
            </span>
          </div>

          <div className="today-attendance-content">

            <div className="attendance-time-box">
              <div className="attendance-time-icon">
                ↗
              </div>

              <div>
                <span>Check In</span>

                <strong>
                  {formatTime(
                    todayRecord?.check_in || null
                  )}
                </strong>
              </div>
            </div>

            <div className="attendance-time-box">
              <div className="attendance-time-icon checkout">
                ↙
              </div>

              <div>
                <span>Check Out</span>

                <strong>
                  {formatTime(
                    todayRecord?.check_out || null
                  )}
                </strong>
              </div>
            </div>

            <div className="attendance-time-box">
              <div className="attendance-time-icon worked">
                ⏱
              </div>

              <div>
                <span>Worked Time</span>

                <strong>
                  {formatWorkedTime(
                    todayRecord?.worked_minutes || 0
                  )}
                </strong>
              </div>
            </div>

          </div>

          <div className="attendance-actions">

            <button
              className="attendance-checkin-button"
              onClick={handleCheckIn}
              disabled={
                actionLoading || hasCheckedIn
              }
            >
              {actionLoading && !hasCheckedIn
                ? 'Processing...'
                : hasCheckedIn
                  ? '✓ Checked In'
                  : '↗ Check In'}
            </button>

            <button
              className="attendance-checkout-button"
              onClick={handleCheckOut}
              disabled={
                actionLoading ||
                !hasCheckedIn ||
                hasCheckedOut
              }
            >
              {actionLoading && hasCheckedIn
                ? 'Processing...'
                : hasCheckedOut
                  ? '✓ Checked Out'
                  : '↙ Check Out'}
            </button>

          </div>

          {!hasCheckedIn && (
            <p className="attendance-helper-text">
              Click <strong>Check In</strong> when you start
              your working day.
            </p>
          )}

          {hasCheckedIn && !hasCheckedOut && (
            <p className="attendance-helper-text">
              You are currently checked in. Remember to check
              out when your working day is complete.
            </p>
          )}

          {hasCheckedIn && hasCheckedOut && (
            <p className="attendance-helper-text success">
              Today's attendance has been completed successfully.
            </p>
          )}

        </section>

        {/* Attendance History */}
        <section className="attendance-history-card">

          <div className="attendance-history-header">
            <div>
              <h3>Attendance History</h3>

              <p>
                Review your previous attendance records.
              </p>
            </div>

            <span className="attendance-record-count">
              {attendance.length} records
            </span>
          </div>

          {loading ? (
            <div className="attendance-loading">
              <div className="loading-spinner"></div>

              <p>Loading attendance...</p>
            </div>
          ) : attendance.length === 0 ? (
            <div className="attendance-empty">
              <div>◷</div>

              <h3>No attendance records</h3>

              <p>
                Your attendance history will appear here after
                you check in.
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
                  {attendance.map((record) => (
                    <tr key={record.id}>

                      <td>
                        <strong>
                          {formatDate(
                            record.attendance_date
                          )}
                        </strong>
                      </td>

                      <td>
                        {formatTime(record.check_in)}
                      </td>

                      <td>
                        {formatTime(record.check_out)}
                      </td>

                      <td>
                        {record.break_minutes || 0} min
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
                          className={`attendance-status ${
                            record.status
                              .toLowerCase()
                              .replace('_', '-')
                          }`}
                        >
                          <span className="status-circle">
                            ●
                          </span>

                          {record.status}
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>
    </HRMSLayout>
  );
}

