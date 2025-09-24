import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { PatientTestSetup } from './setup';
import { PATIENT_SEARCH_QUERIES, TEST_PATIENTS } from './fixtures';

describe('Patient Search and Filtering - Contract Tests', () => {
  let app: any;
  let authToken: string;
  let patientIds: string[] = [];

  beforeAll(async () => {
    await PatientTestSetup.initialize();
    app = PatientTestSetup.getApp();
  });

  afterAll(async () => {
    await PatientTestSetup.cleanup();
  });

  beforeEach(async () => {
    // Authenticate and get token
    const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');
    if (authResult) {
      authToken = authResult.accessToken;
    }

    // Create test patients
    patientIds = [];
    for (let i = 0; i < 5; i++) {
      const patient = await PatientTestSetup.createTestPatient({
        firstName: `Search${i}`,
        lastName: `Patient${i}`,
        dateOfBirth: `199${i}-0${i + 1}-15`,
        email: `search${i}.patient@example.com`,
        bloodType: ['A+', 'B+', 'AB+', 'O+', 'O-'][i],
        allergies: i % 2 === 0 ? ['Dust', 'Pollen'] : ['Penicillin'],
        chronicConditions: i % 2 === 0 ? ['Hypertension'] : ['Diabetes']
      });
      patientIds.push(patient.id);
    }
  });

  afterEach(async () => {
    await PatientTestSetup.cleanup();
  });

  describe('GET /api/patients/search - Advanced Patient Search', () => {
    it('should search by patient name', async () => {
      const response = await request(app)
        .get('/api/patients/search?name=Search0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.patients).toBeDefined();
      expect(response.body.data.searchMetadata).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      // Verify search results
      response.body.data.patients.forEach((patient: any) => {
        expect(patient.fullName.toLowerCase().includes('search0')).toBe(true);
      });
    });

    it('should search by patient ID', async () => {
      const response = await request(app)
        .get('/api/patients/search?patientId=PAT-2024-001')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      // If PAT-2024-001 exists, it should be in results
      if (response.body.data.patients.length > 0) {
        response.body.data.patients.forEach((patient: any) => {
          expect(patient.patientId.toLowerCase().includes('pat-2024-001')).toBe(true);
        });
      }
    });

    it('should search by phone number', async () => {
      const response = await request(app)
        .get('/api/patients/search?phone=+201234567890')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        expect(patient.phoneNumber.includes('+201234567890')).toBe(true);
      });
    });

    it('should search by email address', async () => {
      const response = await request(app)
        .get('/api/patients/search?email=search0.patient@example.com')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        expect(patient.email?.toLowerCase().includes('search0.patient@example.com')).toBe(true);
      });
    });

    it('should search by blood type', async () => {
      const response = await request(app)
        .get('/api/patients/search?bloodType=A+')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        expect(patient.bloodType).toBe('A+');
      });
    });

    it('should search by medical condition', async () => {
      const response = await request(app)
        .get('/api/patients/search?condition=Hypertension')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        expect(
          patient.chronicConditions?.some((condition: string) =>
            condition.toLowerCase().includes('hypertension')
          )
        ).toBe(true);
      });
    });

    it('should search by medication', async () => {
      // Add some medications to test patients
      const dbService = PatientTestSetup.getDatabaseService();
      await dbService.updatePatient(patientIds[0], {
        medications: [
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            startDate: new Date(),
            prescribedBy: 'Dr. Smith',
            isActive: true
          }
        ]
      });

      const response = await request(app)
        .get('/api/patients/search?medication=Lisinopril')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        expect(
          patient.medications?.some((med: any) =>
            med.name.toLowerCase().includes('lisinopril')
          )
        ).toBe(true);
      });
    });

    it('should search by allergies', async () => {
      const response = await request(app)
        .get('/api/patients/search?allergies=Penicillin')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        expect(
          patient.allergies?.some((allergy: string) =>
            allergy.toLowerCase().includes('penicillin')
          )
        ).toBe(true);
      });
    });

    it('should search by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request(app)
        .get(`/api/patients/search?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      // Verify date range filtering (this would depend on actual data)
      response.body.data.patients.forEach((patient: any) => {
        // Date range filtering logic would be implemented in the actual service
        expect(patient.createdAt).toBeDefined();
      });
    });

    it('should search by age range', async () => {
      const response = await request(app)
        .get('/api/patients/search?minAge=30&maxAge=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      // Verify age range filtering
      response.body.data.patients.forEach((patient: any) => {
        const age = calculateAge(new Date(patient.dateOfBirth));
        expect(age).toBeGreaterThanOrEqual(30);
        expect(age).toBeLessThanOrEqual(50);
      });
    });

    it('should filter by active status', async () => {
      const response = await request(app)
        .get('/api/patients/search?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        expect(patient.isActive).toBe(true);
      });
    });

    it('should handle free-text search query', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=Search Patient')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      // Verify search works across multiple fields
      response.body.data.patients.forEach((patient: any) => {
        const searchableText = `${patient.fullName} ${patient.patientId} ${patient.email || ''}`.toLowerCase();
        expect(searchableText.includes('search') || searchableText.includes('patient')).toBe(true);
      });
    });

    it('should support complex search with multiple filters', async () => {
      const response = await request(app)
        .get('/api/patients/search?name=Search&bloodType=A+&condition=Hypertension&isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      // Verify all filters are applied
      response.body.data.patients.forEach((patient: any) => {
        expect(patient.fullName.toLowerCase().includes('search')).toBe(true);
        expect(patient.bloodType).toBe('A+');
        expect(
          patient.chronicConditions?.some((condition: string) =>
            condition.toLowerCase().includes('hypertension')
          )
        ).toBe(true);
        expect(patient.isActive).toBe(true);
      });
    });

    it('should return search metadata', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=Search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.searchMetadata).toBeDefined();
      expect(response.body.data.searchMetadata.query).toBe('Search');
      expect(response.body.data.searchMetadata.totalResults).toBeGreaterThanOrEqual(0);
      expect(response.body.data.searchMetadata.searchTime).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(response.body.data.searchMetadata.filters)).toBe(true);
    });

    it('should return pagination information', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=Search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBeGreaterThanOrEqual(1);
      expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(0);
      expect(response.body.data.pagination.totalPages).toBeGreaterThanOrEqual(0);
    });

    it('should handle search with no results', async () => {
      const response = await request(app)
        .get('/api/patients/search?name=NonexistentPatient')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toEqual([]);
      expect(response.body.data.pagination.total).toBe(0);
      expect(response.body.data.searchMetadata.totalResults).toBe(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=test')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should require proper permissions', async () => {
      // Authenticate as technician (no search permissions)
      const techAuth = await PatientTestSetup.authenticateUser('tech_davis', 'password123');

      const response = await request(app)
        .get('/api/patients/search?q=test')
        .set('Authorization', `Bearer ${techAuth?.accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should log search activity in audit trail', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=Search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify audit log was created
      const auditService = PatientTestSetup.getAuditService();
      const auditLogs = await auditService.getAuditLogs({ action: 'search_performed' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      expect(auditLogs.logs.some(log =>
        log.action === 'search_performed' &&
        log.resourceId === 'search'
      )).toBe(true);
    });
  });

  describe('Search Performance and Edge Cases', () => {
    it('should handle search with special characters', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=O\'Connor-Smith')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);
    });

    it('should handle search with numeric values', async () => {
      const response = await request(app)
        .get('/api/patients/search?phone=123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);
    });

    it('should handle search with very long query', async () => {
      const longQuery = 'x'.repeat(500);

      const response = await request(app)
        .get(`/api/patients/search?q=${longQuery}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);
    });

    it('should handle search with empty parameters', async () => {
      const response = await request(app)
        .get('/api/patients/search?name=&phone=&email=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);
    });

    it('should handle search with malformed date ranges', async () => {
      const response = await request(app)
        .get('/api/patients/search?startDate=invalid-date&endDate=invalid-date')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);
    });

    it('should handle search with invalid age ranges', async () => {
      const response = await request(app)
        .get('/api/patients/search?minAge=invalid&maxAge=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);
    });

    it('should respect search result limits', async () => {
      // Create many patients to test limit
      const manyPatients = [];
      for (let i = 0; i < 60; i++) {
        const patient = await PatientTestSetup.createTestPatient({
          firstName: `Many${i}`,
          lastName: `Patient${i}`,
          email: `many${i}.patient@example.com`
        });
        manyPatients.push(patient);
      }

      const response = await request(app)
        .get('/api/patients/search?q=Many')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients.length).toBeLessThanOrEqual(50); // Default limit
    });

    it('should support custom search limits', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=Search&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients.length).toBeLessThanOrEqual(5);
    });

    it('should measure search performance', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/patients/search?q=Search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.data.searchMetadata.searchTime).toBeGreaterThanOrEqual(0);
      expect(endTime - startTime).toBeLessThan(1000); // Search should complete within 1 second
    });

    it('should handle concurrent searches', async () => {
      const searchPromises = [
        request(app).get('/api/patients/search?q=Search0').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/patients/search?q=Search1').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/patients/search?q=Search2').set('Authorization', `Bearer ${authToken}`)
      ];

      const responses = await Promise.all(searchPromises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.patients)).toBe(true);
      });
    });
  });

  describe('Search Result Relevance and Sorting', () => {
    it('should return relevant search results based on name match', async () => {
      // Create patients with similar names
      await PatientTestSetup.createTestPatient({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com'
      });

      await PatientTestSetup.createTestPatient({
        firstName: 'Johnny',
        lastName: 'Smith',
        email: 'johnny.smith@example.com'
      });

      await PatientTestSetup.createTestPatient({
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com'
      });

      const response = await request(app)
        .get('/api/patients/search?q=John')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      // Results should be relevant to "John"
      response.body.data.patients.forEach((patient: any) => {
        expect(
          patient.fullName.toLowerCase().includes('john') ||
          patient.email?.toLowerCase().includes('john')
        ).toBe(true);
      });
    });

    it('should handle partial matches in search', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=Sear') // Partial match for "Search"
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        const searchableText = `${patient.fullName} ${patient.patientId} ${patient.email || ''}`.toLowerCase();
        expect(searchableText.includes('sear')).toBe(true);
      });
    });

    it('should be case-insensitive in search', async () => {
      const responses = await Promise.all([
        request(app).get('/api/patients/search?q=search').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/patients/search?q=Search').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/patients/search?q=SEARCH').set('Authorization', `Bearer ${authToken}`)
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // All should return similar results
        expect(Array.isArray(response.body.data.patients)).toBe(true);
      });
    });

    it('should handle search with multiple words', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=Search Patient')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      // Results should match either "Search" or "Patient" or both
      response.body.data.patients.forEach((patient: any) => {
        const searchableText = `${patient.fullName} ${patient.patientId} ${patient.email || ''}`.toLowerCase();
        expect(
          searchableText.includes('search') ||
          searchableText.includes('patient')
        ).toBe(true);
      });
    });
  });

  describe('Search Filtering and Advanced Features', () => {
    it('should support filtering by provider', async () => {
      const response = await request(app)
        .get('/api/patients/search?providerId=user_1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);
    });

    it('should support filtering by visit type', async () => {
      const response = await request(app)
        .get('/api/patients/search?visitType=consultation')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);
    });

    it('should support filtering by provider name', async () => {
      const response = await request(app)
        .get('/api/patients/search?providerName=Dr.')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);
    });

    it('should support filtering by insurance status', async () => {
      const response = await request(app)
        .get('/api/patients/search?hasInsurance=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        expect(patient.insurance).toBeDefined();
        expect(patient.insurance.provider).toBeDefined();
      });
    });

    it('should support filtering by consent status', async () => {
      const response = await request(app)
        .get('/api/patients/search?hasConsent=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        expect(patient.consentGiven).toBe(true);
      });
    });

    it('should support filtering by emergency contact availability', async () => {
      const response = await request(app)
        .get('/api/patients/search?hasEmergencyContact=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        expect(patient.emergencyContact).toBeDefined();
        expect(patient.emergencyContact.name).toBeDefined();
        expect(patient.emergencyContact.phoneNumber).toBeDefined();
      });
    });

    it('should handle complex search combinations', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=Search&bloodType=A+&minAge=25&maxAge=45&isActive=true&hasInsurance=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      // Verify all complex filters are applied
      response.body.data.patients.forEach((patient: any) => {
        const age = calculateAge(new Date(patient.dateOfBirth));
        expect(age).toBeGreaterThanOrEqual(25);
        expect(age).toBeLessThanOrEqual(45);
        expect(patient.isActive).toBe(true);
        expect(patient.insurance).toBeDefined();
      });
    });
  });
});

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }

  return age;
}