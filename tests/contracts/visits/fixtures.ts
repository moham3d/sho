import {
  Visit,
  VisitCreateRequest,
  VisitUpdateRequest,
  VisitCheckInRequest,
  VisitCheckOutRequest,
  VisitType,
  VisitPriority,
  VisitStatus,
  VisitOutcome,
  VisitForm,
  VisitCreateFormRequest
} from './types';

// Mock patients for visit testing
export const MOCK_PATIENTS = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'John',
    lastName: 'Doe',
    nationalId: '12345678901234',
    dateOfBirth: '1980-01-15',
    gender: 'male',
    phone: '+201234567890',
    email: 'john.doe@example.com',
    address: '123 Main Street, Cairo, Egypt'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    firstName: 'Jane',
    lastName: 'Smith',
    nationalId: '12345678901235',
    dateOfBirth: '1990-05-20',
    gender: 'female',
    phone: '+201234567891',
    email: 'jane.smith@example.com',
    address: '456 Oak Avenue, Alexandria, Egypt'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    firstName: 'Mohamed',
    lastName: 'Ali',
    nationalId: '12345678901236',
    dateOfBirth: '1975-11-30',
    gender: 'male',
    phone: '+201234567892',
    email: 'mohamed.ali@example.com',
    address: '789 Palm Road, Giza, Egypt'
  }
];

// Mock users for visit testing
export const MOCK_USERS = [
  {
    id: '987fcdeb-51a2-43d7-8f9e-0123456789ab',
    username: 'doctor_smith',
    firstName: 'Robert',
    lastName: 'Smith',
    email: 'robert.smith@hospital.com',
    role: 'doctor',
    department: 'Cardiology',
    licenseNumber: 'DOC123456'
  },
  {
    id: '987fcdeb-51a2-43d7-8f9e-0123456789ac',
    username: 'doctor_jones',
    firstName: 'Sarah',
    lastName: 'Jones',
    email: 'sarah.jones@hospital.com',
    role: 'doctor',
    department: 'Orthopedics',
    licenseNumber: 'DOC789012'
  },
  {
    id: '987fcdeb-51a2-43d7-8f9e-0123456789ad',
    username: 'nurse_johnson',
    firstName: 'Emily',
    lastName: 'Johnson',
    email: 'emily.johnson@hospital.com',
    role: 'nurse',
    department: 'Emergency'
  },
  {
    id: '987fcdeb-51a2-43d7-8f9e-0123456789ae',
    username: 'admin_williams',
    firstName: 'Michael',
    lastName: 'Williams',
    email: 'michael.williams@hospital.com',
    role: 'admin',
    department: 'Administration'
  }
];

// Valid visit create requests
export const VALID_VISIT_CREATE_REQUESTS: VisitCreateRequest[] = [
  {
    patientId: MOCK_PATIENTS[0].id,
    visitType: VisitType.INITIAL,
    reasonForVisit: 'Routine checkup and examination',
    priority: VisitPriority.MEDIUM,
    assignedDoctorId: MOCK_USERS[0].id,
    scheduledDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    notes: 'Patient requested annual physical examination',
    duration: 30,
    location: 'Examination Room 1',
    departmentId: 'dept-cardiology'
  },
  {
    patientId: MOCK_PATIENTS[1].id,
    visitType: VisitType.FOLLOW_UP,
    reasonForVisit: 'Follow-up for previous treatment',
    priority: VisitPriority.LOW,
    assignedDoctorId: MOCK_USERS[1].id,
    scheduledDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    notes: 'Post-operative follow-up visit',
    duration: 20,
    location: 'Consultation Room 2',
    departmentId: 'dept-orthopedics'
  },
  {
    patientId: MOCK_PATIENTS[2].id,
    visitType: VisitType.EMERGENCY,
    reasonForVisit: 'Chest pain and shortness of breath',
    priority: VisitPriority.URGENT,
    assignedDoctorId: MOCK_USERS[0].id,
    notes: 'Emergency admission via ambulance',
    location: 'Emergency Room 1',
    departmentId: 'dept-emergency'
  },
  {
    patientId: MOCK_PATIENTS[0].id,
    visitType: VisitType.SPECIALIST,
    reasonForVisit: 'Cardiology consultation',
    priority: VisitPriority.HIGH,
    assignedDoctorId: MOCK_USERS[0].id,
    scheduledDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
    notes: 'Referral from primary care physician',
    duration: 45,
    location: 'Specialist Room 1',
    departmentId: 'dept-cardiology'
  }
];

