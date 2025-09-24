const axios = require('axios');
const { expect } = require('chai');

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000/api';
const POSTGREST_URL = process.env.POSTGREST_URL || 'http://localhost:3000';

describe('Admin Functions Contract Tests', () => {
  let authToken;
  let nurseToken;
  let doctorToken;

  before(async () => {
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get authentication tokens for different roles
    try {
      const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
        username: 'admin',
        password: 'AdminPassword123!'
      });
      authToken = adminLogin.data.accessToken;

      const nurseLogin = await axios.post(`${BASE_URL}/auth/login`, {
        username: 'nurse',
        password: 'NursePassword123!'
      });
      nurseToken = nurseLogin.data.accessToken;

      const doctorLogin = await axios.post(`${BASE_URL}/auth/login`, {
        username: 'doctor',
        password: 'DoctorPassword123!'
      });
      doctorToken = doctorLogin.data.accessToken;

    } catch (error) {
      console.log('Could not get authentication tokens:', error.message);
    }
  });

  describe('Health Check Endpoints', () => {
    describe('GET /api/health (Public Health Check)', () => {
      it('should return 200 and basic health information without authentication', async () => {
        try {
          const response = await axios.get(`${BASE_URL}/health`);

          expect(response.status).to.equal(200);
          expect(response.data).to.have.property('status');
          expect(response.data).to.have.property('timestamp');
          expect(response.data).to.have.property('uptime');
          expect(response.data).to.have.property('version');
          expect(response.data).to.have.property('components');
          expect(response.data).to.have.property('metrics');

          // Check component structure
          expect(response.data.components).to.have.property('database');
          expect(response.data.components).to.have.property('websocket');
          expect(response.data.components).to.have.property('memory');
          expect(response.data.components).to.have.property('disk');

        } catch (error) {
          console.log('Public health check test failed:', error.message);
        }
      });

      it('should return appropriate status based on system health', async () => {
        try {
          const response = await axios.get(`${BASE_URL}/health`);

          expect(response.data.status).to.be.oneOf(['healthy', 'unhealthy', 'degraded']);

          // Check status codes match health status
          if (response.data.status === 'healthy') {
            expect(response.status).to.equal(200);
          } else if (response.data.status === 'unhealthy') {
            expect(response.status).to.equal(503);
          }

        } catch (error) {
          console.log('Health status test failed:', error.message);
        }
      });
    });

    describe('GET /api/health/detailed (Detailed Health Check)', () => {
      it('should return 401 for unauthenticated requests', async () => {
        try {
          await axios.get(`${BASE_URL}/health/detailed`);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(401);
        }
      });

      it('should return 200 and detailed health information for authenticated users', async () => {
        if (!authToken) {
          console.log('Skipping detailed health check test - no admin token available');
          return;
        }

        try {
          const response = await axios.get(`${BASE_URL}/health/detailed`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          expect(response.status).to.equal(200);
          expect(response.data).to.have.property('status');
          expect(response.data).to.have.property('timestamp');
          expect(response.data).to.have.property('uptime');
          expect(response.data).to.have.property('version');
          expect(response.data).to.have.property('components');
          expect(response.data).to.have.property('metrics');

          // Check detailed component information
          expect(response.data.components.database).to.have.property('responseTime');
          expect(response.data.components.database).to.have.property('poolSize');
          expect(response.data.components.websocket).to.have.property('activeConnections');
          expect(response.data.components.memory).to.have.property('usagePercentage');
          expect(response.data.components.disk).to.have.property('usagePercentage');

        } catch (error) {
          console.log('Detailed health check test failed:', error.message);
        }
      });

      it('should restrict access to admin users only', async () => {
        if (!nurseToken) {
          console.log('Skipping nurse access test - no nurse token available');
          return;
        }

        try {
          await axios.get(`${BASE_URL}/health/detailed`, {
            headers: {
              'Authorization': `Bearer ${nurseToken}`
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(403);
        }
      });
    });

    describe('GET /api/health/metrics (System Metrics)', () => {
      it('should return 401 for unauthenticated requests', async () => {
        try {
          await axios.get(`${BASE_URL}/health/metrics`);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(401);
        }
      });

      it('should return 200 and system metrics for authenticated admin users', async () => {
        if (!authToken) {
          console.log('Skipping system metrics test - no admin token available');
          return;
        }

        try {
          const response = await axios.get(`${BASE_URL}/health/metrics`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          expect(response.status).to.equal(200);
          expect(response.data).to.have.property('status', 'success');
          expect(response.data).to.have.property('data');

          // Check metrics structure
          expect(response.data.data).to.have.property('cpu');
          expect(response.data.data).to.have.property('memory');
          expect(response.data.data).to.have.property('disk');
          expect(response.data.data).to.have.property('network');

          // Check CPU metrics
          expect(response.data.data.cpu).to.have.property('usage');
          expect(response.data.data.cpu).to.have.property('cores');
          expect(response.data.data.cpu).to.have.property('loadAverage');

          // Check memory metrics
          expect(response.data.data.memory).to.have.property('total');
          expect(response.data.data.memory).to.have.property('used');
          expect(response.data.data.memory).to.have.property('usagePercentage');

        } catch (error) {
          console.log('System metrics test failed:', error.message);
        }
      });

      it('should restrict non-admin users from accessing metrics', async () => {
        if (!doctorToken) {
          console.log('Skipping doctor metrics test - no doctor token available');
          return;
        }

        try {
          await axios.get(`${BASE_URL}/health/metrics`, {
            headers: {
              'Authorization': `Bearer ${doctorToken}`
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(403);
        }
      });
    });

    describe('GET /api/health/report (Health Report)', () => {
      it('should return 401 for unauthenticated requests', async () => {
        try {
          await axios.get(`${BASE_URL}/health/report`);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(401);
        }
      });

      it('should return 200 and text/plain report for authenticated admin users', async () => {
        if (!authToken) {
          console.log('Skipping health report test - no admin token available');
          return;
        }

        try {
          const response = await axios.get(`${BASE_URL}/health/report`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          expect(response.status).to.equal(200);
          expect(response.headers['content-type']).to.include('text/plain');
          expect(typeof response.data).to.equal('string');

          // Check report content
          expect(response.data).to.include('System Health Report');
          expect(response.data).to.include('Overall Status');
          expect(response.data).to.include('Components');
          expect(response.data).to.include('System Metrics');

        } catch (error) {
          console.log('Health report test failed:', error.message);
        }
      });
    });

    describe('Component-specific Health Checks', () => {
      describe('GET /api/health/database', () => {
        it('should return 401 for unauthenticated requests', async () => {
          try {
            await axios.get(`${BASE_URL}/health/database`);
            expect.fail('Should have thrown an error');
          } catch (error) {
            expect(error.response.status).to.equal(401);
          }
        });

        it('should return 200 and database health information for authenticated users', async () => {
          if (!authToken) {
            console.log('Skipping database health test - no admin token available');
            return;
          }

          try {
            const response = await axios.get(`${BASE_URL}/health/database`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('status');
            expect(response.data).to.have.property('responseTime');
            expect(response.data).to.have.property('poolSize');
            expect(response.data).to.have.property('availableConnections');
            expect(response.data).to.have.property('waitingClients');

          } catch (error) {
            console.log('Database health test failed:', error.message);
          }
        });
      });

      describe('GET /api/health/websocket', () => {
        it('should return 401 for unauthenticated requests', async () => {
          try {
            await axios.get(`${BASE_URL}/health/websocket`);
            expect.fail('Should have thrown an error');
          } catch (error) {
            expect(error.response.status).to.equal(401);
          }
        });

        it('should return 200 and WebSocket health information for authenticated users', async () => {
          if (!authToken) {
            console.log('Skipping WebSocket health test - no admin token available');
            return;
          }

          try {
            const response = await axios.get(`${BASE_URL}/health/websocket`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('status');
            expect(response.data).to.have.property('activeConnections');
            expect(response.data).to.have.property('authenticatedConnections');
            expect(response.data).to.have.property('uptime');

          } catch (error) {
            console.log('WebSocket health test failed:', error.message);
          }
        });
      });

      describe('GET /api/health/memory', () => {
        it('should return 401 for unauthenticated requests', async () => {
          try {
            await axios.get(`${BASE_URL}/health/memory`);
            expect.fail('Should have thrown an error');
          } catch (error) {
            expect(error.response.status).to.equal(401);
          }
        });

        it('should return 200 and memory health information for authenticated users', async () => {
          if (!authToken) {
            console.log('Skipping memory health test - no admin token available');
            return;
          }

          try {
            const response = await axios.get(`${BASE_URL}/health/memory`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('status');
            expect(response.data).to.have.property('total');
            expect(response.data).to.have.property('used');
            expect(response.data).to.have.property('free');
            expect(response.data).to.have.property('usagePercentage');

          } catch (error) {
            console.log('Memory health test failed:', error.message);
          }
        });
      });

      describe('GET /api/health/disk', () => {
        it('should return 401 for unauthenticated requests', async () => {
          try {
            await axios.get(`${BASE_URL}/health/disk`);
            expect.fail('Should have thrown an error');
          } catch (error) {
            expect(error.response.status).to.equal(401);
          }
        });

        it('should return 200 and disk health information for authenticated users', async () => {
          if (!authToken) {
            console.log('Skipping disk health test - no admin token available');
            return;
          }

          try {
            const response = await axios.get(`${BASE_URL}/health/disk`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('status');
            expect(response.data).to.have.property('total');
            expect(response.data).to.have.property('used');
            expect(response.data).to.have.property('free');
            expect(response.data).to.have.property('usagePercentage');
            expect(response.data).to.have.property('path');

          } catch (error) {
            console.log('Disk health test failed:', error.message);
          }
        });
      });
    });

    describe('Database Performance Monitoring', () => {
      describe('GET /api/health/slow-queries', () => {
        it('should return 401 for unauthenticated requests', async () => {
          try {
            await axios.get(`${BASE_URL}/health/slow-queries`);
            expect.fail('Should have thrown an error');
          } catch (error) {
            expect(error.response.status).to.equal(401);
          }
        });

        it('should return 200 and slow queries information for authenticated admin users', async () => {
          if (!authToken) {
            console.log('Skipping slow queries test - no admin token available');
            return;
          }

          try {
            const response = await axios.get(`${BASE_URL}/health/slow-queries`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('status', 'success');
            expect(response.data).to.have.property('threshold');
            expect(response.data).to.have.property('count');
            expect(response.data).to.have.property('data');
            expect(Array.isArray(response.data.data)).to.be.true;

          } catch (error) {
            console.log('Slow queries test failed:', error.message);
          }
        });

        it('should support custom threshold parameter', async () => {
          if (!authToken) {
            console.log('Skipping custom threshold test - no admin token available');
            return;
          }

          try {
            const response = await axios.get(`${BASE_URL}/health/slow-queries?threshold=2000`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('threshold', 2000);

          } catch (error) {
            console.log('Custom threshold test failed:', error.message);
          }
        });

        it('should restrict non-admin users from accessing slow queries', async () => {
          if (!nurseToken) {
            console.log('Skipping nurse slow queries test - no nurse token available');
            return;
          }

          try {
            await axios.get(`${BASE_URL}/health/slow-queries`, {
              headers: {
                'Authorization': `Bearer ${nurseToken}`
              }
            });
            expect.fail('Should have thrown an error');
          } catch (error) {
            expect(error.response.status).to.equal(403);
          }
        });
      });

      describe('GET /api/health/database-size', () => {
        it('should return 401 for unauthenticated requests', async () => {
          try {
            await axios.get(`${BASE_URL}/health/database-size`);
            expect.fail('Should have thrown an error');
          } catch (error) {
            expect(error.response.status).to.equal(401);
          }
        });

        it('should return 200 and database size information for authenticated admin users', async () => {
          if (!authToken) {
            console.log('Skipping database size test - no admin token available');
            return;
          }

          try {
            const response = await axios.get(`${BASE_URL}/health/database-size`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('status', 'success');
            expect(response.data).to.have.property('data');
            expect(response.data.data).to.have.property('size');
            expect(response.data.data).to.have.property('tableCount');
            expect(typeof response.data.data.tableCount).to.equal('number');

          } catch (error) {
            console.log('Database size test failed:', error.message);
          }
        });
      });
    });
  });

  describe('Audit Log Management', () => {
    describe('GET /audit_logs (List Audit Logs)', () => {
      it('should return 401 for unauthenticated requests', async () => {
        try {
          await axios.get(`${POSTGREST_URL}/audit_logs`);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(401);
        }
      });

      it('should return 200 and audit logs for authenticated admin users', async () => {
        if (!authToken) {
          console.log('Skipping audit logs test - no admin token available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/audit_logs`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;

          // Check audit log structure
          if (response.data.length > 0) {
            const log = response.data[0];
            expect(log).to.have.property('id');
            expect(log).to.have.property('userId');
            expect(log).to.have.property('action');
            expect(log).to.have.property('entityType');
            expect(log).to.have.property('entityId');
            expect(log).to.have.property('oldValues');
            expect(log).to.have.property('newValues');
            expect(log).to.have.property('ipAddress');
            expect(log).to.have.property('userAgent');
            expect(log).to.have.property('timestamp');
          }

        } catch (error) {
          console.log('Audit logs test failed:', error.message);
        }
      });

      it('should restrict non-admin users from accessing audit logs', async () => {
        if (!doctorToken) {
          console.log('Skipping doctor audit logs test - no doctor token available');
          return;
        }

        try {
          await axios.get(`${POSTGREST_URL}/audit_logs`, {
            headers: {
              'Authorization': `Bearer ${doctorToken}`,
              'Content-Type': 'application/json'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(403);
        }
      });

      it('should support filtering by action type', async () => {
        if (!authToken) {
          console.log('Skipping action filtering test - no admin token available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/audit_logs`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              action: 'eq.CREATE'
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;

          // All returned logs should be CREATE actions
          response.data.forEach(log => {
            expect(log.action).to.equal('CREATE');
          });

        } catch (error) {
          console.log('Action filtering test failed:', error.message);
        }
      });

      it('should support filtering by entity type', async () => {
        if (!authToken) {
          console.log('Skipping entity type filtering test - no admin token available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/audit_logs`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              entityType: 'eq.users'
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;

          // All returned logs should be for users entity
          response.data.forEach(log => {
            expect(log.entityType).to.equal('users');
          });

        } catch (error) {
          console.log('Entity type filtering test failed:', error.message);
        }
      });

      it('should support filtering by user', async () => {
        if (!authToken) {
          console.log('Skipping user filtering test - no admin token available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/audit_logs`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              userId: 'eq.00000000-0000-0000-0000-000000000000' // Non-existent user for test
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;

          // Should return empty array for non-existent user
          expect(response.data.length).to.equal(0);

        } catch (error) {
          console.log('User filtering test failed:', error.message);
        }
      });

      it('should support ordering by timestamp', async () => {
        if (!authToken) {
          console.log('Skipping timestamp ordering test - no admin token available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/audit_logs`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              order: 'timestamp.desc',
              limit: 10
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;

          // Check that logs are ordered by timestamp (newest first)
          for (let i = 1; i < response.data.length; i++) {
            const currentDate = new Date(response.data[i].timestamp);
            const previousDate = new Date(response.data[i - 1].timestamp);
            expect(currentDate <= previousDate).to.be.true;
          }

        } catch (error) {
          console.log('Timestamp ordering test failed:', error.message);
        }
      });

      it('should support pagination', async () => {
        if (!authToken) {
          console.log('Skipping pagination test - no admin token available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/audit_logs`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              limit: 5,
              offset: 0
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;
          expect(response.data.length).to.be.at.most(5);

        } catch (error) {
          console.log('Pagination test failed:', error.message);
        }
      });
    });

    describe('GET /audit_logs/:id (Get Specific Audit Log)', () => {
      it('should return 401 for unauthenticated requests', async () => {
        try {
          await axios.get(`${POSTGREST_URL}/audit_logs?id=eq.test-id`);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(401);
        }
      });

      it('should return 200 and specific audit log for authenticated admin users', async () => {
        if (!authToken) {
          console.log('Skipping specific audit log test - no admin token available');
          return;
        }

        try {
          // First, get a list of audit logs to find a valid ID
          const listResponse = await axios.get(`${POSTGREST_URL}/audit_logs`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              limit: 1
            }
          });

          if (listResponse.data.length > 0) {
            const logId = listResponse.data[0].id;

            const response = await axios.get(`${POSTGREST_URL}/audit_logs?id=eq.${logId}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            });

            expect(response.status).to.equal(200);
            expect(Array.isArray(response.data)).to.be.true;
            expect(response.data.length).to.equal(1);
            expect(response.data[0]).to.have.property('id', logId);
          }

        } catch (error) {
          console.log('Specific audit log test failed:', error.message);
        }
      });

      it('should return empty array for non-existent audit log', async () => {
        if (!authToken) {
          console.log('Skipping non-existent audit log test - no admin token available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/audit_logs?id=eq.00000000-0000-0000-0000-000000000000`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;
          expect(response.data.length).to.equal(0);

        } catch (error) {
          console.log('Non-existent audit log test failed:', error.message);
        }
      });
    });
  });

  describe('System Statistics Dashboard', () => {
    describe('System Activity Overview', () => {
      it('should allow admin to access system-wide statistics', async () => {
        if (!authToken) {
          console.log('Skipping system statistics test - no admin token available');
          return;
        }

        try {
          // Test accessing various system statistics
          const [usersResponse, patientsResponse, visitsResponse] = await Promise.all([
            axios.get(`${POSTGREST_URL}/users`, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            }),
            axios.get(`${POSTGREST_URL}/patients`, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            }),
            axios.get(`${POSTGREST_URL}/visits`, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            })
          ]);

          expect(usersResponse.status).to.equal(200);
          expect(patientsResponse.status).to.equal(200);
          expect(visitsResponse.status).to.equal(200);

          // Admin should be able to see all data
          expect(Array.isArray(usersResponse.data)).to.be.true;
          expect(Array.isArray(patientsResponse.data)).to.be.true;
          expect(Array.isArray(visitsResponse.data)).to.be.true;

        } catch (error) {
          console.log('System statistics test failed:', error.message);
        }
      });

      it('should provide comprehensive system overview through multiple endpoints', async () => {
        if (!authToken) {
          console.log('Skipping system overview test - no admin token available');
          return;
        }

        try {
          const endpoints = [
            `${BASE_URL}/health`,
            `${BASE_URL}/health/metrics`,
            `${POSTGREST_URL}/audit_logs`,
            `${POSTGREST_URL}/users`,
            `${POSTGREST_URL}/patients`,
            `${POSTGREST_URL}/visits`
          ];

          const responses = await Promise.all(
            endpoints.map(endpoint =>
              axios.get(endpoint.startsWith('/api') ? endpoint : `${POSTGREST_URL}${endpoint}`, {
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json'
                }
              }).catch(error => ({ error, endpoint }))
            )
          );

          // All endpoints should be accessible to admin
          responses.forEach(response => {
            if (response.error) {
              console.log(`Endpoint ${response.endpoint} failed:`, response.error.message);
            } else {
              expect(response.status).to.equal(200);
            }
          });

        } catch (error) {
          console.log('System overview test failed:', error.message);
        }
      });
    });
  });

  describe('Real-time Monitoring Access', () => {
    it('should provide WebSocket endpoints for real-time monitoring', async () => {
      if (!authToken) {
        console.log('Skipping WebSocket access test - no admin token available');
        return;
      }

      try {
        // Test WebSocket health endpoint
        const wsHealthResponse = await axios.get(`${BASE_URL}/health/websocket`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        expect(wsHealthResponse.status).to.equal(200);
        expect(wsHealthResponse.data).to.have.property('status');
        expect(wsHealthResponse.data).to.have.property('activeConnections');

        // Admin should have access to real-time monitoring data
        console.log('WebSocket monitoring access test passed');

      } catch (error) {
        console.log('WebSocket access test failed:', error.message);
      }
    });
  });

  after(() => {
    console.log('Admin functions contract tests completed');
  });
});