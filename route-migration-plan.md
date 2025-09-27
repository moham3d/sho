# Route Migration Plan

This document tracks the migration of route handlers from `server_backup.js` to the new modular `/srv` directory structure.

## Overview
- **Total Routes Found**: 38 routes
- **Original File Size**: 2,091 lines
- **New File Size**: 19 lines
- **Reduction**: 99% code reduction

## Migration Status

### ✅ Completed
- [x] Basic project structure created
- [x] Config files created (app.js, database.js, session.js)
- [x] Middleware files created (auth.js)
- [x] Route files scaffolded
- [x] Server.js refactored to 19 lines

### 🔄 In Progress
- [ ] Route migration

### ❌ Pending
- [ ] Testing migrated routes
- [ ] Remove server_backup.js

## Route Categories

### 1. Admin Routes (21 routes) → `srv/routes/admin.js` + `srv/controllers/adminController.js`

#### Dashboard & Users
- [ ] `GET /admin` (line 14) → `adminController.getDashboard`
- [ ] `GET /admin/users` (line 67) → `adminController.getUsers`
- [ ] `GET /admin/users/new` (line 119) → `adminController.newUserForm`
- [ ] `POST /admin/users` (line 123) → `adminController.createUser`
- [ ] `GET /admin/users/:id/edit` (line 180) → `adminController.editUserForm`
- [ ] `POST /admin/users/:id` (line 197) → `adminController.updateUser`
- [ ] `POST /admin/users/:id/delete` (line 262) → `adminController.deleteUser`

#### Patient Management
- [ ] `GET /admin/patients` (line 274) → `adminController.getPatients`
- [ ] `GET /admin/patients/new` (line 329) → `adminController.newPatientForm`
- [ ] `POST /admin/patients` (line 339) → `adminController.createPatient`
- [ ] `GET /admin/patients/:ssn/edit` (line 449) → `adminController.editPatientForm`
- [ ] `POST /admin/patients/:ssn` (line 466) → `adminController.updatePatient`
- [ ] `POST /admin/patients/:ssn/delete` (line 518) → `adminController.deletePatient`

#### Visit Management
- [ ] `GET /admin/visits` (line 570) → `adminController.getVisits`
- [ ] `POST /admin/visits/:visitId/delete` (line 642) → `adminController.deleteVisit`
- [ ] `GET /admin/visits/new` (line 696) → `adminController.newVisitForm`
- [ ] `POST /admin/visits` (line 729) → `adminController.createVisit`
- [ ] `GET /admin/visits/:visitId/edit` (line 791) → `adminController.editVisitForm`
- [ ] `POST /admin/visits/:visitId` (line 833) → `adminController.updateVisit`

#### Assessment Management
- [ ] `GET /admin/assessments` (line 902) → `adminController.getAssessments`
- [ ] `POST /admin/assessments/:assessmentId/delete` (line 1005) → `adminController.deleteAssessment`
- [ ] `GET /admin/assessments/:assessmentId` (line 1085) → `adminController.getAssessmentDetail`
- [ ] `GET /admin/visits/:visitId` (line 1153) → `adminController.getVisitDetail`
- [ ] `GET /admin/visits/:visitId/print` (line 1210) → `adminController.printVisit`

### 2. Nurse Routes (7 routes) → `srv/routes/nurse.js` + `srv/controllers/nurseController.js`

- [ ] `GET /nurse` (line 1260) → `nurseController.getDashboard`
- [ ] `GET /nurse/my-assessments` (line 1297) → `nurseController.getMyAssessments`
- [ ] `GET /nurse/search-patient` (line 1326) → `nurseController.searchPatientForm`
- [ ] `POST /nurse/search-patient` (line 1381) → `nurseController.searchPatient`
- [ ] `GET /nurse/add-patient` (line 1480) → `nurseController.addPatientForm`
- [ ] `POST /nurse/add-patient` (line 1484) → `nurseController.createPatient`
- [ ] `GET /nurse/assessment/:visitId` (line 1571) → `nurseController.getAssessmentForm`

### 3. Doctor Routes (4 routes) → `srv/routes/doctor.js` + `srv/controllers/doctorController.js`

- [ ] `GET /doctor` (line 1615) → `doctorController.getDashboard`
- [ ] `POST /doctor/start-radiology/:visitId` (line 1661) → `doctorController.startRadiology`
- [ ] `POST /doctor/search-patient` (line 1699) → `doctorController.searchPatient`
- [ ] `GET /radiology-form` (line 1747) → `doctorController.getRadiologyForm`

### 4. Form Submission Routes (2 routes) → `srv/routes/forms.js` + `srv/controllers/formController.js`

- [ ] `POST /submit-nurse-form` (line 1766) → `formController.submitNurseForm`
- [ ] `POST /submit-radiology-form` (line 1971) → `formController.submitRadiologyForm`

### 5. API Routes (1 route) → `srv/routes/api.js` + `srv/controllers/apiController.js`

- [ ] `GET /api/patients/search` (line 1360) → `apiController.searchPatients`

## Services to Create

### Core Services
- [ ] `srv/services/userService.js` - User CRUD operations
- [ ] `srv/services/patientService.js` - Patient management
- [ ] `srv/services/visitService.js` - Visit management
- [ ] `srv/services/assessmentService.js` - Assessment operations
- [ ] `srv/services/signatureService.js` - Digital signature handling
- [ ] `srv/services/notificationService.js` - Session notifications

### Form Processing Services
- [ ] `srv/services/nurseFormService.js` - Nursing assessment processing
- [ ] `srv/services/radiologyFormService.js` - Radiology form processing
- [ ] `srv/services/calculationService.js` - Score calculations (Morse, etc.)

## Models to Create

- [ ] `srv/models/User.js` - User data model
- [ ] `srv/models/Patient.js` - Patient data model
- [ ] `srv/models/Visit.js` - Visit data model
- [ ] `srv/models/Assessment.js` - Assessment data model

## Utilities to Create

- [ ] `srv/utils/constants.js` - Application constants
- [ ] `srv/utils/helpers.js` - Utility functions
- [ ] `srv/utils/validators.js` - Data validation functions

## Migration Steps

### Phase 1: Admin Routes Migration
1. Create `adminController.js` with all admin route handlers
2. Update `srv/routes/admin.js` to use the controller
3. Create supporting services (userService, patientService, visitService)
4. Test admin functionality

### Phase 2: Nurse Routes Migration
1. Create `nurseController.js` with all nurse route handlers
2. Update `srv/routes/nurse.js` to use the controller
3. Create nurseFormService for form processing
4. Test nurse functionality

### Phase 3: Doctor Routes Migration
1. Create `doctorController.js` with all doctor route handlers
2. Update `srv/routes/doctor.js` to use the controller
3. Create radiologyFormService for form processing
4. Test doctor functionality

### Phase 4: Form & API Routes Migration
1. Create `formController.js` and `apiController.js`
2. Update respective route files
3. Create supporting services
4. Test form submissions and API endpoints

### Phase 5: Cleanup & Testing
1. Comprehensive testing of all migrated routes
2. Remove `server_backup.js`
3. Update documentation
4. Performance testing

## Success Criteria
- [ ] All 38 routes migrated and functional
- [ ] No functionality lost in migration
- [ ] Clean separation of concerns
- [ ] Maintainable code structure
- [ ] All tests passing
- [ ] Server.js remains under 30 lines

## Notes
- Each route handler should be extracted with its complete logic
- Database queries should be moved to appropriate services
- Error handling should be consistent across all routes
- Session management and authentication middleware already in place
- Form validation should be moved to validation middleware or services