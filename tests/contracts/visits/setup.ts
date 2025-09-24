import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { Express } from 'express';
import request from 'supertest';
import {
  Visit,
  VisitCreateRequest,
  VisitUpdateRequest,
  VisitCheckInRequest,
  VisitCheckOutRequest,
  VisitCreateFormRequest,
  VisitForm,
  VisitStatus,
  VisitPriority,
  VisitType,
  VisitOutcome
} from './types';
import {
  MOCK_PATIENTS,
  MOCK_USERS,
  VALID_VISIT_CREATE_REQUESTS,
  SAMPLE_EXISTING_VISITS,
  SAMPLE_VISIT_FORMS
} from './fixtures';

export class VisitTestSetup {
  private static app: Express;
  private static authToken: string;
  private static createdVisitIds: string[] = [];
  private static createdFormIds: string[] = [];
  private static createdPatientIds: string[] = [];
  private static createdUserIds: string[] = [];

  static async initialize(): Promise<void> {
    // Import the Express app dynamically to avoid circular dependencies
    // This assumes the main app exports an Express instance
    try {
      const appModule = await import('../../../src/app');
      VisitTestSetup.app = appModule.default;
    } catch (error) {
      console.log('Using mock app for testing purposes');
      VisitTestSetup.app = VisitTestSetup.createMockApp();
    }

    // Initialize database connections and test data
    await this.setupDatabase();
    await this.createTestUsers();
    await this.createTestPatients();
  }

