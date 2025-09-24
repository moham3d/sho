import request from 'supertest';
import { VisitTestSetup } from './setup';
import { Visit, VisitCreateRequest, VisitUpdateRequest, VisitStatus, VisitPriority, VisitType } from './types';

export class VisitTestUtils {
  /**
   * Create a visit with the given data and return the response
   */
  static async createVisit(
    visitData: Partial<VisitCreateRequest>,
    authToken?: string
  ) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    const defaultData: VisitCreateRequest = {
      patientId: VisitTestSetup.getCreatedPatientIds()[0],
      visitType: VisitType.INITIAL,
      reasonForVisit: 'Test visit creation',
      priority: VisitPriority.MEDIUM,
      ...visitData
    };

    return request(app)
      .post('/api/visits')
      .set('Authorization', `Bearer ${token}`)
      .send(defaultData);
  }

  /**
   * Get a visit by ID
   */
  static async getVisit(visitId: string, authToken?: string) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    return request(app)
      .get(`/api/visits/${visitId}`)
      .set('Authorization', `Bearer ${token}`);
  }

  /**
   * List visits with optional query parameters
   */
  static async listVisits(query: any = {}, authToken?: string) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    return request(app)
      .get('/api/visits')
      .query(query)
      .set('Authorization', `Bearer ${token}`);
  }

  /**
   * Update a visit with the given data
   */
  static async updateVisit(
    visitId: string,
    updateData: Partial<VisitUpdateRequest>,
    authToken?: string
  ) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    return request(app)
      .put(`/api/visits/${visitId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);
  }

  /**
   * Delete a visit (soft delete)
   */
  static async deleteVisit(visitId: string, authToken?: string) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    return request(app)
      .delete(`/api/visits/${visitId}`)
      .set('Authorization', `Bearer ${token}`);
  }

  /**
   * Get upcoming visits
   */
  static async getUpcomingVisits(authToken?: string) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    return request(app)
      .get('/api/visits/upcoming')
      .set('Authorization', `Bearer ${token}`);
  }

  /**
   * Get visits for a specific patient
   */
  static async getPatientVisits(patientId: string, authToken?: string) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    return request(app)
      .get(`/api/visits/patient/${patientId}`)
      .set('Authorization', `Bearer ${token}`);
  }

  /**
   * Check in a patient for a visit
   */
  static async checkInVisit(
    visitId: string,
    checkInData: any = {},
    authToken?: string
  ) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    return request(app)
      .post(`/api/visits/${visitId}/check-in`)
      .set('Authorization', `Bearer ${token}`)
      .send(checkInData);
  }

  /**
   * Check out a patient after a visit
   */
  static async checkOutVisit(
    visitId: string,
    checkOutData: any = {},
    authToken?: string
  ) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    return request(app)
      .post(`/api/visits/${visitId}/check-out`)
      .set('Authorization', `Bearer ${token}`)
      .send(checkOutData);
  }

  /**
   * Get forms for a specific visit
   */
  static async getVisitForms(visitId: string, authToken?: string) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    return request(app)
      .get(`/api/visits/${visitId}/forms`)
      .set('Authorization', `Bearer ${token}`);
  }

  /**
   * Create a form for a specific visit
   */
  static async createVisitForm(
    visitId: string,
    formData: any,
    authToken?: string
  ) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    return request(app)
      .post(`/api/visits/${visitId}/forms`)
      .set('Authorization', `Bearer ${token}`)
      .send(formData);
  }

  /**
   * Test visit status transitions
   */
  static async testStatusTransition(
    visitId: string,
    fromStatus: VisitStatus,
    toStatus: VisitStatus,
    shouldSucceed: boolean = true,
    authToken?: string
  ) {
    const response = await this.updateVisit(
      visitId,
      { status: toStatus },
      authToken
    );

    if (shouldSucceed) {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.visit.status).toBe(toStatus);
    } else {
      expect(response.status).toBeGreaterThanOrEqual(400);
    }

    return response;
  }

  /**
   * Test visit scheduling conflicts
   */
  static async testSchedulingConflict(
    visitData: VisitCreateRequest,
    shouldHaveConflict: boolean = true,
    authToken?: string
  ) {
    const response = await this.createVisit(visitData, authToken);

    if (shouldHaveConflict) {
      expect(response.status).toBe(409); // Conflict
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('conflict');
    } else {
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    }

    return response;
  }

  /**
   * Test visit workflow validation
   */
  static async testWorkflowValidation(
    visitId: string,
    action: 'check-in' | 'check-out' | 'cancel' | 'reschedule',
    shouldSucceed: boolean = true,
    authToken?: string
  ) {
    let response;

    switch (action) {
      case 'check-in':
        response = await this.checkInVisit(visitId, {}, authToken);
        break;
      case 'check-out':
        response = await this.checkOutVisit(visitId, {
          outcome: 'discharged',
          followUpRequired: false
        }, authToken);
        break;
      case 'cancel':
        response = await this.updateVisit(visitId, { status: VisitStatus.CANCELLED }, authToken);
        break;
      case 'reschedule':
        const newDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 2 days from now
        response = await this.updateVisit(visitId, { scheduledDateTime: newDate }, authToken);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    if (shouldSucceed) {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    } else {
      expect(response.status).toBeGreaterThanOrEqual(400);
    }

    return response;
  }

  /**
   * Test pagination functionality
   */
  static async testPagination(
    baseUrl: string,
    expectedTotal: number,
    authToken?: string
  ) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    // Test first page
    const response1 = await request(app)
      .get(baseUrl)
      .query({ page: 1, limit: 10 })
      .set('Authorization', `Bearer ${token}`);

    expect(response1.status).toBe(200);
    expect(response1.body.success).toBe(true);
    expect(response1.body.data.pagination.page).toBe(1);
    expect(response1.body.data.pagination.limit).toBe(10);
    expect(response1.body.data.pagination.total).toBe(expectedTotal);

    // Test second page if there are more items
    if (expectedTotal > 10) {
      const response2 = await request(app)
        .get(baseUrl)
        .query({ page: 2, limit: 10 })
        .set('Authorization', `Bearer ${token}`);

      expect(response2.status).toBe(200);
      expect(response2.body.data.pagination.page).toBe(2);
    }

    // Test different page size
    const response3 = await request(app)
      .get(baseUrl)
      .query({ page: 1, limit: 5 })
      .set('Authorization', `Bearer ${token}`);

    expect(response3.status).toBe(200);
    expect(response3.body.data.pagination.limit).toBe(5);
    expect(response3.body.data.visits.length).toBeLessThanOrEqual(5);
  }

  /**
   * Test filtering functionality
   */
  static async testFiltering(
    baseUrl: string,
    filters: Record<string, any>,
    expectedCount: number,
    authToken?: string
  ) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    const response = await request(app)
      .get(baseUrl)
      .query(filters)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.visits.length).toBe(expectedCount);

    return response;
  }

  /**
   * Test sorting functionality
   */
  static async testSorting(
    baseUrl: string,
    sortBy: string,
    sortOrder: 'asc' | 'desc',
    authToken?: string
  ) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    const response = await request(app)
      .get(baseUrl)
      .query({ sortBy, sortOrder })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const visits = response.body.data.visits;
    if (visits.length > 1) {
      // Verify sorting order
      for (let i = 1; i < visits.length; i++) {
        const current = visits[i][sortBy];
        const previous = visits[i - 1][sortBy];

        if (sortOrder === 'asc') {
          expect(current >= previous).toBe(true);
        } else {
          expect(current <= previous).toBe(true);
        }
      }
    }

    return response;
  }

  /**
   * Test search functionality
   */
  static async testSearch(
    baseUrl: string,
    searchQuery: string,
    expectedResults: number,
    authToken?: string
  ) {
    const token = authToken || VisitTestSetup.getAuthToken();
    const app = VisitTestSetup.getApp();

    const response = await request(app)
      .get(baseUrl)
      .query({ q: searchQuery })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.visits.length).toBe(expectedResults);

    return response;
  }

  /**
   * Test authentication requirements
   */
  static async testAuthentication(endpoint: string, method: 'get' | 'post' | 'put' | 'delete' = 'get') {
    const app = VisitTestSetup.getApp();
    let response;

    switch (method) {
      case 'get':
        response = await request(app).get(endpoint);
        break;
      case 'post':
        response = await request(app).post(endpoint).send({});
        break;
      case 'put':
        response = await request(app).put(endpoint).send({});
        break;
      case 'delete':
        response = await request(app).delete(endpoint);
        break;
    }

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Unauthorized');

    return response;
  }

  /**
   * Test authorization with different user roles
   */
  static async testAuthorization(
    endpoint: string,
    method: 'get' | 'post' | 'put' | 'delete' = 'get',
    allowedRoles: string[],
    deniedRoles: string[]
  ) {
    // Test with allowed roles
    for (const role of allowedRoles) {
      const user = await VisitTestSetup.authenticateUser(`${role}_user`, 'password123');
      if (user) {
        const token = user.accessToken;
        const app = VisitTestSetup.getApp();

        let response;
        switch (method) {
          case 'get':
            response = await request(app).get(endpoint).set('Authorization', `Bearer ${token}`);
            break;
          case 'post':
            response = await request(app).post(endpoint).set('Authorization', `Bearer ${token}`).send({});
            break;
          case 'put':
            response = await request(app).put(endpoint).set('Authorization', `Bearer ${token}`).send({});
            break;
          case 'delete':
            response = await request(app).delete(endpoint).set('Authorization', `Bearer ${token}`);
            break;
        }

        expect(response.status).toBeLessThan(400);
      }
    }

    // Test with denied roles
    for (const role of deniedRoles) {
      const user = await VisitTestSetup.authenticateUser(`${role}_user`, 'password123');
      if (user) {
        const token = user.accessToken;
        const app = VisitTestSetup.getApp();

        let response;
        switch (method) {
          case 'get':
            response = await request(app).get(endpoint).set('Authorization', `Bearer ${token}`);
            break;
          case 'post':
            response = await request(app).post(endpoint).set('Authorization', `Bearer ${token}`).send({});
            break;
          case 'put':
            response = await request(app).put(endpoint).set('Authorization', `Bearer ${token}`).send({});
            break;
          case 'delete':
            response = await request(app).delete(endpoint).set('Authorization', `Bearer ${token}`);
            break;
        }

        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    }
  }

  /**
   * Validate visit response structure
   */
  static validateVisitResponse(visit: any, expectedFields: string[] = []) {
    const requiredFields = [
      'id', 'patientId', 'visitType', 'reasonForVisit', 'priority', 'status',
      'createdAt', 'updatedAt', ...expectedFields
    ];

    requiredFields.forEach(field => {
      expect(visit).toHaveProperty(field);
    });

    // Validate data types
    expect(typeof visit.id).toBe('string');
    expect(typeof visit.patientId).toBe('string');
    expect(typeof visit.visitType).toBe('string');
    expect(typeof visit.reasonForVisit).toBe('string');
    expect(typeof visit.priority).toBe('string');
    expect(typeof visit.status).toBe('string');
    expect(new Date(visit.createdAt).toString()).not.toBe('Invalid Date');
    expect(new Date(visit.updatedAt).toString()).not.toBe('Invalid Date');
  }

  /**
   * Validate pagination response structure
   */
  static validatePaginationResponse(response: any) {
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('visits');
    expect(response.body.data).toHaveProperty('pagination');
    expect(response.body.data.pagination).toHaveProperty('page');
    expect(response.body.data.pagination).toHaveProperty('limit');
    expect(response.body.data.pagination).toHaveProperty('total');
    expect(response.body.data.pagination).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.data.visits)).toBe(true);
  }
}