// Invalid visit create requests
export const INVALID_VISIT_CREATE_REQUESTS = [
  {
    description: 'Missing patientId',
    data: {
      visitType: VisitType.INITIAL,
      reasonForVisit: 'Routine checkup',
      priority: VisitPriority.MEDIUM
    } as VisitCreateRequest
  },
  {
    description: 'Missing visitType',
    data: {
      patientId: MOCK_PATIENTS[0].id,
      reasonForVisit: 'Routine checkup',
      priority: VisitPriority.MEDIUM
    } as VisitCreateRequest
  },
  {
    description: 'Missing reasonForVisit',
    data: {
      patientId: MOCK_PATIENTS[0].id,
      visitType: VisitType.INITIAL,
      priority: VisitPriority.MEDIUM
    } as VisitCreateRequest
  },
  {
    description: 'Missing priority',
    data: {
      patientId: MOCK_PATIENTS[0].id,
      visitType: VisitType.INITIAL,
      reasonForVisit: 'Routine checkup'
    } as VisitCreateRequest
  },
  {
    description: 'Invalid visitType',
    data: {
      patientId: MOCK_PATIENTS[0].id,
      visitType: 'invalid_type' as any,
      reasonForVisit: 'Routine checkup',
      priority: VisitPriority.MEDIUM
    } as VisitCreateRequest
  },
  {
    description: 'Invalid priority',
    data: {
      patientId: MOCK_PATIENTS[0].id,
      visitType: VisitType.INITIAL,
      reasonForVisit: 'Routine checkup',
      priority: 'invalid_priority' as any
    } as VisitCreateRequest
  },
  {
    description: 'Non-existent patient',
    data: {
      patientId: '00000000-0000-0000-0000-000000000000',
      visitType: VisitType.INITIAL,
      reasonForVisit: 'Routine checkup',
      priority: VisitPriority.MEDIUM
    } as VisitCreateRequest
  },
  {
    description: 'Non-existent doctor',
    data: {
      patientId: MOCK_PATIENTS[0].id,
      visitType: VisitType.INITIAL,
      reasonForVisit: 'Routine checkup',
      priority: VisitPriority.MEDIUM,
      assignedDoctorId: '00000000-0000-0000-0000-000000000000'
    } as VisitCreateRequest
  },
  {
    description: 'Past scheduledDateTime',
    data: {
      patientId: MOCK_PATIENTS[0].id,
      visitType: VisitType.INITIAL,
      reasonForVisit: 'Routine checkup',
      priority: VisitPriority.MEDIUM,
      scheduledDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    } as VisitCreateRequest
  },
  {
    description: 'Invalid duration (negative)',
    data: {
      patientId: MOCK_PATIENTS[0].id,
      visitType: VisitType.INITIAL,
      reasonForVisit: 'Routine checkup',
      priority: VisitPriority.MEDIUM,
      duration: -30
    } as VisitCreateRequest
  }
];

// Valid visit update requests
export const VALID_VISIT_UPDATE_REQUESTS: VisitUpdateRequest[] = [
  {
    visitType: VisitType.FOLLOW_UP,
    reasonForVisit: 'Updated reason for visit',
    priority: VisitPriority.HIGH,
    notes: 'Updated notes for the visit'
  },
  {
    status: VisitStatus.IN_PROGRESS,
    notes: 'Doctor started examination'
  },
  {
    assignedDoctorId: MOCK_USERS[1].id,
    scheduledDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    duration: 45
  },
  {
    location: 'Updated examination room',
    departmentId: 'dept-updated'
  }
];

