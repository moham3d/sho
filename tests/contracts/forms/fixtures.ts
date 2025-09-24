// Form Management Test Fixtures
// This file contains test data and mock objects for form management tests

import {
  User,
  Patient,
  Visit,
  FormTemplate,
  Form,
  FormSignature,
  FormMetadata,
  FormField,
  FormSection,
  FormSchema,
  ValidationRule,
  FormType,
  FormStatus,
  UserRole,
  Language,
  UUID,
  FormAttachment,
  AuditEntry,
  AuditAction
} from './types';

// Test Users
export const TEST_USERS: Record<string, User> = {
  admin: {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'admin',
    email: 'admin@alshorouk.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  doctor: {
    id: '00000000-0000-0000-0000-000000000002',
    username: 'doctor',
    email: 'doctor@alshorouk.com',
    firstName: 'Ahmed',
    lastName: 'Mohamed',
    role: 'doctor',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  nurse: {
    id: '00000000-0000-0000-0000-000000000003',
    username: 'nurse',
    email: 'nurse@alshorouk.com',
    firstName: 'Fatima',
    lastName: 'Ali',
    role: 'nurse',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  receptionist: {
    id: '00000000-0000-0000-0000-000000000004',
    username: 'receptionist',
    email: 'receptionist@alshorouk.com',
    firstName: 'Aisha',
    lastName: 'Hassan',
    role: 'receptionist',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  }
};

// Test Patients
export const TEST_PATIENTS: Record<string, Patient> = {
  patient1: {
    id: '10000000-0000-0000-0000-000000000001',
    firstName: 'محمد',
    lastName: 'أحمد',
    nationalId: '12345678901234',
    dateOfBirth: new Date('1980-05-15'),
    gender: 'male',
    phone: '+201012345678',
    email: 'mohamed.ahmed@example.com',
    address: '123 شارع التحرير، القاهرة، مصر',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  patient2: {
    id: '10000000-0000-0000-0000-000000000002',
    firstName: 'فاطمة',
    lastName: 'علي',
    nationalId: '12345678901235',
    dateOfBirth: new Date('1975-08-20'),
    gender: 'female',
    phone: '+201098765432',
    email: 'fatima.ali@example.com',
    address: '456 شارع النيل، الإسكندرية، مصر',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  patient3: {
    id: '10000000-0000-0000-0000-000000000003',
    firstName: 'John',
    lastName: 'Doe',
    nationalId: '12345678901236',
    dateOfBirth: new Date('1990-12-10'),
    gender: 'male',
    phone: '+201112233445',
    email: 'john.doe@example.com',
    address: '789 Main Street, Cairo, Egypt',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  }
};

// Test Visits
export const TEST_VISITS: Record<string, Visit> = {
  visit1: {
    id: '20000000-0000-0000-0000-000000000001',
    patientId: TEST_PATIENTS.patient1.id,
    visitType: 'initial',
    reasonForVisit: 'Chest pain and shortness of breath',
    priority: 'high',
    status: 'in_progress',
    assignedDoctorId: TEST_USERS.doctor.id,
    assignedNurseId: TEST_USERS.nurse.id,
    startTime: new Date('2023-06-15T09:00:00Z'),
    notes: 'Patient presents with chest pain, requires immediate evaluation',
    createdAt: new Date('2023-06-15T09:00:00Z'),
    updatedAt: new Date('2023-06-15T09:00:00Z')
  },
  visit2: {
    id: '20000000-0000-0000-0000-000000000002',
    patientId: TEST_PATIENTS.patient2.id,
    visitType: 'follow_up',
    reasonForVisit: 'Post-operative checkup',
    priority: 'medium',
    status: 'scheduled',
    assignedDoctorId: TEST_USERS.doctor.id,
    startTime: new Date('2023-06-16T10:00:00Z'),
    notes: 'Routine follow-up after recent surgery',
    createdAt: new Date('2023-06-15T14:00:00Z'),
    updatedAt: new Date('2023-06-15T14:00:00Z')
  }
};

// Form Templates
export const NURSE_FORM_TEMPLATE: FormTemplate = {
  id: '30000000-0000-0000-0000-000000000001',
  name: 'Nurse Assessment Form',
  description: 'Comprehensive nursing assessment form for initial patient evaluation',
  type: 'nurse_form',
  version: '1.0.0',
  schema: {
    sections: [
      {
        id: 'patient_info',
        title: { en: 'Patient Information', ar: 'معلومات المريض' },
        description: { en: 'Basic patient information', ar: 'معلومات أساسية عن المريض' },
        order: 1,
        isCollapsible: false,
        isRequired: true,
        fields: ['patient_name', 'patient_id', 'date_of_birth', 'gender']
      },
      {
        id: 'vital_signs',
        title: { en: 'Vital Signs', ar: 'العلامات الحيوية' },
        description: { en: 'Patient vital signs measurement', ar: 'قياسات العلامات الحيوية للمريض' },
        order: 2,
        isCollapsible: true,
        isRequired: true,
        fields: ['blood_pressure', 'heart_rate', 'respiratory_rate', 'temperature', 'oxygen_saturation']
      },
      {
        id: 'assessment',
        title: { en: 'Nursing Assessment', ar: 'تقييم التمريض' },
        description: { en: 'Comprehensive nursing assessment', ar: 'التقييم الشامل للتمريض' },
        order: 3,
        isCollapsible: true,
        isRequired: true,
        fields: ['chief_complaint', 'pain_assessment', 'mobility', 'nutrition', 'psychosocial']
      }
    ],
    fields: [
      {
        id: 'patient_name',
        name: { en: 'Patient Name', ar: 'اسم المريض' },
        type: 'text',
        required: true,
        readOnly: true,
        phi: true,
        sensitive: false,
        order: 1
      },
      {
        id: 'blood_pressure',
        name: { en: 'Blood Pressure', ar: 'ضغط الدم' },
        type: 'text',
        required: true,
        readOnly: false,
        validation: {
          pattern: '^\\d{2,3}\\/\\d{2,3}$',
          minLength: 5,
          maxLength: 7
        },
        phi: false,
        sensitive: false,
        order: 2
      },
      {
        id: 'heart_rate',
        name: { en: 'Heart Rate', ar: 'معدل ضربات القلب' },
        type: 'number',
        required: true,
        readOnly: false,
        validation: {
          min: 30,
          max: 200
        },
        phi: false,
        sensitive: false,
        order: 3
      },
      {
        id: 'pain_scale',
        name: { en: 'Pain Scale (0-10)', ar: 'مقياس الألم (0-10)' },
        type: 'number',
        required: true,
        readOnly: false,
        validation: {
          min: 0,
          max: 10
        },
        phi: false,
        sensitive: false,
        order: 4
      }
    ],
    dependencies: [],
    calculatedFields: []
  },
  requiredFields: ['patient_name', 'blood_pressure', 'heart_rate', 'pain_scale'],
  validationRules: [
    {
      fieldId: 'blood_pressure',
      type: 'pattern',
      condition: '^\\d{2,3}\\/\\d{2,3}$',
      message: {
        en: 'Blood pressure must be in format 120/80',
        ar: 'يجب أن يكون ضغط الدم بالتنسيق 120/80'
      },
      severity: 'error'
    }
  ],
  supportedLanguages: ['en', 'ar'],
  isActive: true,
  createdBy: TEST_USERS.admin.id,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

export const DOCTOR_FORM_TEMPLATE: FormTemplate = {
  id: '30000000-0000-0000-0000-000000000002',
  name: 'Doctor Evaluation Form',
  description: 'Medical evaluation and diagnosis form for doctor assessment',
  type: 'doctor_form',
  version: '1.0.0',
  schema: {
    sections: [
      {
        id: 'medical_history',
        title: { en: 'Medical History', ar: 'التاريخ الطبي' },
        description: { en: 'Patient medical history', ar: 'التاريخ الطبي للمريض' },
        order: 1,
        isCollapsible: true,
        isRequired: true,
        fields: ['chronic_conditions', 'medications', 'allergies', 'previous_surgeries']
      },
      {
        id: 'examination',
        title: { en: 'Physical Examination', ar: 'الفحص السريري' },
        description: { en: 'Physical examination findings', ar: 'نتائج الفحص السريري' },
        order: 2,
        isCollapsible: true,
        isRequired: true,
        fields: ['general_appearance', 'vital_signs', 'systemic_examination']
      },
      {
        id: 'diagnosis',
        title: { en: 'Diagnosis and Treatment', ar: 'التشخيص والعلاج' },
        description: { en: 'Diagnosis and treatment plan', ar: 'خطة التشخيص والعلاج' },
        order: 3,
        isCollapsible: false,
        isRequired: true,
        fields: ['primary_diagnosis', 'secondary_diagnoses', 'treatment_plan', 'follow_up']
      }
    ],
    fields: [
      {
        id: 'primary_diagnosis',
        name: { en: 'Primary Diagnosis', ar: 'التشخيص الأساسي' },
        type: 'text',
        required: true,
        readOnly: false,
        phi: true,
        sensitive: true,
        order: 1
      },
      {
        id: 'treatment_plan',
        name: { en: 'Treatment Plan', ar: 'خطة العلاج' },
        type: 'textarea',
        required: true,
        readOnly: false,
        validation: {
          minLength: 10,
          maxLength: 2000
        },
        phi: true,
        sensitive: true,
        order: 2
      }
    ],
    dependencies: [],
    calculatedFields: []
  },
  requiredFields: ['primary_diagnosis', 'treatment_plan'],
  validationRules: [
    {
      fieldId: 'primary_diagnosis',
      type: 'required',
      condition: 'true',
      message: {
        en: 'Primary diagnosis is required',
        ar: 'التشخيص الأساسي مطلوب'
      },
      severity: 'error'
    }
  ],
  supportedLanguages: ['en', 'ar'],
  isActive: true,
  createdBy: TEST_USERS.admin.id,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

export const CONSENT_FORM_TEMPLATE: FormTemplate = {
  id: '30000000-0000-0000-0000-000000000003',
  name: 'Informed Consent Form',
  description: 'Patient consent form for medical procedures',
  type: 'consent_form',
  version: '1.0.0',
  schema: {
    sections: [
      {
        id: 'procedure_info',
        title: { en: 'Procedure Information', ar: 'معلومات الإجراء' },
        description: { en: 'Details of the proposed procedure', ar: 'تفاصيل الإجراء المقترح' },
        order: 1,
        isCollapsible: false,
        isRequired: true,
        fields: ['procedure_name', 'procedure_description', 'risks', 'benefits', 'alternatives']
      },
      {
        id: 'consent',
        title: { en: 'Patient Consent', ar: 'موافقة المريض' },
        description: { en: 'Patient consent and acknowledgement', ar: 'موافقة المريض وإقراره' },
        order: 2,
        isCollapsible: false,
        isRequired: true,
        fields: ['consent_given', 'understood', 'questions', 'signature']
      }
    ],
    fields: [
      {
        id: 'procedure_name',
        name: { en: 'Procedure Name', ar: 'اسم الإجراء' },
        type: 'text',
        required: true,
        readOnly: false,
        phi: false,
        sensitive: false,
        order: 1
      },
      {
        id: 'consent_given',
        name: { en: 'I consent to this procedure', ar: 'أوافق على هذا الإجراء' },
        type: 'checkbox',
        required: true,
        readOnly: false,
        phi: false,
        sensitive: false,
        order: 2
      },
      {
        id: 'signature',
        name: { en: 'Patient Signature', ar: 'توقيع المريض' },
        type: 'signature',
        required: true,
        readOnly: false,
        phi: true,
        sensitive: true,
        order: 3
      }
    ],
    dependencies: [],
    calculatedFields: []
  },
  requiredFields: ['procedure_name', 'consent_given', 'signature'],
  validationRules: [
    {
      fieldId: 'consent_given',
      type: 'required',
      condition: 'true',
      message: {
        en: 'Patient consent is required',
        ar: 'موافقة المريض مطلوبة'
      },
      severity: 'error'
    }
  ],
  supportedLanguages: ['en', 'ar'],
  isActive: true,
  createdBy: TEST_USERS.admin.id,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

// Test Form Data
export const TEST_NURSE_FORM_DATA = {
  patient_name: 'محمد أحمد',
  patient_id: TEST_PATIENTS.patient1.id,
  date_of_birth: '1980-05-15',
  gender: 'male',
  blood_pressure: '140/90',
  heart_rate: 85,
  respiratory_rate: 18,
  temperature: 37.2,
  oxygen_saturation: 98,
  pain_scale: 6,
  chief_complaint: 'Chest pain and shortness of breath',
  pain_assessment: {
    location: 'chest',
    characteristics: 'sharp',
    duration: '2 hours',
    aggravating_factors: 'deep breathing'
  },
  mobility: 'independent',
  nutrition: 'good',
  psychosocial: 'anxious but cooperative',
  notes: 'Patient appears anxious but cooperative'
};

export const TEST_DOCTOR_FORM_DATA = {
  primary_diagnosis: 'Stable coronary artery disease',
  secondary_diagnoses: ['Hypertension', 'Hyperlipidemia'],
  treatment_plan: 'Continue current medications. Lifestyle modifications recommended. Follow up in 2 weeks.',
  medications: [
    { name: 'Aspirin', dosage: '81mg', frequency: 'daily' },
    { name: 'Metoprolol', dosage: '50mg', frequency: 'twice daily' }
  ],
  follow_up: '2 weeks',
  recommendations: ['Cardiology follow-up', 'Stress test if symptoms persist'],
  notes: 'Patient stable, continue current treatment plan'
};

export const TEST_CONSENT_FORM_DATA = {
  procedure_name: 'CT Scan - Chest with Contrast',
  procedure_description: 'Computed tomography scan of the chest with intravenous contrast media',
  risks: 'Allergic reaction to contrast, radiation exposure, kidney damage',
  benefits: 'Detailed imaging of chest structures, accurate diagnosis',
  alternatives: 'X-ray, MRI without contrast',
  consent_given: true,
  understood: true,
  questions: 'None',
  signature: 'base64_encoded_signature_data'
};

// Test Form Objects
export const TEST_FORMS: Record<string, Form> = {
  nurseForm: {
    id: '40000000-0000-0000-0000-000000000001',
    templateId: NURSE_FORM_TEMPLATE.id,
    patientId: TEST_PATIENTS.patient1.id,
    visitId: TEST_VISITS.visit1.id,
    type: 'nurse_form',
    status: 'draft',
    version: '1.0.0',
    data: TEST_NURSE_FORM_DATA,
    metadata: {
      language: 'ar',
      completionPercentage: 85,
      requiredFieldsCompleted: 8,
      totalRequiredFields: 10,
      estimatedTime: 15,
      actualTime: 12,
      priority: 'high',
      tags: ['chest_pain', 'emergency', 'vital_signs']
    } as FormMetadata,
    signatures: [],
    auditTrail: [],
    createdAt: new Date('2023-06-15T09:15:00Z'),
    createdBy: TEST_USERS.nurse.id,
    updatedBy: TEST_USERS.nurse.id,
    updatedAt: new Date('2023-06-15T09:15:00Z')
  },
  doctorForm: {
    id: '40000000-0000-0000-0000-000000000002',
    templateId: DOCTOR_FORM_TEMPLATE.id,
    patientId: TEST_PATIENTS.patient1.id,
    visitId: TEST_VISITS.visit1.id,
    type: 'doctor_form',
    status: 'pending_review',
    version: '1.0.0',
    data: TEST_DOCTOR_FORM_DATA,
    metadata: {
      language: 'en',
      completionPercentage: 100,
      requiredFieldsCompleted: 3,
      totalRequiredFields: 3,
      estimatedTime: 20,
      actualTime: 18,
      priority: 'high',
      tags: ['cardiology', 'follow_up', 'medication']
    } as FormMetadata,
    signatures: [],
    auditTrail: [],
    createdAt: new Date('2023-06-15T10:30:00Z'),
    createdBy: TEST_USERS.doctor.id,
    updatedBy: TEST_USERS.doctor.id,
    updatedAt: new Date('2023-06-15T10:30:00Z')
  },
  consentForm: {
    id: '40000000-0000-0000-0000-000000000003',
    templateId: CONSENT_FORM_TEMPLATE.id,
    patientId: TEST_PATIENTS.patient1.id,
    visitId: TEST_VISITS.visit1.id,
    type: 'consent_form',
    status: 'pending_signature',
    version: '1.0.0',
    data: TEST_CONSENT_FORM_DATA,
    metadata: {
      language: 'ar',
      completionPercentage: 90,
      requiredFieldsCompleted: 3,
      totalRequiredFields: 3,
      estimatedTime: 10,
      actualTime: 8,
      priority: 'high',
      tags: ['consent', 'ct_scan', 'contrast']
    } as FormMetadata,
    signatures: [],
    auditTrail: [],
    createdAt: new Date('2023-06-15T11:00:00Z'),
    createdBy: TEST_USERS.receptionist.id,
    updatedBy: TEST_USERS.receptionist.id,
    updatedAt: new Date('2023-06-15T11:00:00Z')
  }
};

// Test Signatures
export const TEST_SIGNATURES: Record<string, FormSignature> = {
  nurseSignature: {
    id: '50000000-0000-0000-0000-000000000001',
    formId: TEST_FORMS.nurseForm.id,
    signatureType: 'digital',
    signerRole: 'nurse',
    signerId: TEST_USERS.nurse.id,
    signatureData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Test Suite)',
    status: 'signed',
    signedAt: new Date('2023-06-15T09:45:00Z'),
    metadata: {
      deviceInfo: {
        deviceType: 'desktop',
        operatingSystem: 'Windows 10',
        browser: 'Chrome',
        screenResolution: '1920x1080',
        timezone: 'Africa/Cairo'
      },
      verificationMethod: 'password'
    },
    createdAt: new Date('2023-06-15T09:45:00Z')
  },
  doctorSignature: {
    id: '50000000-0000-0000-0000-000000000002',
    formId: TEST_FORMS.doctorForm.id,
    signatureType: 'digital',
    signerRole: 'doctor',
    signerId: TEST_USERS.doctor.id,
    signatureData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Test Suite)',
    status: 'signed',
    signedAt: new Date('2023-06-15T11:15:00Z'),
    metadata: {
      deviceInfo: {
        deviceType: 'desktop',
        operatingSystem: 'Windows 10',
        browser: 'Chrome',
        screenResolution: '1920x1080',
        timezone: 'Africa/Cairo'
      },
      verificationMethod: 'password'
    },
    createdAt: new Date('2023-06-15T11:15:00Z')
  },
  patientSignature: {
    id: '50000000-0000-0000-0000-000000000003',
    formId: TEST_FORMS.consentForm.id,
    signatureType: 'digital',
    signerRole: 'patient',
    signerId: TEST_PATIENTS.patient1.id,
    signatureData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Test Suite)',
    status: 'signed',
    signedAt: new Date('2023-06-15T11:30:00Z'),
    metadata: {
      deviceInfo: {
        deviceType: 'tablet',
        operatingSystem: 'iOS',
        browser: 'Safari',
        screenResolution: '1024x768',
        timezone: 'Africa/Cairo'
      },
      verificationMethod: 'touch_id'
    },
    createdAt: new Date('2023-06-15T11:30:00Z')
  }
};

// Test Audit Entries
export const TEST_AUDIT_ENTRIES: Record<string, AuditEntry> = {
  formCreated: {
    id: '60000000-0000-0000-0000-000000000001',
    formId: TEST_FORMS.nurseForm.id,
    action: 'created',
    userId: TEST_USERS.nurse.id,
    userRole: 'nurse',
    details: {
      reason: 'Initial assessment for patient with chest pain',
      priority: 'high'
    },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Test Suite)',
    timestamp: new Date('2023-06-15T09:15:00Z')
  },
  formUpdated: {
    id: '60000000-0000-0000-0000-000000000002',
    formId: TEST_FORMS.nurseForm.id,
    action: 'updated',
    userId: TEST_USERS.nurse.id,
    userRole: 'nurse',
    details: {
      field: 'vital_signs',
      oldValue: { blood_pressure: '130/85', heart_rate: 80 },
      newValue: { blood_pressure: '140/90', heart_rate: 85 },
      reason: 'Updated vital signs after reassessment'
    },
    changes: [
      {
        field: 'blood_pressure',
        oldValue: '130/85',
        newValue: '140/90',
        reason: 'Patient anxiety increased'
      },
      {
        field: 'heart_rate',
        oldValue: 80,
        newValue: 85,
        reason: 'Patient anxiety increased'
      }
    ],
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Test Suite)',
    timestamp: new Date('2023-06-15T09:30:00Z')
  },
  formSigned: {
    id: '60000000-0000-0000-0000-000000000003',
    formId: TEST_FORMS.nurseForm.id,
    action: 'signed',
    userId: TEST_USERS.nurse.id,
    userRole: 'nurse',
    details: {
      signatureId: TEST_SIGNATURES.nurseSignature.id,
      signatureType: 'digital'
    },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Test Suite)',
    timestamp: new Date('2023-06-15T09:45:00Z')
  }
};

// Test Files/Attachments
export const TEST_ATTACHMENTS: Record<string, FormAttachment> = {
  labReport: {
    id: '70000000-0000-0000-0000-000000000001',
    filename: 'blood_test_results.pdf',
    fileType: 'application/pdf',
    fileSize: 2048576, // 2MB
    uploadedAt: new Date('2023-06-15T10:00:00Z'),
    uploadedBy: TEST_USERS.nurse.id,
    phi: true
  },
  imagingReport: {
    id: '70000000-0000-0000-0000-000000000002',
    filename: 'chest_xray.jpg',
    fileType: 'image/jpeg',
    fileSize: 1048576, // 1MB
    uploadedAt: new Date('2023-06-15T10:30:00Z'),
    uploadedBy: TEST_USERS.doctor.id,
    phi: true
  }
};

// Authentication Tokens (for testing)
export const TEST_TOKENS: Record<string, string> = {
  admin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admin',
  doctor: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.doctor',
  nurse: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.nurse',
  receptionist: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.receptionist'
};

// API Endpoints
export const API_ENDPOINTS = {
  forms: {
    base: '/api/forms',
    list: '/api/forms',
    create: '/api/forms',
    get: '/api/forms/:id',
    update: '/api/forms/:id',
    delete: '/api/forms/:id',
    templates: '/api/forms/templates',
    submit: '/api/forms/:id/submit',
    signatures: '/api/forms/:id/signatures',
    sign: '/api/forms/:id/sign',
    auditTrail: '/api/forms/:id/audit-trail',
    versions: '/api/forms/:id/versions',
    comments: '/api/forms/:id/comments',
    export: '/api/forms/:id/export',
    search: '/api/forms/search',
    statistics: '/api/forms/statistics'
  },
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    profile: '/api/auth/profile'
  }
};

