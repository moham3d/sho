import { TestPatient, PatientVisit, MedicalRecord, PatientForm, MedicalHistory, PatientAuditLog } from './types';
import { UserRole } from './types';

export const TEST_PATIENTS: TestPatient[] = [
  {
    id: 'pat_1',
    patientId: 'PAT-2024-001',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    dateOfBirth: new Date('1980-05-15'),
    gender: 'male',
    nationalId: '1980051501234',
    phoneNumber: '+201234567890',
    email: 'john.doe@example.com',
    address: {
      street: '123 Main St',
      city: 'Cairo',
      state: 'Cairo',
      postalCode: '11511',
      country: 'Egypt'
    },
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phoneNumber: '+201234567891',
      email: 'jane.doe@example.com'
    },
    bloodType: 'A+',
    allergies: ['Penicillin', 'Dust'],
    chronicConditions: ['Hypertension', 'Diabetes Type 2'],
    medications: [
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        startDate: new Date('2023-01-15'),
        prescribedBy: 'Dr. Smith',
        isActive: true
      },
      {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        startDate: new Date('2023-02-01'),
        prescribedBy: 'Dr. Johnson',
        isActive: true
      }
    ],
    insurance: {
      provider: 'Global Health Insurance',
      policyNumber: 'POL-123456',
      groupNumber: 'GRP-789012',
      expiryDate: new Date('2025-12-31'),
      coverageType: 'Comprehensive'
    },
    primaryCarePhysician: 'Dr. Smith',
    isActive: true,
    consentGiven: true,
    consentDate: new Date('2023-01-01'),
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-12-15T14:30:00Z')
  },
  {
    id: 'pat_2',
    patientId: 'PAT-2024-002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    fullName: 'Sarah Johnson',
    dateOfBirth: new Date('1992-08-22'),
    gender: 'female',
    nationalId: '1992082205678',
    phoneNumber: '+201234567892',
    email: 'sarah.johnson@example.com',
    address: {
      street: '456 Elm St',
      city: 'Alexandria',
      state: 'Alexandria',
      postalCode: '21599',
      country: 'Egypt'
    },
    emergencyContact: {
      name: 'Michael Johnson',
      relationship: 'Father',
      phoneNumber: '+201234567893'
    },
    bloodType: 'O+',
    allergies: ['Shellfish'],
    chronicConditions: ['Asthma'],
    medications: [
      {
        name: 'Albuterol',
        dosage: '90mcg',
        frequency: 'As needed',
        startDate: new Date('2023-03-15'),
        prescribedBy: 'Dr. Williams',
        isActive: true
      }
    ],
    insurance: {
      provider: 'EgyptCare Insurance',
      policyNumber: 'POL-789012',
      expiryDate: new Date('2024-12-31'),
      coverageType: 'Basic'
    },
    primaryCarePhysician: 'Dr. Williams',
    isActive: true,
    consentGiven: true,
    consentDate: new Date('2023-03-01'),
    createdAt: new Date('2023-03-01T09:15:00Z'),
    updatedAt: new Date('2023-11-20T11:45:00Z')
  },
  {
    id: 'pat_3',
    patientId: 'PAT-2024-003',
    firstName: 'Ahmed',
    lastName: 'Hassan',
    fullName: 'Ahmed Hassan',
    dateOfBirth: new Date('1975-12-10'),
    gender: 'male',
    nationalId: '1975121009123',
    phoneNumber: '+201234567894',
    email: 'ahmed.hassan@example.com',
    address: {
      street: '789 Oak St',
      city: 'Giza',
      state: 'Giza',
      postalCode: '12511',
      country: 'Egypt'
    },
    emergencyContact: {
      name: 'Fatima Hassan',
      relationship: 'Spouse',
      phoneNumber: '+201234567895'
    },
    bloodType: 'B+',
    allergies: ['Latex', 'Ibuprofen'],
    chronicConditions: ['Arthritis', 'High Blood Pressure'],
    medications: [
      {
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'Three times daily',
        startDate: new Date('2023-04-10'),
        endDate: new Date('2023-06-15'),
        prescribedBy: 'Dr. Ahmed',
        isActive: false
      }
    ],
    insurance: {
      provider: 'MedNet Egypt',
      policyNumber: 'POL-345678',
      expiryDate: new Date('2025-06-30'),
      coverageType: 'Premium'
    },
    primaryCarePhysician: 'Dr. Ahmed',
    isActive: true,
    consentGiven: true,
    consentDate: new Date('2023-04-01'),
    createdAt: new Date('2023-04-01T08:30:00Z'),
    updatedAt: new Date('2023-10-10T16:20:00Z')
  },
  {
    id: 'pat_4',
    patientId: 'PAT-2024-004',
    firstName: 'Fatima',
    lastName: 'Mohamed',
    fullName: 'Fatima Mohamed',
    dateOfBirth: new Date('1965-03-25'),
    gender: 'female',
    nationalId: '1965032503456',
    phoneNumber: '+201234567896',
    address: {
      street: '321 Pine St',
      city: 'Luxor',
      state: 'Luxor',
      postalCode: '85111',
      country: 'Egypt'
    },
    emergencyContact: {
      name: 'Omar Mohamed',
      relationship: 'Son',
      phoneNumber: '+201234567897'
    },
    bloodType: 'AB-',
    allergies: ['Sulfa drugs'],
    chronicConditions: ['Osteoporosis'],
    medications: [
      {
        name: 'Calcium Carbonate',
        dosage: '1200mg',
        frequency: 'Once daily',
        startDate: new Date('2023-05-01'),
        prescribedBy: 'Dr. Fatima',
        isActive: true
      }
    ],
    insurance: {
      provider: 'National Health Insurance',
      policyNumber: 'POL-901234',
      expiryDate: new Date('2024-09-30'),
      coverageType: 'Standard'
    },
    primaryCarePhysician: 'Dr. Fatima',
    isActive: false,
    consentGiven: false,
    createdAt: new Date('2023-05-01T11:00:00Z'),
    updatedAt: new Date('2023-09-15T13:15:00Z')
  }
];

