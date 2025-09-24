import { TestPatient, PatientVisit, MedicalRecord, PatientForm, MedicalHistory, PatientAuditLog } from './types';
import { TEST_PATIENTS, TEST_VISITS, TEST_MEDICAL_RECORDS, TEST_FORMS, TEST_MEDICAL_HISTORIES, TEST_AUDIT_LOGS } from './fixtures';
import { UserRole, PatientAuditAction } from './types';

export class MockPatientDatabaseService {
  private patients: Map<string, TestPatient> = new Map();
  private visits: Map<string, PatientVisit> = new Map();
  private medicalRecords: Map<string, MedicalRecord> = new Map();
  private forms: Map<string, PatientForm> = new Map();
  private medicalHistories: Map<string, MedicalHistory> = new Map();
  private auditLogs: PatientAuditLog[] = [];
  private userPermissions: Map<string, any> = new Map();

  constructor() {
    this.initializeTestData();
  }

  private initializeTestData() {
    // Initialize patients
    TEST_PATIENTS.forEach(patient => {
      this.patients.set(patient.id, { ...patient });
    });

    // Initialize visits
    TEST_VISITS.forEach(visit => {
      this.visits.set(visit.id, { ...visit });
    });

    // Initialize medical records
    TEST_MEDICAL_RECORDS.forEach(record => {
      this.medicalRecords.set(record.id, { ...record });
    });

    // Initialize forms
    TEST_FORMS.forEach(form => {
      this.forms.set(form.id, { ...form });
    });

    // Initialize medical histories
    Object.entries(TEST_MEDICAL_HISTORIES).forEach(([patientId, history]) => {
      this.medicalHistories.set(patientId, { ...history });
    });

    // Initialize audit logs
    this.auditLogs = [...TEST_AUDIT_LOGS];

    // Initialize user permissions
    this.initializeUserPermissions();
  }

  private initializeUserPermissions() {
    const permissions = {
      user_1: { role: 'doctor', canAccessPhi: true, canCreatePatient: true, canUpdatePatient: true, canDeletePatient: false },
      user_2: { role: 'nurse', canAccessPhi: true, canCreatePatient: true, canUpdatePatient: true, canDeletePatient: false },
      user_3: { role: 'receptionist', canAccessPhi: false, canCreatePatient: true, canUpdatePatient: true, canDeletePatient: false },
      user_4: { role: 'admin', canAccessPhi: true, canCreatePatient: true, canUpdatePatient: true, canDeletePatient: true },
      user_5: { role: 'technician', canAccessPhi: false, canCreatePatient: false, canUpdatePatient: false, canDeletePatient: false },
      user_6: { role: 'radiologist', canAccessPhi: true, canCreatePatient: false, canUpdatePatient: false, canDeletePatient: false }
    };

    Object.entries(permissions).forEach(([userId, perms]) => {
      this.userPermissions.set(userId, perms);
    });
  }

  async connect(): Promise<void> {
    // Mock database connection
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    // Mock database disconnection
    return Promise.resolve();
  }

  async clearTestData(): Promise<void> {
    this.patients.clear();
    this.visits.clear();
    this.medicalRecords.clear();
    this.forms.clear();
    this.medicalHistories.clear();
    this.auditLogs = [];
    this.initializeTestData();
  }

  // Patient CRUD operations
  async findPatients(params: any = {}): Promise<{ patients: TestPatient[]; total: number }> {
    let filteredPatients = Array.from(this.patients.values());

    // Apply filters
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredPatients = filteredPatients.filter(patient =>
        patient.fullName.toLowerCase().includes(searchLower) ||
        patient.patientId.toLowerCase().includes(searchLower) ||
        patient.email?.toLowerCase().includes(searchLower) ||
        patient.phoneNumber.includes(searchLower)
      );
    }

    if (params.gender) {
      filteredPatients = filteredPatients.filter(patient => patient.gender === params.gender);
    }

    if (params.bloodType) {
      filteredPatients = filteredPatients.filter(patient => patient.bloodType === params.bloodType);
    }

    if (params.isActive !== undefined) {
      filteredPatients = filteredPatients.filter(patient => patient.isActive === params.isActive);
    }