// Invalid visit update requests
export const INVALID_VISIT_UPDATE_REQUESTS = [
  {
    description: 'Invalid status transition',
    data: {
      status: VisitStatus.COMPLETED
    } as VisitUpdateRequest,
    currentStatus: VisitStatus.PENDING
  },
  {
    description: 'Invalid visitType',
    data: {
      visitType: 'invalid_type' as any
    } as VisitUpdateRequest
  },
  {
    description: 'Invalid priority',
    data: {
      priority: 'invalid_priority' as any
    } as VisitUpdateRequest
  }
];

// Valid check-in requests
export const VALID_CHECK_IN_REQUESTS: VisitCheckInRequest[] = [
  {
    notes: 'Patient arrived on time, vitals stable',
    vitals: {
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 36.5,
      weight: 70,
      height: 175
    }
  },
  {
    notes: 'Patient checked in without vitals'
  },
  {
    vitals: {
      bloodPressure: '130/85',
      heartRate: 85,
      temperature: 37.2
    }
  }
];

// Invalid check-in requests
export const INVALID_CHECK_IN_REQUESTS = [
  {
    description: 'Invalid heart rate (negative)',
    data: {
      vitals: {
        heartRate: -10
      }
    } as VisitCheckInRequest
  },
  {
    description: 'Invalid temperature (too high)',
    data: {
      vitals: {
        temperature: 50
      }
    } as VisitCheckInRequest
  },
  {
    description: 'Invalid weight (negative)',
    data: {
      vitals: {
        weight: -70
      }
    } as VisitCheckInRequest
  }
];

// Valid check-out requests
export const VALID_CHECK_OUT_REQUESTS: VisitCheckOutRequest[] = [
  {
    outcome: VisitOutcome.DISCHARGED,
    followUpRequired: true,
    followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    dischargeInstructions: 'Continue medication as prescribed. Return if symptoms worsen.',
    notes: 'Patient discharged in stable condition'
  },
  {
    outcome: VisitOutcome.ADMITTED,
    followUpRequired: false,
    dischargeInstructions: 'Patient admitted for further observation',
    notes: 'Admitted to cardiology ward'
  },
  {
    outcome: VisitOutcome.REFERRED,
    followUpRequired: true,
    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    dischargeInstructions: 'Referred to specialist for further evaluation',
    notes: 'Referred to neurology department'
  }
];

// Invalid check-out requests
export const INVALID_CHECK_OUT_REQUESTS = [
  {
    description: 'Missing outcome',
    data: {
      followUpRequired: false
    } as VisitCheckOutRequest
  },
  {
    description: 'Missing followUpRequired',
    data: {
      outcome: VisitOutcome.DISCHARGED
    } as VisitCheckOutRequest
  },
  {
    description: 'Invalid outcome',
    data: {
      outcome: 'invalid_outcome' as any,
      followUpRequired: false
    } as VisitCheckOutRequest
  },
  {
    description: 'Past followUpDate',
    data: {
      outcome: VisitOutcome.DISCHARGED,
      followUpRequired: true,
      followUpDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    } as VisitCheckOutRequest
  }
];

// Valid form create requests
export const VALID_FORM_CREATE_REQUESTS: VisitCreateFormRequest[] = [
  {
    formType: 'medical_history',
    formData: {
      allergies: ['Penicillin', 'Latex'],
      medications: ['Lisinopril 10mg', 'Metformin 500mg'],
      chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
      surgeries: ['Appendectomy 2010'],
      familyHistory: 'Father has heart disease'
    }
  },
  {
    formType: 'vital_signs',
    formData: {
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 36.5,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      painScale: 0
    }
  },
  {
    formType: 'examination',
    formData: {
      generalAppearance: 'Well-developed, well-nourished',
      heent: 'Normocephalic, atraumatic',
      cardiovascular: 'Regular rate and rhythm',
      respiratory: 'Clear breath sounds bilaterally',
      abdominal: 'Soft, non-tender',
      neurological: 'Alert and oriented x3'
    }
  },
  {
    formType: 'treatment_plan',
    formData: {
      diagnosis: 'Essential Hypertension',
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          duration: '30 days'
        }
      ],
      procedures: [],
      referrals: [],
      followUp: '30 days'
    }
  }
];

