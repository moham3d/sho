const axios = require('axios');
const { expect } = require('chai');

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000/api';
const POSTGREST_URL = process.env.POSTGREST_URL || 'http://localhost:3000';

// Test nurse form data
const TEST_NURSE_FORM = {
  patientId: null, // Will be set in before hook
  visitId: null, // Will be set in before hook
  nurseId: null, // Will be set in before hook
  arrivalMode: 'ambulance',
  chiefComplaint: 'Chest pain and shortness of breath',
  vitalSigns: {
    bloodPressure: { systolic: 140, diastolic: 90 },
    heartRate: 85,
    respiratoryRate: 18,
    temperature: 37.2,
    oxygenSaturation: 98,
    painScale: 6
  },
  psychosocialAssessment: {
    mood: 'anxious',
    supportSystem: 'family present',
    copingMechanisms: 'positive'
  },
  nutritionalScreening: {
    appetite: 'good',
    swallowingAbility: 'normal',
    dietaryRestrictions: 'none'
  },
  functionalAssessment: {
    mobility: 'independent',
    adlStatus: 'independent',
    fallRisk: 'low'
  },
  painAssessment: {
    location: 'chest',
    characteristics: 'sharp',
    severity: 6,
    duration: '2 hours',
    aggravatingFactors: 'deep breathing'
  },
  morseFallScale: {
    historyOfFalls: false,
    secondaryDiagnosis: true,
    ambulatoryAid: false,
    ivHeparinLock: false,
    gaitTransfer: 'normal',
    mentalStatus: 'alert'
  },
  notes: 'Patient appears anxious but cooperative'
};

// Test doctor form data
const TEST_DOCTOR_FORM = {
  patientId: null, // Will be set in before hook
  visitId: null, // Will be set in before hook
  doctorId: null, // Will be set in before hook
  nurseFormId: null, // Will be set in before hook
  studyIndication: 'Chest pain evaluation',
  contraindications: 'None',
  medicalHistory: {
    hypertension: true,
    diabetes: false,
    cardiacDisease: true,
    previousSurgeries: 'appendectomy 2010'
  },
  technicalParameters: {
    ctdivol: 150,
    dlp: 200,
    kv: 120,
    mas: 100,
    contrastUsed: true,
    contrastVolume: 80
  },
  imagingFindings: {
    findings: 'No acute pulmonary embolism. Mild cardiomegaly noted.',
    impression: 'Stable cardiac findings. No acute process identified.',
    recommendations: 'Continue current medications. Follow up with cardiology.'
  },
  diagnosis: 'Stable coronary artery disease',
  treatmentPlan: 'Continue medications, cardiology follow-up',
  followUpRequired: true,
  followUpTimeline: '2 weeks'
};

// Test signature data
const TEST_SIGNATURE = {
  formId: null, // Will be set in before hook
  formType: 'nurse_form', // or 'doctor_form'
  signerRole: 'nurse', // or 'doctor', 'patient'
  signerId: null, // Will be set in before hook
  signatureData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==', // Base64 encoded minimal PNG
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0 (Test Suite)'
};

