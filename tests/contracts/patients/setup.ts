import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { MockPatientDatabaseService, MockPatientAuthService, MockPatientAuditService, MockPHIEncryptionService } from './mocks';
import { TestPatient, PatientTestContext } from './types';
import { TEST_PATIENTS } from './fixtures';

export class PatientTestSetup {
  private static app: express.Application;
  private static dbService: MockPatientDatabaseService;
  private static authService: MockPatientAuthService;
  private static auditService: MockPatientAuditService;
  private static encryptionService: MockPHIEncryptionService;
  private static testContext: PatientTestContext;

  static async initialize() {
    // Initialize mock services
    this.dbService = new MockPatientDatabaseService();
    this.authService = new MockPatientAuthService();
    this.auditService = new MockPatientAuditService();
    this.encryptionService = new MockPHIEncryptionService();

    await this.dbService.connect();

    // Create Express app for testing
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Setup authentication and authorization middleware
    const authMiddleware = this.setupAuthMiddleware();

    // Setup patient routes
    this.setupPatientRoutes(authMiddleware);

    // Setup medical data routes
    this.setupMedicalDataRoutes(authMiddleware);

    // Setup search routes
    this.setupSearchRoutes(authMiddleware);

    // Error handling middleware
    this.setupErrorHandling();
  }

