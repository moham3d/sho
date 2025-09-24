import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { TestSetup } from './setup';
import { TestUtils } from './utils';
import { TEST_ADMIN_USERS, SAMPLE_USAGE_REPORT, SAMPLE_COMPLIANCE_REPORT } from './fixtures';
import { UsageReport, ComplianceReport } from './types';

describe('Admin Reports and Analytics Contract Tests', () => {
  let app: any;
  let auditAdminToken: string;
  let systemAdminToken: string;
  let superAdminToken: string;

  beforeEach(() => {
    app = TestSetup.getApp();
  });

  describe('Usage Reports', () => {
    beforeEach(async () => {
      auditAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.AUDIT_ADMIN.id,
        TEST_ADMIN_USERS.AUDIT_ADMIN.username,
        TEST_ADMIN_USERS.AUDIT_ADMIN.role,
        TEST_ADMIN_USERS.AUDIT_ADMIN.permissions
      );
    });

    it('should generate daily usage report', async () => {
      const response = await request(app)
        .get('/api/admin/reports/usage?type=daily')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        type: 'daily'
      });

      const report = response.body.data;
      validateUsageReport(report);
    });

    it('should generate weekly usage report', async () => {
      const response = await request(app)
        .get('/api/admin/reports/usage?type=weekly')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.data.type).toBe('weekly');
      validateUsageReport(response.body.data);
    });

    it('should generate monthly usage report', async () => {
      const response = await request(app)
        .get('/api/admin/reports/usage?type=monthly')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.data.type).toBe('monthly');
      validateUsageReport(response.body.data);
    });

    it('should support custom date ranges', async () => {
      const startDate = new Date(Date.now() - 604800000).toISOString(); // 7 days ago
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/admin/reports/usage?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      const report = response.body.data;
      expect(new Date(report.period.start).toISOString()).toBe(startDate);
      expect(new Date(report.period.end).toISOString()).toBe(endDate);
      validateUsageReport(report);
    });

    it('should support different report formats', async () => {
      const formats = ['json', 'csv', 'pdf', 'xlsx'];

      for (const format of formats) {
        const response = await request(app)
          .get(`/api/admin/reports/usage?type=daily&format=${format}`)
          .set('Authorization', `Bearer ${auditAdminToken}`)
          .expect(200);

        if (format === 'json') {
          expect(response.headers['content-type']).toContain('application/json');
        } else if (format === 'csv') {
          expect(response.headers['content-type']).toContain('text/csv');
        } else if (format === 'pdf') {
          expect(response.headers['content-type']).toContain('application/pdf');
        } else if (format === 'xlsx') {
          expect(response.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        }
      }
    });

    it('should include detailed user activity breakdown', async () => {
      const response = await request(app)
        .get('/api/admin/reports/usage?type=daily&includeBreakdown=true')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      const report = response.body.data;
      expect(report.breakdown).toBeDefined();
      expect(report.breakdown.byRole).toBeDefined();
      expect(report.breakdown.byDepartment).toBeDefined();
      expect(report.breakdown.byDate).toBeDefined();

      // Validate role breakdown
      report.breakdown.byRole.forEach((role: any) => {
        expect(role).toHaveProperty('role');
        expect(role).toHaveProperty('count');
        expect(role).toHaveProperty('activeUsers');
        expect(typeof role.count).toBe('number');
        expect(typeof role.activeUsers).toBe('number');
      });

      // Validate department breakdown
      report.breakdown.byDepartment.forEach((dept: any) => {
        expect(dept).toHaveProperty('department');
        expect(dept).toHaveProperty('patients');
        expect(dept).toHaveProperty('visits');
        expect(typeof dept.patients).toBe('number');
        expect(typeof dept.visits).toBe('number');
      });

      // Validate date breakdown
      report.breakdown.byDate.forEach((date: any) => {
        expect(date).toHaveProperty('date');
        expect(date).toHaveProperty('users');
        expect(date).toHaveProperty('patients');
        expect(date).toHaveProperty('visits');
        expect(date).toHaveProperty('forms');
      });
    });

    it('should support usage report scheduling', async () => {
      const scheduleRequest = {
        type: 'weekly',
        frequency: 'weekly',
        dayOfWeek: 1, // Monday
        time: '09:00',
        format: 'pdf',
        recipients: ['admin@example.com', 'manager@example.com']
      };

      const response = await request(app)
        .post('/api/admin/reports/usage/schedule')
        .send(scheduleRequest)
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        type: 'weekly',
        frequency: 'weekly',
        format: 'pdf'
      });
    });

    it('should require report generation permissions', async () => {
      const limitedAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.LIMITED_ADMIN.id,
        TEST_ADMIN_USERS.LIMITED_ADMIN.username,
        TEST_ADMIN_USERS.LIMITED_ADMIN.role,
        TEST_ADMIN_USERS.LIMITED_ADMIN.permissions
      );

      await request(app)
        .get('/api/admin/reports/usage?type=daily')
        .set('Authorization', `Bearer ${limitedAdminToken}`)
        .expect(403);
    });

    it('should handle large date ranges efficiently', async () => {
      const startDate = new Date(Date.now() - 2592000000).toISOString(); // 30 days ago
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/admin/reports/usage?startDate=${startDate}&endDate=${endDate}&type=daily`)
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.data.breakdown.byDate.length).toBeLessThanOrEqual(31); // Max 31 days
    });
  });

  describe('Compliance Reports', () => {
    beforeEach(async () => {
      auditAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.AUDIT_ADMIN.id,
        TEST_ADMIN_USERS.AUDIT_ADMIN.username,
        TEST_ADMIN_USERS.AUDIT_ADMIN.role,
        TEST_ADMIN_USERS.AUDIT_ADMIN.permissions
      );
    });

    it('should generate HIPAA compliance report', async () => {
      const response = await request(app)
        .get('/api/admin/reports/compliance?type=HIPAA')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        type: 'HIPAA'
      });

      const report = response.body.data;
      validateComplianceReport(report);
    });

    it('should generate GDPR compliance report', async () => {
      const response = await request(app)
        .get('/api/admin/reports/compliance?type=GDPR')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.data.type).toBe('GDPR');
      validateComplianceReport(response.body.data);
    });

    it('should generate data retention compliance report', async () => {
      const response = await request(app)
        .get('/api/admin/reports/compliance?type=DATA_RETENTION')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.data.type).toBe('DATA_RETENTION');
      validateComplianceReport(response.body.data);
    });

    it('should generate security compliance report', async () => {
      const response = await request(app)
        .get('/api/admin/reports/compliance?type=SECURITY')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.data.type).toBe('SECURITY');
      validateComplianceReport(response.body.data);
    });

    it('should include detailed compliance findings', async () => {
      const response = await request(app)
        .get('/api/admin/reports/compliance?type=HIPAA&includeFindings=true')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      const report = response.body.data;
      expect(report.findings).toBeDefined();
      expect(Array.isArray(report.findings)).toBe(true);
      expect(report.findings.length).toBeGreaterThan(0);

      report.findings.forEach((finding: any) => {
        expect(finding).toHaveProperty('checkId');
        expect(finding).toHaveProperty('category');
        expect(finding).toHaveProperty('description');
        expect(finding).toHaveProperty('status');
        expect(finding).toHaveProperty('severity');
        expect(['PASS', 'FAIL', 'WARNING']).toContain(finding.status);
        expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(finding.severity);
      });
    });

    it('should categorize findings by severity', async () => {
      const response = await request(app)
        .get('/api/admin/reports/compliance?type=HIPAA')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      const report = response.body.data;
      expect(report.summary).toHaveProperty('totalChecks');
      expect(report.summary).toHaveProperty('passedChecks');
      expect(report.summary).toHaveProperty('failedChecks');
      expect(report.summary).toHaveProperty('warningChecks');
      expect(report.summary).toHaveProperty('score');

      expect(report.summary.totalChecks).toBeGreaterThan(0);
      expect(report.summary.score).toBeGreaterThanOrEqual(0);
      expect(report.summary.score).toBeLessThanOrEqual(100);
    });

    it('should support custom compliance frameworks', async () => {
      const customFramework = {
        name: 'CUSTOM_FRAMEWORK',
        checks: [
          {
            id: 'CUSTOM_001',
            category: 'Custom Security',
            description: 'Custom security check',
            severity: 'HIGH'
          }
        ]
      };

      const response = await request(app)
        .post('/api/admin/reports/compliance/custom')
        .send(customFramework)
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('CUSTOM_FRAMEWORK');
    });

    it('should provide remediation recommendations', async () => {
      const response = await request(app)
        .get('/api/admin/reports/compliance?type=HIPAA&includeRecommendations=true')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      const report = response.body.data;
      const failedFindings = report.findings.filter((f: any) => f.status === 'FAIL');

      failedFindings.forEach((finding: any) => {
        if (finding.severity === 'HIGH' || finding.severity === 'CRITICAL') {
          expect(finding.recommendation).toBeDefined();
          expect(typeof finding.recommendation).toBe('string');
          expect(finding.recommendation.length).toBeGreaterThan(0);
        }
      });
    });

    it('should track compliance trends over time', async () => {
      const response = await request(app)
        .get('/api/admin/reports/compliance?type=HIPAA&includeTrends=true')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      const report = response.body.data;
      expect(report.trends).toBeDefined();
      expect(Array.isArray(report.trends)).toBe(true);

      if (report.trends.length > 0) {
        const trend = report.trends[0];
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('score');
        expect(trend).toHaveProperty('passedChecks');
        expect(trend).toHaveProperty('failedChecks');
      }
    });
  });

  describe('Analytics and Dashboards', () => {
    beforeEach(async () => {
      systemAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SYSTEM_ADMIN.id,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.username,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.role,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.permissions
      );
    });

    it('should provide system performance analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/performance')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('metrics');
      expect(response.body.data).toHaveProperty('trends');
      expect(response.body.data).toHaveProperty('insights');

      const metrics = response.body.data.metrics;
      expect(metrics).toHaveProperty('responseTime');
      expect(metrics).toHaveProperty('throughput');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('availability');
    });

    it('should provide user activity analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/user-activity')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('activeUsers');
      expect(response.body.data).toHaveProperty('sessionDuration');
      expect(response.body.data).toHaveProperty('loginFrequency');
      expect(response.body.data).toHaveProperty('featureUsage');
    });

    it('should provide data growth analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/data-growth')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('storageUsage');
      expect(response.body.data).toHaveProperty('growthRate');
      expect(response.body.data).toHaveProperty('predictions');
      expect(response.body.data).toHaveProperty('byEntity');
    });

    it('should provide real-time dashboard data', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('quickStats');
      expect(response.body.data).toHaveProperty('charts');
    });

    it('should support custom analytics queries', async () => {
      const query = {
        metrics: ['user_count', 'patient_count', 'visit_count'],
        timeRange: '7d',
        groupBy: 'day',
        aggregations: ['sum', 'avg', 'max']
      };

      const response = await request(app)
        .post('/api/admin/analytics/custom')
        .send(query)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('query');
      expect(response.body.data).toHaveProperty('executionTime');
    });

    it('should provide data export capabilities', async () => {
      const exportRequest = {
        type: 'analytics',
        format: 'csv',
        timeRange: '30d',
        metrics: ['user_activity', 'system_performance'],
        includeHeaders: true
      };

      const response = await request(app)
        .post('/api/admin/analytics/export')
        .send(exportRequest)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });
  });

  describe('Alerts and Notifications', () => {
    beforeEach(async () => {
      superAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SUPER_ADMIN.id,
        TEST_ADMIN_USERS.SUPER_ADMIN.username,
        TEST_ADMIN_USERS.SUPER_ADMIN.role,
        TEST_ADMIN_USERS.SUPER_ADMIN.permissions
      );
    });

    it('should provide system alerts', async () => {
      const response = await request(app)
        .get('/api/admin/alerts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('alerts');
      expect(Array.isArray(response.body.data.alerts)).toBe(true);

      if (response.body.data.alerts.length > 0) {
        const alert = response.body.data.alerts[0];
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('timestamp');
        expect(alert).toHaveProperty('status');
      }
    });

    it('should support alert filtering by severity', async () => {
      const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

      for (const severity of severities) {
        const response = await request(app)
          .get(`/api/admin/alerts?severity=${severity}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200);

        expect(response.body.data.alerts.every((alert: any) => alert.severity === severity)).toBe(true);
      }
    });

    it('should support alert filtering by status', async () => {
      const statuses = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'];

      for (const status of statuses) {
        const response = await request(app)
          .get(`/api/admin/alerts?status=${status}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200);

        expect(response.body.data.alerts.every((alert: any) => alert.status === status)).toBe(true);
      }
    });

    it('should allow alert acknowledgment', async () => {
      const acknowledgeRequest = {
        alertId: 'test_alert_id',
        action: 'ACKNOWLEDGE',
        comment: 'Investigating the issue'
      };

      const response = await request(app)
        .post('/api/admin/alerts/acknowledge')
        .send(acknowledgeRequest)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ACKNOWLEDGED');
    });

    it('should support alert configuration', async () => {
      const configRequest = {
        alertType: 'SYSTEM_PERFORMANCE',
        enabled: true,
        thresholds: {
          cpuUsage: 80,
          memoryUsage: 85,
          diskUsage: 90
        },
        notificationChannels: ['email', 'sms'],
        escalationRules: [
          {
            condition: 'HIGH_SEVERITY',
            delay: 300, // 5 minutes
            notify: ['super_admin', 'system_admin']
          }
        ]
      };

      const response = await request(app)
        .put('/api/admin/alerts/configuration')
        .send(configRequest)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enabled).toBe(true);
    });
  });

  describe('Report Scheduling and Automation', () => {
    beforeEach(async () => {
      auditAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.AUDIT_ADMIN.id,
        TEST_ADMIN_USERS.AUDIT_ADMIN.username,
        TEST_ADMIN_USERS.AUDIT_ADMIN.role,
        TEST_ADMIN_USERS.AUDIT_ADMIN.permissions
      );
    });

    it('should list scheduled reports', async () => {
      const response = await request(app)
        .get('/api/admin/reports/scheduled')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('schedules');
      expect(Array.isArray(response.body.data.schedules)).toBe(true);
    });

    it('should create new report schedule', async () => {
      const scheduleRequest = {
        name: 'Weekly Usage Report',
        type: 'usage',
        subtype: 'weekly',
        frequency: 'weekly',
        schedule: {
          dayOfWeek: 1, // Monday
          time: '09:00'
        },
        format: 'pdf',
        recipients: ['admin@example.com'],
        enabled: true
      };

      const response = await request(app)
        .post('/api/admin/reports/schedule')
        .send(scheduleRequest)
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Weekly Usage Report',
        type: 'usage',
        enabled: true
      });
    });

    it('should update existing report schedule', async () => {
      const updateRequest = {
        scheduleId: 'schedule_123',
        updates: {
          enabled: false,
          recipients: ['new_admin@example.com'],
          format: 'xlsx'
        }
      };

      const response = await request(app)
        .put('/api/admin/reports/schedule')
        .send(updateRequest)
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enabled).toBe(false);
    });

    it('should delete report schedule', async () => {
      const response = await request(app)
        .delete('/api/admin/reports/schedule/schedule_123')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should test report delivery', async () => {
      const testRequest = {
        scheduleId: 'schedule_123',
        testMode: true
      };

      const response = await request(app)
        .post('/api/admin/reports/schedule/test')
        .send(testRequest)
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.testResults).toBeDefined();
    });
  });

  describe('Cross-cutting Concerns', () => {
    beforeEach(async () => {
      auditAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.AUDIT_ADMIN.id,
        TEST_ADMIN_USERS.AUDIT_ADMIN.username,
        TEST_ADMIN_USERS.AUDIT_ADMIN.role,
        TEST_ADMIN_USERS.AUDIT_ADMIN.permissions
      );
    });

    it('should log all report generation activities', async () => {
      // Generate a report
      await request(app)
        .get('/api/admin/reports/usage?type=daily')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      // Check audit logs
      const auditResponse = await request(app)
        .get('/api/admin/audit-logs?action=REPORT_GENERATE')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(auditResponse.body.data.length).toBeGreaterThan(0);
    });

    it('should handle large report datasets efficiently', async () => {
      const startDate = new Date(Date.now() - 2592000000).toISOString(); // 30 days ago
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/admin/reports/usage?startDate=${startDate}&endDate=${endDate}&type=daily`)
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      expect(response.body.data.breakdown.byDate.length).toBeLessThanOrEqual(31);
    });

    it('should cache frequently accessed reports', async () => {
      // First request
      const firstResponse = await request(app)
        .get('/api/admin/reports/usage?type=daily')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      // Second request (should be faster due to caching)
      const secondResponse = await request(app)
        .get('/api/admin/reports/usage?type=daily')
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(200);

      // Both should return the same data
      expect(firstResponse.body.data.summary.totalUsers).toBe(secondResponse.body.data.summary.totalUsers);
    });

    it('should validate report parameters', async () => {
      const invalidRequests = [
        '/api/admin/reports/usage?type=invalid_type',
        '/api/admin/reports/usage?startDate=invalid_date',
        '/api/admin/reports/compliance?type=invalid_type',
        '/api/admin/reports/compliance?startDate=invalid_date'
      ];

      for (const url of invalidRequests) {
        await request(app)
          .get(url)
          .set('Authorization', `Bearer ${auditAdminToken}`)
          .expect(400);
      }
    });
  });
});