// Error Response Templates
export const ERROR_RESPONSES = {
  unauthorized: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    timestamp: new Date(),
    path: '/api/forms'
  },
  forbidden: {
    code: 'FORBIDDEN',
    message: 'Insufficient permissions',
    timestamp: new Date(),
    path: '/api/forms'
  },
  notFound: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    timestamp: new Date(),
    path: '/api/forms/:id'
  },
  validationError: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid request data',
    details: {
      errors: []
    },
    timestamp: new Date(),
    path: '/api/forms'
  },
  conflict: {
    code: 'CONFLICT',
    message: 'Resource conflict',
    timestamp: new Date(),
    path: '/api/forms'
  }
};

// Performance Benchmarks
export const PERFORMANCE_BENCHMARKS = {
  MAX_RESPONSE_TIME: 2000, // 2 seconds
  MAX_DB_QUERY_TIME: 500, // 500ms
  MAX_PDF_GENERATION_TIME: 10000, // 10 seconds
  MAX_SIGNATURE_VERIFICATION_TIME: 3000, // 3 seconds
  MAX_FORM_SEARCH_TIME: 3000, // 3 seconds
  MAX_FORM_SUBMISSION_TIME: 5000, // 5 seconds
  MAX_AUDIT_LOG_QUERY_TIME: 1000, // 1 second
  MAX_CONCURRENT_REQUESTS: 100
};

