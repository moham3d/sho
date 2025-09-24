export interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: Date;
  gender: PatientGender;
  nationalId: string;
  phoneNumber: string;
  email?: string;
  address: PatientAddress;
  emergencyContact: EmergencyContact;
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  medications?: Medication[];
  insurance: InsuranceInfo;
  primaryCarePhysician?: string;
  isActive: boolean;
  consentGiven: boolean;
  consentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface PatientAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  isActive: boolean;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  expiryDate: Date;
  coverageType: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  recordType: MedicalRecordType;
  title: string;
  description: string;
  data: Record<string, any>;
  providerId: string;
  providerName: string;
  visitId?: string;
  dateOfService: Date;
  isConfidential: boolean;
  accessLevel: AccessLevel;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientVisit {
  id: string;
  patientId: string;
  visitType: VisitType;
  reason: string;
  providerId: string;
  providerName: string;
  providerRole: UserRole;
  dateOfVisit: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: VisitStatus;
  diagnosis?: string[];
  treatment?: string;
  notes?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  vitals?: PatientVitals;
  forms?: PatientForm[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientVitals {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  painLevel?: number;
}

export interface PatientForm {
  id: string;
  formId: string;
  formName: string;
  version: string;
  patientId: string;
  visitId?: string;
  data: Record<string, any>;
  status: FormStatus;
  completedBy: string;
  completedByRole: UserRole;
  completedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalHistory {
  patientId: string;
  conditions: MedicalCondition[];
  surgeries: Surgery[];
  familyHistory: FamilyMedicalHistory;
  immunizations: Immunization[];
  allergies: Allergy[];
  socialHistory: SocialHistory;
  lastUpdated: Date;
}

export interface MedicalCondition {
  id: string;
  condition: string;
  diagnosisDate: Date;
  isActive: boolean;
  severity: ConditionSeverity;
  treatment?: string;
  notes?: string;
}

export interface Surgery {
  id: string;
  procedure: string;
  date: Date;
  surgeon: string;
  hospital: string;
  complications?: string;
  notes?: string;
}

export interface FamilyMedicalHistory {
  conditions: FamilyCondition[];
  notes?: string;
}

export interface FamilyCondition {
  relationship: string;
  condition: string;
  ageOfOnset?: number;
  notes?: string;
}

export interface Immunization {
  id: string;
  vaccine: string;
  date: Date;
  administeredBy: string;
  nextDueDate?: Date;
  lotNumber?: string;
  notes?: string;
}

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: AllergySeverity;
  firstObserved: Date;
  notes?: string;
}

export interface SocialHistory {
  smokingStatus: SmokingStatus;
  alcoholUse: AlcoholUse;
  drugUse?: DrugUse;
  occupation?: string;
  exercise: ExerciseInfo;
  diet?: string;
  notes?: string;
}

export interface ExerciseInfo {
  frequency: string;
  duration: string;
  type: string;
}

export interface PatientCreateRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: PatientGender;
  nationalId: string;
  phoneNumber: string;
  email?: string;
  address: PatientAddress;
  emergencyContact: EmergencyContact;
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  insurance: InsuranceInfo;
  primaryCarePhysician?: string;
  consentGiven: boolean;
}

export interface PatientUpdateRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  address?: PatientAddress;
  emergencyContact?: EmergencyContact;
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  medications?: Medication[];
  insurance?: InsuranceInfo;
  primaryCarePhysician?: string;
  isActive?: boolean;
}

export interface MedicalRecordCreateRequest {
  recordType: MedicalRecordType;
  title: string;
  description: string;
  data: Record<string, any>;
  visitId?: string;
  dateOfService: string;
  isConfidential: boolean;
  accessLevel: AccessLevel;
  tags: string[];
}

export interface PatientVisitCreateRequest {
  visitType: VisitType;
  reason: string;
  dateOfVisit: string;
  diagnosis?: string[];
  treatment?: string;
  notes?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  vitals?: PatientVitals;
}