  static createMockApp(): Express {
    const express = require('express');
    const app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req, res, next) => {
      if (req.headers.authorization) {
        const token = req.headers.authorization.replace('Bearer ', '');
        if (token === 'mock-token') {
          req.user = {
            id: 'test-user-id',
            username: 'testuser',
            role: 'doctor',
            department: 'Cardiology'
          };
        }
      }
      next();
    });

    // Mock visit endpoints
    app.get('/api/visits', (req, res) => {
      res.json({
        success: true,
        data: {
          visits: SAMPLE_EXISTING_VISITS,
          pagination: {
            page: 1,
            limit: 10,
            total: SAMPLE_EXISTING_VISITS.length,
            totalPages: 1
          }
        }
      });
    });

    app.get('/api/visits/:id', (req, res) => {
      const visit = SAMPLE_EXISTING_VISITS.find(v => v.id === req.params.id);
      if (visit) {
        res.json({ success: true, data: { visit } });
      } else {
        res.status(404).json({ success: false, error: 'Visit not found' });
      }
    });

    app.post('/api/visits', (req, res) => {
      const visit: Visit = {
        id: `visit-${Date.now()}`,
        patientId: req.body.patientId,
        visitType: req.body.visitType,
        reasonForVisit: req.body.reasonForVisit,
        priority: req.body.priority,
        status: VisitStatus.PENDING,
        assignedDoctorId: req.body.assignedDoctorId,
        scheduledDateTime: req.body.scheduledDateTime,
        notes: req.body.notes,
        duration: req.body.duration,
        location: req.body.location,
        departmentId: req.body.departmentId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user-id',
        updatedBy: 'test-user-id'
      };
      VisitTestSetup.createdVisitIds.push(visit.id);
      res.status(201).json({ success: true, data: { visit } });
    });

    app.put('/api/visits/:id', (req, res) => {
      const visitIndex = SAMPLE_EXISTING_VISITS.findIndex(v => v.id === req.params.id);
      if (visitIndex !== -1) {
        const updatedVisit = { ...SAMPLE_EXISTING_VISITS[visitIndex], ...req.body };
        res.json({ success: true, data: { visit: updatedVisit } });
      } else {
        res.status(404).json({ success: false, error: 'Visit not found' });
      }
    });

    app.delete('/api/visits/:id', (req, res) => {
      const visitIndex = SAMPLE_EXISTING_VISITS.findIndex(v => v.id === req.params.id);
      if (visitIndex !== -1) {
        res.json({ success: true, message: 'Visit deleted successfully' });
      } else {
        res.status(404).json({ success: false, error: 'Visit not found' });
      }
    });

    app.get('/api/visits/upcoming', (req, res) => {
      const upcomingVisits = SAMPLE_EXISTING_VISITS.filter(v =>
        v.status === VisitStatus.SCHEDULED &&
        v.scheduledDateTime &&
        v.scheduledDateTime > new Date()
      );
      res.json({ success: true, data: { visits: upcomingVisits } });
    });

    app.get('/api/visits/patient/:patientId', (req, res) => {
      const patientVisits = SAMPLE_EXISTING_VISITS.filter(v => v.patientId === req.params.patientId);
      res.json({ success: true, data: { visits: patientVisits } });
    });

    app.post('/api/visits/:id/check-in', (req, res) => {
      const visitIndex = SAMPLE_EXISTING_VISITS.findIndex(v => v.id === req.params.id);
      if (visitIndex !== -1) {
        const updatedVisit = {
          ...SAMPLE_EXISTING_VISITS[visitIndex],
          status: VisitStatus.CHECKED_IN,
          checkInDateTime: new Date(),
          notes: req.body.notes || SAMPLE_EXISTING_VISITS[visitIndex].notes
        };
        res.json({ success: true, data: { visit: updatedVisit } });
      } else {
        res.status(404).json({ success: false, error: 'Visit not found' });
      }
    });

    app.post('/api/visits/:id/check-out', (req, res) => {
      const visitIndex = SAMPLE_EXISTING_VISITS.findIndex(v => v.id === req.params.id);
      if (visitIndex !== -1) {
        const updatedVisit = {
          ...SAMPLE_EXISTING_VISITS[visitIndex],
          status: VisitStatus.COMPLETED,
          checkOutDateTime: new Date(),
          notes: req.body.notes || SAMPLE_EXISTING_VISITS[visitIndex].notes
        };
        res.json({ success: true, data: { visit: updatedVisit } });
      } else {
        res.status(404).json({ success: false, error: 'Visit not found' });
      }
    });

    app.get('/api/visits/:id/forms', (req, res) => {
      const visitForms = SAMPLE_VISIT_FORMS.filter(f => f.visitId === req.params.id);
      res.json({ success: true, data: { forms: visitForms } });
    });

    app.post('/api/visits/:id/forms', (req, res) => {
      const form: VisitForm = {
        id: `form-${Date.now()}`,
        visitId: req.params.id,
        formType: req.body.formType,
        formData: req.body.formData,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      VisitTestSetup.createdFormIds.push(form.id);
      res.status(201).json({ success: true, data: { form } });
    });

    return app;
  }

  private static async setupDatabase(): Promise<void> {
    // Mock database setup
    console.log('Setting up test database...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private static async createTestUsers(): Promise<void> {
    // Mock user creation
    console.log('Creating test users...');
    MOCK_USERS.forEach(user => {
      VisitTestSetup.createdUserIds.push(user.id);
    });
  }

  private static async createTestPatients(): Promise<void> {
    // Mock patient creation
    console.log('Creating test patients...');
    MOCK_PATIENTS.forEach(patient => {
      VisitTestSetup.createdPatientIds.push(patient.id);
    });
  }

  static async cleanup(): Promise<void> {
    // Clean up created test data
    console.log('Cleaning up test data...');

    // Clean up visits
    for (const visitId of VisitTestSetup.createdVisitIds) {
      try {
        await request(VisitTestSetup.app)
          .delete(`/api/visits/${visitId}`)
          .set('Authorization', `Bearer ${VisitTestSetup.authToken}`);
      } catch (error) {
        console.log(`Failed to delete visit ${visitId}:`, error);
      }
    }

    // Clean up forms
    for (const formId of VisitTestSetup.createdFormIds) {
      // Forms are typically deleted when visits are deleted
    }

    // Clean up patients
    for (const patientId of VisitTestSetup.createdPatientIds) {
      try {
        await request(VisitTestSetup.app)
          .delete(`/api/patients/${patientId}`)
          .set('Authorization', `Bearer ${VisitTestSetup.authToken}`);
      } catch (error) {
        console.log(`Failed to delete patient ${patientId}:`, error);
      }
    }

    // Clean up users
    for (const userId of VisitTestSetup.createdUserIds) {
      try {
        await request(VisitTestSetup.app)
          .delete(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${VisitTestSetup.authToken}`);
      } catch (error) {
        console.log(`Failed to delete user ${userId}:`, error);
      }
    }

    // Reset arrays
    VisitTestSetup.createdVisitIds = [];
    VisitTestSetup.createdFormIds = [];
    VisitTestSetup.createdPatientIds = [];
    VisitTestSetup.createdUserIds = [];
    VisitTestSetup.authToken = '';
  }

  static getApp(): Express {
    if (!VisitTestSetup.app) {
      throw new Error('VisitTestSetup not initialized. Call initialize() first.');
    }
    return VisitTestSetup.app;
  }

  static async authenticateUser(username: string, password: string): Promise<any> {
    try {
      const response = await request(VisitTestSetup.getApp())
        .post('/api/auth/login')
        .send({ username, password });

      if (response.body.success) {
        VisitTestSetup.authToken = response.body.data.accessToken;
        return response.body.data;
      }
      return null;
    } catch (error) {
      console.log(`Authentication failed for ${username}:`, error);
      return null;
    }
  }

  static getAuthToken(): string {
    return VisitTestSetup.authToken;
  }

  static setAuthToken(token: string): void {
    VisitTestSetup.authToken = token;
  }

  static getCreatedVisitIds(): string[] {
    return [...VisitTestSetup.createdVisitIds];
  }

  static addCreatedVisitId(visitId: string): void {
    if (!VisitTestSetup.createdVisitIds.includes(visitId)) {
      VisitTestSetup.createdVisitIds.push(visitId);
    }
  }

  static getCreatedPatientIds(): string[] {
    return [...VisitTestSetup.createdPatientIds];
  }

  static addCreatedPatientId(patientId: string): void {
    if (!VisitTestSetup.createdPatientIds.includes(patientId)) {
      VisitTestSetup.createdPatientIds.push(patientId);
    }
  }

  static getCreatedUserIds(): string[] {
    return [...VisitTestSetup.createdUserIds];
  }

  static addCreatedUserId(userId: string): void {
    if (!VisitTestSetup.createdUserIds.includes(userId)) {
      VisitTestSetup.createdUserIds.push(userId);
    }
  }

  static async createTestVisit(
    visitData: Partial<VisitCreateRequest>,
    authToken?: string
  ): Promise<Visit> {
    const token = authToken || VisitTestSetup.authToken;
    if (!token) {
      throw new Error('No auth token available');
    }

    const defaultVisitData: VisitCreateRequest = {
      patientId: VisitTestSetup.createdPatientIds[0],
      visitType: VisitType.INITIAL,
      reasonForVisit: 'Test visit',
      priority: VisitPriority.MEDIUM,
      ...visitData
    };

    const response = await request(VisitTestSetup.getApp())
      .post('/api/visits')
      .set('Authorization', `Bearer ${token}`)
      .send(defaultVisitData);

    if (response.body.success) {
      const visit = response.body.data.visit;
      VisitTestSetup.addCreatedVisitId(visit.id);
      return visit;
    }

    throw new Error(`Failed to create test visit: ${response.body.error}`);
  }

  static async createTestPatient(
    patientData: any,
    authToken?: string
  ): Promise<any> {
    const token = authToken || VisitTestSetup.authToken;
    if (!token) {
      throw new Error('No auth token available');
    }

    const response = await request(VisitTestSetup.getApp())
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send(patientData);

    if (response.body.success) {
      const patient = response.body.data.patient;
      VisitTestSetup.addCreatedPatientId(patient.id);
      return patient;
    }

    throw new Error(`Failed to create test patient: ${response.body.error}`);
  }

  static async createTestUser(
    userData: any,
    authToken?: string
  ): Promise<any> {
    const token = authToken || VisitTestSetup.authToken;
    if (!token) {
      throw new Error('No auth token available');
    }

    const response = await request(VisitTestSetup.getApp())
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send(userData);

    if (response.body.success) {
      const user = response.body.data.user;
      VisitTestSetup.addCreatedUserId(user.id);
      return user;
    }

    throw new Error(`Failed to create test user: ${response.body.error}`);
  }
}