// Security Requirements
export const SECURITY_REQUIREMENTS = {
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_TIMEOUT: 1800000, // 30 minutes
  TOKEN_EXPIRATION: 86400000, // 24 hours
  PASSWORD_MIN_LENGTH: 12,
  REQUIRE_STRONG_PASSWORD: true,
  ENCRYPTION_ALGORITHM: 'AES-256-GCM',
  AUDIT_LOG_RETENTION_DAYS: 2555, // 7 years
  RATE_LIMITING: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 100
  }
};

// Compliance Requirements
export const COMPLIANCE_REQUIREMENTS = {
  GDPR_COMPLIANT: true,
  HIPAA_COMPLIANT: true,
  DATA_RETENTION_DAYS: 365,
  RIGHT_TO_BE_FORGOTTEN: true,
  AUDIT_TRAIL_REQUIRED: true,
  CONSENT_REQUIRED: true,
  DATA_BREACH_NOTIFICATION_HOURS: 72,
  BACKUP_FREQUENCY_HOURS: 24,
  DISASTER_RECOVERY_RTO_HOURS: 4,
  DISASTER_RECOVERY_RPO_HOURS: 1
};

// Test Utilities
export const generateTestId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}-${timestamp}-${random}`;
};

export const generateTestFormData = (templateId: string, overrides: Record<string, any> = {}): Record<string, any> => {
  const baseData = {
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: '1.0.0'
  };

  return { ...baseData, ...overrides };
};

export const createTestForm = (overrides: Partial<Form> = {}): Form => {
  const baseForm = { ...TEST_FORMS.nurseForm };
  return {
    ...baseForm,
    id: generateTestId('form'),
    ...overrides
  };
};

export const createTestSignature = (overrides: Partial<FormSignature> = {}): FormSignature => {
  const baseSignature = { ...TEST_SIGNATURES.nurseSignature };
  return {
    ...baseSignature,
    id: generateTestId('signature'),
    ...overrides
  };
};

export const createTestAuditEntry = (overrides: Partial<AuditEntry> = {}): AuditEntry => {
  const baseEntry = { ...TEST_AUDIT_ENTRIES.formCreated };
  return {
    ...baseEntry,
    id: generateTestId('audit'),
    ...overrides
  };
};