    if (params.ageRange) {
      filteredPatients = filteredPatients.filter(patient => {
        const age = this.calculateAge(patient.dateOfBirth);
        return age >= params.ageRange.min && age <= params.ageRange.max;
      });
    }

    // Apply sorting
    if (params.sortBy) {
      filteredPatients.sort((a, b) => {
        const aValue = a[params.sortBy];
        const bValue = b[params.sortBy];
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return params.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const total = filteredPatients.length;
    const offset = params.offset || 0;
    const limit = Math.min(params.limit || 10, 50);
    const paginatedPatients = filteredPatients.slice(offset, offset + limit);

    return { patients: paginatedPatients, total };
  }

  async findPatientById(id: string): Promise<TestPatient | null> {
    return this.patients.get(id) || null;
  }

  async findPatientByPatientId(patientId: string): Promise<TestPatient | null> {
    return Array.from(this.patients.values()).find(patient => patient.patientId === patientId) || null;
  }

  async createPatient(patientData: any): Promise<TestPatient> {
    const newPatient: TestPatient = {
      id: `pat_${Date.now()}`,
      patientId: `PAT-2024-${String(this.patients.size + 1).padStart(3, '0')}`,
      fullName: `${patientData.firstName} ${patientData.lastName}`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...patientData,
      dateOfBirth: new Date(patientData.dateOfBirth),
      insurance: {
        ...patientData.insurance,
        expiryDate: new Date(patientData.insurance.expiryDate)
      }
    };

    this.patients.set(newPatient.id, newPatient);
    return newPatient;
  }

  async updatePatient(id: string, updateData: any): Promise<TestPatient> {
    const patient = this.patients.get(id);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const updatedPatient = {
      ...patient,
      ...updateData,
      fullName: updateData.firstName && updateData.lastName
        ? `${updateData.firstName} ${updateData.lastName}`
        : patient.fullName,
      updatedAt: new Date(),
      insurance: updateData.insurance
        ? { ...patient.insurance, ...updateData.insurance, expiryDate: new Date(updateData.insurance.expiryDate) }
        : patient.insurance
    };

    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async deletePatient(id: string, reason?: string): Promise<void> {
    const patient = this.patients.get(id);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Soft delete
    patient.deletedAt = new Date();
    patient.isActive = false;
    this.patients.set(id, patient);

    // Log the deletion
    await this.logAuditAction({
      userId: 'system',
      userName: 'System',
      userRole: 'admin',
      action: 'patient_deleted',
      resource: 'patient',
      resourceId: id,
      patientId: id,
      details: { reason: reason || 'System deletion' },
      ipAddress: '127.0.0.1',
      userAgent: 'System',
      timestamp: new Date(),
      isPhiAccess: true,
      reasonForAccess: 'Patient deletion'
    });
  }

  // Visit operations
  async findVisitsByPatientId(patientId: string, params: any = {}): Promise<{ visits: PatientVisit[]; total: number }> {
    let visits = Array.from(this.visits.values()).filter(visit => visit.patientId === patientId);

    // Apply filters
    if (params.status) {
      visits = visits.filter(visit => visit.status === params.status);
    }

    if (params.visitType) {
      visits = visits.filter(visit => visit.visitType === params.visitType);
    }

    // Apply sorting
    if (params.sortBy) {
      visits.sort((a, b) => {
        const aValue = a[params.sortBy];
        const bValue = b[params.sortBy];
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return params.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    const total = visits.length;
    const offset = params.offset || 0;
    const limit = Math.min(params.limit || 10, 50);
    const paginatedVisits = visits.slice(offset, offset + limit);

    return { visits: paginatedVisits, total };
  }

  async createVisit(visitData: any): Promise<PatientVisit> {
    const newVisit: PatientVisit = {
      id: `visit_${Date.now()}`,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...visitData,
      dateOfVisit: new Date(visitData.dateOfVisit),
      followUpDate: visitData.followUpDate ? new Date(visitData.followUpDate) : undefined
    };

    this.visits.set(newVisit.id, newVisit);
    return newVisit;
  }

  // Medical record operations
  async findMedicalRecordsByPatientId(patientId: string, params: any = {}): Promise<{ records: MedicalRecord[]; total: number }> {
    let records = Array.from(this.medicalRecords.values()).filter(record => record.patientId === patientId);

    // Apply filters
    if (params.recordType) {
      records = records.filter(record => record.recordType === params.recordType);
    }

    if (params.isConfidential !== undefined) {
      records = records.filter(record => record.isConfidential === params.isConfidential);
    }

    const total = records.length;
    const offset = params.offset || 0;
    const limit = Math.min(params.limit || 10, 50);
    const paginatedRecords = records.slice(offset, offset + limit);

    return { records: paginatedRecords, total };
  }

  async createMedicalRecord(recordData: any): Promise<MedicalRecord> {
    const newRecord: MedicalRecord = {
      id: `med_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...recordData,
      dateOfService: new Date(recordData.dateOfService)
    };

    this.medicalRecords.set(newRecord.id, newRecord);
    return newRecord;
  }

  // Form operations
  async findFormsByPatientId(patientId: string, params: any = {}): Promise<{ forms: PatientForm[]; total: number }> {
    let forms = Array.from(this.forms.values()).filter(form => form.patientId === patientId);

    // Apply filters
    if (params.status) {
      forms = forms.filter(form => form.status === params.status);
    }

    const total = forms.length;
    const offset = params.offset || 0;
    const limit = Math.min(params.limit || 10, 50);
    const paginatedForms = forms.slice(offset, offset + limit);

    return { forms: paginatedForms, total };
  }

  // Medical history operations
  async getMedicalHistory(patientId: string): Promise<MedicalHistory | null> {
    return this.medicalHistories.get(patientId) || null;
  }

  // Search operations
  async searchPatients(query: any): Promise<{ patients: TestPatient[]; total: number; searchTime: number }> {
    const startTime = Date.now();

    let results = Array.from(this.patients.values());

    // Apply various search filters
    if (query.query) {
      const searchTerms = query.query.toLowerCase().split(' ');
      results = results.filter(patient => {
        const searchableText = `${patient.fullName} ${patient.patientId} ${patient.email || ''} ${patient.phoneNumber}`.toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    if (query.name) {
      results = results.filter(patient =>
        patient.fullName.toLowerCase().includes(query.name.toLowerCase())
      );
    }

    if (query.patientId) {
      results = results.filter(patient =>
        patient.patientId.toLowerCase().includes(query.patientId.toLowerCase())
      );
    }

    if (query.phone) {
      results = results.filter(patient =>
        patient.phoneNumber.includes(query.phone)
      );
    }

    if (query.bloodType) {
      results = results.filter(patient => patient.bloodType === query.bloodType);
    }

    if (query.condition) {
      results = results.filter(patient =>
        patient.chronicConditions?.some(condition =>
          condition.toLowerCase().includes(query.condition.toLowerCase())
        )
      );
    }

    if (query.medication) {
      results = results.filter(patient =>
        patient.medications?.some(med =>
          med.name.toLowerCase().includes(query.medication.toLowerCase())
        )
      );
    }

    const searchTime = Date.now() - startTime;
    return {
      patients: results.slice(0, 50),
      total: results.length,
      searchTime
    };
  }

  // Permission operations
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const permissions = this.userPermissions.get(userId);
    if (!permissions) return false;

    // Role-based permissions
    switch (permissions.role) {
      case 'admin':
        return true;
      case 'doctor':
        return ['read', 'create', 'update'].includes(action);
      case 'nurse':
        return ['read', 'create', 'update'].includes(action);
      case 'receptionist':
        return ['read', 'create', 'update'].includes(action) && !resource.includes('medical_record');
      case 'radiologist':
        return ['read'].includes(action);
      default:
        return false;
    }
  }

  async canAccessPhi(userId: string): Promise<boolean> {
    const permissions = this.userPermissions.get(userId);
    return permissions?.canAccessPhi || false;
  }

  // Audit logging
  async logAuditAction(auditData: any): Promise<void> {
    const auditLog: PatientAuditLog = {
      id: `audit_${Date.now()}`,
      timestamp: new Date(),
      ...auditData
    };

    this.auditLogs.push(auditLog);
  }

  async getAuditLogs(patientId?: string, params: any = {}): Promise<{ logs: PatientAuditLog[]; total: number }> {
    let logs = this.auditLogs;

    if (patientId) {
      logs = logs.filter(log => log.patientId === patientId);
    }

    if (params.action) {
      logs = logs.filter(log => log.action === params.action);
    }

    if (params.userId) {
      logs = logs.filter(log => log.userId === params.userId);
    }

    if (params.isPhiAccess !== undefined) {
      logs = logs.filter(log => log.isPhiAccess === params.isPhiAccess);
    }

    const total = logs.length;
    const offset = params.offset || 0;
    const limit = Math.min(params.limit || 50, 100);
    const paginatedLogs = logs.slice(offset, offset + limit);

    return { logs: paginatedLogs, total };
  }

  // Helper methods
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }

  async getPatientsWithUpcomingVisits(): Promise<TestPatient[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingVisits = Array.from(this.visits.values()).filter(
      visit => visit.dateOfVisit <= tomorrow && visit.status === 'scheduled'
    );

    const patientIds = upcomingVisits.map(visit => visit.patientId);
    return Array.from(this.patients.values()).filter(patient =>
      patientIds.includes(patient.id)
    );
  }

  async getInactivePatients(): Promise<TestPatient[]> {
    return Array.from(this.patients.values()).filter(patient => !patient.isActive);
  }

  async getPatientsWithoutConsent(): Promise<TestPatient[]> {
    return Array.from(this.patients.values()).filter(patient => !patient.consentGiven);
  }

  async getPatientsByProvider(providerId: string): Promise<TestPatient[]> {
    const patientIds = Array.from(this.visits.values())
      .filter(visit => visit.providerId === providerId)
      .map(visit => visit.patientId);

    return Array.from(this.patients.values()).filter(patient =>
      patientIds.includes(patient.id)
    );
  }
}

export class MockPatientAuthService {
  private tokens: Map<string, any> = new Map();
  private users: Map<string, any> = new Map();

  constructor() {
    this.initializeUsers();
  }

  private initializeUsers() {
    const users = {
      user_1: { id: 'user_1', username: 'doctor_smith', role: 'doctor', canAccessPhi: true },
      user_2: { id: 'user_2', username: 'nurse_johnson', role: 'nurse', canAccessPhi: true },
      user_3: { id: 'user_3', username: 'reception_brown', role: 'receptionist', canAccessPhi: false },
      user_4: { id: 'user_4', username: 'admin_wilson', role: 'admin', canAccessPhi: true },
      user_5: { id: 'user_5', username: 'tech_davis', role: 'technician', canAccessPhi: false },
      user_6: { id: 'user_6', username: 'radiologist_miller', role: 'radiologist', canAccessPhi: true }
    };

    Object.entries(users).forEach(([userId, user]) => {
      this.users.set(userId, user);
    });
  }

  async authenticateUser(username: string, password: string): Promise<{ user: any; accessToken: string; refreshToken: string } | null> {
    const user = Array.from(this.users.values()).find(u => u.username === username);
    if (!user) return null;

    // Mock password validation (in real implementation, use bcrypt)
    if (password !== 'password123') return null;

    const accessToken = `access_${Date.now()}_${user.id}`;
    const refreshToken = `refresh_${Date.now()}_${user.id}`;

    this.tokens.set(accessToken, { userId: user.id, type: 'access' });
    this.tokens.set(refreshToken, { userId: user.id, type: 'refresh' });

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  async verifyToken(token: string): Promise<any> {
    const tokenData = this.tokens.get(token);
    if (!tokenData) return null;

    const user = this.users.get(tokenData.userId);
    if (!user) return null;

    return user;
  }

  async revokeToken(token: string): Promise<void> {
    this.tokens.delete(token);
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    const permissions = {
      admin: ['*'],
      doctor: ['patient:read', 'patient:create', 'patient:update', 'medical_record:read', 'medical_record:create', 'visit:read', 'visit:create'],
      nurse: ['patient:read', 'patient:create', 'patient:update', 'medical_record:read', 'visit:read', 'visit:create'],
      receptionist: ['patient:read', 'patient:create', 'patient:update'],
      radiologist: ['patient:read', 'medical_record:read'],
      technician: []
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }
}

export class MockPatientAuditService {
  private auditLogs: PatientAuditLog[] = [];

  constructor() {
    this.initializeAuditLogs();
  }

  private initializeAuditLogs() {
    this.auditLogs = [...TEST_AUDIT_LOGS];
  }

  async logAction(userId: string, action: PatientAuditAction, resource: string, resourceId: string, details: any = {}): Promise<void> {
    const auditLog: PatientAuditLog = {
      id: `audit_${Date.now()}`,
      userId,
      userName: `User ${userId}`,
      userRole: 'doctor', // Mock role
      action,
      resource,
      resourceId,
      patientId: resource === 'patient' ? resourceId : details.patientId,
      details,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      timestamp: new Date(),
      isPhiAccess: this.isPhiAccess(action, resource),
      reasonForAccess: details.reason || 'System action'
    };

    this.auditLogs.push(auditLog);
  }

  async getAuditLogs(filters: any = {}): Promise<{ logs: PatientAuditLog[]; total: number }> {
    let logs = [...this.auditLogs];

    if (filters.patientId) {
      logs = logs.filter(log => log.patientId === filters.patientId);
    }

    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }

    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }

    if (filters.isPhiAccess !== undefined) {
      logs = logs.filter(log => log.isPhiAccess === filters.isPhiAccess);
    }

    if (filters.startDate) {
      logs = logs.filter(log => log.timestamp >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      logs = logs.filter(log => log.timestamp <= new Date(filters.endDate));
    }

    const total = logs.length;
    const offset = filters.offset || 0;
    const limit = Math.min(filters.limit || 50, 100);
    const paginatedLogs = logs.slice(offset, offset + limit);

    return { logs: paginatedLogs, total };
  }

  async clearLogs(): Promise<void> {
    this.auditLogs = [];
  }

  private isPhiAccess(action: PatientAuditAction, resource: string): boolean {
    const phiActions = [
      'patient_viewed', 'medical_record_created', 'medical_record_updated',
      'medical_record_deleted', 'medical_record_viewed', 'medical_history_accessed',
      'phi_accessed'
    ];

    const phiResources = ['medical_record', 'patient'];

    return phiActions.includes(action) || phiResources.includes(resource);
  }
}

export class MockPHIEncryptionService {
  private encryptionKey: string = 'mock-encryption-key-123';

  async encrypt(data: string): Promise<string> {
    // Mock encryption - in real implementation, use proper encryption
    return `encrypted_${Buffer.from(data).toString('base64')}`;
  }

  async decrypt(encryptedData: string): Promise<string> {
    // Mock decryption - in real implementation, use proper decryption
    if (!encryptedData.startsWith('encrypted_')) {
      throw new Error('Invalid encrypted data format');
    }
    const base64Data = encryptedData.substring(10);
    return Buffer.from(base64Data, 'base64').toString();
  }

  async isEncrypted(data: string): Promise<boolean> {
    return data.startsWith('encrypted_');
  }

  async encryptPhiFields(patientData: any): Promise<any> {
    const phiFields = ['firstName', 'lastName', 'fullName', 'email', 'phoneNumber', 'nationalId'];
    const encryptedData = { ...patientData };

    for (const field of phiFields) {
      if (encryptedData[field]) {
        encryptedData[field] = await this.encrypt(encryptedData[field]);
      }
    }

    return encryptedData;
  }

  async decryptPhiFields(encryptedData: any): Promise<any> {
    const phiFields = ['firstName', 'lastName', 'fullName', 'email', 'phoneNumber', 'nationalId'];
    const decryptedData = { ...encryptedData };

    for (const field of phiFields) {
      if (decryptedData[field] && await this.isEncrypted(decryptedData[field])) {
        decryptedData[field] = await this.decrypt(decryptedData[field]);
      }
    }

    return decryptedData;
  }
}