// Helper functions for validation
function validateUsageReport(report: UsageReport) {
  expect(report).toHaveProperty('id');
  expect(report).toHaveProperty('type');
  expect(report).toHaveProperty('period');
  expect(report).toHaveProperty('summary');
  expect(report).toHaveProperty('generatedAt');

  expect(report.period).toHaveProperty('start');
  expect(report.period).toHaveProperty('end');

  expect(report.summary).toHaveProperty('totalUsers');
  expect(report.summary).toHaveProperty('activeUsers');
  expect(report.summary).toHaveProperty('totalPatients');
  expect(report.summary).toHaveProperty('totalVisits');
  expect(report.summary).toHaveProperty('totalForms');
  expect(report.summary).toHaveProperty('totalStorageUsed');

  expect(typeof report.summary.totalUsers).toBe('number');
  expect(typeof report.summary.activeUsers).toBe('number');
  expect(typeof report.summary.totalPatients).toBe('number');
  expect(typeof report.summary.totalVisits).toBe('number');
  expect(typeof report.summary.totalForms).toBe('number');
  expect(typeof report.summary.totalStorageUsed).toBe('number');

  expect(new Date(report.generatedAt)).toBeInstanceOf(Date);
}

function validateComplianceReport(report: ComplianceReport) {
  expect(report).toHaveProperty('id');
  expect(report).toHaveProperty('type');
  expect(report).toHaveProperty('period');
  expect(report).toHaveProperty('status');
  expect(report).toHaveProperty('summary');
  expect(report).toHaveProperty('findings');
  expect(report).toHaveProperty('generatedAt');

  expect(report.period).toHaveProperty('start');
  expect(report.period).toHaveProperty('end');

  expect(report.summary).toHaveProperty('totalChecks');
  expect(report.summary).toHaveProperty('passedChecks');
  expect(report.summary).toHaveProperty('failedChecks');
  expect(report.summary).toHaveProperty('warningChecks');
  expect(report.summary).toHaveProperty('score');

  expect(typeof report.summary.totalChecks).toBe('number');
  expect(typeof report.summary.passedChecks).toBe('number');
  expect(typeof report.summary.failedChecks).toBe('number');
  expect(typeof report.summary.warningChecks).toBe('number');
  expect(typeof report.summary.score).toBe('number');

  expect(report.summary.score).toBeGreaterThanOrEqual(0);
  expect(report.summary.score).toBeLessThanOrEqual(100);

  expect(Array.isArray(report.findings)).toBe(true);

  report.findings.forEach((finding: any) => {
    expect(finding).toHaveProperty('checkId');
    expect(finding).toHaveProperty('category');
    expect(finding).toHaveProperty('description');
    expect(finding).toHaveProperty('status');
    expect(finding).toHaveProperty('severity');
    expect(['PASS', 'FAIL', 'WARNING']).toContain(finding.status);
    expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(finding.severity);
  });

  expect(new Date(report.generatedAt)).toBeInstanceOf(Date);
}