'use client';

import { useEffect, useMemo, useState } from 'react';
import HRMSLayout from '../../components/HRMSLayout';

type Employee = {
id: string;
user_id: string;
employee_code: string;
department_id: string;
designation: string;
manager_id: string | null;
joining_date: string;
employment_type: string;
work_location: string | null;
phone: string | null;
address: string | null;
status: string;
created_at: string;
updated_at: string;
first_name: string;
last_name: string;
email: string;
department: string;
};

export default function EmployeesPage() {
const [employees, setEmployees] = useState<Employee[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

const [search, setSearch] = useState('');
const [departmentFilter, setDepartmentFilter] = useState('ALL');
const [statusFilter, setStatusFilter] = useState('ALL');

const [selectedEmployee, setSelectedEmployee] =
useState<Employee | null>(null);

useEffect(() => {
loadEmployees();
}, []);

async function loadEmployees() {
const token = localStorage.getItem('hrms_token');


if (!token) {
  window.location.href = '/login';
  return;
}

try {
  setLoading(true);
  setError('');

  const response = await fetch(
    'http://localhost:5000/api/employees',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    setError(data.message || 'Unable to load employees.');
    return;
  }

  setEmployees(Array.isArray(data) ? data : []);
} catch (err) {
  console.error('Employees loading error:', err);
  setError('Unable to connect to the HRMS server.');
} finally {
  setLoading(false);
}


}

const departments = useMemo(() => {
return Array.from(
new Set(employees.map((employee) => employee.department))
);
}, [employees]);

const filteredEmployees = useMemo(() => {
const searchValue = search.toLowerCase().trim();


return employees.filter((employee) => {
  const fullName =
    `${employee.first_name} ${employee.last_name}`.toLowerCase();

  const matchesSearch =
    !searchValue ||
    fullName.includes(searchValue) ||
    employee.employee_code.toLowerCase().includes(searchValue) ||
    employee.email.toLowerCase().includes(searchValue) ||
    employee.designation.toLowerCase().includes(searchValue);

  const matchesDepartment =
    departmentFilter === 'ALL' ||
    employee.department === departmentFilter;

  const matchesStatus =
    statusFilter === 'ALL' ||
    employee.status === statusFilter;

  return (
    matchesSearch &&
    matchesDepartment &&
    matchesStatus
  );
});


}, [employees, search, departmentFilter, statusFilter]);

const activeEmployees = employees.filter(
(employee) => employee.status === 'ACTIVE'
).length;

const inactiveEmployees = employees.filter(
(employee) => employee.status !== 'ACTIVE'
).length;

function formatDate(value: string) {
return new Date(value).toLocaleDateString([], {
day: '2-digit',
month: 'short',
year: 'numeric',
});
}

function getInitials(employee: Employee) {
return `${employee.first_name.charAt(0)}${employee.last_name.charAt(
      0
    )}`.toUpperCase();
}

function formatEmploymentType(value: string) {
return value
.replace(/_/g, ' ')
.toLowerCase()
.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

return ( <HRMSLayout title="Employees"> <div className="employees-container">

```
    <section className="employees-header">
      <div>
        <p className="eyebrow employees-eyebrow">
          PEOPLE MANAGEMENT
        </p>

        <h2>Employees</h2>

        <p>
          Manage employee information, departments and employment
          details.
        </p>
      </div>

      <button
        className="add-employee-button"
        onClick={() =>
          alert(
            'Employee creation will be connected to the backend next.'
          )
        }
      >
        + Add Employee
      </button>
    </section>

    <section className="employee-summary-grid">

      <div className="employee-summary-card">
        <div className="employee-summary-icon blue">
          👥
        </div>

        <div>
          <span>Total Employees</span>
          <strong>
            {loading ? '...' : employees.length}
          </strong>
        </div>
      </div>

      <div className="employee-summary-card">
        <div className="employee-summary-icon green">
          ✓
        </div>

        <div>
          <span>Active Employees</span>
          <strong>
            {loading ? '...' : activeEmployees}
          </strong>
        </div>
      </div>

      <div className="employee-summary-card">
        <div className="employee-summary-icon orange">
          ◷
        </div>

        <div>
          <span>Inactive Employees</span>
          <strong>
            {loading ? '...' : inactiveEmployees}
          </strong>
        </div>
      </div>

      <div className="employee-summary-card">
        <div className="employee-summary-icon purple">
          🏢
        </div>

        <div>
          <span>Departments</span>
          <strong>
            {loading ? '...' : departments.length}
          </strong>
        </div>
      </div>

    </section>

    <section className="employees-card">

      <div className="employees-card-header">
        <div>
          <h3>Employee Directory</h3>

          <p>
            View and manage your organization's employees.
          </p>
        </div>

        <span className="employee-count">
          {filteredEmployees.length} employees
        </span>
      </div>

      <div className="employee-filters">

        <div className="employee-search">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search by name, code, email or designation..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(event) =>
            setDepartmentFilter(event.target.value)
          }
        >
          <option value="ALL">
            All Departments
          </option>

          {departments.map((department) => (
            <option
              key={department}
              value={department}
            >
              {department}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="ALL">
            All Status
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="INACTIVE">
            Inactive
          </option>
        </select>

      </div>

      {error && (
        <div className="employee-error">
          {error}
        </div>
      )}

      {loading ? (

        <div className="employees-loading">
          <div className="loading-spinner"></div>
          <p>Loading employees...</p>
        </div>

      ) : filteredEmployees.length === 0 ? (

        <div className="employees-empty">
          <div>👥</div>
          <h3>No employees found</h3>
          <p>
            Try changing your search or filter options.
          </p>
        </div>

      ) : (

        <div className="employee-table-wrapper">

          <table className="employee-table">

            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Employment</th>
                <th>Location</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {filteredEmployees.map((employee) => (

                <tr key={employee.id}>

                  <td>
                    <div className="employee-name-cell">

                      <div className="employee-avatar">
                        {getInitials(employee)}
                      </div>

                      <div>
                        <strong>
                          {employee.first_name}{' '}
                          {employee.last_name}
                        </strong>

                        <span>
                          {employee.email}
                        </span>
                      </div>

                    </div>
                  </td>

                  <td>
                    <span className="employee-code">
                      {employee.employee_code}
                    </span>
                  </td>

                  <td>
                    {employee.department}
                  </td>

                  <td>
                    {employee.designation}
                  </td>

                  <td>
                    {formatEmploymentType(
                      employee.employment_type
                    )}
                  </td>

                  <td>
                    {employee.work_location || '—'}
                  </td>

                  <td>
                    {formatDate(
                      employee.joining_date
                    )}
                  </td>

                  <td>
                    <span
                      className={`employee-status ${
                        employee.status === 'ACTIVE'
                          ? 'active'
                          : 'inactive'
                      }`}
                    >
                      <span className="status-circle">
                        ●
                      </span>

                      {employee.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="view-employee-button"
                      onClick={() =>
                        setSelectedEmployee(employee)
                      }
                    >
                      View
                    </button>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </section>

    {selectedEmployee && (

      <div
        className="employee-modal-overlay"
        onClick={() =>
          setSelectedEmployee(null)
        }
      >

        <div
          className="employee-modal"
          onClick={(event) =>
            event.stopPropagation()
          }
        >

          <div className="employee-modal-header">

            <div>
              <h3>Employee Details</h3>

              <p>
                Complete employee information
              </p>
            </div>

            <button
              className="modal-close-button"
              onClick={() =>
                setSelectedEmployee(null)
              }
            >
              ×
            </button>

          </div>

          <div className="employee-profile-header">

            <div className="large-employee-avatar">
              {getInitials(selectedEmployee)}
            </div>

            <div>

              <h2>
                {selectedEmployee.first_name}{' '}
                {selectedEmployee.last_name}
              </h2>

              <p>
                {selectedEmployee.designation}
              </p>

              <span
                className={`employee-status ${
                  selectedEmployee.status === 'ACTIVE'
                    ? 'active'
                    : 'inactive'
                }`}
              >
                <span className="status-circle">
                  ●
                </span>

                {selectedEmployee.status}
              </span>

            </div>

          </div>

          <div className="employee-details-grid">

            <div className="detail-item">
              <span>Employee ID</span>
              <strong>
                {selectedEmployee.employee_code}
              </strong>
            </div>

            <div className="detail-item">
              <span>Email</span>
              <strong>
                {selectedEmployee.email}
              </strong>
            </div>

            <div className="detail-item">
              <span>Department</span>
              <strong>
                {selectedEmployee.department}
              </strong>
            </div>

            <div className="detail-item">
              <span>Designation</span>
              <strong>
                {selectedEmployee.designation}
              </strong>
            </div>

            <div className="detail-item">
              <span>Employment Type</span>
              <strong>
                {formatEmploymentType(
                  selectedEmployee.employment_type
                )}
              </strong>
            </div>

            <div className="detail-item">
              <span>Joining Date</span>
              <strong>
                {formatDate(
                  selectedEmployee.joining_date
                )}
              </strong>
            </div>

            <div className="detail-item">
              <span>Work Location</span>
              <strong>
                {selectedEmployee.work_location ||
                  'Not specified'}
              </strong>
            </div>

            <div className="detail-item">
              <span>Phone</span>
              <strong>
                {selectedEmployee.phone ||
                  'Not specified'}
              </strong>
            </div>

            <div className="detail-item">
              <span>Address</span>
              <strong>
                {selectedEmployee.address ||
                  'Not specified'}
              </strong>
            </div>

          </div>

        </div>

      </div>

    )}

  </div>
</HRMSLayout>


);
}
