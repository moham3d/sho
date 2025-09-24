export interface Visit {
  id: string;
  patientId: string;
  visitType: VisitType;
  reasonForVisit: string;
  priority: VisitPriority;
  status: VisitStatus;
  assignedDoctorId?: string;
  scheduledDateTime?: Date;
  checkInDateTime?: Date;
  checkOutDateTime?: Date;
  notes?: string;
  duration?: number;
  location?: string;
  departmentId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface VisitCreateRequest {
  patientId: string;
  visitType: VisitType;
  reasonForVisit: string;
  priority: VisitPriority;
  assignedDoctorId?: string;
  scheduledDateTime?: Date;
  notes?: string;
  duration?: number;
  location?: string;
  departmentId?: string;
}

export interface VisitUpdateRequest {
  visitType?: VisitType;
  reasonForVisit?: string;
  priority?: VisitPriority;
  status?: VisitStatus;
  assignedDoctorId?: string;
  scheduledDateTime?: Date;
  checkInDateTime?: Date;
  checkOutDateTime?: Date;
  notes?: string;
  duration?: number;
  location?: string;
  departmentId?: string;
}

export interface VisitCheckInRequest {
  notes?: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
}

export interface VisitCheckOutRequest {
  notes?: string;
  outcome: VisitOutcome;
  followUpRequired: boolean;
  followUpDate?: Date;
  dischargeInstructions?: string;
}

export interface VisitListResponse {
  visits: Visit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VisitScheduleConflict {
  visitId: string;
  scheduledDateTime: Date;
  duration: number;
  doctorId: string;
  location: string;
}

export interface VisitWorkflowValidation {
  canCheckIn: boolean;
  canCheckOut: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  canAssign: boolean;
  errors: string[];
}

export interface VisitAuditLog {
  id: string;
  visitId: string;
  action: string;
  userId: string;
  username: string;
  changes: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

export interface VisitForm {
  id: string;
  visitId: string;
  formType: string;
  formData: Record<string, any>;
  status: 'draft' | 'completed' | 'signed';
  completedBy?: string;
  completedAt?: Date;
  signedBy?: string;
  signedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VisitCreateFormRequest {
  formType: string;
  formData: Record<string, any>;
}

export interface VisitUpcomingResponse {
  today: Visit[];
  tomorrow: Visit[];
  thisWeek: Visit[];
  nextWeek: Visit[];
  overdue: Visit[];
}

export interface VisitStats {
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  inProgressVisits: number;
  cancelledVisits: number;
  averageDuration: number;
  visitsByType: Record<VisitType, number>;
  visitsByPriority: Record<VisitPriority, number>;
}

export enum VisitType {
  INITIAL = 'initial',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
  ROUTINE = 'routine',
  SPECIALIST = 'specialist',
  SURGERY = 'surgery',
  THERAPY = 'therapy',
  CONSULTATION = 'consultation'
}

export enum VisitPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

export enum VisitStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled'
}

export enum VisitOutcome {
  DISCHARGED = 'discharged',
  ADMITTED = 'admitted',
  TRANSFERRED = 'transferred',
  REFERRED = 'referred',
  DECEASED = 'deceased',
  OTHER = 'other'
}

export interface VisitFilterOptions {
  status?: VisitStatus[];
  visitType?: VisitType[];
  priority?: VisitPriority[];
  assignedDoctorId?: string;
  patientId?: string;
  departmentId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  location?: string;
}

export interface VisitSortOptions {
  sortBy: 'scheduledDateTime' | 'createdAt' | 'priority' | 'status' | 'patientName';
  sortOrder: 'asc' | 'desc';
}

export interface VisitSearchParams {
  query: string;
  filters: VisitFilterOptions;
  sort: VisitSortOptions;
  pagination: {
    page: number;
    limit: number;
  };
}

export interface VisitNotification {
  id: string;
  type: 'check_in' | 'check_out' | 'assignment' | 'schedule_change' | 'reminder';
  visitId: string;
  patientId: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
}

export interface VisitCalendarEvent {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  visitType: VisitType;
  title: string;
  start: Date;
  end: Date;
  location: string;
  status: VisitStatus;
  priority: VisitPriority;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  color: string;
}