// Invalid form create requests
export const INVALID_FORM_CREATE_REQUESTS = [
  {
    description: 'Missing formType',
    data: {
      formData: {
        allergies: ['Penicillin']
      }
    } as VisitCreateFormRequest
  },
  {
    description: 'Missing formData',
    data: {
      formType: 'medical_history'
    } as VisitCreateFormRequest
  },
  {
    description: 'Empty formData',
    data: {
      formType: 'medical_history',
      formData: {}
    } as VisitCreateFormRequest
  },
  {
    description: 'Invalid formType',
    data: {
      formType: 'invalid_form_type',
      formData: {
        allergies: ['Penicillin']
      }
    } as VisitCreateFormRequest
  }
];

// Sample existing visits for testing
export const SAMPLE_EXISTING_VISITS: Visit[] = [
  {
    id: '111e4567-e89b-12d3-a456-426614174111',
    patientId: MOCK_PATIENTS[0].id,
    visitType: VisitType.INITIAL,
    reasonForVisit: 'Annual physical examination',
    priority: VisitPriority.MEDIUM,
    status: VisitStatus.COMPLETED,
    assignedDoctorId: MOCK_USERS[0].id,
    scheduledDateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    checkInDateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    checkOutDateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    notes: 'Routine annual physical completed successfully',
    duration: 30,
    location: 'Examination Room 1',
    departmentId: 'dept-cardiology',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    createdBy: MOCK_USERS[2].id,
    updatedBy: MOCK_USERS[0].id
  },
  {
    id: '111e4567-e89b-12d3-a456-426614174112',
    patientId: MOCK_PATIENTS[1].id,
    visitType: VisitType.FOLLOW_UP,
    reasonForVisit: 'Post-operative follow-up',
    priority: VisitPriority.LOW,
    status: VisitStatus.SCHEDULED,
    assignedDoctorId: MOCK_USERS[1].id,
    scheduledDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    notes: 'Follow-up after knee surgery',
    duration: 20,
    location: 'Consultation Room 2',
    departmentId: 'dept-orthopedics',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    createdBy: MOCK_USERS[2].id
  },
  {
    id: '111e4567-e89b-12d3-a456-426614174113',
    patientId: MOCK_PATIENTS[2].id,
    visitType: VisitType.EMERGENCY,
    reasonForVisit: 'Chest pain and shortness of breath',
    priority: VisitPriority.URGENT,
    status: VisitStatus.IN_PROGRESS,
    assignedDoctorId: MOCK_USERS[0].id,
    checkInDateTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    notes: 'Emergency admission, currently being examined',
    duration: 60,
    location: 'Emergency Room 1',
    departmentId: 'dept-emergency',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    createdBy: MOCK_USERS[2].id,
    updatedBy: MOCK_USERS[0].id
  }
];

// Sample visit forms for testing
export const SAMPLE_VISIT_FORMS: VisitForm[] = [
  {
    id: '222e4567-e89b-12d3-a456-426614174221',
    visitId: SAMPLE_EXISTING_VISITS[0].id,
    formType: 'medical_history',
    formData: {
      allergies: ['Penicillin'],
      medications: ['Lisinopril 10mg'],
      chronicConditions: ['Hypertension'],
      surgeries: [],
      familyHistory: 'Father has heart disease'
    },
    status: 'completed',
    completedBy: MOCK_USERS[0].id,
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    signedBy: MOCK_USERS[0].id,
    signedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '222e4567-e89b-12d3-a456-426614174222',
    visitId: SAMPLE_EXISTING_VISITS[0].id,
    formType: 'vital_signs',
    formData: {
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 36.5,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      painScale: 0
    },
    status: 'completed',
    completedBy: MOCK_USERS[2].id,
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
];