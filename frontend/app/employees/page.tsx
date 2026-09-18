'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import HRMSLayout from '../../components/HRMSLayout';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

type IconName =
  | 'eye'
  | 'edit'
  | 'status'
  | 'users'
  | 'building'
  | 'briefcase'
  | 'plus'
  | 'refresh'
  | 'file'
  | 'shield'
  | 'lock'
  | 'unlock'
  | 'key'
  | 'clock'
  | 'arrow';

function Icon({
  name,
  size = 17,
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
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
      );

    case 'status':
      return (
        <svg {...common}>
          <path d="M13 2 3 14h8l-1 8 10-12h-8Z" />
        </svg>
      );

    case 'users':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case 'building':
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16" />
          <path d="M16 8h3a2 2 0 0 1 2 2v11" />
          <path d="M9 7h3M9 11h3M9 15h3M9 19h3" />
        </svg>
      );

    case 'briefcase':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
        </svg>
      );

    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );

    case 'refresh':
      return (
        <svg {...common}>
          <path d="M20 11a8.1 8.1 0 0 0-14.9-3L3 11" />
          <path d="M3 5v6h6" />
          <path d="M4 13a8.1 8.1 0 0 0 14.9 3L21 13" />
          <path d="M21 19v-6h-6" />
        </svg>
      );

    case 'file':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8M8 17h6" />
        </svg>
      );

    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case 'lock':
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );

    case 'unlock':
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 7-2" />
        </svg>
      );

    case 'key':
      return (
        <svg {...common}>
          <circle cx="8" cy="15" r="4" />
          <path d="m11 12 9-9M16 5l3 3M14 7l3 3" />
        </svg>
      );

    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case 'arrow':
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
  }
}

type Employee = {
  id: number;
  user_id?: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  department_id?: number | null;
  department?: string | null;
  designation?: string | null;
  designation_id?: number | null;
  manager_id?: number | null;
  manager_name?: string | null;
  joining_date?: string | null;
  employment_type?: string | null;
  work_location?: string | null;
  status: string;
  role?: string | null;
  is_active?: boolean;
};

type Department = {
  id: number;
  name: string;
  description?: string | null;
  employee_count?: number;
};

type Designation = {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  employee_count?: number;
};

type Manager = {
  id: number;
  employee_code: string;
  name: string;
  designation?: string | null;
  status: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Statistics = {
  total: number;
  active: number;
  onLeave: number;
  departments: number;
};

type EmployeesResponse = {
  data?: Employee[];
  employees?: Employee[];
  pagination?: Pagination;
  statistics?: Statistics;
};

type ProfileData = {
  employee?: Employee;
  attendance?: {
    total?: number;
    present?: number;
    absent?: number;
    excused?: number;
    workedMinutes?: number;
    attendancePercentage?: number;
  };
  leave?: {
    total?: number;
    approved?: number;
    pending?: number;
    rejected?: number;
    cancelled?: number;
    approvedDays?: number;
  };
  payroll?: {
    basicSalary?: number;
    hra?: number;
    allowances?: number;
    deductions?: number;
    grossSalary?: number;
    totalDeductions?: number;
    netSalary?: number;
    payMonth?: number;
    payYear?: number;
    status?: string;
  };
  performance?: {
    totalGoals?: number;
    totalReviews?: number;
    averageRating?: number | null;
  };
  manager?: {
    id?: number;
    name?: string;
    email?: string;
    role?: string;
    designation?: string;
  };
  activityHistory?: ProfileActivity[];
  activity?: any[];
};

type ProfileActivity = {
  id: number | string;
  user_id?: number | string | null;
  action?: string | null;
  entity_type?: string | null;
  entity_id?: number | string | null;
  details?: string | Record<string, unknown> | null;
  ip_address?: string | null;
  created_at?: string | null;
  actor_first_name?: string | null;
  actor_last_name?: string | null;
  actor_email?: string | null;
  actor_role?: string | null;
};

type EmployeeDocument = {
  id: number;
  employee_id: number;
  document_name: string;
  document_type: string;
  file_url?: string | null;
  description?: string | null;
  status: string;
  uploaded_by?: number | null;
  uploaded_by_name?: string | null;
  uploaded_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type DocumentForm = {
  documentName: string;
  documentType: string;
  fileUrl: string;
  description: string;
  status: string;
};

const DOCUMENT_TYPES = [
  'RESUME',
  'ID_PROOF',
  'ADDRESS_PROOF',
  'OFFER_LETTER',
  'JOINING_DOCUMENTS',
  'EMPLOYMENT_AGREEMENT',
  'CERTIFICATE',
  'OTHER_HR_DOCUMENT',
];

const DOCUMENT_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'ACTIVE',
];

const emptyDocumentForm: DocumentForm = {
  documentName: '',
  documentType: 'OTHER_HR_DOCUMENT',
  fileUrl: '',
  description: '',
  status: 'PENDING',
};

type AddEmployeeForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  employeeCode: string;
  joiningDate: string;
  departmentId: string;
  designationId: string;
  managerId: string;
  employmentType: string;
  workLocation: string;
  status: string;
  loginEmail: string;
  temporaryPassword: string;
  role: string;
  isActive: boolean;
};

type EditEmployeeForm = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  departmentId: string;
  designationId: string;
  managerId: string;
  joiningDate: string;
  employmentType: string;
  workLocation: string;
  status: string;
};

type DepartmentForm = {
  name: string;
  description: string;
};

type DesignationForm = {
  name: string;
  description: string;
  isActive: boolean;
};

const STATUS_OPTIONS = [
  'ACTIVE',
  'INACTIVE',
  'ON_LEAVE',
  'SUSPENDED',
  'TERMINATED',
];

const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERN',
  'TEMPORARY',
];

const emptyAddForm: AddEmployeeForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  employeeCode: '',
  joiningDate: '',
  departmentId: '',
  designationId: '',
  managerId: '',
  employmentType: 'FULL_TIME',
  workLocation: 'Hyderabad',
  status: 'ACTIVE',
  loginEmail: '',
  temporaryPassword: 'Password@123',
  role: 'EMPLOYEE',
  isActive: true,
};

const emptyEditForm: EditEmployeeForm = {
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  departmentId: '',
  designationId: '',
  managerId: '',
  joiningDate: '',
  employmentType: 'FULL_TIME',
  workLocation: '',
  status: 'ACTIVE',
};

const emptyDepartmentForm: DepartmentForm = {
  name: '',
  description: '',
};

const emptyDesignationForm: DesignationForm = {
  name: '',
  description: '',
  isActive: true,
};

function getToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return localStorage.getItem('hrms_token') || '';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

async function apiRequest(
  url: string,
  options: RequestInit = {}
) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }

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

function formatCurrency(value?: number) {
  if (
    value === undefined ||
    value === null
  ) {
    return '₹0';
  }

  return `₹${Number(value).toLocaleString(
    'en-IN'
  )}`;
}