export interface PatientSearchQuery {
  query?: string;
  patientId?: string;
  name?: string;
  nationalId?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  bloodType?: BloodType;
  condition?: string;
  medication?: string;
  allergies?: string;
  tags?: string[];
  visitType?: VisitType;
  providerId?: string;
  providerName?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  ageRange?: {
    min: number;
    max: number;
  };
  isActive?: boolean;
  hasInsurance?: boolean;
  hasEmergencyContact?: boolean;
  hasConsent?: boolean;
}

export interface PatientQueryParams {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'dateOfBirth' | 'patientId';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  gender?: PatientGender;
  bloodType?: BloodType;
  ageRange?: {
    min: number;
    max: number;
  };
  isActive?: boolean;
  hasConsent?: boolean;
  hasInsurance?: boolean;
  providerId?: string;
  visitType?: VisitType;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
}

export interface PatientResponse {
  success: boolean;
  data?: {
    patients: Patient[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
    validationErrors?: ValidationError[];
  };
}

export interface SinglePatientResponse {
  success: boolean;
  data?: Patient;
  error?: {
    code: string;
    message: string;
    details?: any;
    validationErrors?: ValidationError[];
  };
}

export interface PatientVisitsResponse {
  success: boolean;
  data?: {
    visits: PatientVisit[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PatientFormsResponse {
  success: boolean;
  data?: {
    forms: PatientForm[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface MedicalHistoryResponse {
  success: boolean;
  data?: MedicalHistory;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface PatientAuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: PatientAuditAction;
  resource: 'patient' | 'medical_record' | 'visit' | 'form';
  resourceId: string;
  patientId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  isPhiAccess: boolean;
  reasonForAccess?: string;
}

export interface PatientSearchResponse {
  success: boolean;
  data?: {
    patients: Patient[];
    searchMetadata: {
      query: string;
      totalResults: number;
      searchTime: number;
      filters: string[];
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export type PatientGender = 'male' | 'female' | 'other';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type MedicalRecordType = 'diagnosis' | 'treatment' | 'medication' | 'lab_result' | 'imaging' | 'vitals' | 'notes' | 'consent' | 'other';
export type VisitType = 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup' | 'procedure' | 'imaging' | 'surgery' | 'therapy';
export type VisitStatus = 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type FormStatus = 'draft' | 'in_progress' | 'completed' | 'submitted' | 'approved' | 'rejected';
export type AccessLevel = 'public' | 'restricted' | 'confidential' | 'highly_confidential';
export type ConditionSeverity = 'mild' | 'moderate' | 'severe' | 'critical';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening';
export type SmokingStatus = 'never' | 'former' | 'current';
export type AlcoholUse = 'never' | 'occasional' | 'moderate' | 'heavy';
export type DrugUse = 'never' | 'former' | 'current';
export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'technician' | 'radiologist';
export type PatientAuditAction = 'patient_created' | 'patient_updated' | 'patient_deleted' | 'patient_viewed' | 'medical_record_created' | 'medical_record_updated' | 'medical_record_deleted' | 'medical_record_viewed' | 'visit_created' | 'visit_updated' | 'visit_deleted' | 'visit_viewed' | 'form_completed' | 'form_submitted' | 'form_approved' | 'form_rejected' | 'medical_history_accessed' | 'phi_accessed' | 'search_performed' | 'export_performed' | 'consent_updated';

export interface TestPatient extends Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: Date;
  gender: PatientGender;
  nationalId: string;
  phoneNumber: string;
  email?: string;
  address: PatientAddress;
  emergencyContact: EmergencyContact;
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  medications?: Medication[];
  insurance: InsuranceInfo;
  primaryCarePhysician?: string;
  isActive: boolean;
  consentGiven: boolean;
  consentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientTestData {
  patients: TestPatient[];
  medicalRecords: MedicalRecord[];
  visits: PatientVisit[];
  forms: PatientForm[];
  auditLogs: PatientAuditLog[];
}

export interface PatientTestContext {
  authToken: string;
  refreshToken: string;
  currentUser: any;
  app: any;
  dbService: any;
  patientService: any;
}

export interface PHIEncryptionConfig {
  algorithm: string;
  keyRotationDays: number;
  fields: string[];
  auditLogging: boolean;
}