export const TEST_VISITS: PatientVisit[] = [
  {
    id: 'visit_1',
    patientId: 'pat_1',
    visitType: 'consultation',
    reason: 'Annual checkup and hypertension management',
    providerId: 'doc_1',
    providerName: 'Dr. Smith',
    providerRole: 'doctor',
    dateOfVisit: new Date('2024-01-15T10:00:00Z'),
    checkInTime: new Date('2024-01-15T09:45:00Z'),
    checkOutTime: new Date('2024-01-15T11:30:00Z'),
    status: 'completed',
    diagnosis: ['Essential Hypertension', 'Type 2 Diabetes Mellitus'],
    treatment: 'Continue current medications, lifestyle modifications',
    notes: 'Patient reports good compliance with medications. Blood pressure well controlled.',
    followUpRequired: true,
    followUpDate: new Date('2024-04-15'),
    vitals: {
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 36.8,
      weight: 85,
      height: 175,
      oxygenSaturation: 98
    },
    createdAt: new Date('2024-01-15T09:45:00Z'),
    updatedAt: new Date('2024-01-15T11:30:00Z')
  },
  {
    id: 'visit_2',
    patientId: 'pat_2',
    visitType: 'emergency',
    reason: 'Acute asthma attack',
    providerId: 'doc_2',
    providerName: 'Dr. Williams',
    providerRole: 'doctor',
    dateOfVisit: new Date('2024-02-20T14:30:00Z'),
    checkInTime: new Date('2024-02-20T14:15:00Z'),
    checkOutTime: new Date('2024-02-20T16:45:00Z'),
    status: 'completed',
    diagnosis: ['Acute Asthma Exacerbation'],
    treatment: 'Albuterol nebulizer, prednisone, oxygen therapy',
    notes: 'Patient presented with severe shortness of breath. Responded well to treatment.',
    followUpRequired: true,
    followUpDate: new Date('2024-03-01'),
    vitals: {
      bloodPressure: '140/90',
      heartRate: 110,
      temperature: 37.2,
      oxygenSaturation: 92
    },
    createdAt: new Date('2024-02-20T14:15:00Z'),
    updatedAt: new Date('2024-02-20T16:45:00Z')
  },
  {
    id: 'visit_3',
    patientId: 'pat_1',
    visitType: 'imaging',
    reason: 'Chest X-ray for respiratory symptoms',
    providerId: 'rad_1',
    providerName: 'Dr. Radiologist',
    providerRole: 'radiologist',
    dateOfVisit: new Date('2024-03-10T08:00:00Z'),
    status: 'scheduled',
    createdAt: new Date('2024-03-10T07:30:00Z'),
    updatedAt: new Date('2024-03-10T07:30:00Z')
  }
];

