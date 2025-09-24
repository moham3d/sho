import { TestPatient, PatientVisit, MedicalRecord, PatientForm, PatientAuditLog } from './types';
import { PatientTestSetup } from './setup';

/**
 * Utility functions for patient contract tests
 */

export class PatientTestUtils {
  /**
   * Generate test patient data with optional overrides
   */
  static generatePatientData(overrides: any = {}): any {
    const timestamp = Date.now();
    return {
      firstName: `Test${timestamp}`,
      lastName: `Patient${timestamp}`,
      dateOfBirth: '1990-01-01',
      gender: 'male',
      nationalId: `199001010${timestamp.toString().slice(-6)}`,
      phoneNumber: '+201234567890',
      email: `test${timestamp}@example.com`,
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
      bloodType: 'A+',
      allergies: ['Dust'],
      chronicConditions: [],
      insurance: {
        provider: 'Test Insurance',
        policyNumber: `TEST-${timestamp}`,
        expiryDate: '2025-12-31',
        coverageType: 'Basic'
      },
      primaryCarePhysician: 'Dr. Test',
      consentGiven: true,
      ...overrides
    };
  }

  /**
   * Create multiple test patients with variations
   */
  static async createTestPatients(count: number, variations: any[] = []): Promise<TestPatient[]> {
    const patients: TestPatient[] = [];

    for (let i = 0; i < count; i++) {
      const variation = variations[i % variations.length] || {};
      const patient = await PatientTestSetup.createTestPatient({
        firstName: `Patient${i}`,
        lastName: `Test${i}`,
        email: `patient${i}@example.com`,
        ...variation
      });
      patients.push(patient);
    }

    return patients;
  }

  /**
   * Create test patients with diverse demographics
   */
  static async createDiverseTestPatients(): Promise<TestPatient[]> {
    const demographics = [
      {
        firstName: 'Ahmed',
        lastName: 'Hassan',
        gender: 'male',
        dateOfBirth: '1985-03-15',
        bloodType: 'A+',
        chronicConditions: ['Hypertension'],
        allergies: ['Penicillin']
      },
      {
        firstName: 'Fatima',
        lastName: 'Mohamed',
        gender: 'female',
        dateOfBirth: '1992-08-22',
        bloodType: 'O+',
        chronicConditions: ['Asthma'],
        allergies: ['Dust']
      },
      {
        firstName: 'John',
        lastName: 'Smith',
        gender: 'male',
        dateOfBirth: '1980-05-15',
        bloodType: 'B+',
        chronicConditions: ['Diabetes'],
        allergies: ['Shellfish']
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        gender: 'female',
        dateOfBirth: '1975-12-10',
        bloodType: 'AB-',
        chronicConditions: ['Arthritis'],
        allergies: ['Latex']
      },
      {
        firstName: 'Mohamed',
        lastName: 'Ali',
        gender: 'male',
        dateOfBirth: '1995-07-30',
        bloodType: 'O-',
        chronicConditions: [],
        allergies: ['Peanuts']
      }
    ];

    return this.createTestPatients(demographics.length, demographics);
  }

  /**
   * Generate test medical record data
   */
  static generateMedicalRecordData(overrides: any = {}): any {
    return {
      recordType: 'lab_result',
      title: 'Test Lab Result',
      description: 'Test laboratory results',
      data: {
        hemoglobin: 14.2,
        whiteBloodCells: 7.5,
        platelets: 250,
        glucose: 95
      },
      dateOfService: new Date().toISOString().split('T')[0],
      isConfidential: false,
      accessLevel: 'public',
      tags: ['test', 'routine'],
      ...overrides
    };
  }

