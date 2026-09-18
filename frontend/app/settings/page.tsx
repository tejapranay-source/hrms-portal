'use client';

import { FormEvent, useEffect, useState } from 'react';
import HRMSLayout from '../../components/HRMSLayout';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

type Profile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  employeeCode: string | null;
  designation: string | null;
  joiningDate: string | null;
  workLocation: string | null;
  employmentType: string | null;
  employeeStatus: string | null;
  department: string | null;
};

type Activity = {
  id: number;
  action: string;
  entity_type: string;
  created_at: string;
  ip_address: string | null;
};

type Section =
  | 'profile'
  | 'account'
  | 'notifications'
  | 'security'
  | 'appearance'
  | 'region'
  | 'help';

export default function SettingsPage() {
  const [section, setSection] =
    useState<Section>('profile');

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  const [firstName, setFirstName] =
    useState('');

  const [lastName, setLastName] =
    useState('');

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [emailNotifications, setEmailNotifications] =
    useState(true);

  const [leaveNotifications, setLeaveNotifications] =
    useState(true);

  const [attendanceNotifications, setAttendanceNotifications] =
    useState(true);

  const [requestNotifications, setRequestNotifications] =
    useState(true);

  const [payrollNotifications, setPayrollNotifications] =
    useState(true);

  const [language, setLanguage] =
    useState('English');

  const [timezone, setTimezone] =
    useState('Asia/Kolkata');

  const [dateFormat, setDateFormat] =
    useState('DD/MM/YYYY');

  const [currency, setCurrency] =
    useState('INR');

  const [appearance, setAppearance] =
    useState('system');

  useEffect(() => {
    loadProfile();
    loadPreferences();
  }, []);

  useEffect(() => {
    if (section === 'security') {
      loadActivity();
    }
  }, [section]);

  async function loadProfile() {
    const token =
      localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(
        `${API}/settings/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          'Unable to load your profile.'
        );
      }

      const data = await response.json();

      setProfile(data);
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load settings.'
      );
    } finally {
      setLoading(false);
    }
  }

  function loadPreferences() {
    try {
      const saved =
        localStorage.getItem(
          'hrms_settings_preferences'
        );

      if (!saved) {
        return;
      }

      const data = JSON.parse(saved);

      if (typeof data.emailNotifications === 'boolean') {
        setEmailNotifications(
          data.emailNotifications
        );
      }

      if (typeof data.leaveNotifications === 'boolean') {
        setLeaveNotifications(
          data.leaveNotifications
        );
      }

      if (
        typeof data.attendanceNotifications ===
        'boolean'
      ) {
        setAttendanceNotifications(
          data.attendanceNotifications
        );
      }

      if (
        typeof data.requestNotifications ===
        'boolean'
      ) {
        setRequestNotifications(
          data.requestNotifications
        );
      }

      if (
        typeof data.payrollNotifications ===
        'boolean'
      ) {
        setPayrollNotifications(
          data.payrollNotifications
        );
      }

      if (typeof data.language === 'string') {
        setLanguage(data.language);
      }

      if (typeof data.timezone === 'string') {
        setTimezone(data.timezone);
      }

      if (typeof data.dateFormat === 'string') {
        setDateFormat(data.dateFormat);
      }

      if (typeof data.currency === 'string') {
        setCurrency(data.currency);
      }

      if (typeof data.appearance === 'string') {
        setAppearance(data.appearance);
      }
    } catch {
      // Ignore invalid saved preferences.
    }
  }

  function savePreferences() {
    localStorage.setItem(
      'hrms_settings_preferences',
      JSON.stringify({
        emailNotifications,
        leaveNotifications,
        attendanceNotifications,
        requestNotifications,
        payrollNotifications,
        language,
        timezone,
        dateFormat,
        currency,
        appearance,
      })
    );

    setMessage(
      'Preferences saved successfully.'
    );

    setError('');
  }

  async function updateProfile(
    event: FormEvent
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const token =
        localStorage.getItem('hrms_token');

      const response = await fetch(
        `${API}/settings/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName,
            lastName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to update profile.'
        );
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              firstName,
              lastName,
            }
          : current
      );

      const storedUser =
        localStorage.getItem('hrms_user');

      if (storedUser) {
        const user =
          JSON.parse(storedUser);

        localStorage.setItem(
          'hrms_user',
          JSON.stringify({
            ...user,
            firstName,
            lastName,
          })
        );
      }

      setMessage(
        'Profile updated successfully.'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update profile.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(
    event: FormEvent
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (newPassword !== confirmPassword) {
        throw new Error(
          'New password and confirmation do not match.'
        );
      }

      const token =
        localStorage.getItem('hrms_token');

      const response = await fetch(
        `${API}/settings/password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to change password.'
        );
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setMessage(
        'Password changed successfully.'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to change password.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function loadActivity() {
    try {
      const token =
        localStorage.getItem('hrms_token');

      const response = await fetch(
        `${API}/settings/activity`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setActivities(data);
    } catch {
      setActivities([]);
    }
  }

  function selectSection(
    value: Section
  ) {
    setSection(value);
    setMessage('');
    setError('');
  }

  function applyAppearance(
    value: string
  ) {
    setAppearance(value);

    if (value === 'dark') {
      localStorage.setItem(
        'hrms_theme',
        'dark'
      );

      document.documentElement.classList.add(
        'hrms-dark'
      );
    } else if (value === 'light') {
      localStorage.setItem(
        'hrms_theme',
        'light'
      );

      document.documentElement.classList.remove(
        'hrms-dark'
      );
    } else {
      localStorage.removeItem(
        'hrms_theme'
      );

      const prefersDark =
        window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;

      if (prefersDark) {
        document.documentElement.classList.add(
          'hrms-dark'
        );
      } else {
        document.documentElement.classList.remove(
          'hrms-dark'
        );
      }
    }
  }

  const roleLabel =
    profile?.role
      ?.replaceAll('_', ' ')
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      ) || '';

  if (loading) {
    return (
      <HRMSLayout title="Settings">
        <div style={styles.loading}>
          Loading your settings...
        </div>
      </HRMSLayout>
    );
  }

  return (
    <HRMSLayout title="Settings">
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              ACCOUNT SETTINGS
            </div>

            <h2 style={styles.title}>
              Settings
            </h2>

            <p style={styles.subtitle}>
              Manage your account, preferences and
              security from one place.
            </p>
          </div>

          <div style={styles.profileMini}>
            <div style={styles.avatar}>
              {(
                firstName?.[0] || 'U'
              ).toUpperCase()}
            </div>

            <div>
              <strong>
                {firstName} {lastName}
              </strong>

              <span>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {message && (
          <div style={styles.success}>
            ✓ {message}
          </div>
        )}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <div style={styles.layout}>
          <aside style={styles.settingsNav}>
            <SettingsNavItem
              active={section === 'profile'}
              title="My Profile"
              description="Personal information"
              icon="◉"
              onClick={() =>
                selectSection('profile')
              }
            />

            <SettingsNavItem
              active={section === 'account'}
              title="Account"
              description="Password and account"
              icon="◆"
              onClick={() =>
                selectSection('account')
              }
            />

            <SettingsNavItem
              active={
                section === 'notifications'
              }
              title="Notifications"
              description="Alerts and updates"
              icon="◌"
              onClick={() =>
                selectSection(
                  'notifications'
                )
              }
            />

            <SettingsNavItem
              active={section === 'security'}
              title="Security"
              description="Activity and access"
              icon="◇"
              onClick={() =>
                selectSection('security')
              }
            />

            <SettingsNavItem
              active={
                section === 'appearance'
              }
              title="Appearance"
              description="Theme preferences"
              icon="◐"
              onClick={() =>
                selectSection('appearance')
              }
            />

            <SettingsNavItem
              active={section === 'region'}
              title="Language & Region"
              description="Regional preferences"
              icon="◎"
              onClick={() =>
                selectSection('region')
              }
            />

            <SettingsNavItem
              active={section === 'help'}
              title="Help & Support"
              description="Get assistance"
              icon="?"
              onClick={() =>
                selectSection('help')
              }
            />
          </aside>

          <main style={styles.content}>
            {section === 'profile' && (
              <section>
                <SectionHeading
                  title="My Profile"
                  description="Review and update the personal information associated with your HRMS account."
                />

                <form
                  onSubmit={updateProfile}
                >
                  <div style={styles.card}>
                    <div
                      style={
                        styles.profileBanner
                      }
                    >
                      <div
                        style={
                          styles.largeAvatar
                        }
                      >
                        {(
                          firstName?.[0] ||
                          'U'
                        ).toUpperCase()}
                      </div>

                      <div>
                        <h3
                          style={
                            styles.profileName
                          }
                        >
                          {firstName}{' '}
                          {lastName}
                        </h3>

                        <p
                          style={
                            styles.profileEmail
                          }
                        >
                          {profile?.email}
                        </p>
                      </div>
                    </div>

                    <div style={styles.formGrid}>
                      <Field
                        label="First name"
                        value={firstName}
                        onChange={
                          setFirstName
                        }
                      />

                      <Field
                        label="Last name"
                        value={lastName}
                        onChange={
                          setLastName
                        }
                      />

                      <ReadOnlyField
                        label="Work email"
                        value={
                          profile?.email ||
                          ''
                        }
                      />

                      <ReadOnlyField
                        label="Employee ID"
                        value={
                          profile
                            ?.employeeCode ||
                          'Not assigned'
                        }
                      />

                      <ReadOnlyField
                        label="Department"
                        value={
                          profile
                            ?.department ||
                          'Not assigned'
                        }
                      />

                      <ReadOnlyField
                        label="Designation"
                        value={
                          profile
                            ?.designation ||
                          'Not assigned'
                        }
                      />

                      <ReadOnlyField
                        label="Joining date"
                        value={
                          profile
                            ?.joiningDate ||
                          'Not available'
                        }
                      />

                      <ReadOnlyField
                        label="Work location"
                        value={
                          profile
                            ?.workLocation ||
                          'Not assigned'
                        }
                      />
                    </div>

                    <div
                      style={
                        styles.formFooter
                      }
                    >
                      <button
                        type="submit"
                        disabled={saving}
                        style={
                          styles.primaryButton
                        }
                      >
                        {saving
                          ? 'Saving...'
                          : 'Save changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </section>
            )}

            {section === 'account' && (
              <section>
                <SectionHeading
                  title="Account"
                  description="Manage your account credentials."
                />

                <div style={styles.card}>
                  <div style={styles.accountRow}>
                    <div>
                      <strong>
                        Account email
                      </strong>

                      <span>
                        {profile?.email}
                      </span>
                    </div>

                    <span
                      style={
                        styles.statusBadge
                      }
                    >
                      {profile?.isActive
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </div>
                </div>

                <form
                  onSubmit={changePassword}
                >
                  <div
                    style={{
                      ...styles.card,
                      marginTop: 18,
                    }}
                  >
                    <h3
                      style={
                        styles.cardTitle
                      }
                    >
                      Change password
                    </h3>

                    <p
                      style={
                        styles.cardDescription
                      }
                    >
                      Use a strong password that
                      you do not use on another
                      service.
                    </p>

                    <div
                      style={
                        styles.singleColumn
                      }
                    >
                      <PasswordField
                        label="Current password"
                        value={
                          currentPassword
                        }
                        onChange={
                          setCurrentPassword
                        }
                      />

                      <PasswordField
                        label="New password"
                        value={newPassword}
                        onChange={
                          setNewPassword
                        }
                      />

                      <PasswordField
                        label="Confirm new password"
                        value={
                          confirmPassword
                        }
                        onChange={
                          setConfirmPassword
                        }
                      />
                    </div>

                    <div
                      style={
                        styles.formFooter
                      }
                    >
                      <button
                        type="submit"
                        disabled={saving}
                        style={
                          styles.primaryButton
                        }
                      >
                        {saving
                          ? 'Updating...'
                          : 'Change password'}
                      </button>
                    </div>
                  </div>
                </form>
              </section>
            )}

            {section ===
              'notifications' && (
              <section>
                <SectionHeading
                  title="Notifications"
                  description="Choose which HRMS updates you want to receive."
                />

                <div style={styles.card}>
                  <PreferenceRow
                    title="Email notifications"
                    description="Receive important HRMS updates by email."
                    checked={
                      emailNotifications
                    }
                    onChange={
                      setEmailNotifications
                    }
                  />

                  <PreferenceRow
                    title="Leave updates"
                    description="Notifications about leave requests, approvals and status changes."
                    checked={
                      leaveNotifications
                    }
                    onChange={
                      setLeaveNotifications
                    }
                  />

                  <PreferenceRow
                    title="Attendance updates"
                    description="Receive reminders and attendance-related notifications."
                    checked={
                      attendanceNotifications
                    }
                    onChange={
                      setAttendanceNotifications
                    }
                  />

                  <PreferenceRow
                    title="Requests and approvals"
                    description="Updates about HR requests and approval workflows."
                    checked={
                      requestNotifications
                    }
                    onChange={
                      setRequestNotifications
                    }
                  />

                  <PreferenceRow
                    title="Payroll notifications"
                    description="Receive notifications related to salary and payroll."
                    checked={
                      payrollNotifications
                    }
                    onChange={
                      setPayrollNotifications
                    }
                  />

                  <div
                    style={
                      styles.formFooter
                    }
                  >
                    <button
                      type="button"
                      onClick={
                        savePreferences
                      }
                      style={
                        styles.primaryButton
                      }
                    >
                      Save preferences
                    </button>
                  </div>
                </div>
              </section>
            )}

            {section === 'security' && (
              <section>
                <SectionHeading
                  title="Security"
                  description="Review recent activity on your HRMS account."
                />

                <div style={styles.card}>
                  <div
                    style={
                      styles.securityHeader
                    }
                  >
                    <div>
                      <h3
                        style={
                          styles.cardTitle
                        }
                      >
                        Recent account activity
                      </h3>

                      <p
                        style={
                          styles.cardDescription
                        }
                      >
                        Recent actions associated
                        with your account.
                      </p>
                    </div>

                    <span
                      style={
                        styles.secureBadge
                      }
                    >
                      Account protected
                    </span>
                  </div>

                  {activities.length ===
                  0 ? (
                    <div
                      style={
                        styles.empty
                      }
                    >
                      No recent activity found.
                    </div>
                  ) : (
                    <div>
                      {activities.map(
                        (activity) => (
                          <div
                            key={
                              activity.id
                            }
                            style={
                              styles.activity
                            }
                          >
                            <div
                              style={
                                styles.activityDot
                              }
                            />

                            <div
                              style={
                                styles.activityInfo
                              }
                            >
                              <strong>
                                {formatAction(
                                  activity.action
                                )}
                              </strong>

                              <span>
                                {formatDateTime(
                                  activity.created_at
                                )}
                                {activity.ip_address
                                  ? ` • ${activity.ip_address}`
                                  : ''}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    ...styles.card,
                    marginTop: 18,
                  }}
                >
                  <h3
                    style={
                      styles.cardTitle
                    }
                  >
                    Security guidance
                  </h3>

                  <ul
                    style={
                      styles.guidanceList
                    }
                  >
                    <li>
                      Use a unique password for
                      your HRMS account.
                    </li>

                    <li>
                      Never share your password
                      with another person.
                    </li>

                    <li>
                      Sign out when using a
                      shared computer.
                    </li>
                  </ul>
                </div>
              </section>
            )}

            {section === 'appearance' && (
              <section>
                <SectionHeading
                  title="Appearance"
                  description="Choose how the HRMS interface should appear on your device."
                />

                <div style={styles.card}>
                  <div
                    style={
                      styles.themeOptions
                    }
                  >
                    <ThemeOption
                      title="System"
                      description="Follow your device preference."
                      selected={
                        appearance ===
                        'system'
                      }
                      onClick={() =>
                        applyAppearance(
                          'system'
                        )
                      }
                    />

                    <ThemeOption
                      title="Light"
                      description="Use the standard light interface."
                      selected={
                        appearance ===
                        'light'
                      }
                      onClick={() =>
                        applyAppearance(
                          'light'
                        )
                      }
                    />

                    <ThemeOption
                      title="Dark"
                      description="Use a darker interface."
                      selected={
                        appearance ===
                        'dark'
                      }
                      onClick={() =>
                        applyAppearance(
                          'dark'
                        )
                      }
                    />
                  </div>

                  <div
                    style={
                      styles.formFooter
                    }
                  >
                    <button
                      type="button"
                      onClick={
                        savePreferences
                      }
                      style={
                        styles.primaryButton
                      }
                    >
                      Save preference
                    </button>
                  </div>
                </div>
              </section>
            )}

            {section === 'region' && (
              <section>
                <SectionHeading
                  title="Language & Region"
                  description="Configure the regional format used for your HRMS experience."
                />

                <div style={styles.card}>
                  <div style={styles.formGrid}>
                    <SelectField
                      label="Language"
                      value={language}
                      onChange={setLanguage}
                      options={[
                        'English',
                      ]}
                    />

                    <SelectField
                      label="Time zone"
                      value={timezone}
                      onChange={setTimezone}
                      options={[
                        'Asia/Kolkata',
                        'Asia/Dubai',
                        'Asia/Singapore',
                        'Europe/London',
                        'America/New_York',
                      ]}
                    />

                    <SelectField
                      label="Date format"
                      value={dateFormat}
                      onChange={
                        setDateFormat
                      }
                      options={[
                        'DD/MM/YYYY',
                        'MM/DD/YYYY',
                        'YYYY-MM-DD',
                      ]}
                    />

                    <SelectField
                      label="Currency"
                      value={currency}
                      onChange={setCurrency}
                      options={[
                        'INR',
                        'USD',
                        'EUR',
                        'GBP',
                      ]}
                    />
                  </div>

                  <div
                    style={
                      styles.formFooter
                    }
                  >
                    <button
                      type="button"
                      onClick={
                        savePreferences
                      }
                      style={
                        styles.primaryButton
                      }
                    >
                      Save preferences
                    </button>
                  </div>
                </div>
              </section>
            )}

            {section === 'help' && (
              <section>
                <SectionHeading
                  title="Help & Support"
                  description="Find assistance when you need help using the HRMS."
                />

                <div style={styles.helpGrid}>
                  <HelpCard
                    title="HR Support"
                    description="Contact your HR team for employee-related questions, leave, payroll and policy support."
                  />

                  <HelpCard
                    title="Account Support"
                    description="For login, password or account-access issues, contact your HRMS administrator."
                  />

                  <HelpCard
                    title="Report a problem"
                    description="If something is not working correctly, provide the issue details to your HRMS administrator."
                  />
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </HRMSLayout>
  );
}

/*
 * ============================================================
 * SMALL COMPONENTS
 * ============================================================
 */

function SettingsNavItem({
  active,
  title,
  description,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.navItem,
        ...(active
          ? styles.navItemActive
          : {}),
      }}
    >
      <span style={styles.navIconBox}>
        {icon}
      </span>

      <span style={styles.navText}>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </button>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div style={styles.sectionHeading}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={styles.field}>
      <span>{label}</span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={styles.input}
      />
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <label style={styles.field}>
      <span>{label}</span>

      <input
        value={value}
        readOnly
        style={{
          ...styles.input,
          ...styles.readOnlyInput,
        }}
      />
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={styles.field}>
      <span>{label}</span>

      <input
        type="password"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={styles.input}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label style={styles.field}>
      <span>{label}</span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={styles.input}
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div style={styles.preferenceRow}>
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <button
        type="button"
        onClick={() =>
          onChange(!checked)
        }
        aria-pressed={checked}
        style={{
          ...styles.switch,
          ...(checked
            ? styles.switchOn
            : styles.switchOff),
        }}
      >
        <span
          style={{
            ...styles.switchKnob,
            ...(checked
              ? styles.switchKnobOn
              : {}),
          }}
        />
      </button>
    </div>
  );
}

function ThemeOption({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.themeOption,
        ...(selected
          ? styles.themeOptionSelected
          : {}),
      }}
    >
      <div
        style={{
          ...styles.radio,
          ...(selected
            ? styles.radioSelected
            : {}),
        }}
      >
        {selected ? '✓' : ''}
      </div>

      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </button>
  );
}

function HelpCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div style={styles.helpCard}>
      <div style={styles.helpIcon}>
        ?
      </div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}

function formatAction(
  action: string
) {
  return action
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatDateTime(
  value: string
) {
  try {
    return new Date(value).toLocaleString(
      'en-IN',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    );
  } catch {
    return value;
  }
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '8px 0 40px',
  },

  loading: {
    padding: 40,
    textAlign: 'center',
    color: '#64748b',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#7c3aed',
    marginBottom: 6,
  },

  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 750,
    letterSpacing: '-0.02em',
    color: '#171329',
  },

  subtitle: {
    margin: '7px 0 0',
    color: '#6b7280',
    fontSize: 14,
  },

  profileMini: {
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    padding: '8px 12px',
    border: '1px solid #ece8f5',
    borderRadius: 14,
    background: '#fff',
  },

  profileMiniAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(135deg, #7c3aed, #6d28d9)',
    color: '#fff',
    fontWeight: 700,
  },

  profileMiniName: {
    fontSize: 13,
  },

  success: {
    padding: '12px 15px',
    marginBottom: 18,
    borderRadius: 10,
    background: '#ecfdf5',
    border: '1px solid #bbf7d0',
    color: '#166534',
    fontSize: 13,
  },

  error: {
    padding: '12px 15px',
    marginBottom: 18,
    borderRadius: 10,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    fontSize: 13,
  },

  layout: {
    display: 'grid',
    gridTemplateColumns:
      '270px minmax(0, 1fr)',
    gap: 22,
    alignItems: 'start',
  },

  settingsNav: {
    background: '#fff',
    border: '1px solid #ece8f5',
    borderRadius: 16,
    padding: 8,
    boxShadow:
      '0 8px 30px rgba(30, 20, 60, 0.04)',
  },

  navItem: {
    width: '100%',
    border: 0,
    background: 'transparent',
    borderRadius: 11,
    padding: '11px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    cursor: 'pointer',
    textAlign: 'left',
    color: '#4b5563',
    marginBottom: 3,
  },

  navItemActive: {
    background: '#f4f0ff',
    color: '#6d28d9',
  },

  navIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f7f5fb',
    color: '#7c3aed',
    fontWeight: 700,
    flexShrink: 0,
  },

  navText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },

  content: {
    minWidth: 0,
  },

  sectionHeading: {
    marginBottom: 16,
  },

  sectionHeadingTitle: {
    margin: 0,
  },

  card: {
    background: '#fff',
    border: '1px solid #ece8f5',
    borderRadius: 16,
    padding: 22,
    boxShadow:
      '0 8px 30px rgba(30, 20, 60, 0.04)',
  },

  profileBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 20,
    marginBottom: 20,
    borderBottom:
      '1px solid #f0edf5',
  },

  largeAvatar: {
    width: 58,
    height: 58,
    borderRadius: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(135deg, #7c3aed, #6d28d9)',
    color: '#fff',
    fontSize: 21,
    fontWeight: 750,
  },

  profileName: {
    margin: 0,
    fontSize: 18,
    color: '#171329',
  },

  profileEmail: {
    margin: '4px 0 0',
    color: '#6b7280',
    fontSize: 13,
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(2, minmax(0, 1fr))',
    gap: 17,
  },

  singleColumn: {
    display: 'grid',
    gap: 17,
    maxWidth: 560,
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },

  fieldLabel: {
    fontSize: 12,
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    height: 42,
    padding: '0 12px',
    borderRadius: 9,
    border: '1px solid #ddd8e9',
    background: '#fff',
    color: '#27213b',
    fontSize: 13,
    outline: 'none',
  },

  readOnlyInput: {
    background: '#f8f7fb',
    color: '#6b7280',
    cursor: 'not-allowed',
  },

  formFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 22,
    paddingTop: 18,
    borderTop: '1px solid #f0edf5',
  },

  primaryButton: {
    border: 0,
    borderRadius: 9,
    padding: '10px 17px',
    background:
      'linear-gradient(135deg, #7c3aed, #6d28d9)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },

  cardTitle: {
    margin: 0,
    fontSize: 16,
    color: '#211b35',
  },

  cardDescription: {
    margin: '6px 0 18px',
    fontSize: 13,
    lineHeight: 1.5,
    color: '#737083',
  },

  accountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
  },

  statusBadge: {
    padding: '5px 9px',
    borderRadius: 999,
    background: '#ecfdf5',
    color: '#15803d',
    fontSize: 11,
    fontWeight: 700,
  },

  secureBadge: {
    padding: '6px 10px',
    borderRadius: 999,
    background: '#f4f0ff',
    color: '#6d28d9',
    fontSize: 11,
    fontWeight: 700,
  },

  preferenceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    padding: '15px 0',
    borderBottom:
      '1px solid #f0edf5',
  },

  switch: {
    width: 44,
    height: 24,
    padding: 3,
    borderRadius: 999,
    border: 0,
    cursor: 'pointer',
    position: 'relative',
    flexShrink: 0,
  },

  switchOn: {
    background: '#7c3aed',
  },

  switchOff: {
    background: '#d1d5db',
  },

  switchKnob: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    transition: 'left 0.15s ease',
  },

  switchKnobOn: {
    left: 23,
  },

  activity: {
    display: 'flex',
    gap: 12,
    padding: '14px 0',
    borderBottom:
      '1px solid #f0edf5',
  },

  activityDot: {
    width: 9,
    height: 9,
    borderRadius: '50%',
    background: '#7c3aed',
    marginTop: 6,
    flexShrink: 0,
  },

  activityInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  empty: {
    padding: '30px 0',
    textAlign: 'center',
    color: '#737083',
    fontSize: 13,
  },

  guidanceList: {
    margin: 0,
    paddingLeft: 19,
    color: '#646070',
    fontSize: 13,
    lineHeight: 1.8,
  },

  themeOptions: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, minmax(0, 1fr))',
    gap: 12,
  },

  themeOption: {
    border: '1px solid #e7e2ef',
    background: '#fff',
    borderRadius: 12,
    padding: 15,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 11,
    textAlign: 'left',
    cursor: 'pointer',
  },

  themeOptionSelected: {
    border:
      '1px solid #a78bfa',
    background: '#faf8ff',
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: '1px solid #d4cfe0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 11,
    flexShrink: 0,
  },

  radioSelected: {
    border:
      '1px solid #7c3aed',
    background: '#7c3aed',
  },

  helpGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, minmax(0, 1fr))',
    gap: 15,
  },

  helpCard: {
    background: '#fff',
    border: '1px solid #ece8f5',
    borderRadius: 16,
    padding: 20,
  },

  helpIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f4f0ff',
    color: '#6d28d9',
    fontWeight: 700,
    marginBottom: 14,
  },
};