export const TEST_MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: 'med_1',
    patientId: 'pat_1',
    recordType: 'lab_result',
    title: 'Complete Blood Count',
    description: 'Routine CBC test results',
    data: {
      hemoglobin: 14.2,
      whiteBloodCells: 7.5,
      redBloodCells: 4.8,
      platelets: 250,
      referenceRanges: {
        hemoglobin: { min: 13.5, max: 17.5 },
        whiteBloodCells: { min: 4.5, max: 11.0 },
        redBloodCells: { min: 4.2, max: 5.9 },
        platelets: { min: 150, max: 450 }
      }
    },
    providerId: 'tech_1',
    providerName: 'Lab Technician',
    visitId: 'visit_1',
    dateOfService: new Date('2024-01-15T10:30:00Z'),
    isConfidential: false,
    accessLevel: 'public',
    tags: ['routine', 'blood_test'],
    createdAt: new Date('2024-01-15T11:00:00Z'),
    updatedAt: new Date('2024-01-15T11:00:00Z')
  },
  {
    id: 'med_2',
    patientId: 'pat_2',
    recordType: 'imaging',
    title: 'Chest X-ray',
    description: 'PA and lateral chest X-ray for asthma evaluation',
    data: {
      findings: 'Clear lung fields, no evidence of consolidation or pneumothorax',
      impression: 'Normal chest X-ray',
      technique: 'PA and lateral views'
    },
    providerId: 'rad_1',
    providerName: 'Dr. Radiologist',
    visitId: 'visit_2',
    dateOfService: new Date('2024-02-20T15:00:00Z'),
    isConfidential: false,
    accessLevel: 'restricted',
    tags: ['imaging', 'chest_xray'],
    createdAt: new Date('2024-02-20T16:00:00Z'),
    updatedAt: new Date('2024-02-20T16:00:00Z')
  },
  {
    id: 'med_3',
    patientId: 'pat_1',
    recordType: 'medication',
    title: 'Medication Adjustment',
    description: 'Adjustment of antihypertensive medication',
    data: {
      previousMedication: 'Lisinopril 20mg',
      newMedication: 'Lisinopril 40mg',
      reason: 'Blood pressure not adequately controlled',
      monitoringRequired: true
    },
    providerId: 'doc_1',
    providerName: 'Dr. Smith',
    visitId: 'visit_1',
    dateOfService: new Date('2024-01-15T11:00:00Z'),
    isConfidential: true,
    accessLevel: 'confidential',
    tags: ['medication', 'adjustment'],
    createdAt: new Date('2024-01-15T11:30:00Z'),
    updatedAt: new Date('2024-01-15T11:30:00Z')
  }
];

