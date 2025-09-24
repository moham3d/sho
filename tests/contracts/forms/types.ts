// Form Management System Types and Interfaces
// This file defines all TypeScript types used in form management tests

export interface UUID {
  id: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Visit {
  id: string;
  patientId: string;
  visitType: 'initial' | 'follow_up' | 'emergency';
  reasonForVisit: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assignedDoctorId?: string;
  assignedNurseId?: string;
  startTime?: Date;
  endTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'technician';
export type FormStatus = 'draft' | 'in_progress' | 'pending_review' | 'approved' | 'rejected' | 'signed' | 'archived';
export type FormType = 'nurse_form' | 'doctor_form' | 'patient_form' | 'consent_form' | 'assessment_form';
export type SignatureRole = 'doctor' | 'nurse' | 'patient' | 'admin' | 'supervisor';
export type SignatureStatus = 'pending' | 'signed' | 'rejected' | 'expired';
export type Language = 'en' | 'ar';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  type: FormType;
  version: string;
  schema: FormSchema;
  requiredFields: string[];
  validationRules: ValidationRule[];
  supportedLanguages: Language[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormSchema {
  sections: FormSection[];
  fields: FormField[];
  dependencies: FieldDependency[];
  calculatedFields: CalculatedField[];
}

export interface FormSection {
  id: string;
  title: Record<Language, string>;
  description?: Record<Language, string>;
  order: number;
  isCollapsible: boolean;
  isRequired: boolean;
  fields: string[];
}

export interface FormField {
  id: string;
  name: Record<Language, string>;
  type: 'text' | 'number' | 'date' | 'time' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'textarea' | 'file' | 'signature';
  required: boolean;
  readOnly: boolean;
  defaultValue?: any;
  validation?: FieldValidation;
  options?: SelectOption[];
  conditional?: ConditionalRule;
  phi: boolean;
  sensitive: boolean;
  order: number;
}

export interface SelectOption {
  value: string;
  label: Record<Language, string>;
  score?: number;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: string;
}

export interface ValidationRule {
  fieldId: string;
  type: 'required' | 'pattern' | 'range' | 'custom';
  condition: string;
  message: Record<Language, string>;
  severity: 'error' | 'warning' | 'info';
}

export interface FieldDependency {
  fieldId: string;
  dependsOn: string[];
  condition: string;
  action: 'show' | 'hide' | 'enable' | 'disable' | 'set_value';
  value?: any;
}

export interface ConditionalRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface CalculatedField {
  fieldId: string;
  formula: string;
  dependencies: string[];
}

export interface Form {
  id: string;
  templateId: string;
  patientId: string;
  visitId?: string;
  type: FormType;
  status: FormStatus;
  version: string;
  data: Record<string, any>;
  metadata: FormMetadata;
  signatures: FormSignature[];
  auditTrail: AuditEntry[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface FormMetadata {
  language: Language;
  completionPercentage: number;
  requiredFieldsCompleted: number;
  totalRequiredFields: number;
  estimatedTime?: number;
  actualTime?: number;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  attachments?: FormAttachment[];
}

export interface FormAttachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
  phi: boolean;
}

export interface FormSignature {
  id: string;
  formId: string;
  signatureType: 'digital' | 'electronic' | 'wet';
  signerRole: SignatureRole;
  signerId: string;
  signatureData: string; // Base64 encoded signature image
  ipAddress: string;
  userAgent: string;
  status: SignatureStatus;
  signedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  metadata: SignatureMetadata;
  createdAt: Date;
}

export interface SignatureMetadata {
  deviceInfo: DeviceInfo;
  location?: GeoLocation;
  biometricData?: BiometricData;
  verificationMethod: string;
  certificateId?: string;
}

export interface DeviceInfo {
  deviceType: 'desktop' | 'tablet' | 'mobile';
  operatingSystem: string;
  browser: string;
  screenResolution: string;
  timezone: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface BiometricData {
  fingerprint?: string;
  faceId?: string;
  voicePrint?: string;
}

export interface AuditEntry {
  id: string;
  formId: string;
  action: AuditAction;
  userId: string;
  userRole: UserRole;
  details: Record<string, any>;
  changes?: ChangeLog[];
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export type AuditAction = 'created' | 'updated' | 'deleted' | 'submitted' | 'approved' | 'rejected' | 'signed' | 'archived' | 'restored' | 'viewed' | 'exported';

export interface ChangeLog {
  field: string;
  oldValue: any;
  newValue: any;
  reason?: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  submittedBy: string;
  submittedAt: Date;
  submissionMethod: 'manual' | 'automatic' | 'batch';
  destination: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  response?: SubmissionResponse;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface SubmissionResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  timestamp: Date;
}

export interface FormVersion {
  id: string;
  formId: string;
  version: string;
  data: Record<string, any>;
  metadata: FormMetadata;
  signatures: FormSignature[];
  createdBy: string;
  createdAt: Date;
  changeReason?: string;
  parentVersion?: string;
}

export interface FormComment {
  id: string;
  formId: string;
  userId: string;
  userRole: UserRole;
  comment: string;
  isPrivate: boolean;
  mentions: string[];
  attachments: FormAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PDFGenerationRequest {
  formId: string;
  templateId: string;
  language: Language;
  includeSignatures: boolean;
  includeAuditTrail: boolean;
  watermark?: string;
  encryption?: PDFEncryption;
}

export interface PDFEncryption {
  password?: string;
  permissions: PDFPermission[];
}

export type PDFPermission = 'print' | 'modify' | 'copy' | 'annotate' | 'fill' | 'extract' | 'assemble';

export interface FormSearchCriteria {
  patientId?: string;
  visitId?: string;
  type?: FormType;
  status?: FormStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  createdBy?: string;
  tags?: string[];
  text?: string;
  advancedFilters?: AdvancedFilter[];
}

export interface AdvancedFilter {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface FormSearchResult {
  forms: Form[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  facets: SearchFacet[];
}

export interface SearchFacet {
  field: string;
  values: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface FormStatistics {
  totalForms: number;
  formsByType: Record<FormType, number>;
  formsByStatus: Record<FormStatus, number>;
  formsByUser: Record<string, { count: number; lastActivity: Date }>;
  averageCompletionTime: number;
  signatureRate: number;
  rejectionRate: number;
  popularTemplates: Array<{
    templateId: string;
    count: number;
  }>;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  path: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters?: Record<string, any>;
  sort?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
}

export interface TestContext {
  baseUrl: string;
  authToken: string;
  user: User;
  patient: Patient;
  visit: Visit;
  formTemplates: FormTemplate[];
  testForms: Form[];
  cleanup: () => Promise<void>;
}

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  databaseQueryTime: number;
}

export interface SecurityRequirements {
  maxLoginAttempts: number;
  sessionTimeout: number;
  passwordMinLength: number;
  requireMFA: boolean;
  encryptionAlgorithm: string;
  auditLogRetentionDays: number;
}

export interface ComplianceRequirements {
  gdprCompliant: boolean;
  hipaaCompliant: boolean;
  dataRetentionDays: number;
  rightToBeForgotten: boolean;
  auditTrailRequired: boolean;
  consentRequired: boolean;
}