function prettyValue(
  value?: string | null
) {
  if (!value) {
    return '—';
  }

  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function statusClass(status: string) {
  return (
    'status-pill status-' +
    status.toLowerCase()
  );
}

function documentStatusClass(
  status: string
) {
  return (
    'document-status document-status-' +
    status.toLowerCase()
  );
}

export default function EmployeesPage() {
  /*
  |--------------------------------------------------------------------------
  | DIRECTORY
  |--------------------------------------------------------------------------
  */
  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [
    departmentsList,
    setDepartmentsList,
  ] = useState<Department[]>([]);

  const [
    designationsList,
    setDesignationsList,
  ] = useState<Designation[]>([]);

  const [
    managersList,
    setManagersList,
  ] = useState<Manager[]>([]);

  const [
    employmentTypes,
    setEmploymentTypes,
  ] = useState<string[]>(
    EMPLOYMENT_TYPES
  );

  const [
    statuses,
    setStatuses,
  ] = useState<string[]>(
    STATUS_OPTIONS
  );

  const [loading, setLoading] =
    useState(true);

  const [currentRole, setCurrentRole] =
    useState<string>('EMPLOYEE');

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [
    departmentFilter,
    setDepartmentFilter,
  ] = useState('');

  const [
    designationFilter,
    setDesignationFilter,
  ] = useState('');

  const [
    managerFilter,
    setManagerFilter,
  ] = useState('');

  const [
    employmentTypeFilter,
    setEmploymentTypeFilter,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('');

  const [
    locationFilter,
    setLocationFilter,
  ] = useState('');

  const [sortBy, setSortBy] =
    useState('created_at');

  const [sortOrder, setSortOrder] =
    useState('desc');

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(10);

  const [
    pagination,
    setPagination,
  ] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [
    statistics,
    setStatistics,
  ] = useState<Statistics>({
    total: 0,
    active: 0,
    onLeave: 0,
    departments: 0,
  });

  /*
  |--------------------------------------------------------------------------
  | MODALS
  |--------------------------------------------------------------------------
  */
  const [showAdd, setShowAdd] =
    useState(false);

  const [showProfile, setShowProfile] =
    useState(false);

  const [showEdit, setShowEdit] =
    useState(false);

  const [
    showDepartments,
    setShowDepartments,
  ] = useState(false);

  const [
    showDesignations,
    setShowDesignations,
  ] = useState(false);

  const [
    showStatusManager,
    setShowStatusManager,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | ADD EMPLOYEE
  |--------------------------------------------------------------------------
  */
  const [addForm, setAddForm] =
    useState<AddEmployeeForm>(
      emptyAddForm
    );

  const [addError, setAddError] =
    useState('');

  const [addSuccess, setAddSuccess] =
    useState('');

  const [adding, setAdding] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | EDIT EMPLOYEE
  |--------------------------------------------------------------------------
  */
  const [
    editingEmployee,
    setEditingEmployee,
  ] = useState<Employee | null>(null);

  const [
    editForm,
    setEditForm,
  ] = useState<EditEmployeeForm>(
    emptyEditForm
  );

  const [
    editError,
    setEditError,
  ] = useState('');

  const [
    editSuccess,
    setEditSuccess,
  ] = useState('');

  const [updating, setUpdating] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | PROFILE
  |--------------------------------------------------------------------------
  */
  const [
    selectedEmployee,
    setSelectedEmployee,
  ] = useState<Employee | null>(
    null
  );

  const [
    profile,
    setProfile,
  ] = useState<ProfileData | null>(
    null
  );

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(false);

  const [
    profileError,
    setProfileError,
  ] = useState('');

  /*
  |--------------------------------------------------------------------------
  | DOCUMENTS
  |--------------------------------------------------------------------------
  */
  const [
    employeeDocuments,
    setEmployeeDocuments,
  ] = useState<EmployeeDocument[]>(
    []
  );

  const [
    documentsLoading,
    setDocumentsLoading,
  ] = useState(false);

  const [
    documentsError,
    setDocumentsError,
  ] = useState('');

  const [
    documentsSuccess,
    setDocumentsSuccess,
  ] = useState('');

  const [
    showDocumentForm,
    setShowDocumentForm,
  ] = useState(false);

  const [
    editingDocument,
    setEditingDocument,
  ] = useState<EmployeeDocument | null>(
    null
  );

  const [
    documentForm,
    setDocumentForm,
  ] = useState<DocumentForm>(
    emptyDocumentForm
  );

  const [
    documentSaving,
    setDocumentSaving,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */
  const [
    statusEmployee,
    setStatusEmployee,
  ] = useState<Employee | null>(
    null
  );

  const [
    newStatus,
    setNewStatus,
  ] = useState('ACTIVE');

  const [
    statusSaving,
    setStatusSaving,
  ] = useState(false);

  const [
    statusError,
    setStatusError,
  ] = useState('');

  /*
  |--------------------------------------------------------------------------
  | ACCOUNT CONTROLS
  |--------------------------------------------------------------------------
  */
  const [showAccountControls, setShowAccountControls] =
    useState(false);

  const [accountAction, setAccountAction] = useState<
    'password' | 'role'
  >('password');

  const [accountPassword, setAccountPassword] = useState('');
  const [accountPasswordConfirm, setAccountPasswordConfirm] =
    useState('');
  const [accountRole, setAccountRole] = useState('EMPLOYEE');
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');

  /*
  |--------------------------------------------------------------------------
  | DEPARTMENT MANAGEMENT
  |--------------------------------------------------------------------------
  */
  const [
    departmentForm,
    setDepartmentForm,
  ] = useState<DepartmentForm>(
    emptyDepartmentForm
  );

  const [
    departmentEditingId,
    setDepartmentEditingId,
  ] = useState<number | null>(
    null
  );

  const [
    departmentError,
    setDepartmentError,
  ] = useState('');

  const [
    departmentSuccess,
    setDepartmentSuccess,
  ] = useState('');

  const [
    departmentSaving,
    setDepartmentSaving,
  ] = useState(false);

  const [
    departmentAssignEmployee,
    setDepartmentAssignEmployee,
  ] = useState('');

  /*
  |--------------------------------------------------------------------------
  | DESIGNATION MANAGEMENT
  |--------------------------------------------------------------------------
  */
  const [
    designationForm,
    setDesignationForm,
  ] = useState<DesignationForm>(
    emptyDesignationForm
  );

  const [
    designationEditingId,
    setDesignationEditingId,
  ] = useState<number | null>(
    null
  );

  const [
    designationError,
    setDesignationError,
  ] = useState('');

  const [
    designationSuccess,
    setDesignationSuccess,
  ] = useState('');

  const [
    designationSaving,
    setDesignationSaving,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD OPTIONS
  |--------------------------------------------------------------------------
  */
  async function loadOptions() {
    try {
      const data =
        await apiRequest(
          `${API}/employee-management/options`
        );

      setDepartmentsList(
        data.departments || []
      );

      setDesignationsList(
        data.designations || []
      );

      setManagersList(
        data.managers || []
      );

      if (
        Array.isArray(
          data.employmentTypes
        )
      ) {
        setEmploymentTypes(
          data.employmentTypes
        );
      }

      if (
        Array.isArray(
          data.statuses
        )
      ) {
        setStatuses(data.statuses);
      }
    } catch (err) {
      console.error(
        'Options error:',
        err
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD EMPLOYEES
  |--------------------------------------------------------------------------
  */
  async function loadEmployees() {
    setLoading(true);
    setError('');

    try {
      const params =
        new URLSearchParams();

      params.set(
        'page',
        String(page)
      );

      params.set(
        'limit',
        String(limit)
      );

      if (search.trim()) {
        params.set(
          'search',
          search.trim()
        );
      }

      if (departmentFilter) {
        params.set(
          'departmentId',
          departmentFilter
        );
      }

      if (designationFilter) {
        params.set(
          'designation',
          designationFilter
        );
      }

      if (managerFilter) {
        params.set(
          'managerId',
          managerFilter
        );
      }

      if (employmentTypeFilter) {
        params.set(
          'employmentType',
          employmentTypeFilter
        );
      }

      if (statusFilter) {
        params.set(
          'status',
          statusFilter
        );
      }

      if (locationFilter) {
        params.set(
          'workLocation',
          locationFilter
        );
      }

      params.set('sortBy', sortBy);
      params.set(
        'sortOrder',
        sortOrder
      );

      const data: EmployeesResponse =
        await apiRequest(
          `${API}/employees?${params.toString()}`
        );

      const employeeData =
        data.data ||
        data.employees ||
        [];

      setEmployees(employeeData);

      if (data.pagination) {
        setPagination(
          data.pagination
        );
      }

      if (data.statistics) {
        setStatistics(
          data.statistics
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load employees'
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD DEPARTMENTS
  |--------------------------------------------------------------------------
  */
  async function loadDepartments() {
    try {
      const data =
        await apiRequest(
          `${API}/employee-management/departments`
        );

      setDepartmentsList(
        Array.isArray(data)
          ? data
          : data.departments || []
      );
    } catch (err) {
      console.error(
        'Departments error:',
        err
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD DESIGNATIONS
  |--------------------------------------------------------------------------
  */
  async function loadDesignations() {
    try {
      const data =
        await apiRequest(
          `${API}/employee-management/designations`
        );

      setDesignationsList(
        Array.isArray(data)
          ? data
          : data.designations || []
      );
    } catch (err) {
      console.error(
        'Designations error:',
        err
      );
    }
  }

 /*
|--------------------------------------------------------------------------
| DOCUMENTS - LOAD
|--------------------------------------------------------------------------
*/
async function loadEmployeeDocuments(
  employeeId: number
) {
  setDocumentsLoading(true);
  setDocumentsError('');

  try {
    const data =
      await apiRequest(
        `${API}/employee-management/employees/${employeeId}/documents`
      );

    const documents =
      Array.isArray(data)
        ? data
        : data.data ||
          data.documents ||
          [];

    setEmployeeDocuments(
      documents
    );
  } catch (err) {
    setEmployeeDocuments([]);

    setDocumentsError(
      err instanceof Error
        ? err.message
        : 'Failed to load employee documents'
    );
  } finally {
    setDocumentsLoading(false);
  }
}

/*
|--------------------------------------------------------------------------
| DOCUMENTS - OPEN ADD FORM
|--------------------------------------------------------------------------
*/
function openAddDocument() {
  setEditingDocument(null);

  setDocumentForm({
    ...emptyDocumentForm,
  });

  setDocumentsError('');
  setDocumentsSuccess('');
  setShowDocumentForm(true);
}

/*
|--------------------------------------------------------------------------
| DOCUMENTS - OPEN EDIT FORM
|--------------------------------------------------------------------------
*/
function openEditDocument(
  document: EmployeeDocument
) {
  setEditingDocument(
    document
  );

  setDocumentForm({
    documentName:
      document.document_name ||
      '',
    documentType:
      document.document_type ||
      'OTHER_HR_DOCUMENT',
    fileUrl:
      document.file_url ||
      '',
    description:
      document.description ||
      '',
    status:
      document.status ||
      'PENDING',
  });

  setDocumentsError('');
  setDocumentsSuccess('');
  setShowDocumentForm(true);
}

/*
|--------------------------------------------------------------------------
| DOCUMENTS - SAVE
|--------------------------------------------------------------------------
*/
async function saveEmployeeDocument(
  event: FormEvent
) {
  event.preventDefault();

  if (!selectedEmployee) {
    return;
  }

  setDocumentSaving(true);
  setDocumentsError('');
  setDocumentsSuccess('');

  if (
    !documentForm.documentName.trim()
  ) {
    setDocumentsError(
      'Document name is required.'
    );

    setDocumentSaving(false);
    return;
  }

  if (
    !documentForm.fileUrl.trim()
  ) {
    setDocumentsError(
      'File URL or document link is required.'
    );

    setDocumentSaving(false);
    return;
  }

  try {
    const payload = {
      documentName:
        documentForm.documentName.trim(),

      documentType:
        documentForm.documentType,

      fileUrl:
        documentForm.fileUrl.trim(),

      description:
        documentForm.description.trim(),

      status:
        documentForm.status,
    };

    let response;

    /*
    |----------------------------------------------------------------------
    | UPDATE EXISTING DOCUMENT
    |----------------------------------------------------------------------
    */
    if (editingDocument) {
      response =
        await apiRequest(
          `${API}/employee-management/employees/${selectedEmployee.id}/documents/${editingDocument.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(
              payload
            ),
          }
        );
    }

    /*
    |----------------------------------------------------------------------
    | ADD NEW DOCUMENT
    |----------------------------------------------------------------------
    */
    else {
      response =
        await apiRequest(
          `${API}/employee-management/employees/${selectedEmployee.id}/documents`,
          {
            method: 'POST',
            body: JSON.stringify(
              payload
            ),
          }
        );
    }

    setDocumentsSuccess(
      response.message ||
        (editingDocument
          ? 'Document updated successfully'
          : 'Document added successfully')
    );

    setDocumentForm({
      ...emptyDocumentForm,
    });

    setEditingDocument(null);
    setShowDocumentForm(false);

    await loadEmployeeDocuments(
      selectedEmployee.id
    );
  } catch (err) {
    setDocumentsError(
      err instanceof Error
        ? err.message
        : 'Failed to save document'
    );
  } finally {
    setDocumentSaving(false);
  }
}

/*
|--------------------------------------------------------------------------
| DOCUMENTS - DELETE
|--------------------------------------------------------------------------
*/
async function deleteEmployeeDocument(
  document: EmployeeDocument
) {
  if (!selectedEmployee) {
    return;
  }

  const confirmed =
    window.confirm(
      `Delete document "${document.document_name}"?`
    );

  if (!confirmed) {
    return;
  }

  setDocumentsError('');
  setDocumentsSuccess('');

  try {
    const response =
      await apiRequest(
        `${API}/employee-management/employees/${selectedEmployee.id}/documents/${document.id}`,
        {
          method: 'DELETE',
        }
      );

    setDocumentsSuccess(
      response.message ||
        'Document deleted successfully'
    );

    await loadEmployeeDocuments(
      selectedEmployee.id
    );
  } catch (err) {
    setDocumentsError(
      err instanceof Error
        ? err.message
        : 'Failed to delete document'
    );
  }
}

useEffect(() => {
  loadOptions();

  try {
    const rawUser =
      localStorage.getItem(
        'hrms_user'
      );

    if (rawUser) {
      const parsedUser =
        JSON.parse(rawUser);

      setCurrentRole(
        parsedUser?.role ||
          'EMPLOYEE'
      );
    }
  } catch {
    setCurrentRole('EMPLOYEE');
  }
}, []);

useEffect(() => {
  loadEmployees();
}, [
  page,
  limit,
  search,
  departmentFilter,
  designationFilter,
  managerFilter,
  employmentTypeFilter,
  statusFilter,
  locationFilter,
  sortBy,
  sortOrder,
]);

/*
|--------------------------------------------------------------------------
| LOCATIONS
|--------------------------------------------------------------------------
*/
const locations = useMemo(() => {
  return Array.from(
    new Set(
      employees
        .map(
          (employee) =>
            employee.work_location
        )
        .filter(Boolean)
    )
  ) as string[];
}, [employees]);

/*
|--------------------------------------------------------------------------
| ADD EMPLOYEE
|--------------------------------------------------------------------------
*/
async function addEmployee(
  event: FormEvent
) {
  event.preventDefault();

  setAddError('');
  setAddSuccess('');

  const requiredFields = [
    {
      value: addForm.firstName,
      label: 'First Name',
    },
    {
      value: addForm.lastName,
      label: 'Last Name',
    },
    {
      value: addForm.email,
      label: 'Email',
    },
    {
      value: addForm.employeeCode,
      label: 'Employee Code',
    },
    {
      value:
        addForm.temporaryPassword,
      label: 'Temporary Password',
    },
  ];

  const missingField =
    requiredFields.find(
      (field) =>
        !field.value.trim()
    );

  if (missingField) {
    setAddError(
      `${missingField.label} is required.`
    );
    return;
  }

  setAdding(true);

  try {
    const response =
      await apiRequest(
        `${API}/employees`,
        {
          method: 'POST',
          body: JSON.stringify({
            firstName:
              addForm.firstName,

            lastName:
              addForm.lastName,

            email:
              addForm.email,

            phone:
              addForm.phone,

            address:
              addForm.address,

            employeeCode:
              addForm.employeeCode,

            joiningDate:
              addForm.joiningDate,

            departmentId:
              addForm.departmentId
                ? Number(
                    addForm.departmentId
                  )
                : null,

            designationId:
              addForm.designationId
                ? Number(
                    addForm.designationId
                  )
                : null,

            designation:
              addForm.designationId
                ? designationsList.find(
                    (item) =>
                      String(
                        item.id
                      ) ===
                      addForm.designationId
                  )?.name
                : null,

            managerId:
              addForm.managerId
                ? Number(
                    addForm.managerId
                  )
                : null,

            employmentType:
              addForm.employmentType,

            workLocation:
              addForm.workLocation,

            status:
              addForm.status,

            loginEmail:
              addForm.loginEmail ||
              addForm.email,

            password:
              addForm.temporaryPassword,

            role:
              addForm.role,

            isActive:
              addForm.isActive,
          }),
        }
      );

    setAddSuccess(
      response.message ||
        'Employee created successfully'
    );

    setAddForm(
      emptyAddForm
    );

    await loadOptions();
    await loadEmployees();

    setTimeout(() => {
      setShowAdd(false);
      setAddSuccess('');
    }, 900);
  } catch (err) {
    setAddError(
      err instanceof Error
        ? err.message
        : 'Failed to create employee'
    );
  } finally {
    setAdding(false);
  }
}

/*
|--------------------------------------------------------------------------
| PROFILE
|--------------------------------------------------------------------------
*/
async function openProfile(
  employee: Employee
) {
  setSelectedEmployee(
    employee
  );

  setProfile(null);
  setProfileError('');
  setProfileLoading(true);

  setEmployeeDocuments([]);
  setDocumentsError('');
  setDocumentsSuccess('');
  setShowDocumentForm(false);

  setShowProfile(true);

  try {
    const [
      profileResponse,
    ] = await Promise.all([
      apiRequest(
        `${API}/employees/${employee.id}/profile`
      ),

      loadEmployeeDocuments(
        employee.id
      ),
    ]);

    setProfile(
      profileResponse.data ||
        profileResponse
    );
  } catch (err) {
    setProfileError(
      err instanceof Error
        ? err.message
        : 'Failed to load profile'
    );
  } finally {
    setProfileLoading(false);
  }
}
  /*
  |--------------------------------------------------------------------------
  | EDIT EMPLOYEE
  |--------------------------------------------------------------------------
  */
  function openEditEmployee(
    employee: Employee
  ) {
    setEditingEmployee(
      employee
    );

    const matchingDesignation =
      employee.designation_id
        ? String(
            employee.designation_id
          )
        : designationsList.find(
            (item) =>
              item.name.toLowerCase() ===
              (
                employee.designation ||
                ''
              ).toLowerCase()
          )?.id
          ? String(
              designationsList.find(
                (item) =>
                  item.name.toLowerCase() ===
                  (
                    employee.designation ||
                    ''
                  ).toLowerCase()
              )!.id
            )
          : '';

    setEditForm({
      firstName:
        employee.first_name || '',
      lastName:
        employee.last_name || '',
      phone:
        employee.phone || '',
      address:
        employee.address || '',
      departmentId:
        employee.department_id
          ? String(
              employee.department_id
            )
          : '',
      designationId:
        matchingDesignation,
      managerId:
        employee.manager_id
          ? String(
              employee.manager_id
            )
          : '',
      joiningDate:
        employee.joining_date
          ? employee.joining_date.slice(
              0,
              10
            )
          : '',
      employmentType:
        employee.employment_type ||
        'FULL_TIME',
      workLocation:
        employee.work_location ||
        '',
      status:
        employee.status ||
        'ACTIVE',
    });

    setEditError('');
    setEditSuccess('');
    setShowEdit(true);
  }

  async function updateEmployee(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!editingEmployee) {
      return;
    }

    setUpdating(true);
    setEditError('');
    setEditSuccess('');

    try {
      const response =
        await apiRequest(
          `${API}/employee-management/employees/${editingEmployee.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              firstName:
                editForm.firstName,
              lastName:
                editForm.lastName,
              phone:
                editForm.phone,
              address:
                editForm.address,
              departmentId:
                editForm.departmentId
                  ? Number(
                      editForm.departmentId
                    )
                  : null,
              designationId:
                editForm.designationId
                  ? Number(
                      editForm.designationId
                    )
                  : null,
              managerId:
                editForm.managerId
                  ? Number(
                      editForm.managerId
                    )
                  : null,
              joiningDate:
                editForm.joiningDate ||
                null,
              employmentType:
                editForm.employmentType,
              workLocation:
                editForm.workLocation,
              status:
                editForm.status,
            }),
          }
        );

      setEditSuccess(
        response.message ||
          'Employee updated successfully'
      );

      await loadOptions();
      await loadDepartments();
      await loadDesignations();
      await loadEmployees();

      setTimeout(() => {
        setShowEdit(false);
        setEditSuccess('');
      }, 900);
    } catch (err) {
      setEditError(
        err instanceof Error
          ? err.message
          : 'Failed to update employee'
      );
    } finally {
      setUpdating(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | STATUS MANAGEMENT
  |--------------------------------------------------------------------------
  */
  function openStatusManager(
    employee: Employee
  ) {
    setStatusEmployee(
      employee
    );

    setNewStatus(
      employee.status
    );

    setStatusError('');
    setShowStatusManager(true);
  }

  async function saveEmployeeStatus() {
    if (!statusEmployee) {
      return;
    }

    setStatusSaving(true);
    setStatusError('');

    try {
      await apiRequest(
        `${API}/employee-management/employees/${statusEmployee.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      await loadEmployees();
      await loadOptions();

      setShowStatusManager(false);
      setStatusEmployee(null);
    } catch (err) {
      setStatusError(
        err instanceof Error
          ? err.message
          : 'Failed to update status'
      );
    } finally {
      setStatusSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ACCOUNT CONTROLS
  |--------------------------------------------------------------------------
  */
  function openAccountControls(
    employee: Employee,
    action: 'password' | 'role'
  ) {
    setAccountAction(action);
    setAccountPassword('');
    setAccountPasswordConfirm('');
    setAccountRole(employee.role || 'EMPLOYEE');
    setAccountError('');
    setAccountSuccess('');
    setShowAccountControls(true);
  }

  async function refreshSelectedEmployeeProfile() {
    if (!selectedEmployee) return;

    const response = await apiRequest(
      `${API}/employees/${selectedEmployee.id}/profile`
    );

    const nextProfile =
      response.data || response;

    setProfile(nextProfile);

    if (nextProfile.employee) {
      setSelectedEmployee(nextProfile.employee);
    }
  }

  async function saveAccountControl() {
    if (!selectedEmployee) return;

    setAccountSaving(true);
    setAccountError('');
    setAccountSuccess('');

    try {
      if (accountAction === 'password') {
        if (accountPassword.length < 8) {
          throw new Error(
            'Password must be at least 8 characters long.'
          );
        }

        if (accountPassword !== accountPasswordConfirm) {
          throw new Error(
            'New password and confirmation password do not match.'
          );
        }

        await apiRequest(
          `${API}/employee-management/employees/${selectedEmployee.id}/reset-password`,
          {
            method: 'POST',
            body: JSON.stringify({
              password: accountPassword,
            }),
          }
        );

        setAccountSuccess(
          'Employee password reset successfully.'
        );
      } else {
        await apiRequest(
          `${API}/employee-management/employees/${selectedEmployee.id}/account-role`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              role: accountRole,
            }),
          }
        );

        setAccountSuccess(
          'Employee account role updated successfully.'
        );
      }

      await loadEmployees();
      await refreshSelectedEmployeeProfile();

      setTimeout(() => {
        setShowAccountControls(false);
        setAccountSuccess('');
      }, 900);
    } catch (err) {
      setAccountError(
        err instanceof Error
          ? err.message
          : 'Failed to update account controls.'
      );
    } finally {
      setAccountSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DEPARTMENT MANAGEMENT
  |--------------------------------------------------------------------------
  */
  function startEditDepartment(
    department: Department
  ) {
    setDepartmentEditingId(
      department.id
    );

    setDepartmentForm({
      name: department.name,
      description:
        department.description ||
        '',
    });

    setDepartmentError('');
    setDepartmentSuccess('');
  }

  function cancelDepartmentEdit() {
    setDepartmentEditingId(null);

    setDepartmentForm(
      emptyDepartmentForm
    );
  }

  async function saveDepartment(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !departmentForm.name.trim()
    ) {
      setDepartmentError(
        'Department name is required'
      );

      return;
    }

    setDepartmentSaving(true);
    setDepartmentError('');
    setDepartmentSuccess('');

    try {
      if (
        departmentEditingId
      ) {
        await apiRequest(
          `${API}/employee-management/departments/${departmentEditingId}`,
          {
            method: 'PUT',
            body: JSON.stringify(
              departmentForm
            ),
          }
        );

        setDepartmentSuccess(
          'Department updated successfully'
        );
      } else {
        await apiRequest(
          `${API}/employee-management/departments`,
          {
            method: 'POST',
            body: JSON.stringify(
              departmentForm
            ),
          }
        );

        setDepartmentSuccess(
          'Department created successfully'
        );
      }

      setDepartmentForm(
        emptyDepartmentForm
      );

      setDepartmentEditingId(null);

      await loadDepartments();
      await loadOptions();
      await loadEmployees();
    } catch (err) {
      setDepartmentError(
        err instanceof Error
          ? err.message
          : 'Department operation failed'
      );
    } finally {
      setDepartmentSaving(false);
    }
  }

  async function deleteDepartment(
    department: Department
  ) {
    const confirmed =
      window.confirm(
        `Delete department "${department.name}"?`
      );

    if (!confirmed) {
      return;
    }

    setDepartmentError('');
    setDepartmentSuccess('');

    try {
      await apiRequest(
        `${API}/employee-management/departments/${department.id}`,
        {
          method: 'DELETE',
        }
      );

      setDepartmentSuccess(
        'Department deleted successfully'
      );

      await loadDepartments();
      await loadOptions();
      await loadEmployees();
    } catch (err) {
      setDepartmentError(
        err instanceof Error
          ? err.message
          : 'Failed to delete department'
      );
    }
  }

  async function assignDepartment(
    employeeId: number
  ) {
    if (
      !departmentAssignEmployee
    ) {
      return;
    }

    try {
      await apiRequest(
        `${API}/employee-management/employees/${employeeId}/department`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            departmentId:
              Number(
                departmentAssignEmployee
              ),
          }),
        }
      );

      setDepartmentSuccess(
        'Employee assigned successfully'
      );

      setDepartmentAssignEmployee(
        ''
      );

      await loadDepartments();
      await loadOptions();
      await loadEmployees();
    } catch (err) {
      setDepartmentError(
        err instanceof Error
          ? err.message
          : 'Failed to assign department'
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DESIGNATION MANAGEMENT
  |--------------------------------------------------------------------------
  */
  function startEditDesignation(
    designation: Designation
  ) {
    setDesignationEditingId(
      designation.id
    );

    setDesignationForm({
      name: designation.name,
      description:
        designation.description ||
        '',
      isActive:
        designation.is_active,
    });

    setDesignationError('');
    setDesignationSuccess('');
  }

  function cancelDesignationEdit() {
    setDesignationEditingId(null);

    setDesignationForm(
      emptyDesignationForm
    );
  }

  async function saveDesignation(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !designationForm.name.trim()
    ) {
      setDesignationError(
        'Designation name is required'
      );

      return;
    }

    setDesignationSaving(true);
    setDesignationError('');
    setDesignationSuccess('');

    try {
      if (
        designationEditingId
      ) {
        await apiRequest(
          `${API}/employee-management/designations/${designationEditingId}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              name:
                designationForm.name,
              description:
                designationForm.description,
              isActive:
                designationForm.isActive,
            }),
          }
        );

        setDesignationSuccess(
          'Designation updated successfully'
        );
      } else {
        await apiRequest(
          `${API}/employee-management/designations`,
          {
            method: 'POST',
            body: JSON.stringify({
              name:
                designationForm.name,
              description:
                designationForm.description,
            }),
          }
        );

        setDesignationSuccess(
          'Designation created successfully'
        );
      }

      setDesignationForm(
        emptyDesignationForm
      );

      setDesignationEditingId(null);

      await loadDesignations();
      await loadOptions();
      await loadEmployees();
    } catch (err) {
      setDesignationError(
        err instanceof Error
          ? err.message
          : 'Designation operation failed'
      );
    } finally {
      setDesignationSaving(false);
    }
  }

  async function toggleDesignation(
    designation: Designation
  ) {
    try {
      await apiRequest(
        `${API}/employee-management/designations/${designation.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: designation.name,
            description:
              designation.description ||
              '',
            isActive:
              !designation.is_active,
          }),
        }
      );

      await loadDesignations();
      await loadOptions();
      await loadEmployees();
    } catch (err) {
      setDesignationError(
        err instanceof Error
          ? err.message
          : 'Failed to update designation'
      );
    }
  }

  async function deleteDesignation(
    designation: Designation
  ) {
    const confirmed =
      window.confirm(
        `Delete designation "${designation.name}"?`
      );

    if (!confirmed) {
      return;
    }

    setDesignationError('');
    setDesignationSuccess('');

    try {
      await apiRequest(
        `${API}/employee-management/designations/${designation.id}`,
        {
          method: 'DELETE',
        }
      );

      setDesignationSuccess(
        'Designation deleted successfully'
      );

      await loadDesignations();
      await loadOptions();
      await loadEmployees();
    } catch (err) {
      setDesignationError(
        err instanceof Error
          ? err.message
          : 'Failed to delete designation'
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FILTERS
  |--------------------------------------------------------------------------
  */
  function clearFilters() {
    setSearch('');
    setDepartmentFilter('');
    setDesignationFilter('');
    setManagerFilter('');
    setEmploymentTypeFilter('');
    setStatusFilter('');
    setLocationFilter('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  }

  /*
  |--------------------------------------------------------------------------
  | CURRENT PAGE STATISTICS
  |--------------------------------------------------------------------------
  */
  const currentActive =
    employees.filter(
      (employee) =>
        employee.status ===
        'ACTIVE'
    ).length;

  const currentOnLeave =
    employees.filter(
      (employee) =>
        employee.status ===
        'ON_LEAVE'
    ).length;

  const canManageEmployees =
    currentRole === 'SUPER_ADMIN' ||
    currentRole === 'HR_ADMIN';

  const isManager =
    currentRole === 'MANAGER';

  const isEmployee =
    currentRole === 'EMPLOYEE';

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  return (
    <HRMSLayout title="Employees">
      <div className="page">
        <div className="page-header">
          <div>
            <h2>Employee Management</h2>
            <p>
              Manage employees, departments,
              designations and employee status.
            </p>

            <div className="role-context">
              <Icon
                name="shield"
                size={13}
              />
              Signed-in role:
              <strong>
                {prettyValue(
                  currentRole
                )}
              </strong>
              ·
              {canManageEmployees
                ? 'Full HR/Admin controls'
                : isManager
                ? 'Team-level controls'
                : 'Self-service access'}
            </div>
          </div>

          <div className="header-actions">
            <button
              className="secondary-button"
              onClick={() =>
                setShowStatusManager(true)
              }
            >
              <Icon
                name="status"
                size={16}
              />
              Status Management
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                setShowDepartments(true)
              }
            >
              <Icon
                name="building"
                size={16}
              />
              Departments
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                setShowDesignations(true)
              }
            >
              <Icon
                name="briefcase"
                size={16}
              />
              Designations
            </button>

            <button
              className="primary-button"
              onClick={() => {
                setAddForm(
                  emptyAddForm
                );
                setAddError('');
                setAddSuccess('');
                setShowAdd(true);
              }}
            >
              <Icon
                name="plus"
                size={16}
              />
              Add Employee
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Icon
                name="users"
                size={20}
              />
            </div>

            <div>
              <span>Total Employees</span>
              <strong>
                {statistics.total ||
                  pagination.total ||
                  0}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon active-icon">
              ✓
            </div>

            <div>
              <span>Active</span>
              <strong>
                {statistics.active ||
                  currentActive}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon leave-icon">
              ◷
            </div>

            <div>
              <span>On Leave</span>
              <strong>
                {statistics.onLeave ||
                  currentOnLeave}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon dept-icon">
              <Icon
                name="building"
                size={20}
              />
            </div>

            <div>
              <span>Departments</span>
              <strong>
                {statistics.departments ||
                  departmentsList.length}
              </strong>
            </div>
          </div>
        </div>

        <div className="card filters-card">
          <div className="filters-grid">
            <div className="field search-field">
              <label>Search</label>

              <input
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );
                  setPage(1);
                }}
                placeholder="Name, email or employee code..."
              />
            </div>

            <div className="field">
              <label>Department</label>

              <select
                value={
                  departmentFilter
                }
                onChange={(event) => {
                  setDepartmentFilter(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                <option value="">
                  All Departments
                </option>

                {departmentsList.map(
                  (department) => (
                    <option
                      key={
                        department.id
                      }
                      value={
                        department.id
                      }
                    >
                      {department.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="field">
              <label>Designation</label>

              <select
                value={
                  designationFilter
                }
                onChange={(event) => {
                  setDesignationFilter(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                <option value="">
                  All Designations
                </option>

                {designationsList
                  .filter(
                    (item) =>
                      item.is_active
                  )
                  .map(
                    (designation) => (
                      <option
                        key={
                          designation.id
                        }
                        value={
                          designation.name
                        }
                      >
                        {
                          designation.name
                        }
                      </option>
                    )
                  )}
              </select>
            </div>

            <div className="field">
              <label>Manager</label>

              <select
                value={managerFilter}
                onChange={(event) => {
                  setManagerFilter(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                <option value="">
                  All Managers
                </option>

                {managersList.map(
                  (manager) => (
                    <option
                      key={manager.id}
                      value={manager.id}
                    >
                      {manager.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="field">
              <label>Employment Type</label>

              <select
                value={
                  employmentTypeFilter
                }
                onChange={(event) => {
                  setEmploymentTypeFilter(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                <option value="">
                  All Types
                </option>

                {employmentTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {prettyValue(type)}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="field">
              <label>Status</label>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                <option value="">
                  All Statuses
                </option>

                {statuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {prettyValue(status)}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="field">
              <label>Location</label>

              <select
                value={locationFilter}
                onChange={(event) => {
                  setLocationFilter(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                <option value="">
                  All Locations
                </option>

                {locations.map(
                  (location) => (
                    <option
                      key={location}
                      value={location}
                    >
                      {location}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="field">
              <label>Sort</label>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value
                  )
                }
              >
                <option value="created_at">
                  Created Date
                </option>

                <option value="first_name">
                  Name
                </option>

                <option value="employee_code">
                  Employee Code
                </option>

                <option value="joining_date">
                  Joining Date
                </option>

                <option value="status">
                  Status
                </option>
              </select>
            </div>

            <div className="filter-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  setSortOrder(
                    sortOrder ===
                      'asc'
                      ? 'desc'
                      : 'asc'
                  )
                }
              >
                {sortOrder ===
                'asc'
                  ? '↑ Asc'
                  : '↓ Desc'}
              </button>

              <button
                className="clear-button"
                onClick={
                  clearFilters
                }
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="card directory-card">
          <div className="section-header">
            <div>
              <h3>Employee Directory</h3>

              <span>
                {pagination.total ||
                  employees.length}{' '}
                employees found
              </span>
            </div>

            <button
              className="refresh-button"
              onClick={() => {
                loadOptions();
                loadDepartments();
                loadDesignations();
                loadEmployees();
              }}
            >
              <Icon
                name="refresh"
                size={15}
              />
              Refresh
            </button>
          </div>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading">
              Loading employees...
            </div>
          ) : employees.length ===
            0 ? (
            <div className="empty">
              No employees found.
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee Code</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Manager</th>
                    <th>Employment</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map(
                    (employee) => (
                      <tr
                        key={
                          employee.id
                        }
                      >
                        <td>
                          <button
                            className="employee-link"
                            onClick={() =>
                              openProfile(
                                employee
                              )
                            }
                          >
                            <div className="employee-avatar">
                              {(
                                employee.first_name ||
                                'U'
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {
                                  employee.first_name
                                }{' '}
                                {
                                  employee.last_name
                                }
                              </strong>

                              <span>
                                {
                                  employee.email
                                }
                              </span>
                            </div>
                          </button>
                        </td>

                        <td>
                          {
                            employee.employee_code
                          }
                        </td>

                        <td>
                          {employee.department ||
                            '—'}
                        </td>

                        <td>
                          {employee.designation ||
                            '—'}
                        </td>

                        <td>
                          {employee.manager_name ||
                            '—'}
                        </td>

                        <td>
                          {prettyValue(
                            employee.employment_type
                          )}
                        </td>

                        <td>
                          <span
                            className={statusClass(
                              employee.status
                            )}
                          >
                            {prettyValue(
                              employee.status
                            )}
                          </span>
                        </td>

                        <td>
                          {employee.work_location ||
                            '—'}
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="row-action-button view-action"
                              title="View profile"
                              aria-label={`View ${employee.first_name} ${employee.last_name} profile`}
                              onClick={() =>
                                openProfile(
                                  employee
                                )
                              }
                            >
                              <Icon
                                name="eye"
                                size={17}
                              />
                            </button>

                            <button
                              type="button"
                              className="row-action-button edit-action"
                              title="Edit employee"
                              aria-label={`Edit ${employee.first_name} ${employee.last_name}`}
                              onClick={() =>
                                openEditEmployee(
                                  employee
                                )
                              }
                            >
                              <Icon
                                name="edit"
                                size={17}
                              />
                            </button>

                            <button
                              type="button"
                              className="row-action-button status-action"
                              title="Change status"
                              aria-label={`Change ${employee.first_name} ${employee.last_name} status`}
                              onClick={() =>
                                openStatusManager(
                                  employee
                                )
                              }
                            >
                              <Icon
                                name="status"
                                size={17}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="pagination">
            <div>
              Showing{' '}
              {employees.length > 0
                ? (page - 1) *
                    limit +
                  1
                : 0}{' '}
              to{' '}
              {Math.min(
                page * limit,
                pagination.total
              )}{' '}
              of{' '}
              {pagination.total}{' '}
              employees
            </div>

            <div className="pagination-controls">
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(
                    Number(
                      event.target.value
                    )
                  );
                  setPage(1);
                }}
              >
                <option value={10}>
                  10 / page
                </option>

                <option value={20}>
                  20 / page
                </option>

                <option value={50}>
                  50 / page
                </option>
              </select>

              <button
                disabled={page <= 1}
                onClick={() =>
                  setPage(
                    (current) =>
                      current - 1
                  )
                }
              >
                ←
              </button>

              <span>
                {page} /{' '}
                {pagination.totalPages ||
                  1}
              </span>

              <button
                disabled={
                  page >=
                  (pagination.totalPages ||
                    1)
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      current + 1
                  )
                }
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* ADD EMPLOYEE MODAL */}
      {/* ================================================================ */}
      {showAdd && (
        <div
          className="modal-backdrop"
          onMouseDown={() =>
            setShowAdd(false)
          }
        >
          <div
            className="modal large-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>Add Employee</h2>
                <p>
                  Create employee and login
                  account.
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowAdd(false)
                }
              >
                ×
              </button>
            </div>

            {addError && (
              <div className="error-box">
                {addError}
              </div>
            )}

            {addSuccess && (
              <div className="success-box">
                {addSuccess}
              </div>
            )}

            <form
              onSubmit={addEmployee}
              className="form"
            >
              <div className="form-section">
                <h3>
                  Personal Information
                </h3>

                <div className="form-grid">
                  <label>
                    First Name *
                    <input
                      required
                      value={
                        addForm.firstName
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            firstName:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    Last Name *
                    <input
                      required
                      value={
                        addForm.lastName
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            lastName:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    Email *
                    <input
                      required
                      type="email"
                      value={
                        addForm.email
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            email:
                              event.target.value,
                            loginEmail:
                              current.loginEmail ||
                              event.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    Phone
                    <input
                      value={
                        addForm.phone
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            phone:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  <label className="full">
                    Address
                    <textarea
                      value={
                        addForm.address
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            address:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>
                  Employment Information
                </h3>

                <div className="form-grid">
                  <label>
                    Employee Code *
                    <input
                      required
                      value={
                        addForm.employeeCode
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            employeeCode:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    Joining Date
                    <input
                      type="date"
                      value={
                        addForm.joiningDate
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            joiningDate:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    Department
                    <select
                      value={
                        addForm.departmentId
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            departmentId:
                              event.target.value,
                          })
                        )
                      }
                    >
                      <option value="">
                        Select Department
                      </option>

                      {departmentsList.map(
                        (department) => (
                          <option
                            key={
                              department.id
                            }
                            value={
                              department.id
                            }
                          >
                            {
                              department.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Designation
                    <select
                      value={
                        addForm.designationId
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            designationId:
                              event.target.value,
                          })
                        )
                      }
                    >
                      <option value="">
                        Select Designation
                      </option>

                      {designationsList
                        .filter(
                          (item) =>
                            item.is_active
                        )
                        .map(
                          (designation) => (
                            <option
                              key={
                                designation.id
                              }
                              value={
                                designation.id
                              }
                            >
                              {
                                designation.name
                              }
                            </option>
                          )
                        )}
                    </select>
                  </label>

                  <label>
                    Manager
                    <select
                      value={
                        addForm.managerId
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            managerId:
                              event.target.value,
                          })
                        )
                      }
                    >
                      <option value="">
                        No Manager
                      </option>

                      {managersList.map(
                        (manager) => (
                          <option
                            key={
                              manager.id
                            }
                            value={
                              manager.id
                            }
                          >
                            {manager.name}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Employment Type
                    <select
                      value={
                        addForm.employmentType
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            employmentType:
                              event.target.value,
                          })
                        )
                      }
                    >
                      {employmentTypes.map(
                        (type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {prettyValue(
                              type
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Work Location
                    <input
                      value={
                        addForm.workLocation
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            workLocation:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    Status
                    <select
                      value={
                        addForm.status
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            status:
                              event.target.value,
                            isActive:
                              event.target.value !==
                                'INACTIVE' &&
                              event.target.value !==
                                'TERMINATED',
                          })
                        )
                      }
                    >
                      {statuses.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {prettyValue(
                              status
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>
                  Account Information
                </h3>

                <div className="form-grid">
                  <label>
                    Login Email
                    <input
                      type="email"
                      value={
                        addForm.loginEmail
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            loginEmail:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    Temporary Password{' '}
                    <span className="required-mark">
                      *
                    </span>

                    <input
                      type="text"
                      value={
                        addForm.temporaryPassword
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            temporaryPassword:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    Role
                    <select
                      value={
                        addForm.role
                      }
                      onChange={(event) =>
                        setAddForm(
                          (current) => ({
                            ...current,
                            role:
                              event.target.value,
                          })
                        )
                      }
                    >
                      <option value="EMPLOYEE">
                        Employee
                      </option>

                      <option value="MANAGER">
                        Manager
                      </option>

                      <option value="HR_ADMIN">
                        HR Admin
                      </option>

                      <option value="PAYROLL">
                        Payroll
                      </option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowAdd(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  disabled={adding}
                >
                  {adding
                    ? 'Creating...'
                    : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* EDIT EMPLOYEE MODAL */}
      {/* ================================================================ */}
      {showEdit &&
        editingEmployee && (
          <div
            className="modal-backdrop"
            onMouseDown={() =>
              setShowEdit(false)
            }
          >
            <div
              className="modal large-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="modal-header">
                <div>
                  <h2>
                    Edit Employee
                  </h2>

                  <p>
                    Update employee
                    information.
                  </p>
                </div>

                <button
                  className="close-button"
                  onClick={() =>
                    setShowEdit(false)
                  }
                >
                  ×
                </button>
              </div>

              {editError && (
                <div className="error-box">
                  {editError}
                </div>
              )}

              {editSuccess && (
                <div className="success-box">
                  {editSuccess}
                </div>
              )}

              <form
                onSubmit={
                  updateEmployee
                }
                className="form"
              >
                <div className="form-section">
                  <h3>
                    Personal Information
                  </h3>

                  <div className="form-grid">
                    <label>
                      First Name *
                      <input
                        required
                        value={
                          editForm.firstName
                        }
                        onChange={(
                          event
                        ) =>
                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,
                              firstName:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      />
                    </label>

                    <label>
                      Last Name *
                      <input
                        required
                        value={
                          editForm.lastName
                        }
                        onChange={(
                          event
                        ) =>
                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,
                              lastName:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      />
                    </label>

                    <label>
                      Phone
                      <input
                        value={
                          editForm.phone
                        }
                        onChange={(
                          event
                        ) =>
                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,
                              phone:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      />
                    </label>

                    <label className="full">
                      Address
                      <textarea
                        value={
                          editForm.address
                        }
                        onChange={(
                          event
                        ) =>
                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,
                              address:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h3>
                    Employment Information
                  </h3>

                  <div className="form-grid">
                    <label>
                      Department
                      <select
                        value={
                          editForm.departmentId
                        }
                        onChange={(
                          event
                        ) =>
                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,
                              departmentId:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      >
                        <option value="">
                          No Department
                        </option>

                        {departmentsList.map(
                          (
                            department
                          ) => (
                            <option
                              key={
                                department.id
                              }
                              value={
                                department.id
                              }
                            >
                              {
                                department.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      Designation
                      <select
                        value={
                          editForm.designationId
                        }
                        onChange={(
                          event
                        ) =>
                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,
                              designationId:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      >
                        <option value="">
                          No Designation
                        </option>

                        {designationsList
                          .filter(
                            (
                              item
                            ) =>
                              item.is_active ||
                              String(
                                item.id
                              ) ===
                                editForm.designationId
                          )
                          .map(
                            (
                              designation
                            ) => (
                              <option
                                key={
                                  designation.id
                                }
                                value={
                                  designation.id
                                }
                              >
                                {
                                  designation.name
                                }
                              </option>
                            )
                          )}
                      </select>
                    </label>

                    <label>
                      Manager
                      <select
                        value={
                          editForm.managerId
                        }
                        onChange={(
                          event
                        ) =>
                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,
                              managerId:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      >
                        <option value="">
                          No Manager
                        </option>

                        {managersList
                          .filter(
                            (
                              manager
                            ) =>
                              manager.id !==
                              editingEmployee.id
                          )
                          .map(
                            (
                              manager
                            ) => (
                              <option
                                key={
                                  manager.id
                                }
                                value={
                                  manager.id
                                }
                              >
                                {
                                  manager.name
                                }
                              </option>
                            )
                          )}
                      </select>
                    </label>

                    <label>
                      Joining Date
                      <input
                        type="date"
                        value={
                          editForm.joiningDate
                        }
                        onChange={(
                          event
                        ) =>
                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,
                              joiningDate:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      />
                    </label>

                    <label>
                      Employment Type
                      <select
                        value={
                          editForm.employmentType
                        }
                        onChange={(
                          event
                        ) =>
                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,
                              employmentType:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      >
                        {employmentTypes.map(
                          (
                            type
                          ) => (
                            <option
                              key={type}
                              value={type}
                            >
                              {prettyValue(
                                type
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      Work Location
                      <input
                        value={
                          editForm.workLocation
                        }
                        onChange={(
                          event
                        ) =>
                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,
                              workLocation:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      />
                    </label>

                    <label>
                      Employee Status
                      <select
                        value={
                          editForm.status
                        }
                        onChange={(
                          event
                        ) =>
                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,
                              status:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      >
                        {statuses.map(
                          (
                            status
                          ) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {prettyValue(
                                status
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setShowEdit(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="primary-button"
                    disabled={updating}
                  >
                    {updating
                      ? 'Saving...'
                      : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* ================================================================ */}
      {/* STATUS MANAGEMENT MODAL */}
      {/* ================================================================ */}
      {showStatusManager && (
        <div
          className="modal-backdrop"
          onMouseDown={() =>
            setShowStatusManager(
              false
            )
          }
        >
          <div
            className="modal status-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  Employee Status Management
                </h2>

                <p>
                  Change an employee's
                  employment status.
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowStatusManager(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            {statusEmployee ? (
              <>
                <div className="selected-employee">
                  <div className="employee-avatar large">
                    {statusEmployee.first_name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {
                        statusEmployee.first_name
                      }{' '}
                      {
                        statusEmployee.last_name
                      }
                    </strong>

                    <span>
                      {
                        statusEmployee.employee_code
                      }
                    </span>
                  </div>
                </div>

                {statusError && (
                  <div className="error-box">
                    {statusError}
                  </div>
                )}

                <div className="status-options">
                  {statuses.map(
                    (status) => (
                      <button
                        key={status}
                        className={
                          newStatus ===
                          status
                            ? 'status-option selected'
                            : 'status-option'
                        }
                        onClick={() =>
                          setNewStatus(
                            status
                          )
                        }
                      >
                        <span
                          className={statusClass(
                            status
                          )}
                        >
                          {prettyValue(
                            status
                          )}
                        </span>

                        {newStatus ===
                          status && (
                          <span>
                            ✓
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>

                <div className="status-note">
                  <strong>
                    Login access:
                  </strong>

                  <span>
                    {newStatus ===
                      'INACTIVE' ||
                    newStatus ===
                      'TERMINATED'
                      ? 'Login will be disabled.'
                      : 'Login will remain enabled.'}
                  </span>
                </div>

                <div className="modal-footer">
                  <button
                    className="secondary-button"
                    onClick={() =>
                      setShowStatusManager(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="primary-button"
                    disabled={
                      statusSaving ||
                      newStatus ===
                        statusEmployee.status
                    }
                    onClick={
                      saveEmployeeStatus
                    }
                  >
                    {statusSaving
                      ? 'Updating...'
                      : 'Update Status'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="status-employee-list">
                  {employees.map(
                    (employee) => (
                      <button
                        key={
                          employee.id
                        }
                        onClick={() =>
                          setStatusEmployee(
                            employee
                          )
                        }
                      >
                        <div className="employee-avatar">
                          {employee.first_name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {
                              employee.first_name
                            }{' '}
                            {
                              employee.last_name
                            }
                          </strong>

                          <span>
                            {
                              employee.employee_code
                            }
                          </span>
                        </div>

                        <span
                          className={statusClass(
                            employee.status
                          )}
                        >
                          {prettyValue(
                            employee.status
                          )}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* DEPARTMENT MANAGEMENT */}
      {/* ================================================================ */}
      {showDepartments && (
        <div
          className="modal-backdrop"
          onMouseDown={() =>
            setShowDepartments(false)
          }
        >
          <div
            className="modal xlarge-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  Department Management
                </h2>

                <p>
                  Create, edit, delete and
                  assign departments.
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowDepartments(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            {departmentError && (
              <div className="error-box">
                {departmentError}
              </div>
            )}

            {departmentSuccess && (
              <div className="success-box">
                {departmentSuccess}
              </div>
            )}

            <div className="management-layout">
              <div className="management-form">
                <h3>
                  {departmentEditingId
                    ? 'Edit Department'
                    : 'Create Department'}
                </h3>

                <form
                  onSubmit={
                    saveDepartment
                  }
                  className="form"
                >
                  <label>
                    Department Name *
                    <input
                      required
                      value={
                        departmentForm.name
                      }
                      onChange={(event) =>
                        setDepartmentForm(
                          (
                            current
                          ) => ({
                            ...current,
                            name:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="e.g. Finance"
                    />
                  </label>

                  <label>
                    Description
                    <textarea
                      value={
                        departmentForm.description
                      }
                      onChange={(event) =>
                        setDepartmentForm(
                          (
                            current
                          ) => ({
                            ...current,
                            description:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Department description"
                    />
                  </label>

                  <div className="form-actions">
                    {departmentEditingId && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={
                          cancelDepartmentEdit
                        }
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      className="primary-button"
                      disabled={
                        departmentSaving
                      }
                    >
                      {departmentSaving
                        ? 'Saving...'
                        : departmentEditingId
                        ? 'Update Department'
                        : 'Create Department'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="management-list">
                <div className="management-list-header">
                  <h3>
                    Departments
                  </h3>

                  <span>
                    {
                      departmentsList.length
                    }{' '}
                    total
                  </span>
                </div>

                <div className="management-table">
                  {departmentsList.length ===
                  0 ? (
                    <div className="empty">
                      No departments found.
                    </div>
                  ) : (
                    departmentsList.map(
                      (
                        department
                      ) => (
                        <div
                          className="management-row"
                          key={
                            department.id
                          }
                        >
                          <div className="management-main">
                            <strong>
                              {
                                department.name
                              }
                            </strong>

                            <span>
                              {
                                department.description ||
                                'No description'
                              }
                            </span>
                          </div>

                          <div className="count-badge">
                            {Number(
                              department.employee_count ||
                                0
                            )}{' '}
                            employees
                          </div>

                          <div className="management-actions">
                            <button
                              onClick={() =>
                                startEditDepartment(
                                  department
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="danger-text"
                              onClick={() =>
                                deleteDepartment(
                                  department
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>

                <div className="assignment-box">
                  <h3>
                    Assign Employee
                  </h3>

                  <div className="assignment-grid">
                    <select
                      value={
                        departmentAssignEmployee
                      }
                      onChange={(event) =>
                        setDepartmentAssignEmployee(
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Select Department
                      </option>

                      {departmentsList.map(
                        (
                          department
                        ) => (
                          <option
                            key={
                              department.id
                            }
                            value={
                              department.id
                            }
                          >
                            {
                              department.name
                            }
                          </option>
                        )
                      )}
                    </select>

                    <select
                      id="department-employee"
                      onChange={async (
                        event
                      ) => {
                        const employeeId =
                          Number(
                            event
                              .target
                              .value
                          );

                        if (
                          employeeId
                        ) {
                          await assignDepartment(
                            employeeId
                          );

                          event.target.value =
                            '';
                        }
                      }}
                    >
                      <option value="">
                        Select Employee
                      </option>

                      {employees.map(
                        (employee) => (
                          <option
                            key={
                              employee.id
                            }
                            value={
                              employee.id
                            }
                          >
                            {
                              employee.first_name
                            }{' '}
                            {
                              employee.last_name
                            } —{' '}
                            {
                              employee.employee_code
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <small>
                    Select a department first,
                    then select an employee.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* DESIGNATION MANAGEMENT */}
      {/* ================================================================ */}
      {showDesignations && (
        <div
          className="modal-backdrop"
          onMouseDown={() =>
            setShowDesignations(false)
          }
        >
          <div
            className="modal xlarge-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  Designation Management
                </h2>

                <p>
                  Create, edit, activate,
                  deactivate and delete
                  designations.
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowDesignations(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            {designationError && (
              <div className="error-box">
                {designationError}
              </div>
            )}

            {designationSuccess && (
              <div className="success-box">
                {designationSuccess}
              </div>
            )}

            <div className="management-layout">
              <div className="management-form">
                <h3>
                  {designationEditingId
                    ? 'Edit Designation'
                    : 'Create Designation'}
                </h3>

                <form
                  onSubmit={
                    saveDesignation
                  }
                  className="form"
                >
                  <label>
                    Designation Name *
                    <input
                      required
                      value={
                        designationForm.name
                      }
                      onChange={(event) =>
                        setDesignationForm(
                          (
                            current
                          ) => ({
                            ...current,
                            name:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="e.g. Data Analyst"
                    />
                  </label>

                  <label>
                    Description
                    <textarea
                      value={
                        designationForm.description
                      }
                      onChange={(event) =>
                        setDesignationForm(
                          (
                            current
                          ) => ({
                            ...current,
                            description:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Designation description"
                    />
                  </label>

                  {designationEditingId && (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={
                          designationForm.isActive
                        }
                        onChange={(event) =>
                          setDesignationForm(
                            (
                              current
                            ) => ({
                              ...current,
                              isActive:
                                event
                                  .target
                                  .checked,
                            })
                          )
                        }
                      />

                      Active designation
                    </label>
                  )}

                  <div className="form-actions">
                    {designationEditingId && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={
                          cancelDesignationEdit
                        }
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      className="primary-button"
                      disabled={
                        designationSaving
                      }
                    >
                      {designationSaving
                        ? 'Saving...'
                        : designationEditingId
                        ? 'Update Designation'
                        : 'Create Designation'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="management-list">
                <div className="management-list-header">
                  <h3>
                    Designations
                  </h3>

                  <span>
                    {
                      designationsList.length
                    }{' '}
                    total
                  </span>
                </div>

                <div className="management-table">
                  {designationsList.length ===
                  0 ? (
                    <div className="empty">
                      No designations found.
                    </div>
                  ) : (
                    designationsList.map(
                      (
                        designation
                      ) => (
                        <div
                          className="management-row"
                          key={
                            designation.id
                          }
                        >
                          <div className="management-main">
                            <strong>
                              {
                                designation.name
                              }
                            </strong>

                            <span>
                              {
                                designation.description ||
                                'No description'
                              }
                            </span>
                          </div>

                          <div>
                            <span
                              className={
                                designation.is_active
                                  ? 'active-badge'
                                  : 'inactive-badge'
                              }
                            >
                              {designation.is_active
                                ? 'Active'
                                : 'Inactive'}
                            </span>
                          </div>

                          <div className="count-badge">
                            {Number(
                              designation.employee_count ||
                                0
                            )}{' '}
                            employees
                          </div>

                          <div className="management-actions">
                            <button
                              onClick={() =>
                                startEditDesignation(
                                  designation
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                toggleDesignation(
                                  designation
                                )
                              }
                            >
                              {designation.is_active
                                ? 'Deactivate'
                                : 'Activate'}
                            </button>

                            <button
                              className="danger-text"
                              onClick={() =>
                                deleteDesignation(
                                  designation
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>

                <div className="info-box">
                  <strong>
                    Assignment
                  </strong>

                  <span>
                    Designations are assigned
                    directly from the employee
                    Edit screen. The employee
                    count above shows current
                    assignments.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* PROFILE MODAL */}
      {/* ================================================================ */}
      {showProfile && (
        <div
          className="modal-backdrop"
          onMouseDown={() =>
            setShowProfile(false)
          }
        >
          <div
            className="modal xlarge-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  Employee Profile
                </h2>

                <p>
                  Complete employee
                  information and summary.
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowProfile(false)
                }
              >
                ×
              </button>
            </div>

            {profileLoading ? (
              <div className="loading">
                Loading profile...
              </div>
            ) : profileError ? (
              <div className="error-box">
                {profileError}
              </div>
            ) : (
              <div className="profile">
                {selectedEmployee && (
                  <>
                    <div className="profile-hero">
                      <div className="profile-avatar">
                        {selectedEmployee.first_name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="profile-title">
                        <h2>
                          {
                            selectedEmployee.first_name
                          }{' '}
                          {
                            selectedEmployee.last_name
                          }
                        </h2>

                        <p>
                          {
                            selectedEmployee.designation ||
                            'Employee'
                          }
                        </p>

                        <span
                          className={statusClass(
                            selectedEmployee.status
                          )}
                        >
                          {prettyValue(
                            selectedEmployee.status
                          )}
                        </span>
                      </div>

                      <button
                        className="primary-button"
                        onClick={() => {
                          setShowProfile(
                            false
                          );

                          openEditEmployee(
                            selectedEmployee
                          );
                        }}
                      >
                        Edit Employee
                      </button>
                    </div>

                    <div className="profile-grid">
                      <div className="profile-section">
                        <h3>
                          Personal Information
                        </h3>

                        <div className="detail-grid">
                          <div>
                            <span>
                              First Name
                            </span>

                            <strong>
                              {
                                selectedEmployee.first_name
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Last Name
                            </span>

                            <strong>
                              {
                                selectedEmployee.last_name
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Email
                            </span>

                            <strong>
                              {
                                selectedEmployee.email
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Phone
                            </span>

                            <strong>
                              {
                                selectedEmployee.phone ||
                                '—'
                              }
                            </strong>
                          </div>

                          <div className="full">
                            <span>
                              Address
                            </span>

                            <strong>
                              {
                                selectedEmployee.address ||
                                '—'
                              }
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="profile-section">
                        <h3>
                          Employment Information
                        </h3>

                        <div className="detail-grid">
                          <div>
                            <span>
                              Employee Code
                            </span>

                            <strong>
                              {
                                selectedEmployee.employee_code
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Department
                            </span>

                            <strong>
                              {
                                selectedEmployee.department ||
                                '—'
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Designation
                            </span>

                            <strong>
                              {
                                selectedEmployee.designation ||
                                '—'
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Employment Type
                            </span>

                            <strong>
                              {prettyValue(
                                selectedEmployee.employment_type
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Joining Date
                            </span>

                            <strong>
                              {formatDate(
                                selectedEmployee.joining_date
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Work Location
                            </span>

                            <strong>
                              {
                                selectedEmployee.work_location ||
                                '—'
                              }
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="profile-section">
                        <h3>
                          Manager / Reporting
                        </h3>

                        <div className="manager-card">
                          <div className="employee-avatar">
                            {(
                              profile?.manager?.name ||
                              selectedEmployee.manager_name ||
                              'N'
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {profile?.manager
                                ?.name ||
                                selectedEmployee.manager_name ||
                                'No Manager'}
                            </strong>

                            <span>
                              {profile?.manager
                                ?.designation ||
                                'Reporting Manager'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="profile-section">
                        <h3>
                          Account
                        </h3>

                        <div className="detail-grid">
                          <div>
                            <span>
                              Role
                            </span>

                            <strong>
                              {prettyValue(
                                selectedEmployee.role
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Login Status
                            </span>

                            <strong>
                              {selectedEmployee.is_active
                                ? 'Enabled'
                                : 'Disabled'}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="summary-grid">
                      <div className="summary-card">
                        <span>
                          Attendance
                        </span>

                        <strong>
                          {profile
                            ?.attendance
                            ?.attendancePercentage ??
                            0}
                          %
                        </strong>

                        <small>
                          {
                            profile
                              ?.attendance
                              ?.present
                          }{' '}
                          present
                        </small>
                      </div>

                      <div className="summary-card">
                        <span>
                          Leave
                        </span>

                        <strong>
                          {
                            profile
                              ?.leave
                              ?.approvedDays
                          }
                        </strong>

                        <small>
                          approved days
                        </small>
                      </div>

                      <div className="summary-card">
                        <span>
                          Net Salary
                        </span>

                        <strong>
                          {formatCurrency(
                            profile
                              ?.payroll
                              ?.netSalary
                          )}
                        </strong>

                        <small>
                          latest payroll
                        </small>
                      </div>

                      <div className="summary-card">
                        <span>
                          Performance
                        </span>

                        <strong>
                          {profile
                            ?.performance
                            ?.averageRating ??
                            '—'}
                        </strong>

                        <small>
                          average rating
                        </small>
                      </div>
                    </div>

                    {/* ================================================== */}
                    {/* EMPLOYEE DOCUMENTS */}
                    {/* ================================================== */}
                    <div className="profile-section profile-feature-section">
                      <div className="feature-section-header">
                        <div>
                          <h3>
                            Employee Documents
                          </h3>

                          <p>
                            Manage resumes, ID
                            proofs, offer letters,
                            certificates and other
                            HR documents.
                          </p>
                        </div>

                        <div className="document-header-actions">
                          <button
                            type="button"
                            className="secondary-button small-button"
                            onClick={() =>
                              loadEmployeeDocuments(
                                selectedEmployee.id
                              )
                            }
                            disabled={
                              documentsLoading
                            }
                          >
                            <Icon
                              name="refresh"
                              size={14}
                            />

                            {documentsLoading
                              ? 'Loading...'
                              : 'Refresh'}
                          </button>

                          <button
                            type="button"
                            className="primary-button small-button"
                            disabled={
                              !canManageEmployees &&
                              currentRole !==
                                'MANAGER'
                            }
                            onClick={
                              openAddDocument
                            }
                          >
                            <Icon
                              name="plus"
                              size={14}
                            />

                            Add Document
                          </button>
                        </div>
                      </div>

                      {documentsError && (
                        <div className="error-box document-message">
                          {documentsError}
                        </div>
                      )}

                      {documentsSuccess && (
                        <div className="success-box document-message">
                          {documentsSuccess}
                        </div>
                      )}

                      {documentsLoading ? (
                        <div className="loading document-loading">
                          Loading employee documents...
                        </div>
                      ) : employeeDocuments.length ===
                        0 ? (
                        <div className="documents-empty">
                          <div className="documents-empty-icon">
                            <Icon
                              name="file"
                              size={24}
                            />
                          </div>

                          <strong>
                            No documents uploaded
                          </strong>

                          <span>
                            Add the employee's
                            resume, ID proof,
                            offer letter or other
                            HR documents.
                          </span>

                          <button
                            type="button"
                            className="secondary-button"
                            disabled={
                              !canManageEmployees &&
                              currentRole !==
                                'MANAGER'
                            }
                            onClick={
                              openAddDocument
                            }
                          >
                            <Icon
                              name="plus"
                              size={14}
                            />
                            Add First Document
                          </button>
                        </div>
                      ) : (
                        <div className="documents-table">
                          {employeeDocuments.map(
                            (document) => (
                              <div
                                className="document-row"
                                key={
                                  document.id
                                }
                              >
                                <div className="document-icon">
                                  <Icon
                                    name="file"
                                    size={17}
                                  />
                                </div>

                                <div className="document-main">
                                  <strong>
                                    {
                                      document.document_name
                                    }
                                  </strong>

                                  <span>
                                    {prettyValue(
                                      document.document_type
                                    )}{' '}
                                    · Uploaded:{' '}
                                    {formatDate(
                                      document.uploaded_at ||
                                        document.created_at
                                    )}
                                    {document.uploaded_by_name
                                      ? ` · By ${document.uploaded_by_name}`
                                      : ''}
                                  </span>

                                  {document.description && (
                                    <small>
                                      {
                                        document.description
                                      }
                                    </small>
                                  )}
                                </div>

                                <span
                                  className={documentStatusClass(
                                    document.status
                                  )}
                                >
                                  {prettyValue(
                                    document.status
                                  )}
                                </span>

                                <div className="document-actions">
                                  {document.file_url && (
                                    <a
                                      className="document-link"
                                      href={
                                        document.file_url
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Open
                                    </a>
                                  )}

                                  <button
                                    type="button"
                                    className="document-action-button"
                                    disabled={
                                      !canManageEmployees &&
                                      currentRole !==
                                        'MANAGER'
                                    }
                                    onClick={() =>
                                      openEditDocument(
                                        document
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="document-action-button danger-document"
                                    disabled={
                                      !canManageEmployees &&
                                      currentRole !==
                                        'MANAGER'
                                    }
                                    onClick={() =>
                                      deleteEmployeeDocument(
                                        document
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <div className="feature-grid">
                      <div className="profile-section">
                        <div className="feature-section-header">
                          <div>
                            <h3>
                              Attendance Summary
                            </h3>

                            <p>
                              Current employee
                              attendance overview.
                            </p>
                          </div>

                          <button
                            type="button"
                            className="text-link-button"
                            onClick={() =>
                              navigateTo(
                                '/attendance'
                              )
                            }
                          >
                            Detailed Attendance
                            <Icon
                              name="arrow"
                              size={13}
                            />
                          </button>
                        </div>

                        <div className="metric-grid">
                          <div>
                            <span>
                              Present
                            </span>

                            <strong>
                              {profile?.attendance?.present ??
                                0}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Absent
                            </span>

                            <strong>
                              {profile?.attendance?.absent ??
                                0}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Excused / Leave
                            </span>

                            <strong>
                              {profile?.attendance?.excused ??
                                0}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Worked Hours
                            </span>

                            <strong>
                              {Math.round(
                                (profile?.attendance
                                  ?.workedMinutes ??
                                  0) / 60
                              )}
                              h
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="profile-section">
                        <div className="feature-section-header">
                          <div>
                            <h3>
                              Leave Summary
                            </h3>

                            <p>
                              Leave balance and
                              request status.
                            </p>
                          </div>

                          <button
                            type="button"
                            className="text-link-button"
                            onClick={() =>
                              navigateTo(
                                '/leave'
                              )
                            }
                          >
                            My Leave
                            <Icon
                              name="arrow"
                              size={13}
                            />
                          </button>
                        </div>

                        <div className="metric-grid">
                          <div>
                            <span>
                              Leave Balance
                            </span>

                            <strong>
                              {profile?.leave?.approvedDays ??
                                0}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Pending
                            </span>

                            <strong>
                              {profile?.leave?.pending ??
                                0}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Approved
                            </span>

                            <strong>
                              {profile?.leave?.approved ??
                                0}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Rejected
                            </span>

                            <strong>
                              {profile?.leave?.rejected ??
                                0}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="profile-section">
                        <div className="feature-section-header">
                          <div>
                            <h3>
                              Payroll Summary
                            </h3>

                            <p>
                              Salary structure and
                              latest payroll.
                            </p>
                          </div>

                          <button
                            type="button"
                            className="text-link-button"
                            onClick={() =>
                              navigateTo(
                                '/payroll'
                              )
                            }
                          >
                            Payroll
                            <Icon
                              name="arrow"
                              size={13}
                            />
                          </button>
                        </div>

                        <div className="salary-grid">
                          <div>
                            <span>
                              Basic Salary
                            </span>

                            <strong>
                              {formatCurrency(
                                profile?.payroll
                                  ?.basicSalary
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              HRA
                            </span>

                            <strong>
                              {formatCurrency(
                                profile?.payroll
                                  ?.hra
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Allowances
                            </span>

                            <strong>
                              {formatCurrency(
                                profile?.payroll
                                  ?.allowances
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Deductions
                            </span>

                            <strong>
                              {formatCurrency(
                                profile?.payroll
                                  ?.deductions ??
                                  profile?.payroll
                                    ?.totalDeductions
                              )}
                            </strong>
                          </div>

                          <div className="salary-net">
                            <span>
                              Net Salary
                            </span>

                            <strong>
                              {formatCurrency(
                                profile?.payroll
                                  ?.netSalary
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="profile-section">
                        <div className="feature-section-header">
                          <div>
                            <h3>
                              Performance
                            </h3>

                            <p>
                              Goals and performance
                              reviews.
                            </p>
                          </div>

                          <button
                            type="button"
                            className="text-link-button"
                            onClick={() =>
                              navigateTo(
                                '/performance'
                              )
                            }
                          >
                            Performance
                            <Icon
                              name="arrow"
                              size={13}
                            />
                          </button>
                        </div>

                        <div className="metric-grid">
                          <div>
                            <span>
                              Total Goals
                            </span>

                            <strong>
                              {profile?.performance
                                ?.totalGoals ??
                                0}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Completed
                            </span>

                            <strong>
                              —
                            </strong>
                          </div>

                          <div>
                            <span>
                              In Progress
                            </span>

                            <strong>
                              —
                            </strong>
                          </div>

                          <div>
                            <span>
                              Average Rating
                            </span>

                            <strong>
                              {profile?.performance
                                ?.averageRating ??
                                '—'}{' '}
                              / 5
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="profile-section account-controls-section">
                      <div className="feature-section-header">
                        <div>
                          <h3>
                            Employee Account Controls
                          </h3>

                          <p>
                            Account access controls
                            available to HR and
                            administrators.
                          </p>
                        </div>

                        <span className="permission-badge">
                          <Icon
                            name="shield"
                            size={13}
                          />

                          {canManageEmployees
                            ? 'HR/Admin access'
                            : 'View only'}
                        </span>
                      </div>

                      <div className="account-control-grid">
                        <div className="control-card">
                          <Icon
                            name={
                              selectedEmployee.is_active
                                ? 'unlock'
                                : 'lock'
                            }
                            size={17}
                          />

                          <div>
                            <strong>
                              {selectedEmployee.is_active
                                ? 'Account Active'
                                : 'Account Inactive'}
                            </strong>

                            <span>
                              Account access follows the employee status.
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={!canManageEmployees}
                            onClick={() =>
                              openStatusManager(selectedEmployee)
                            }
                          >
                            Change
                          </button>
                        </div>

                        <div className="control-card">
                          <Icon name="key" size={17} />

                          <div>
                            <strong>Reset Password</strong>

                            <span>
                              Set a new temporary password for this employee account.
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={!canManageEmployees}
                            onClick={() =>
                              openAccountControls(
                                selectedEmployee,
                                'password'
                              )
                            }
                          >
                            Reset
                          </button>
                        </div>

                        <div className="control-card">
                          <Icon name="shield" size={17} />

                          <div>
                            <strong>Account Role</strong>

                            <span>
                              {prettyValue(selectedEmployee.role)} · HR/Admin only.
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={!canManageEmployees}
                            onClick={() =>
                              openAccountControls(
                                selectedEmployee,
                                'role'
                              )
                            }
                          >
                            Edit
                          </button>
                        </div>

                        <div className="control-card">
                          <Icon
                            name="shield"
                            size={17}
                          />

                          <div>
                            <strong>Security Controls</strong>

                            <span>
                              Password and role changes are recorded in Activity History.
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={!canManageEmployees}
                            onClick={() =>
                              openAccountControls(
                                selectedEmployee,
                                'password'
                              )
                            }
                          >
                            Manage
                          </button>
                        </div>
                      </div>

<div className="last-login">
                        <Icon
                          name="clock"
                          size={15}
                        />

                        Last login:{' '}
                        <strong>
                          Not available from
                          current employee
                          profile API
                        </strong>
                      </div>
                    </div>

                    <div className="profile-section self-service-section">
                      <div className="feature-section-header">
                        <div>
                          <h3>
                            Employee Self-Service
                          </h3>

                          <p>
                            Permitted employee-facing
                            areas.
                          </p>
                        </div>
                      </div>

                      <div className="self-service-grid">
                        <button
                          type="button"
                          onClick={() =>
                            navigateTo(
                              '/employees'
                            )
                          }
                        >
                          <span>
                            My Profile
                          </span>

                          <Icon
                            name="arrow"
                            size={14}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigateTo(
                              '/attendance'
                            )
                          }
                        >
                          <span>
                            My Attendance
                          </span>

                          <Icon
                            name="arrow"
                            size={14}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigateTo(
                              '/leave'
                            )
                          }
                        >
                          <span>
                            My Leave
                          </span>

                          <Icon
                            name="arrow"
                            size={14}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigateTo(
                              '/payroll'
                            )
                          }
                        >
                          <span>
                            My Payroll
                          </span>

                          <Icon
                            name="arrow"
                            size={14}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigateTo(
                              '/performance'
                            )
                          }
                        >
                          <span>
                            My Goals & Reviews
                          </span>

                          <Icon
                            name="arrow"
                            size={14}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setShowDocumentForm(
                              false
                            )
                          }
                        >
                          <span>
                            My Documents
                          </span>

                          <Icon
                            name="arrow"
                            size={14}
                          />
                        </button>
                      </div>

                      <div className="permission-note">
                        Sensitive fields such as
                        salary, role, department,
                        employee status and manager
                        remain restricted to authorized
                        HR/Admin workflows.
                      </div>
                    </div>

                    <div className="profile-section">
                      <h3>
                        Activity History
                      </h3>

                      {(profile?.activityHistory?.length ||
                        profile?.activity?.length ||
                        0) > 0 ? (
                        <div className="activity-list">
                          {(profile?.activityHistory?.length
                            ? profile.activityHistory
                            : profile?.activity || []
                          ).map((item, index) => {
                            let detailsText = '';

                            if (item.details) {
                              if (typeof item.details === 'string') {
                                try {
                                  const parsed = JSON.parse(item.details);
                                  detailsText =
                                    typeof parsed === 'object' && parsed !== null
                                      ? Object.entries(parsed as Record<string, unknown>)
                                          .filter(([, value]) => value !== undefined && value !== null && value !== '')
                                          .map(([key, value]) => `${prettyValue(key)}: ${String(value)}`)
                                          .join(' · ')
                                      : String(parsed);
                                } catch {
                                  detailsText = item.details;
                                }
                              } else {
                                detailsText = Object.entries(item.details)
                                  .filter(([, value]) => value !== undefined && value !== null && value !== '')
                                  .map(([key, value]) => `${prettyValue(key)}: ${String(value)}`)
                                  .join(' · ');
                              }
                            }

                            const actorName =
                              item.actor_first_name || item.actor_last_name
                                ? `${item.actor_first_name || ''} ${item.actor_last_name || ''}`.trim()
                                : item.actor_email || 'System';

                            const actionLabel = prettyValue(item.action || 'Activity');

                            return (
                              <div
                                key={item.id || index}
                                className="activity-item"
                              >
                                <div className="activity-dot" />

                                <div>
                                  <strong>{actionLabel}</strong>

                                  <span>
                                    {detailsText ||
                                      item.entity_type ||
                                      `Performed by ${actorName}`}
                                  </span>

                                  <small>
                                    {formatDate(item.created_at)}
                                    {actorName ? ` · ${actorName}` : ''}
                                  </small>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="empty">
                          No activity history available.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ACCOUNT CONTROLS MODAL */}
      {showAccountControls && selectedEmployee && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowAccountControls(false)}
        >
          <div
            className="modal account-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Employee Account Controls</h2>
                <p>
                  Manage account security for{' '}
                  <strong>
                    {selectedEmployee.first_name}{' '}
                    {selectedEmployee.last_name}
                  </strong>
                  .
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() => setShowAccountControls(false)}
              >
                ×
              </button>
            </div>

            <div className="account-tabs">
              <button
                type="button"
                className={
                  accountAction === 'password'
                    ? 'account-tab active'
                    : 'account-tab'
                }
                onClick={() => {
                  setAccountAction('password');
                  setAccountError('');
                  setAccountSuccess('');
                }}
              >
                <Icon name="key" size={15} />
                Reset Password
              </button>

              <button
                type="button"
                className={
                  accountAction === 'role'
                    ? 'account-tab active'
                    : 'account-tab'
                }
                onClick={() => {
                  setAccountAction('role');
                  setAccountError('');
                  setAccountSuccess('');
                }}
              >
                <Icon name="shield" size={15} />
                Change Role
              </button>
            </div>

            {accountError && (
              <div className="error-box">
                {accountError}
              </div>
            )}

            {accountSuccess && (
              <div className="success-box">
                {accountSuccess}
              </div>
            )}

            {accountAction === 'password' ? (
              <div className="account-form">
                <div className="account-info-box">
                  <strong>Account email</strong>
                  <span>{selectedEmployee.email}</span>
                </div>

                <label>
                  <span>New Password *</span>
                  <input
                    type="password"
                    value={accountPassword}
                    onChange={(event) =>
                      setAccountPassword(event.target.value)
                    }
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                  />
                </label>

                <label>
                  <span>Confirm Password *</span>
                  <input
                    type="password"
                    value={accountPasswordConfirm}
                    onChange={(event) =>
                      setAccountPasswordConfirm(event.target.value)
                    }
                    placeholder="Re-enter the new password"
                    autoComplete="new-password"
                  />
                </label>

                <div className="account-warning">
                  The password itself is never stored in the activity history.
                </div>
              </div>
            ) : (
              <div className="account-form">
                <div className="account-info-box">
                  <strong>Current role</strong>
                  <span>{prettyValue(selectedEmployee.role)}</span>
                </div>

                <label>
                  <span>Account Role *</span>
                  <select
                    value={accountRole}
                    onChange={(event) =>
                      setAccountRole(event.target.value)
                    }
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="PAYROLL">Payroll</option>
                    <option value="HR_ADMIN">HR Admin</option>
                    {currentRole === 'SUPER_ADMIN' && (
                      <option value="SUPER_ADMIN">Super Admin</option>
                    )}
                  </select>
                </label>

                <div className="account-warning">
                  Role changes affect the permissions available after the employee signs in again.
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowAccountControls(false)}
                disabled={accountSaving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={saveAccountControl}
                disabled={accountSaving}
              >
                {accountSaving
                  ? 'Saving...'
                  : accountAction === 'password'
                    ? 'Reset Password'
                    : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT ADD / EDIT MODAL */}
      {/* ================================================================ */}
      {showDocumentForm &&
        selectedEmployee && (
          <div
            className="modal-backdrop document-modal-backdrop"
            onMouseDown={() =>
              setShowDocumentForm(false)
            }
          >
            <div
              className="modal document-form-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="modal-header">
                <div>
                  <h2>
                    {editingDocument
                      ? 'Edit Document'
                      : 'Add Employee Document'}
                  </h2>

                  <p>
                    {selectedEmployee.first_name}{' '}
                    {
                      selectedEmployee.last_name
                    }{' '}
                    ·{' '}
                    {
                      selectedEmployee.employee_code
                    }
                  </p>
                </div>

                <button
                  className="close-button"
                  onClick={() =>
                    setShowDocumentForm(
                      false
                    )
                  }
                >
                  ×
                </button>
              </div>

              {documentsError && (
                <div className="error-box">
                  {documentsError}
                </div>
              )}

              <form
                className="form"
                onSubmit={
                  saveEmployeeDocument
                }
              >
                <div className="form-section">
                  <h3>
                    Document Information
                  </h3>

                  <div className="form-grid">
                    <label>
                      Document Name *
                      <input
                        required
                        value={
                          documentForm.documentName
                        }
                        onChange={(event) =>
                          setDocumentForm(
                            (current) => ({
                              ...current,
                              documentName:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="e.g. Aadhaar Card"
                      />
                    </label>

                    <label>
                      Document Type *
                      <select
                        required
                        value={
                          documentForm.documentType
                        }
                        onChange={(event) =>
                          setDocumentForm(
                            (current) => ({
                              ...current,
                              documentType:
                                event.target.value,
                            })
                          )
                        }
                      >
                        {DOCUMENT_TYPES.map(
                          (type) => (
                            <option
                              key={type}
                              value={type}
                            >
                              {prettyValue(
                                type
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label className="full">
                      File URL / Document Link *
                      <input
                        required
                        type="url"
                        value={
                          documentForm.fileUrl
                        }
                        onChange={(event) =>
                          setDocumentForm(
                            (current) => ({
                              ...current,
                              fileUrl:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="https://example.com/document.pdf"
                      />

                      <small className="field-help">
                        Enter the accessible URL of
                        the document. The current
                        backend stores the document
                        link.
                      </small>
                    </label>

                    <label>
                      Status
                      <select
                        value={
                          documentForm.status
                        }
                        onChange={(event) =>
                          setDocumentForm(
                            (current) => ({
                              ...current,
                              status:
                                event.target.value,
                            })
                          )
                        }
                      >
                        {DOCUMENT_STATUSES.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {prettyValue(
                                status
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label className="full">
                      Description
                      <textarea
                        value={
                          documentForm.description
                        }
                        onChange={(event) =>
                          setDocumentForm(
                            (current) => ({
                              ...current,
                              description:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Optional notes about this document..."
                      />
                    </label>
                  </div>
                </div>

                <div className="document-form-note">
                  <Icon
                    name="shield"
                    size={15}
                  />

                  <span>
                    Upload date and uploaded-by
                    information are recorded by
                    the backend automatically.
                  </span>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setShowDocumentForm(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      documentSaving
                    }
                  >
                    {documentSaving
                      ? 'Saving...'
                      : editingDocument
                      ? 'Update Document'
                      : 'Add Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      <style jsx>{`
        .page {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .page-header h2 {
          margin: 0 0 6px;
          font-size: 26px;
          color: #172033;
        }

        .page-header p {
          margin: 0;
          color: #718096;
        }

        .header-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 9px;
        }

        .header-actions button,
        .refresh-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        button {
          font-family: inherit;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .primary-button,
        .secondary-button,
        .clear-button,
        .refresh-button {
          border: 0;
          border-radius: 9px;
          padding: 10px 14px;
          font-weight: 700;
          font-size: 13px;
        }

        .primary-button {
          background: #2563eb;
          color: white;
        }

        .secondary-button {
          background: #eef2ff;
          color: #334155;
        }

        .clear-button {
          background: #f1f5f9;
          color: #475569;
        }

        .refresh-button {
          background: #f8fafc;
          color: #2563eb;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(
            4,
            minmax(0, 1fr)
          );
          gap: 16px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e7ebf0;
          border-radius: 14px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          border-radius: 12px;
          background: #eff6ff;
          display: grid;
          place-items: center;
          color: #2563eb;
        }

        .active-icon {
          background: #ecfdf5;
        }

        .leave-icon {
          background: #fff7ed;
        }

        .dept-icon {
          background: #f5f3ff;
        }

        .stat-card div:last-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-card span {
          color: #64748b;
          font-size: 12px;
        }

        .stat-card strong {
          font-size: 22px;
          color: #172033;
        }

        .card {
          background: white;
          border: 1px solid #e7ebf0;
          border-radius: 14px;
          overflow: hidden;
        }

        .filters-card {
          padding: 18px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns:
            2fr repeat(4, 1fr);
          gap: 14px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field label,
        .form label {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
        }

        input,
        select,
        textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dbe2ea;
          border-radius: 8px;
          padding: 10px 11px;
          font: inherit;
          color: #172033;
          background: white;
          outline: none;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px
            rgba(37, 99, 235, 0.08);
        }

        textarea {
          min-height: 82px;
          resize: vertical;
        }

        .filter-actions {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .directory-card {
          padding: 0;
        }

        .section-header {
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #edf0f4;
        }

        .section-header h3,
        .management-list-header h3 {
          margin: 0;
          color: #172033;
        }

        .section-header span {
          display: block;
          margin-top: 4px;
          color: #94a3b8;
          font-size: 12px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        th {
          background: #f8fafc;
          color: #64748b;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          text-align: left;
          padding: 13px 15px;
          white-space: nowrap;
        }

        td {
          padding: 14px 15px;
          border-top: 1px solid #eef2f6;
          color: #475569;
          font-size: 13px;
          vertical-align: middle;
        }

        tbody tr {
          transition: background 0.18s ease;
        }

        tbody tr:hover {
          background: #f8fbff;
        }

        .employee-link {
          display: flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: 0;
          padding: 0;
          text-align: left;
        }

        .employee-link > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .employee-link strong {
          color: #172033;
        }

        .employee-link span {
          color: #94a3b8;
          font-size: 11px;
        }

        .employee-avatar {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #e0e7ff;
          color: #3730a3;
          font-weight: 800;
        }

        .employee-avatar.large {
          width: 46px;
          height: 46px;
          flex-basis: 46px;
        }

        .row-actions {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          white-space: nowrap;
        }

        .row-action-button {
          width: 36px;
          height: 36px;
          min-width: 36px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #dbe3ee;
          background: #ffffff;
          border-radius: 9px;
          color: #475569;
          box-shadow: 0 1px 2px
            rgba(15, 23, 42, 0.04);
          transition: all 0.18s ease;
        }

        .row-action-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px
            rgba(15, 23, 42, 0.1);
        }

        .row-action-button:focus-visible {
          outline: 3px solid
            rgba(37, 99, 235, 0.16);
          outline-offset: 1px;
        }

        .view-action {
          color: #2563eb;
        }

        .view-action:hover {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        .edit-action {
          color: #7c3aed;
        }

        .edit-action:hover {
          background: #f5f3ff;
          border-color: #c4b5fd;
        }

        .status-action {
          color: #d97706;
        }

        .status-action:hover {
          background: #fffbeb;
          border-color: #fcd34d;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .status-active {
          background: #dcfce7;
          color: #166534;
        }

        .status-inactive {
          background: #f1f5f9;
          color: #475569;
        }

        .status-on_leave {
          background: #fef3c7;
          color: #92400e;
        }

        .status-suspended {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-terminated {
          background: #e5e7eb;
          color: #374151;
        }

        .pagination {
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #edf0f4;
          color: #64748b;
          font-size: 12px;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pagination-controls button {
          width: 32px;
          height: 32px;
          border: 1px solid #dbe2ea;
          background: white;
          border-radius: 7px;
        }

        .pagination-controls select {
          width: auto;
          padding: 7px 9px;
        }

        .loading,
        .empty {
          padding: 45px;
          text-align: center;
          color: #94a3b8;
        }

        .error-box,
        .success-box,
        .info-box {
          margin: 14px 18px;
          padding: 11px 13px;
          border-radius: 8px;
          font-size: 13px;
        }

        .error-box {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .success-box {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .info-box {
          background: #eff6ff;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(
            15,
            23,
            42,
            0.52
          );
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .document-modal-backdrop {
          z-index: 1100;
        }

        .modal {
          width: min(620px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 60px
            rgba(15, 23, 42, 0.25);
        }

        .large-modal {
          width: min(850px, 100%);
        }

        .xlarge-modal {
          width: min(1100px, 100%);
        }

        .status-modal {
          width: min(620px, 100%);
        }

        .document-form-modal {
          width: min(720px, 100%);
        }

        .modal-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #edf0f4;
        }

        .modal-header h2 {
          margin: 0;
          color: #172033;
        }

        .modal-header p {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 13px;
        }

        .close-button {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 8px;
          background: #f1f5f9;
          font-size: 22px;
          color: #475569;
        }

        .form {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .form-section h3,
        .management-form h3 {
          margin: 0;
          color: #172033;
          font-size: 15px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          );
          gap: 14px;
        }

        .form label {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form label.full {
          grid-column: 1 / -1;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .modal-footer {
          padding: 16px 20px;
          border-top: 1px solid #edf0f4;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .management-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          min-height: 500px;
        }

        .management-form {
          padding: 20px;
          border-right: 1px solid #edf0f4;
          background: #f8fafc;
        }

        .management-list {
          padding: 20px;
        }

        .management-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .management-list-header span {
          color: #94a3b8;
          font-size: 12px;
        }

        .management-table {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }

        .management-row {
          display: grid;
          grid-template-columns:
            minmax(180px, 1fr)
            auto
            auto
            auto;
          align-items: center;
          gap: 15px;
          padding: 13px 14px;
          border-bottom: 1px solid #edf0f4;
        }

        .management-row:last-child {
          border-bottom: 0;
        }

        .management-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .management-main strong {
          color: #172033;
        }

        .management-main span {
          color: #94a3b8;
          font-size: 11px;
        }

        .count-badge {
          padding: 6px 9px;
          border-radius: 7px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .active-badge,
        .inactive-badge {
          display: inline-block;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
        }

        .active-badge {
          background: #dcfce7;
          color: #166534;
        }

        .inactive-badge {
          background: #f1f5f9;
          color: #64748b;
        }

        .management-actions {
          display: flex;
          gap: 5px;
        }

        .management-actions button {
          border: 1px solid #dbe2ea;
          background: white;
          border-radius: 7px;
          padding: 6px 8px;
          font-size: 11px;
          font-weight: 700;
        }

        .danger-text {
          color: #dc2626;
        }

        .assignment-box {
          margin-top: 18px;
          padding: 16px;
          border: 1px solid #dbe2ea;
          border-radius: 10px;
          background: #f8fafc;
        }

        .assignment-box h3 {
          margin: 0 0 12px;
          font-size: 14px;
        }

        .assignment-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .assignment-box small {
          display: block;
          margin-top: 8px;
          color: #94a3b8;
        }

        .checkbox-label {
          flex-direction: row !important;
          align-items: center;
        }

        .checkbox-label input {
          width: auto;
        }

        .selected-employee {
          margin: 18px;
          padding: 15px;
          border-radius: 12px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .selected-employee > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .selected-employee span {
          color: #94a3b8;
          font-size: 11px;
        }

        .status-options {
          padding: 0 18px;
          display: grid;
          gap: 8px;
        }

        .status-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 9px;
        }

        .status-option.selected {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .status-note {
          margin: 18px;
          padding: 12px;
          border-radius: 8px;
          background: #f8fafc;
          display: flex;
          gap: 6px;
          font-size: 12px;
          color: #64748b;
        }

        .status-employee-list {
          padding: 15px 18px;
          display: grid;
          gap: 7px;
        }

        .status-employee-list button {
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 9px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
        }

        .status-employee-list button > div:nth-child(2) {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .status-employee-list span {
          color: #94a3b8;
          font-size: 10px;
        }

        .status-employee-list .status-pill {
          color: inherit;
          font-size: 10px;
        }

        .profile {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .profile-hero {
          padding: 18px;
          border-radius: 12px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .profile-avatar {
          width: 62px;
          height: 62px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 23px;
          font-weight: 800;
        }

        .profile-title {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .profile-title h2 {
          margin: 0;
          color: #172033;
        }

        .profile-title p {
          margin: 0 0 5px;
          color: #64748b;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .profile-section {
          border: 1px solid #e5eaf0;
          border-radius: 11px;
          padding: 16px;
        }

        .profile-section h3 {
          margin: 0 0 14px;
          color: #172033;
          font-size: 14px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .detail-grid > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-grid .full {
          grid-column: 1 / -1;
        }

        .detail-grid span {
          color: #94a3b8;
          font-size: 10px;
          text-transform: uppercase;
        }

        .detail-grid strong {
          color: #334155;
          font-size: 12px;
          word-break: break-word;
        }

        .manager-card {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .manager-card div:last-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .manager-card span {
          color: #94a3b8;
          font-size: 11px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(
            4,
            1fr
          );
          gap: 12px;
        }

        .summary-card {
          padding: 15px;
          border-radius: 11px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .summary-card span {
          color: #64748b;
          font-size: 11px;
        }

        .summary-card strong {
          color: #172033;
          font-size: 20px;
        }

        .summary-card small {
          color: #94a3b8;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
        }

        .activity-item {
          display: flex;
          gap: 10px;
          padding: 12px 0;
          border-bottom: 1px solid #edf0f4;
        }

        .activity-item:last-child {
          border-bottom: 0;
        }

        .activity-dot {
          width: 8px;
          height: 8px;
          margin-top: 5px;
          border-radius: 50%;
          background: #2563eb;
          flex: 0 0 8px;
        }

        .activity-item > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .activity-item strong {
          color: #334155;
          font-size: 12px;
        }

        .activity-item span,
        .activity-item small {
          color: #94a3b8;
          font-size: 11px;
        }

        .required-mark {
          color: #dc2626;
          margin-left: 2px;
          font-weight: 700;
        }

        .role-context {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 8px;
          padding: 6px 9px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 11px;
        }

        .profile-feature-section {
          width: 100%;
        }

        .feature-section-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .feature-section-header h3 {
          margin-bottom: 4px;
        }

        .feature-section-header p {
          margin: 0;
          color: #94a3b8;
          font-size: 11px;
        }

        .small-button {
          padding: 8px 11px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .document-header-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .documents-table {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }

        .document-row {
          display: grid;
          grid-template-columns:
            34px
            minmax(0, 1fr)
            auto
            auto;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-bottom: 1px solid #edf0f4;
        }

        .document-row:last-child {
          border-bottom: 0;
        }

        .document-icon {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
        }

        .document-main {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .document-main strong {
          color: #334155;
          font-size: 12px;
          word-break: break-word;
        }

        .document-main span {
          color: #94a3b8;
          font-size: 10px;
        }

        .document-main small {
          color: #64748b;
          font-size: 10px;
          word-break: break-word;
        }

        .document-status {
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .document-status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .document-status-approved,
        .document-status-active {
          background: #dcfce7;
          color: #166534;
        }

        .document-status-rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .document-status-expired {
          background: #e5e7eb;
          color: #374151;
        }

        .document-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 5px;
          flex-wrap: wrap;
        }

        .document-link,
        .text-link-button {
          border: 0;
          background: transparent;
          color: #2563eb;
          font-size: 11px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          text-decoration: none;
        }

        .document-action-button {
          border: 1px solid #dbe2ea;
          background: white;
          color: #334155;
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 10px;
          font-weight: 700;
        }

        .danger-document {
          color: #dc2626;
        }

        .documents-empty {
          padding: 35px 20px;
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          text-align: center;
          background: #f8fafc;
        }

        .documents-empty-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #eff6ff;
          color: #2563eb;
          margin-bottom: 4px;
        }

        .documents-empty strong {
          color: #334155;
          font-size: 13px;
        }

        .documents-empty span {
          color: #94a3b8;
          font-size: 11px;
          max-width: 460px;
          line-height: 1.5;
          margin-bottom: 7px;
        }

        .document-loading {
          padding: 28px;
        }

        .document-message {
          margin: 0 0 12px;
        }

        .field-help {
          color: #94a3b8;
          font-size: 10px;
          font-weight: 500;
          line-height: 1.4;
        }

        .document-form-note {
          margin: 0 20px;
          padding: 11px 12px;
          border-radius: 8px;
          background: #eff6ff;
          color: #1e40af;
          border: 1px solid #bfdbfe;
          display: flex;
          align-items: flex-start;
          gap: 7px;
          font-size: 11px;
          line-height: 1.4;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(
            4,
            1fr
          );
          gap: 8px;
        }

        .metric-grid > div,
        .salary-grid > div {
          padding: 10px;
          border-radius: 8px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-grid span,
        .salary-grid span {
          color: #94a3b8;
          font-size: 9px;
          text-transform: uppercase;
        }

        .metric-grid strong,
        .salary-grid strong {
          color: #172033;
          font-size: 15px;
        }

        .salary-grid {
          display: grid;
          grid-template-columns: repeat(
            2,
            1fr
          );
          gap: 8px;
        }

        .salary-grid .salary-net {
          grid-column: 1 / -1;
          background: #eff6ff;
        }

        .salary-grid .salary-net strong {
          color: #1d4ed8;
        }

        .account-modal {
          max-width: 520px;
        }

        .account-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }

        .account-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #64748b;
          border-radius: 8px;
          padding: 8px 11px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .account-tab.active {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1d4ed8;
        }

        .account-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .account-form label {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .account-form label > span,
        .account-info-box strong {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
        }

        .account-form input,
        .account-form select {
          width: 100%;
          border: 1px solid #dbe2ea;
          border-radius: 8px;
          padding: 10px 11px;
          font-size: 13px;
          background: #ffffff;
          color: #0f172a;
          outline: none;
        }

        .account-form input:focus,
        .account-form select:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .account-info-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 11px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .account-info-box span {
          color: #64748b;
          font-size: 12px;
        }

        .account-warning {
          padding: 10px 11px;
          border-radius: 8px;
          background: #fff7ed;
          color: #9a3412;
          border: 1px solid #fed7aa;
          font-size: 11px;
          line-height: 1.5;
        }

        .account-controls-section {
          width: 100%;
        }

        .permission-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 9px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .account-control-grid {
          display: grid;
          grid-template-columns: repeat(
            2,
            1fr
          );
          gap: 9px;
        }

        .control-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
        }

        .control-card > svg {
          color: #2563eb;
          flex: 0 0 auto;
        }

        .control-card > div {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .control-card strong {
          color: #334155;
          font-size: 11px;
        }

        .control-card span {
          color: #94a3b8;
          font-size: 9px;
          line-height: 1.35;
        }

        .control-card button {
          border: 1px solid #dbe2ea;
          background: white;
          color: #334155;
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 10px;
          font-weight: 700;
        }

        .control-card button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .last-login {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
          color: #94a3b8;
          font-size: 10px;
        }

        .last-login strong {
          color: #64748b;
          font-weight: 600;
        }

        .self-service-grid {
          display: grid;
          grid-template-columns: repeat(
            3,
            1fr
          );
          gap: 8px;
        }

        .self-service-grid button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 11px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          color: #334155;
          font-size: 11px;
          font-weight: 700;
          text-align: left;
        }

        .self-service-grid button:hover {
          border-color: #93c5fd;
          background: #eff6ff;
        }

        .permission-note {
          margin-top: 10px;
          padding: 9px 10px;
          border-radius: 8px;
          background: #f8fafc;
          color: #64748b;
          font-size: 10px;
        }

        /* DARK MODE */
        :global(.hrms-dark-mode) .page {
          color: #e5e7eb;
        }

        :global(.hrms-dark-mode) .required-mark {
          color: #f87171;
        }

        :global(.hrms-dark-mode) .page-header h2 {
          color: #f8fafc;
        }

        :global(.hrms-dark-mode) .page-header p {
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .secondary-button {
          background: #1e293b;
          color: #e2e8f0;
          border: 1px solid #334155;
        }

        :global(.hrms-dark-mode) .clear-button {
          background: #1e293b;
          color: #cbd5e1;
          border: 1px solid #334155;
        }

        :global(.hrms-dark-mode) .refresh-button {
          background: #172033;
          color: #60a5fa;
          border: 1px solid #334155;
        }

        :global(.hrms-dark-mode) .stat-card,
        :global(.hrms-dark-mode) .card,
        :global(.hrms-dark-mode) .modal {
          background: #111827;
          border-color: #273449;
        }

        :global(.hrms-dark-mode) .stat-card span {
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .stat-card strong {
          color: #f8fafc;
        }

        :global(.hrms-dark-mode) .stat-icon {
          background: #172554;
          color: #60a5fa;
        }

        :global(.hrms-dark-mode) .active-icon {
          background: #052e1a;
          color: #4ade80;
        }

        :global(.hrms-dark-mode) .leave-icon {
          background: #3b2507;
          color: #fbbf24;
        }

        :global(.hrms-dark-mode) .dept-icon {
          background: #24164f;
          color: #a78bfa;
        }

        :global(.hrms-dark-mode) .field label,
        :global(.hrms-dark-mode) .form label {
          color: #cbd5e1;
        }

        :global(.hrms-dark-mode) input,
        :global(.hrms-dark-mode) select,
        :global(.hrms-dark-mode) textarea {
          background: #0f172a;
          color: #f1f5f9;
          border-color: #334155;
        }

        :global(.hrms-dark-mode) input::placeholder,
        :global(.hrms-dark-mode) textarea::placeholder {
          color: #64748b;
        }

        :global(.hrms-dark-mode) select option {
          background: #0f172a;
          color: #f1f5f9;
        }

        :global(.hrms-dark-mode) .section-header {
          border-bottom-color: #273449;
        }

        :global(.hrms-dark-mode) .section-header h3,
        :global(.hrms-dark-mode) .management-list-header h3 {
          color: #f8fafc;
        }

        :global(.hrms-dark-mode) .section-header span,
        :global(.hrms-dark-mode) .management-list-header span {
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) th {
          background: #0f172a;
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) td {
          color: #cbd5e1;
          border-top-color: #273449;
        }

        :global(.hrms-dark-mode) tbody tr:hover {
          background: #172033;
        }

        :global(.hrms-dark-mode) .employee-link strong {
          color: #f8fafc;
        }

        :global(.hrms-dark-mode) .employee-link span {
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .employee-avatar {
          background: #1e3a8a;
          color: #bfdbfe;
        }

        :global(.hrms-dark-mode) .row-action-button {
          background: #0f172a;
          border-color: #334155;
          color: #cbd5e1;
        }

        :global(.hrms-dark-mode) .view-action:hover {
          background: #172554;
          border-color: #3b82f6;
        }

        :global(.hrms-dark-mode) .edit-action:hover {
          background: #2e1065;
          border-color: #8b5cf6;
        }

        :global(.hrms-dark-mode) .status-action:hover {
          background: #451a03;
          border-color: #d97706;
        }

        :global(.hrms-dark-mode) .pagination {
          border-top-color: #273449;
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .pagination-controls button {
          background: #0f172a;
          color: #e2e8f0;
          border-color: #334155;
        }

        :global(.hrms-dark-mode) .modal-header {
          border-bottom-color: #273449;
        }

        :global(.hrms-dark-mode) .modal-header h2,
        :global(.hrms-dark-mode) .form-section h3,
        :global(.hrms-dark-mode) .management-form h3 {
          color: #f8fafc;
        }

        :global(.hrms-dark-mode) .modal-header p {
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .close-button {
          background: #1e293b;
          color: #cbd5e1;
        }

        :global(.hrms-dark-mode) .modal-footer {
          border-top-color: #273449;
        }

        :global(.hrms-dark-mode) .management-form {
          background: #0f172a;
          border-right-color: #273449;
        }

        :global(.hrms-dark-mode) .management-list {
          background: #111827;
        }

        :global(.hrms-dark-mode) .management-table {
          border-color: #334155;
        }

        :global(.hrms-dark-mode) .management-row {
          border-bottom-color: #273449;
        }

        :global(.hrms-dark-mode) .management-main strong {
          color: #f8fafc;
        }

        :global(.hrms-dark-mode) .management-main span {
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .count-badge {
          background: #172554;
          color: #93c5fd;
        }

        :global(.hrms-dark-mode) .management-actions button {
          background: #0f172a;
          color: #cbd5e1;
          border-color: #334155;
        }

        :global(.hrms-dark-mode) .assignment-box,
        :global(.hrms-dark-mode) .selected-employee,
        :global(.hrms-dark-mode) .status-note,
        :global(.hrms-dark-mode) .summary-card,
        :global(.hrms-dark-mode) .profile-hero {
          background: #0f172a;
        }

        :global(.hrms-dark-mode) .assignment-box {
          border-color: #334155;
        }

        :global(.hrms-dark-mode) .assignment-box h3 {
          color: #f8fafc;
        }

        :global(.hrms-dark-mode) .selected-employee span,
        :global(.hrms-dark-mode) .assignment-box small,
        :global(.hrms-dark-mode) .status-note,
        :global(.hrms-dark-mode) .summary-card span,
        :global(.hrms-dark-mode) .summary-card small,
        :global(.hrms-dark-mode) .profile-title p {
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .status-option,
        :global(.hrms-dark-mode) .status-employee-list button {
          background: #0f172a;
          border-color: #334155;
          color: #e2e8f0;
        }

        :global(.hrms-dark-mode) .status-option.selected {
          background: #172554;
          border-color: #3b82f6;
        }

        :global(.hrms-dark-mode) .profile-title h2,
        :global(.hrms-dark-mode) .profile-section h3,
        :global(.hrms-dark-mode) .summary-card strong {
          color: #f8fafc;
        }

        :global(.hrms-dark-mode) .profile-section {
          border-color: #334155;
        }

        :global(.hrms-dark-mode) .detail-grid strong {
          color: #e2e8f0;
        }

        :global(.hrms-dark-mode) .detail-grid span,
        :global(.hrms-dark-mode) .manager-card span {
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .activity-item {
          border-bottom-color: #273449;
        }

        :global(.hrms-dark-mode) .activity-item strong {
          color: #e2e8f0;
        }

        :global(.hrms-dark-mode) .activity-item span,
        :global(.hrms-dark-mode) .activity-item small {
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .error-box {
          background: #450a0a;
          color: #fca5a5;
          border-color: #7f1d1d;
        }

        :global(.hrms-dark-mode) .success-box {
          background: #052e1a;
          color: #86efac;
          border-color: #166534;
        }

        :global(.hrms-dark-mode) .info-box {
          background: #172554;
          color: #bfdbfe;
          border-color: #1d4ed8;
        }

        :global(.hrms-dark-mode) .role-context {
          background: #172554;
          color: #93c5fd;
        }

        :global(.hrms-dark-mode) .feature-section-header p {
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .documents-table {
          border-color: #334155;
        }

        :global(.hrms-dark-mode) .document-row {
          border-bottom-color: #273449;
        }

        :global(.hrms-dark-mode) .document-icon {
          background: #172554;
          color: #60a5fa;
        }

        :global(.hrms-dark-mode) .document-main strong {
          color: #e2e8f0;
        }

        :global(.hrms-dark-mode) .document-main small {
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .document-status-pending {
          background: #451a03;
          color: #fbbf24;
        }

        :global(.hrms-dark-mode) .document-status-approved,
        :global(.hrms-dark-mode) .document-status-active {
          background: #052e1a;
          color: #4ade80;
        }

        :global(.hrms-dark-mode) .document-status-rejected {
          background: #450a0a;
          color: #fca5a5;
        }

        :global(.hrms-dark-mode) .document-status-expired {
          background: #1e293b;
          color: #cbd5e1;
        }

        :global(.hrms-dark-mode) .document-action-button {
          background: #111827;
          color: #cbd5e1;
          border-color: #334155;
        }

        :global(.hrms-dark-mode) .documents-empty {
          background: #0f172a;
          border-color: #334155;
        }

        :global(.hrms-dark-mode) .documents-empty-icon {
          background: #172554;
          color: #60a5fa;
        }

        :global(.hrms-dark-mode) .documents-empty strong {
          color: #e2e8f0;
        }

        :global(.hrms-dark-mode) .documents-empty span {
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .document-form-note {
          background: #172554;
          color: #bfdbfe;
          border-color: #1d4ed8;
        }

        :global(.hrms-dark-mode) .field-help {
          color: #64748b;
        }

        :global(.hrms-dark-mode) .metric-grid > div,
        :global(.hrms-dark-mode) .salary-grid > div,
        :global(.hrms-dark-mode) .permission-note {
          background: #0f172a;
        }

        :global(.hrms-dark-mode) .metric-grid strong,
        :global(.hrms-dark-mode) .salary-grid strong {
          color: #f8fafc;
        }

        :global(.hrms-dark-mode) .salary-grid .salary-net {
          background: #172554;
        }

        :global(.hrms-dark-mode) .salary-grid .salary-net strong {
          color: #93c5fd;
        }

        :global(.hrms-dark-mode) .permission-badge {
          background: #172554;
          color: #93c5fd;
        }

        :global(.hrms-dark-mode) .account-tab {
          background: #172033;
          border-color: #334155;
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .account-tab.active {
          background: #172554;
          border-color: #1d4ed8;
          color: #93c5fd;
        }

        :global(.hrms-dark-mode) .account-form label > span,
        :global(.hrms-dark-mode) .account-info-box strong {
          color: #cbd5e1;
        }

        :global(.hrms-dark-mode) .account-form input,
        :global(.hrms-dark-mode) .account-form select {
          background: #0f172a;
          border-color: #334155;
          color: #e2e8f0;
        }

        :global(.hrms-dark-mode) .account-info-box {
          background: #172033;
          border-color: #334155;
        }

        :global(.hrms-dark-mode) .account-info-box span {
          color: #94a3b8;
        }

        :global(.hrms-dark-mode) .account-warning {
          background: #431407;
          color: #fdba74;
          border-color: #9a3412;
        }

        :global(.hrms-dark-mode) .control-card,
        :global(.hrms-dark-mode) .self-service-grid button {
          background: #0f172a;
          border-color: #334155;
        }

        :global(.hrms-dark-mode) .control-card strong,
        :global(.hrms-dark-mode) .self-service-grid button {
          color: #e2e8f0;
        }

        :global(.hrms-dark-mode) .control-card button {
          background: #111827;
          color: #cbd5e1;
          border-color: #334155;
        }

        :global(.hrms-dark-mode) .last-login strong {
          color: #cbd5e1;
        }

        :global(.hrms-dark-mode) .self-service-grid button:hover {
          background: #172554;
          border-color: #3b82f6;
        }

        :global(.hrms-dark-mode) .permission-note {
          color: #94a3b8;
        }

        @media (max-width: 1200px) {
          .filters-grid {
            grid-template-columns: repeat(
              3,
              1fr
            );
          }

          .stats-grid {
            grid-template-columns: repeat(
              2,
              1fr
            );
          }
        }

        @media (max-width: 900px) {
          .page-header {
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .management-layout {
            grid-template-columns: 1fr;
          }

          .management-form {
            border-right: 0;
            border-bottom: 1px solid
              #edf0f4;
          }

          .profile-grid {
            grid-template-columns: 1fr;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }

          .account-control-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .filters-grid,
          .form-grid,
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .form label.full,
          .detail-grid .full {
            grid-column: auto;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .pagination {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .management-row {
            grid-template-columns: 1fr;
          }

          .assignment-grid {
            grid-template-columns: 1fr;
          }

          .profile-hero {
            flex-wrap: wrap;
          }

          .feature-section-header {
            flex-direction: column;
          }

          .document-header-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .metric-grid,
          .self-service-grid {
            grid-template-columns: repeat(
              2,
              1fr
            );
          }

          .document-row {
            grid-template-columns:
              34px
              1fr
              auto;
          }

          .document-status {
            grid-column: 2;
            justify-self: start;
          }

          .document-actions {
            grid-column: 2 / -1;
            justify-content: flex-start;
          }
        }
      `}</style>
    </HRMSLayout>
  );
}