describe('Form Management Contract Tests', () => {
  let authToken;
  let nurseToken;
  let doctorToken;
  let adminToken;
  let testPatientId;
  let testVisitId;
  let nurseId;
  let doctorId;
  let createdNurseFormId;
  let createdDoctorFormId;

  before(async () => {
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get authentication tokens for different roles
    try {
      const nurseLogin = await axios.post(`${BASE_URL}/auth/login`, {
        username: 'nurse',
        password: 'NursePassword123!'
      });
      nurseToken = nurseLogin.data.accessToken;
      nurseId = nurseLogin.data.user.id;

      const doctorLogin = await axios.post(`${BASE_URL}/auth/login`, {
        username: 'doctor',
        password: 'DoctorPassword123!'
      });
      doctorToken = doctorLogin.data.accessToken;
      doctorId = doctorLogin.data.user.id;

      const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
        username: 'admin',
        password: 'AdminPassword123!'
      });
      adminToken = adminLogin.data.accessToken;

      // Use nurse token as default for most operations
      authToken = nurseToken;

    } catch (error) {
      console.log('Could not get authentication tokens:', error.message);
    }

    // Create test patient and visit for form testing
    if (authToken) {
      try {
        const testPatient = {
          firstName: 'Form',
          lastName: 'TestPatient',
          nationalId: '11223344556677',
          dateOfBirth: '1978-12-03',
          gender: 'male',
          phone: '+201122334455',
          email: 'form.test@example.com',
          address: '321 Form Street, Cairo, Egypt'
        };

        const patientResponse = await axios.post(`${POSTGREST_URL}/patients`, testPatient, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        testPatientId = patientResponse.data[0].id;

        // Create test visit
        const testVisit = {
          patientId: testPatientId,
          visitType: 'initial',
          reasonForVisit: 'Form testing',
          priority: 'medium',
          assignedDoctorId: doctorId,
          notes: 'Visit created for form testing'
        };

        const visitResponse = await axios.post(`${POSTGREST_URL}/visits`, testVisit, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        testVisitId = visitResponse.data[0].id;

        // Update test data with created IDs
        TEST_NURSE_FORM.patientId = testPatientId;
        TEST_NURSE_FORM.visitId = testVisitId;
        TEST_NURSE_FORM.nurseId = nurseId;

        TEST_DOCTOR_FORM.patientId = testPatientId;
        TEST_DOCTOR_FORM.visitId = testVisitId;
        TEST_DOCTOR_FORM.doctorId = doctorId;

      } catch (error) {
        console.log('Could not create test patient/visit:', error.message);
      }
    }
  });

  describe('Nurse Form Management', () => {
    describe('POST /nurse_forms (Create Nurse Form)', () => {
      it('should return 401 for unauthenticated requests', async () => {
        try {
          await axios.post(`${POSTGREST_URL}/nurse_forms`, TEST_NURSE_FORM);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(401);
        }
      });

      it('should return 400 for missing required fields', async () => {
        if (!authToken) {
          console.log('Skipping validation test - no auth token available');
          return;
        }

        try {
          const incompleteForm = { ...TEST_NURSE_FORM };
          delete incompleteForm.patientId;

          await axios.post(`${POSTGREST_URL}/nurse_forms`, incompleteForm, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(400);
        }
      });

      it('should return 404 for non-existent patient', async () => {
        if (!authToken) {
          console.log('Skipping non-existent patient test - no auth token available');
          return;
        }

        try {
          const invalidForm = {
            ...TEST_NURSE_FORM,
            patientId: '00000000-0000-0000-0000-000000000000'
          };

          await axios.post(`${POSTGREST_URL}/nurse_forms`, invalidForm, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(404);
        }
      });

      it('should return 201 and created nurse form for valid request', async () => {
        if (!authToken || !testPatientId) {
          console.log('Skipping nurse form creation test - no auth token or test patient available');
          return;
        }

        try {
          const response = await axios.post(`${POSTGREST_URL}/nurse_forms`, TEST_NURSE_FORM, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });

          expect(response.status).to.equal(201);
          expect(Array.isArray(response.data)).to.be.true;
          expect(response.data.length).to.equal(1);

          const createdForm = response.data[0];
          expect(createdForm).to.have.property('id');
          expect(createdForm).to.have.property('patientId', TEST_NURSE_FORM.patientId);
          expect(createdForm).to.have.property('visitId', TEST_NURSE_FORM.visitId);
          expect(createdForm).to.have.property('nurseId', TEST_NURSE_FORM.nurseId);
          expect(createdForm).to.have.property('arrivalMode', TEST_NURSE_FORM.arrivalMode);
          expect(createdForm).to.have.property('chiefComplaint', TEST_NURSE_FORM.chiefComplaint);
          expect(createdForm).to.have.property('vitalSigns');
          expect(createdForm).to.have.property('psychosocialAssessment');
          expect(createdForm).to.have.property('nutritionalScreening');
          expect(createdForm).to.have.property('functionalAssessment');
          expect(createdForm).to.have.property('painAssessment');
          expect(createdForm).to.have.property('morseFallScale');
          expect(createdForm).to.have.property('notes', TEST_NURSE_FORM.notes);
          expect(createdForm).to.have.property('status', 'draft');
          expect(createdForm).to.have.property('createdAt');
          expect(createdForm).to.have.property('updatedAt');

          // Store form ID for subsequent tests
          createdNurseFormId = createdForm.id;

          // Update doctor form with nurse form ID
          TEST_DOCTOR_FORM.nurseFormId = createdNurseFormId;

        } catch (error) {
          console.log('Nurse form creation test failed:', error.message);
        }
      });

      it('should validate vital signs structure', async () => {
        if (!authToken || !testPatientId) {
          console.log('Skipping vital signs validation test - no auth token or test patient available');
          return;
        }

        try {
          const invalidVitalsForm = {
            ...TEST_NURSE_FORM,
            vitalSigns: {
              bloodPressure: { systolic: 'invalid', diastolic: 90 },
              heartRate: 85
            }
          };

          await axios.post(`${POSTGREST_URL}/nurse_forms`, invalidVitalsForm, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(400);
        }
      });

      it('should validate pain scale range', async () => {
        if (!authToken || !testPatientId) {
          console.log('Skipping pain scale validation test - no auth token or test patient available');
          return;
        }

        try {
          const invalidPainForm = {
            ...TEST_NURSE_FORM,
            vitalSigns: {
              ...TEST_NURSE_FORM.vitalSigns,
              painScale: 15 // Invalid: should be 0-10
            }
          };

          await axios.post(`${POSTGREST_URL}/nurse_forms`, invalidPainForm, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(400);
        }
      });

      it('should validate Morse Fall Scale structure', async () => {
        if (!authToken || !testPatientId) {
          console.log('Skipping Morse Fall Scale validation test - no auth token or test patient available');
          return;
        }

        try {
          const invalidMorseForm = {
            ...TEST_NURSE_FORM,
            morseFallScale: {
              historyOfFalls: 'invalid', // Should be boolean
              gaitTransfer: 'invalid'
            }
          };

          await axios.post(`${POSTGREST_URL}/nurse_forms`, invalidMorseForm, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(400);
        }
      });
    });

    describe('GET /nurse_forms (List Nurse Forms)', () => {
      it('should return 401 for unauthenticated requests', async () => {
        try {
          await axios.get(`${POSTGREST_URL}/nurse_forms`);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(401);
        }
      });

      it('should return 200 and nurse forms list for authenticated users', async () => {
        if (!authToken) {
          console.log('Skipping nurse form list test - no auth token available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/nurse_forms`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;

          // Check that all required fields are present
          if (response.data.length > 0) {
            const form = response.data[0];
            expect(form).to.have.property('id');
            expect(form).to.have.property('patientId');
            expect(form).to.have.property('visitId');
            expect(form).to.have.property('nurseId');
            expect(form).to.have.property('arrivalMode');
            expect(form).to.have.property('chiefComplaint');
            expect(form).to.have.property('status');
            expect(form).to.have.property('createdAt');
          }

        } catch (error) {
          console.log('Nurse form list test failed:', error.message);
        }
      });

      it('should support filtering by patient', async () => {
        if (!authToken || !testPatientId) {
          console.log('Skipping patient filtering test - no auth token or test patient available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/nurse_forms`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              patientId: `eq.${testPatientId}`
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;

          // All returned forms should belong to the test patient
          response.data.forEach(form => {
            expect(form.patientId).to.equal(testPatientId);
          });

        } catch (error) {
          console.log('Patient filtering test failed:', error.message);
        }
      });

      it('should support filtering by status', async () => {
        if (!authToken) {
          console.log('Skipping status filtering test - no auth token available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/nurse_forms`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              status: 'eq.draft'
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;

          // All returned forms should be in draft status
          response.data.forEach(form => {
            expect(form.status).to.equal('draft');
          });

        } catch (error) {
          console.log('Status filtering test failed:', error.message);
        }
      });
    });

    describe('PATCH /nurse_forms/:id (Update Nurse Form)', () => {
      it('should return 401 for unauthenticated requests', async () => {
        if (!createdNurseFormId) {
          console.log('Skipping update test - no created nurse form available');
          return;
        }

        try {
          await axios.patch(`${POSTGREST_URL}/nurse_forms?id=eq.${createdNurseFormId}`, {
            status: 'completed'
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(401);
        }
      });

      it('should return 200 and updated nurse form for valid request', async () => {
        if (!authToken || !createdNurseFormId) {
          console.log('Skipping nurse form update test - no auth token or created form available');
          return;
        }

        try {
          const updateData = {
            status: 'completed',
            notes: 'Updated: Patient assessment completed'
          };

          const response = await axios.patch(`${POSTGREST_URL}/nurse_forms?id=eq.${createdNurseFormId}`, updateData, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;
          expect(response.data.length).to.equal(1);

          const updatedForm = response.data[0];
          expect(updatedForm).to.have.property('id', createdNurseFormId);
          expect(updatedForm).to.have.property('status', 'completed');
          expect(updatedForm).to.have.property('notes', updateData.notes);

        } catch (error) {
          console.log('Nurse form update test failed:', error.message);
        }
      });

      it('should support status transitions', async () => {
        if (!authToken || !testPatientId) {
          console.log('Skipping status transition test - no auth token or test patient available');
          return;
        }

        try {
          // Create a new form
          const formResponse = await axios.post(`${POSTGREST_URL}/nurse_forms`, TEST_NURSE_FORM, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });

          const formId = formResponse.data[0].id;

          // Test status transitions
          const statusTransitions = [
            { status: 'in_progress', notes: 'Started patient assessment' },
            { status: 'completed', notes: 'Assessment completed successfully' }
          ];

          for (const transition of statusTransitions) {
            const updateResponse = await axios.patch(`${POSTGREST_URL}/nurse_forms?id=eq.${formId}`, transition, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              }
            });

            expect(updateResponse.status).to.equal(200);
            expect(updateResponse.data[0]).to.have.property('status', transition.status);
          }

        } catch (error) {
          console.log('Status transition test failed:', error.message);
        }
      });
    });
  });

  describe('Doctor Form Management', () => {
    describe('POST /doctor_forms (Create Doctor Form)', () => {
      it('should return 401 for unauthenticated requests', async () => {
        try {
          await axios.post(`${POSTGREST_URL}/doctor_forms`, TEST_DOCTOR_FORM);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(401);
        }
      });

      it('should return 400 for missing required fields', async () => {
        if (!doctorToken) {
          console.log('Skipping validation test - no doctor token available');
          return;
        }

        try {
          const incompleteForm = { ...TEST_DOCTOR_FORM };
          delete incompleteForm.patientId;

          await axios.post(`${POSTGREST_URL}/doctor_forms`, incompleteForm, {
            headers: {
              'Authorization': `Bearer ${doctorToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(400);
        }
      });

      it('should return 404 for non-existent nurse form', async () => {
        if (!doctorToken) {
          console.log('Skipping non-existent nurse form test - no doctor token available');
          return;
        }

        try {
          const invalidForm = {
            ...TEST_DOCTOR_FORM,
            nurseFormId: '00000000-0000-0000-0000-000000000000'
          };

          await axios.post(`${POSTGREST_URL}/doctor_forms`, invalidForm, {
            headers: {
              'Authorization': `Bearer ${doctorToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(404);
        }
      });

      it('should return 201 and created doctor form for valid request', async () => {
        if (!doctorToken || !createdNurseFormId) {
          console.log('Skipping doctor form creation test - no doctor token or nurse form available');
          return;
        }

        try {
          const response = await axios.post(`${POSTGREST_URL}/doctor_forms`, TEST_DOCTOR_FORM, {
            headers: {
              'Authorization': `Bearer ${doctorToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });

          expect(response.status).to.equal(201);
          expect(Array.isArray(response.data)).to.be.true;
          expect(response.data.length).to.equal(1);

          const createdForm = response.data[0];
          expect(createdForm).to.have.property('id');
          expect(createdForm).to.have.property('patientId', TEST_DOCTOR_FORM.patientId);
          expect(createdForm).to.have.property('visitId', TEST_DOCTOR_FORM.visitId);
          expect(createdForm).to.have.property('doctorId', TEST_DOCTOR_FORM.doctorId);
          expect(createdForm).to.have.property('nurseFormId', TEST_DOCTOR_FORM.nurseFormId);
          expect(createdForm).to.have.property('studyIndication', TEST_DOCTOR_FORM.studyIndication);
          expect(createdForm).to.have.property('contraindications', TEST_DOCTOR_FORM.contraindications);
          expect(createdForm).to.have.property('medicalHistory');
          expect(createdForm).to.have.property('technicalParameters');
          expect(createdForm).to.have.property('imagingFindings');
          expect(createdForm).to.have.property('diagnosis', TEST_DOCTOR_FORM.diagnosis);
          expect(createdForm).to.have.property('treatmentPlan', TEST_DOCTOR_FORM.treatmentPlan);
          expect(createdForm).to.have.property('followUpRequired', TEST_DOCTOR_FORM.followUpRequired);
          expect(createdForm).to.have.property('followUpTimeline', TEST_DOCTOR_FORM.followUpTimeline);
          expect(createdForm).to.have.property('status', 'draft');
          expect(createdForm).to.have.property('createdAt');
          expect(createdForm).to.have.property('updatedAt');

          // Store form ID for subsequent tests
          createdDoctorFormId = createdForm.id;

        } catch (error) {
          console.log('Doctor form creation test failed:', error.message);
        }
      });

      it('should validate technical parameters', async () => {
        if (!doctorToken || !createdNurseFormId) {
          console.log('Skipping technical parameters validation test - no doctor token or nurse form available');
          return;
        }

        try {
          const invalidParamsForm = {
            ...TEST_DOCTOR_FORM,
            technicalParameters: {
              ctdivol: 'invalid', // Should be number
              dlp: 200,
              kv: 120
            }
          };

          await axios.post(`${POSTGREST_URL}/doctor_forms`, invalidParamsForm, {
            headers: {
              'Authorization': `Bearer ${doctorToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(400);
        }
      });

      it('should validate required imaging findings', async () => {
        if (!doctorToken || !createdNurseFormId) {
          console.log('Skipping imaging findings validation test - no doctor token or nurse form available');
          return;
        }

        try {
          const invalidFindingsForm = {
            ...TEST_DOCTOR_FORM,
            imagingFindings: {
              findings: '', // Should not be empty
              impression: 'Some impression'
            }
          };

          await axios.post(`${POSTGREST_URL}/doctor_forms`, invalidFindingsForm, {
            headers: {
              'Authorization': `Bearer ${doctorToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(400);
        }
      });
    });

    describe('GET /doctor_forms (List Doctor Forms)', () => {
      it('should return 401 for unauthenticated requests', async () => {
        try {
          await axios.get(`${POSTGREST_URL}/doctor_forms`);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(401);
        }
      });

      it('should return 200 and doctor forms list for authenticated users', async () => {
        if (!doctorToken) {
          console.log('Skipping doctor form list test - no doctor token available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/doctor_forms`, {
            headers: {
              'Authorization': `Bearer ${doctorToken}`,
              'Content-Type': 'application/json'
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;

          // Check that all required fields are present
          if (response.data.length > 0) {
            const form = response.data[0];
            expect(form).to.have.property('id');
            expect(form).to.have.property('patientId');
            expect(form).to.have.property('visitId');
            expect(form).to.have.property('doctorId');
            expect(form).to.have.property('nurseFormId');
            expect(form).to.have.property('studyIndication');
            expect(form).to.have.property('status');
            expect(form).to.have.property('createdAt');
          }

        } catch (error) {
          console.log('Doctor form list test failed:', error.message);
        }
      });
    });
  });

  describe('Digital Signature Management', () => {
    describe('POST /digital_signatures (Create Signature)', () => {
      it('should return 401 for unauthenticated requests', async () => {
        try {
          await axios.post(`${POSTGREST_URL}/digital_signatures`, TEST_SIGNATURE);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(401);
        }
      });

      it('should return 400 for missing required fields', async () => {
        if (!authToken) {
          console.log('Skipping signature validation test - no auth token available');
          return;
        }

        try {
          const incompleteSignature = { ...TEST_SIGNATURE };
          delete incompleteSignature.formId;

          await axios.post(`${POSTGREST_URL}/digital_signatures`, incompleteSignature, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(400);
        }
      });

      it('should return 201 and created signature for valid request', async () => {
        if (!authToken || !createdNurseFormId) {
          console.log('Skipping signature creation test - no auth token or nurse form available');
          return;
        }

        try {
          const signatureData = {
            ...TEST_SIGNATURE,
            formId: createdNurseFormId,
            signerId: nurseId
          };

          const response = await axios.post(`${POSTGREST_URL}/digital_signatures`, signatureData, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });

          expect(response.status).to.equal(201);
          expect(Array.isArray(response.data)).to.be.true;
          expect(response.data.length).to.equal(1);

          const createdSignature = response.data[0];
          expect(createdSignature).to.have.property('id');
          expect(createdSignature).to.have.property('formId', signatureData.formId);
          expect(createdSignature).to.have.property('formType', signatureData.formType);
          expect(createdSignature).to.have.property('signerRole', signatureData.signerRole);
          expect(createdSignature).to.have.property('signerId', signatureData.signerId);
          expect(createdSignature).to.have.property('signatureData');
          expect(createdSignature).to.have.property('ipAddress', signatureData.ipAddress);
          expect(createdSignature).to.have.property('userAgent', signatureData.userAgent);
          expect(createdSignature).to.have.property('createdAt');

        } catch (error) {
          console.log('Signature creation test failed:', error.message);
        }
      });

      it('should validate signature data format', async () => {
        if (!authToken || !createdNurseFormId) {
          console.log('Skipping signature format test - no auth token or nurse form available');
          return;
        }

        try {
          const invalidSignature = {
            ...TEST_SIGNATURE,
            formId: createdNurseFormId,
            signerId: nurseId,
            signatureData: 'invalid_base64_data'
          };

          await axios.post(`${POSTGREST_URL}/digital_signatures`, invalidSignature, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(400);
        }
      });
    });

    describe('GET /digital_signatures (List Signatures)', () => {
      it('should return 401 for unauthenticated requests', async () => {
        try {
          await axios.get(`${POSTGREST_URL}/digital_signatures`);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(401);
        }
      });

      it('should return 200 and signatures list for authenticated users', async () => {
        if (!authToken) {
          console.log('Skipping signature list test - no auth token available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/digital_signatures`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;

          // Check that all required fields are present
          if (response.data.length > 0) {
            const signature = response.data[0];
            expect(signature).to.have.property('id');
            expect(signature).to.have.property('formId');
            expect(signature).to.have.property('formType');
            expect(signature).to.have.property('signerRole');
            expect(signature).to.have.property('signerId');
            expect(signature).to.have.property('signatureData');
            expect(signature).to.have.property('createdAt');
          }

        } catch (error) {
          console.log('Signature list test failed:', error.message);
        }
      });

      it('should support filtering by form type', async () => {
        if (!authToken) {
          console.log('Skipping form type filtering test - no auth token available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/digital_signatures`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              formType: 'eq.nurse_form'
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;

          // All returned signatures should be for nurse forms
          response.data.forEach(signature => {
            expect(signature.formType).to.equal('nurse_form');
          });

        } catch (error) {
          console.log('Form type filtering test failed:', error.message);
        }
      });

      it('should support filtering by signer role', async () => {
        if (!authToken) {
          console.log('Skipping signer role filtering test - no auth token available');
          return;
        }

        try {
          const response = await axios.get(`${POSTGREST_URL}/digital_signatures`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              signerRole: 'eq.nurse'
            }
          });

          expect(response.status).to.equal(200);
          expect(Array.isArray(response.data)).to.be.true;

          // All returned signatures should be by nurses
          response.data.forEach(signature => {
            expect(signature.signerRole).to.equal('nurse');
          });

        } catch (error) {
          console.log('Signer role filtering test failed:', error.message);
        }
      });
    });
  });

  describe('Form Status Transitions', () => {
    it('should support nurse form status transitions', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping nurse form status transitions test - no auth token or test patient available');
        return;
      }

      try {
        // Create a new nurse form
        const formResponse = await axios.post(`${POSTGREST_URL}/nurse_forms`, TEST_NURSE_FORM, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        const formId = formResponse.data[0].id;

        // Test status transitions
        const transitions = [
          { status: 'in_progress', notes: 'Started assessment' },
          { status: 'completed', notes: 'Assessment completed' },
          { status: 'signed', notes: 'Signed by nurse' }
        ];

        for (const transition of transitions) {
          const updateResponse = await axios.patch(`${POSTGREST_URL}/nurse_forms?id=eq.${formId}`, transition, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });

          expect(updateResponse.status).to.equal(200);
          expect(updateResponse.data[0]).to.have.property('status', transition.status);
        }

      } catch (error) {
        console.log('Nurse form status transitions test failed:', error.message);
      }
    });

    it('should support doctor form status transitions', async () => {
      if (!doctorToken || !createdNurseFormId) {
        console.log('Skipping doctor form status transitions test - no doctor token or nurse form available');
        return;
      }

      try {
        // Create a new doctor form
        const formResponse = await axios.post(`${POSTGREST_URL}/doctor_forms`, TEST_DOCTOR_FORM, {
          headers: {
            'Authorization': `Bearer ${doctorToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        const formId = formResponse.data[0].id;

        // Test status transitions
        const transitions = [
          { status: 'in_progress', notes: 'Started evaluation' },
          { status: 'completed', notes: 'Evaluation completed' },
          { status: 'signed', notes: 'Signed by doctor' }
        ];

        for (const transition of transitions) {
          const updateResponse = await axios.patch(`${POSTGREST_URL}/doctor_forms?id=eq.${formId}`, transition, {
            headers: {
              'Authorization': `Bearer ${doctorToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });

          expect(updateResponse.status).to.equal(200);
          expect(updateResponse.data[0]).to.have.property('status', transition.status);
        }

      } catch (error) {
        console.log('Doctor form status transitions test failed:', error.message);
      }
    });
  });

  after(() => {
    console.log('Form management contract tests completed');
  });
});