export const TEST_FORMS: PatientForm[] = [
  {
    id: 'form_1',
    formId: 'consent_form',
    formName: 'Patient Consent Form',
    version: '1.0',
    patientId: 'pat_1',
    visitId: 'visit_1',
    data: {
      consentGiven: true,
      consentType: 'treatment',
      dateOfConsent: '2024-01-15',
      patientSignature: 'John Doe',
      witnessSignature: 'Nurse Smith'
    },
    status: 'approved',
    completedBy: 'nurse_1',
    completedByRole: 'nurse',
    completedAt: new Date('2024-01-15T09:30:00Z'),
    submittedAt: new Date('2024-01-15T09:45:00Z'),
    approvedAt: new Date('2024-01-15T10:00:00Z'),
    approvedBy: 'doc_1',
    createdAt: new Date('2024-01-15T09:30:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    id: 'form_2',
    formId: 'medical_history',
    formName: 'Medical History Form',
    version: '2.1',
    patientId: 'pat_2',
    visitId: 'visit_2',
    data: {
      previousConditions: ['Asthma', 'Allergic rhinitis'],
      familyHistory: {
        asthma: 'Father',
        allergies: 'Mother'
      },
      lifestyle: {
        smoking: 'never',
        alcohol: 'never',
        exercise: 'regular'
      }
    },
    status: 'completed',
    completedBy: 'nurse_2',
    completedByRole: 'nurse',
    completedAt: new Date('2024-02-20T14:45:00Z'),
    submittedAt: new Date('2024-02-20T15:00:00Z'),
    createdAt: new Date('2024-02-20T14:45:00Z'),
    updatedAt: new Date('2024-02-20T15:00:00Z')
  }
];

export const TEST_MEDICAL_HISTORIES: Record<string, MedicalHistory> = {
  pat_1: {
    patientId: 'pat_1',
    conditions: [
      {
        id: 'cond_1',
        condition: 'Essential Hypertension',
        diagnosisDate: new Date('2020-03-15'),
        isActive: true,
        severity: 'moderate',
        treatment: 'Lisinopril 40mg daily',
        notes: 'Well controlled with medication'
      },
      {
        id: 'cond_2',
        condition: 'Type 2 Diabetes Mellitus',
        diagnosisDate: new Date('2019-07-20'),
        isActive: true,
        severity: 'mild',
        treatment: 'Metformin 500mg twice daily',
        notes: 'Good blood sugar control'
      }
    ],
    surgeries: [
      {
        id: 'surg_1',
        procedure: 'Appendectomy',
        date: new Date('2015-06-10'),
        surgeon: 'Dr. Ahmed',
        hospital: 'Cairo Medical Center',
        notes: 'Uncomplicated procedure'
      }
    ],
    familyHistory: {
      conditions: [
        {
          relationship: 'Father',
          condition: 'Hypertension',
          ageOfOnset: 55
        },
        {
          relationship: 'Mother',
          condition: 'Type 2 Diabetes',
          ageOfOnset: 60
        }
      ]
    },
    immunizations: [
      {
        id: 'imm_1',
        vaccine: 'Influenza',
        date: new Date('2023-10-15'),
        administeredBy: 'Nurse Johnson',
        nextDueDate: new Date('2024-10-15'),
        lotNumber: 'FLU2023-001'
      }
    ],
    allergies: [
      {
        id: 'all_1',
        allergen: 'Penicillin',
        reaction: 'Rash, itching',
        severity: 'moderate',
        firstObserved: new Date('1995-03-15'),
        notes: 'Avoid all penicillin derivatives'
      }
    ],
    socialHistory: {
      smokingStatus: 'never',
      alcoholUse: 'occasional',
      occupation: 'Software Engineer',
      exercise: {
        frequency: '3-4 times per week',
        duration: '45 minutes',
        type: 'Mixed cardio and strength training'
      },
      diet: 'Mediterranean diet'
    },
    lastUpdated: new Date('2024-01-15T11:30:00Z')
  }
};

export const TEST_AUDIT_LOGS: PatientAuditLog[] = [
  {
    id: 'audit_1',
    userId: 'user_1',
    userName: 'Dr. Smith',
    userRole: 'doctor',
    action: 'patient_viewed',
    resource: 'patient',
    resourceId: 'pat_1',
    patientId: 'pat_1',
    details: {
      reason: 'Routine checkup',
      accessMethod: 'web_portal'
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date('2024-01-15T09:45:00Z'),
    isPhiAccess: true,
    reasonForAccess: 'Patient care'
  },
  {
    id: 'audit_2',
    userId: 'user_2',
    userName: 'Nurse Johnson',
    userRole: 'nurse',
    action: 'medical_record_created',
    resource: 'medical_record',
    resourceId: 'med_1',
    patientId: 'pat_1',
    details: {
      recordType: 'lab_result',
      recordTitle: 'Complete Blood Count'
    },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    timestamp: new Date('2024-01-15T11:00:00Z'),
    isPhiAccess: true,
    reasonForAccess: 'Patient care documentation'
  },
  {
    id: 'audit_3',
    userId: 'user_3',
    userName: 'Lab Technician',
    userRole: 'technician',
    action: 'medical_record_viewed',
    resource: 'medical_record',
    resourceId: 'med_2',
    patientId: 'pat_2',
    details: {
      reason: 'Lab analysis',
      accessMethod: 'system_integration'
    },
    ipAddress: '192.168.1.102',
    userAgent: 'Lab Information System v2.1',
    timestamp: new Date('2024-02-20T16:30:00Z'),
    isPhiAccess: true,
    reasonForAccess: 'Diagnostic testing'
  }
];

export const VALID_PATIENT_CREATE_REQUEST = {
  firstName: 'Test',
  lastName: 'Patient',
  dateOfBirth: '1990-01-01',
  gender: 'male' as const,
  nationalId: '1990010101234',
  phoneNumber: '+201234567890',
  email: 'test.patient@example.com',
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    country: 'Egypt'
  },
  emergencyContact: {
    name: 'Emergency Contact',
    relationship: 'Spouse',
    phoneNumber: '+201234567891'
  },
  bloodType: 'A+' as const,
  allergies: ['Dust'],
  chronicConditions: [],
  insurance: {
    provider: 'Test Insurance',
    policyNumber: 'TEST-123456',
    expiryDate: '2025-12-31',
    coverageType: 'Basic'
  },
  primaryCarePhysician: 'Dr. Test',
  consentGiven: true
};

export const INVALID_PATIENT_CREATE_REQUESTS = [
  {
    name: 'Missing required fields',
    data: {
      firstName: 'Test',
      lastName: 'Patient'
    },
    expectedError: 'VALIDATION_ERROR'
  },
  {
    name: 'Invalid date format',
    data: {
      ...VALID_PATIENT_CREATE_REQUEST,
      dateOfBirth: 'invalid-date'
    },
    expectedError: 'VALIDATION_ERROR'
  },
  {
    name: 'Invalid phone number',
    data: {
      ...VALID_PATIENT_CREATE_REQUEST,
      phoneNumber: 'invalid-phone'
    },
    expectedError: 'VALIDATION_ERROR'
  },
  {
    name: 'Invalid email format',
    data: {
      ...VALID_PATIENT_CREATE_REQUEST,
      email: 'invalid-email'
    },
    expectedError: 'VALIDATION_ERROR'
  },
  {
    name: 'Missing consent',
    data: {
      ...VALID_PATIENT_CREATE_REQUEST,
      consentGiven: false
    },
    expectedError: 'CONSENT_REQUIRED'
  }
];

export const VALID_MEDICAL_RECORD_CREATE_REQUEST = {
  recordType: 'lab_result' as const,
  title: 'Test Lab Result',
  description: 'Test lab result description',
  data: {
    testValue: 100,
    unit: 'mg/dL',
    referenceRange: { min: 50, max: 150 }
  },
  dateOfService: '2024-01-15',
  isConfidential: false,
  accessLevel: 'public' as const,
  tags: ['test', 'lab']
};

export const PATIENT_SEARCH_QUERIES = [
  {
    name: 'Search by name',
    query: { name: 'John' },
    expectedResults: ['pat_1']
  },
  {
    name: 'Search by patient ID',
    query: { patientId: 'PAT-2024-001' },
    expectedResults: ['pat_1']
  },
  {
    name: 'Search by phone number',
    query: { phone: '+201234567890' },
    expectedResults: ['pat_1']
  },
  {
    name: 'Search by blood type',
    query: { bloodType: 'A+' as const },
    expectedResults: ['pat_1']
  },
  {
    name: 'Search by condition',
    query: { condition: 'Diabetes' },
    expectedResults: ['pat_1']
  },
  {
    name: 'Search by medication',
    query: { medication: 'Lisinopril' },
    expectedResults: ['pat_1']
  },
  {
    name: 'Search by allergy',
    query: { allergies: ['Penicillin'] },
    expectedResults: ['pat_1']
  },
  {
    name: 'Search by date range',
    query: {
      dateRange: { start: '2024-01-01', end: '2024-01-31' }
    },
    expectedResults: ['pat_1']
  },
  {
    name: 'Search by age range',
    query: {
      ageRange: { min: 40, max: 50 }
    },
    expectedResults: ['pat_1']
  },
  {
    name: 'Complex search',
    query: {
      name: 'John',
      bloodType: 'A+' as const,
      condition: 'Diabetes',
      isActive: true
    },
    expectedResults: ['pat_1']
  }
];

export const PHI_ACCESS_TEST_SCENARIOS = [
  {
    name: 'Doctor accessing patient records for treatment',
    userRole: 'doctor' as UserRole,
    patientId: 'pat_1',
    action: 'patient_viewed',
    reason: 'Patient treatment',
    isAllowed: true
  },
  {
    name: 'Nurse accessing patient records for care',
    userRole: 'nurse' as UserRole,
    patientId: 'pat_1',
    action: 'patient_viewed',
    reason: 'Patient care',
    isAllowed: true
  },
  {
    name: 'Receptionist accessing medical records without need',
    userRole: 'receptionist' as UserRole,
    patientId: 'pat_1',
    action: 'medical_record_viewed',
    reason: 'Curiosity',
    isAllowed: false
  },
  {
    name: 'Technician accessing own records',
    userRole: 'technician' as UserRole,
    patientId: 'pat_1',
    action: 'patient_viewed',
    reason: 'Personal access',
    isAllowed: false
  }
];

export const COMPLIANCE_TEST_SCENARIOS = [
  {
    name: 'HIPAA - Minimum necessary standard',
    scenario: 'Access only necessary information',
    test: async () => {
      // Test implementation
    }
  },
  {
    name: 'HIPAA - Access audit logging',
    scenario: 'All PHI access must be logged',
    test: async () => {
      // Test implementation
    }
  },
  {
    name: 'HIPAA - Data encryption',
    scenario: 'PHI data must be encrypted at rest and in transit',
    test: async () => {
      // Test implementation
    }
  },
  {
    name: 'GDPR - Data subject access',
    scenario: 'Patients can access their own data',
    test: async () => {
      // Test implementation
    }
  },
  {
    name: 'GDPR - Right to be forgotten',
    scenario: 'Patients can request data deletion',
    test: async () => {
      // Test implementation
    }
  }
];

export const PATIENT_ROLE_PERMISSIONS = {
  admin: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    canViewPhi: true,
    canExport: true,
    canSearch: true,
    canManageConsent: true
  },
  doctor: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    canViewPhi: true,
    canExport: true,
    canSearch: true,
    canManageConsent: true
  },
  nurse: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    canViewPhi: true,
    canExport: false,
    canSearch: true,
    canManageConsent: false
  },
  receptionist: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    canViewPhi: false,
    canExport: false,
    canSearch: true,
    canManageConsent: false
  },
  technician: {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canViewPhi: false,
    canExport: false,
    canSearch: false,
    canManageConsent: false
  },
  radiologist: {
    canCreate: false,
    canRead: true,
    canUpdate: false,
    canDelete: false,
    canViewPhi: true,
    canExport: false,
    canSearch: true,
    canManageConsent: false
  }
};