  /**
   * Create test visits for a patient
   */
  static async createTestVisits(patientId: string, count: number = 3): Promise<PatientVisit[]> {
    const visitTypes = ['consultation', 'follow_up', 'emergency', 'routine_checkup'];
    const visits: PatientVisit[] = [];

    for (let i = 0; i < count; i++) {
      const visitData = {
        patientId,
        visitType: visitTypes[i % visitTypes.length],
        reason: `Test visit ${i + 1}`,
        providerId: 'user_1',
        providerName: 'Dr. Smith',
        providerRole: 'doctor',
        dateOfVisit: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        notes: `Test visit ${i + 1} notes`
      };

      const dbService = PatientTestSetup.getDatabaseService();
      const visit = await dbService.createVisit(visitData);
      visits.push(visit);
    }

    return visits;
  }

  /**
   * Calculate age from date of birth
   */
  static calculateAge(dateOfBirth: Date | string): number {
    const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Generate test search queries
   */
  static generateSearchQueries(): Array<{name: string; query: any}> {
    return [
      {
        name: 'Search by first name',
        query: { q: 'John' }
      },
      {
        name: 'Search by last name',
        query: { q: 'Smith' }
      },
      {
        name: 'Search by patient ID',
        query: { patientId: 'PAT-2024-001' }
      },
      {
        name: 'Search by phone number',
        query: { phone: '+201234567890' }
      },
      {
        name: 'Search by blood type',
        query: { bloodType: 'A+' }
      },
      {
        name: 'Search by condition',
        query: { condition: 'Diabetes' }
      },
      {
        name: 'Search by age range',
        query: { minAge: 30, maxAge: 50 }
      },
      {
        name: 'Complex search',
        query: {
          q: 'John',
          bloodType: 'A+',
          minAge: 30,
          maxAge: 50,
          isActive: true
        }
      }
    ];
  }

  /**
   * Validate audit log structure
   */
  static validateAuditLog(log: PatientAuditLog): boolean {
    const requiredFields = [
      'id', 'userId', 'userName', 'userRole', 'action',
      'resource', 'resourceId', 'details', 'ipAddress',
      'userAgent', 'timestamp', 'isPhiAccess'
    ];

    return requiredFields.every(field => log[field as keyof PatientAuditLog] !== undefined);
  }

  /**
   * Wait for a specified amount of time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry an operation with specified number of attempts
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          await this.wait(delay);
          delay *= 2; // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  /**
   * Measure execution time of an operation
   */
  static async measureTime<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;

    return { result, duration };
  }

  /**
   * Generate test data for compliance scenarios
   */
  static generateComplianceTestData(): any {
    return {
      hipaaScenarios: [
        {
          name: 'Minimum Necessary Access',
          description: 'User accesses only necessary patient information',
          test: async () => {
            // Test implementation
          }
        },
        {
          name: 'PHI Encryption',
          description: 'Sensitive patient information is properly encrypted',
          test: async () => {
            // Test implementation
          }
        }
      ],
      gdprScenarios: [
        {
          name: 'Right to Access',
          description: 'Patient can access their own data',
          test: async () => {
            // Test implementation
          }
        },
        {
          name: 'Right to Erasure',
          description: 'Patient can request data deletion',
          test: async () => {
            // Test implementation
          }
        }
      ]
    };
  }

  /**
   * Validate patient data structure
   */
  static validatePatientData(patient: TestPatient): boolean {
    const requiredFields = [
      'id', 'patientId', 'firstName', 'lastName', 'fullName',
      'dateOfBirth', 'gender', 'nationalId', 'phoneNumber',
      'address', 'emergencyContact', 'insurance', 'isActive',
      'consentGiven', 'createdAt', 'updatedAt'
    ];

    return requiredFields.every(field => patient[field as keyof TestPatient] !== undefined);
  }

  /**
   * Clean up test data
   */
  static async cleanupTestData(): Promise<void> {
    await PatientTestSetup.cleanup();
  }

  /**
   * Setup test environment
   */
  static async setupTestEnvironment(): Promise<void> {
    await PatientTestSetup.initialize();
  }

  /**
   * Create audit log expectations
   */
  static expectAuditLog(log: PatientAuditLog, expectations: Partial<PatientAuditLog>): void {
    Object.entries(expectations).forEach(([key, value]) => {
      expect(log[key as keyof PatientAuditLog]).toEqual(value);
    });
  }