  private static setupAuthMiddleware() {
    return {
      authenticate: async (req: any, res: any, next: any) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Missing or invalid authorization header'
            }
          });
        }

        const token = authHeader.substring(7);
        const payload = await this.authService.verifyToken(token);

        if (!payload) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid or expired token'
            }
          });
        }

        req.user = payload;
        next();
      },

      requireRole: (roles: string[]) => {
        return async (req: any, res: any, next: any) => {
          if (!req.user) {
            return res.status(401).json({
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
              }
            });
          }

          if (!roles.includes(req.user.role)) {
            return res.status(403).json({
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions'
              }
            });
          }

          next();
        };
      },

      requirePermission: (resource: string, action: string) => {
        return async (req: any, res: any, next: any) => {
          if (!req.user) {
            return res.status(401).json({
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
              }
            });
          }

          const hasPermission = await this.authService.hasPermission(req.user.id, `${resource}:${action}`);

          if (!hasPermission) {
            return res.status(403).json({
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions'
              }
            });
          }

          next();
        };
      },

      requirePhiAccess: async (req: any, res: any, next: any) => {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          });
        }

        const canAccessPhi = await this.dbService.canAccessPhi(req.user.id);

        if (!canAccessPhi) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'PHI_ACCESS_DENIED',
              message: 'Access to Protected Health Information is not permitted'
            }
          });
        }

        next();
      },

      logPhiAccess: (resource: string, reason?: string) => {
        return async (req: any, res: any, next: any) => {
          const originalSend = res.send;
          res.send = function(data) {
            // Log PHI access after response is sent
            setImmediate(async () => {
              try {
                await PatientTestSetup.auditService.logAction(
                  req.user.id,
                  'phi_accessed' as any,
                  resource,
                  req.params.id || req.body.id || 'unknown',
                  {
                    method: req.method,
                    path: req.path,
                    reason: reason || 'Patient care',
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent')
                  }
                );
              } catch (error) {
                console.error('Failed to log PHI access:', error);
              }
            });
            originalSend.call(this, data);
          };
          next();
        };
      }
    };
  }

  private static setupPatientRoutes(authMiddleware: any) {
    // GET /api/patients - List patients with pagination and filtering
    this.app.get('/api/patients',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('patient', 'read'),
      async (req, res) => {
        try {
          const params = {
            page: parseInt(req.query.page as string) || 1,
            limit: Math.min(parseInt(req.query.limit as string) || 10, 50),
            offset: parseInt(req.query.offset as string) || 0,
            sortBy: req.query.sortBy as string || 'createdAt',
            sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
            search: req.query.search as string,
            gender: req.query.gender as string,
            bloodType: req.query.bloodType as string,
            ageRange: req.query.ageRange ? JSON.parse(req.query.ageRange as string) : undefined,
            isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
          };

          const result = await this.dbService.findPatients(params);

          const totalPages = Math.ceil(result.total / params.limit);

          res.json({
            success: true,
            data: {
              patients: result.patients,
              pagination: {
                page: params.page,
                limit: params.limit,
                total: result.total,
                totalPages
              }
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch patients'
            }
          });
        }
      }
    );

    // GET /api/patients/:id - Get patient by ID
    this.app.get('/api/patients/:id',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('patient', 'read'),
      authMiddleware.requirePhiAccess(),
      authMiddleware.logPhiAccess('patient', 'Patient record access'),
      async (req, res) => {
        try {
          const patient = await this.dbService.findPatientById(req.params.id);

          if (!patient) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'PATIENT_NOT_FOUND',
                message: 'Patient not found'
              }
            });
          }

          // Log patient access
          await this.auditService.logAction(
            req.user.id,
            'patient_viewed' as any,
            'patient',
            req.params.id,
            {
              method: 'GET',
              reason: req.query.reason || 'Patient record access'
            }
          );

          res.json({
            success: true,
            data: patient
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch patient'
            }
          });
        }
      }
    );

    // POST /api/patients - Create new patient
    this.app.post('/api/patients',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('patient', 'create'),
      async (req, res) => {
        try {
          const patientData = req.body;

          // Validate required fields
          const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'nationalId', 'phoneNumber', 'address', 'emergencyContact', 'insurance'];
          const missingFields = requiredFields.filter(field => !patientData[field]);

          if (missingFields.length > 0) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Missing required fields',
                validationErrors: missingFields.map(field => ({
                  field,
                  message: `${field} is required`
                }))
              }
            });
          }

          // Validate consent
          if (!patientData.consentGiven) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'CONSENT_REQUIRED',
                message: 'Patient consent is required'
              }
            });
          }

          // Validate date format
          const dateOfBirth = new Date(patientData.dateOfBirth);
          if (isNaN(dateOfBirth.getTime())) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid date format',
                validationErrors: [
                  { field: 'dateOfBirth', message: 'Invalid date format' }
                ]
              }
            });
          }

          // Check for existing patient
          const existingPatient = await this.dbService.findPatientByPatientId(patientData.patientId) ||
                                 await this.dbService.findPatients({ search: patientData.nationalId });

          if (existingPatient.patients.length > 0) {
            return res.status(409).json({
              success: false,
              error: {
                code: 'PATIENT_ALREADY_EXISTS',
                message: 'Patient with this ID or national ID already exists'
              }
            });
          }

          const patient = await this.dbService.createPatient(patientData);

          // Log patient creation
          await this.auditService.logAction(
            req.user.id,
            'patient_created' as any,
            'patient',
            patient.id,
            {
              patientId: patient.patientId,
              name: patient.fullName
            }
          );

          res.status(201).json({
            success: true,
            data: patient
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to create patient'
            }
          });
        }
      }
    );

    // PUT /api/patients/:id - Update patient
    this.app.put('/api/patients/:id',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('patient', 'update'),
      authMiddleware.requirePhiAccess(),
      authMiddleware.logPhiAccess('patient', 'Patient record update'),
      async (req, res) => {
        try {
          const existingPatient = await this.dbService.findPatientById(req.params.id);

          if (!existingPatient) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'PATIENT_NOT_FOUND',
                message: 'Patient not found'
              }
            });
          }

          const updatedPatient = await this.dbService.updatePatient(req.params.id, req.body);

          // Log patient update
          await this.auditService.logAction(
            req.user.id,
            'patient_updated' as any,
            'patient',
            req.params.id,
            {
              updatedFields: Object.keys(req.body)
            }
          );

          res.json({
            success: true,
            data: updatedPatient
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to update patient'
            }
          });
        }
      }
    );

    // DELETE /api/patients/:id - Delete patient (soft delete)
    this.app.delete('/api/patients/:id',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('patient', 'delete'),
      async (req, res) => {
        try {
          const existingPatient = await this.dbService.findPatientById(req.params.id);

          if (!existingPatient) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'PATIENT_NOT_FOUND',
                message: 'Patient not found'
              }
            });
          }

          await this.dbService.deletePatient(req.params.id, req.body.reason);

          res.status(204).send();
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to delete patient'
            }
          });
        }
      }
    );
  }

  private static setupMedicalDataRoutes(authMiddleware: any) {
    // GET /api/patients/:id/visits - Get patient visits
    this.app.get('/api/patients/:id/visits',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('visit', 'read'),
      authMiddleware.requirePhiAccess(),
      authMiddleware.logPhiAccess('visit', 'Patient visit access'),
      async (req, res) => {
        try {
          const params = {
            page: parseInt(req.query.page as string) || 1,
            limit: Math.min(parseInt(req.query.limit as string) || 10, 50),
            offset: parseInt(req.query.offset as string) || 0,
            sortBy: req.query.sortBy as string || 'dateOfVisit',
            sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
            status: req.query.status as string,
            visitType: req.query.visitType as string
          };

          const result = await this.dbService.findVisitsByPatientId(req.params.id, params);

          const totalPages = Math.ceil(result.total / params.limit);

          res.json({
            success: true,
            data: {
              visits: result.visits,
              pagination: {
                page: params.page,
                limit: params.limit,
                total: result.total,
                totalPages
              }
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch patient visits'
            }
          });
        }
      }
    );

    // GET /api/patients/:id/forms - Get patient forms
    this.app.get('/api/patients/:id/forms',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('form', 'read'),
      authMiddleware.requirePhiAccess(),
      authMiddleware.logPhiAccess('form', 'Patient form access'),
      async (req, res) => {
        try {
          const params = {
            page: parseInt(req.query.page as string) || 1,
            limit: Math.min(parseInt(req.query.limit as string) || 10, 50),
            offset: parseInt(req.query.offset as string) || 0,
            status: req.query.status as string
          };

          const result = await this.dbService.findFormsByPatientId(req.params.id, params);

          const totalPages = Math.ceil(result.total / params.limit);

          res.json({
            success: true,
            data: {
              forms: result.forms,
              pagination: {
                page: params.page,
                limit: params.limit,
                total: result.total,
                totalPages
              }
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch patient forms'
            }
          });
        }
      }
    );

    // GET /api/patients/:id/medical-history - Get patient medical history
    this.app.get('/api/patients/:id/medical-history',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('medical_record', 'read'),
      authMiddleware.requirePhiAccess(),
      authMiddleware.logPhiAccess('medical_record', 'Patient medical history access'),
      async (req, res) => {
        try {
          const medicalHistory = await this.dbService.getMedicalHistory(req.params.id);

          if (!medicalHistory) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'MEDICAL_HISTORY_NOT_FOUND',
                message: 'Medical history not found'
              }
            });
          }

          // Log medical history access
          await this.auditService.logAction(
            req.user.id,
            'medical_history_accessed' as any,
            'medical_record',
            req.params.id,
            {
              reason: req.query.reason || 'Medical history review'
            }
          );

          res.json({
            success: true,
            data: medicalHistory
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch medical history'
            }
          });
        }
      }
    );

    // POST /api/patients/:id/medical-records - Create medical record
    this.app.post('/api/patients/:id/medical-records',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('medical_record', 'create'),
      authMiddleware.requirePhiAccess(),
      authMiddleware.logPhiAccess('medical_record', 'Medical record creation'),
      async (req, res) => {
        try {
          const patient = await this.dbService.findPatientById(req.params.id);

          if (!patient) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'PATIENT_NOT_FOUND',
                message: 'Patient not found'
              }
            });
          }

          const medicalRecord = await this.dbService.createMedicalRecord({
            ...req.body,
            patientId: req.params.id,
            providerId: req.user.id,
            providerName: req.user.username
          });

          // Log medical record creation
          await this.auditService.logAction(
            req.user.id,
            'medical_record_created' as any,
            'medical_record',
            medicalRecord.id,
            {
              patientId: req.params.id,
              recordType: medicalRecord.recordType,
              title: medicalRecord.title
            }
          );

          res.status(201).json({
            success: true,
            data: medicalRecord
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to create medical record'
            }
          });
        }
      }
    );
  }

  private static setupSearchRoutes(authMiddleware: any) {
    // GET /api/patients/search - Advanced patient search
    this.app.get('/api/patients/search',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('patient', 'read'),
      async (req, res) => {
        try {
          const searchQuery = {
            query: req.query.q as string,
            name: req.query.name as string,
            patientId: req.query.patientId as string,
            phone: req.query.phone as string,
            email: req.query.email as string,
            bloodType: req.query.bloodType as string,
            condition: req.query.condition as string,
            medication: req.query.medication as string,
            allergies: req.query.allergies ? (req.query.allergies as string).split(',') : undefined,
            dateRange: req.query.startDate && req.query.endDate ? {
              start: req.query.startDate as string,
              end: req.query.endDate as string
            } : undefined,
            ageRange: req.query.minAge && req.query.maxAge ? {
              min: parseInt(req.query.minAge as string),
              max: parseInt(req.query.maxAge as string)
            } : undefined,
            isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
          };

          const result = await this.dbService.searchPatients(searchQuery);

          // Log search activity
          await this.auditService.logAction(
            req.user.id,
            'search_performed' as any,
            'patient',
            'search',
            {
              query: searchQuery,
              resultCount: result.total,
              searchTime: result.searchTime
            }
          );

          res.json({
            success: true,
            data: {
              patients: result.patients,
              searchMetadata: {
                query: searchQuery.query || 'Advanced search',
                totalResults: result.total,
                searchTime: result.searchTime,
                filters: Object.keys(searchQuery).filter(key => searchQuery[key] !== undefined)
              },
              pagination: {
                page: 1,
                limit: result.patients.length,
                total: result.total,
                totalPages: Math.ceil(result.total / result.patients.length)
              }
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to search patients'
            }
          });
        }
      }
    );
  }

  private static setupErrorHandling() {
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Test error:', err);

      // Validation errors
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            validationErrors: Object.values(err.errors).map((error: any) => ({
              field: error.path,
              message: error.message
            }))
          }
        });
      }

      // Database errors
      if (err.code === '23505') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Resource already exists'
          }
        });
      }

      if (err.code === '23503') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FOREIGN_KEY_VIOLATION',
            message: 'Invalid reference'
          }
        });
      }

      // PHI access errors
      if (err.code === 'PHI_ACCESS_DENIED') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PHI_ACCESS_DENIED',
            message: 'Access to Protected Health Information is not permitted'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      });
    });
  }

  static async cleanup() {
    if (this.dbService) {
      await this.dbService.clearTestData();
      await this.dbService.disconnect();
    }
    if (this.auditService) {
      await this.auditService.clearLogs();
    }
  }

  static getApp(): express.Application {
    return this.app;
  }

  static getDatabaseService(): MockPatientDatabaseService {
    return this.dbService;
  }

  static getAuthService(): MockPatientAuthService {
    return this.authService;
  }

  static getAuditService(): MockPatientAuditService {
    return this.auditService;
  }

  static getEncryptionService(): MockPHIEncryptionService {
    return this.encryptionService;
  }

  static async createTestPatient(patientData: any = {}): Promise<TestPatient> {
    return this.dbService.createPatient({
      firstName: 'Test',
      lastName: 'Patient',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      nationalId: '1990010101234',
      phoneNumber: '+201234567890',
      email: 'test@example.com',
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
      insurance: {
        provider: 'Test Insurance',
        policyNumber: 'TEST-123456',
        expiryDate: '2025-12-31',
        coverageType: 'Basic'
      },
      consentGiven: true,
      ...patientData
    });
  }

  static async authenticateUser(username: string, password: string): Promise<{ user: any; accessToken: string; refreshToken: string } | null> {
    return this.authService.authenticateUser(username, password);
  }
}

// Global test setup
beforeAll(async () => {
  await PatientTestSetup.initialize();
});

afterAll(async () => {
  await PatientTestSetup.cleanup();
});

beforeEach(async () => {
  // Clear test data before each test
  await PatientTestSetup.cleanup();
});

afterEach(async () => {
  // Clean up after each test
});

export { PatientTestSetup };