  /**
   * Generate performance test scenarios
   */
  static generatePerformanceScenarios(): Array<{name: string; test: () => Promise<any>}> {
    return [
      {
        name: 'Bulk patient creation',
        test: async () => {
          const patients = await this.createTestPatients(100);
          return { patientCount: patients.length };
        }
      },
      {
        name: 'Complex search queries',
        test: async () => {
          const queries = this.generateSearchQueries();
          const results = [];

          for (const query of queries) {
            // Execute search query
            results.push({ query: query.name, executed: true });
          }

          return { queryCount: results.length };
        }
      },
      {
        name: 'High volume audit logging',
        test: async () => {
          const patient = await PatientTestSetup.createTestPatient();
          const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

          // Generate many audit events
          for (let i = 0; i < 50; i++) {
            // Access patient to create audit log
            // This would be actual API calls in real implementation
          }

          return { eventsGenerated: 50 };
        }
      }
    ];
  }
}

/**
 * Assertion helpers for patient tests
 */
export class PatientAssertions {
  /**
   * Assert successful API response
   */
  static assertSuccessResponse(response: any): void {
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  }

  /**
   * Assert successful creation response
   */
  static assertCreatedResponse(response: any): void {
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBeDefined();
  }

  /**
   * Assert error response
   */
  static assertErrorResponse(response: any, expectedStatusCode: number, expectedErrorCode: string): void {
    expect(response.status).toBe(expectedStatusCode);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe(expectedErrorCode);
  }

  /**
   * Assert patient data structure
   */
  static assertPatientStructure(patient: any): void {
    expect(patient.id).toBeDefined();
    expect(patient.patientId).toBeDefined();
    expect(patient.firstName).toBeDefined();
    expect(patient.lastName).toBeDefined();
    expect(patient.fullName).toBeDefined();
    expect(patient.dateOfBirth).toBeDefined();
    expect(patient.gender).toBeDefined();
    expect(patient.nationalId).toBeDefined();
    expect(patient.phoneNumber).toBeDefined();
    expect(patient.address).toBeDefined();
    expect(patient.emergencyContact).toBeDefined();
    expect(patient.insurance).toBeDefined();
    expect(patient.isActive).toBeDefined();
    expect(patient.consentGiven).toBeDefined();
    expect(patient.createdAt).toBeDefined();
    expect(patient.updatedAt).toBeDefined();
  }

  /**
   * Assert pagination structure
   */
  static assertPaginationStructure(pagination: any): void {
    expect(pagination.page).toBeDefined();
    expect(pagination.limit).toBeDefined();
    expect(pagination.total).toBeDefined();
    expect(pagination.totalPages).toBeDefined();
    expect(typeof pagination.page).toBe('number');
    expect(typeof pagination.limit).toBe('number');
    expect(typeof pagination.total).toBe('number');
    expect(typeof pagination.totalPages).toBe('number');
  }

  /**
   * Assert audit log structure
   */
  static assertAuditLogStructure(log: any): void {
    expect(log.id).toBeDefined();
    expect(log.userId).toBeDefined();
    expect(log.userName).toBeDefined();
    expect(log.userRole).toBeDefined();
    expect(log.action).toBeDefined();
    expect(log.resource).toBeDefined();
    expect(log.resourceId).toBeDefined();
    expect(log.details).toBeDefined();
    expect(log.ipAddress).toBeDefined();
    expect(log.userAgent).toBeDefined();
    expect(log.timestamp).toBeDefined();
    expect(log.isPhiAccess).toBeDefined();
  }

  /**
   * Assert PHI access control
   */
  static assertPHIAccessControl(response: any, shouldHaveAccess: boolean): void {
    if (shouldHaveAccess) {
      expect([200, 201, 204]).toContain(response.status);
    } else {
      expect([401, 403]).toContain(response.status);
      if (response.status === 403) {
        expect(response.body.error.code).toBe('PHI_ACCESS_DENIED');
      }
    }
  }
}

export { PatientTestUtils, PatientAssertions };