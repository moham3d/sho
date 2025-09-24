// Al-Shorouk Radiology Management System - Frontend JavaScript

class RadiologyApp {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = null;
        this.currentView = 'patients';
        this.currentVisitId = null;

        this.initializeEventListeners();
        this.checkAuth();
    }

    initializeEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Navigation
        document.getElementById('patients-btn').addEventListener('click', () => this.showView('patients'));
        document.getElementById('visits-btn').addEventListener('click', () => this.showView('visits'));
        document.getElementById('nurse-forms-btn').addEventListener('click', () => this.showView('nurse-forms'));
        document.getElementById('doctor-forms-btn').addEventListener('click', () => this.showView('doctor-forms'));
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Modal
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());

        // Signature modal
        document.getElementById('signature-modal-close').addEventListener('click', () => this.closeSignatureModal());
        document.getElementById('clear-signature').addEventListener('click', () => this.clearSignature());
        document.getElementById('save-signature').addEventListener('click', () => this.saveSignature());
    }

    checkAuth() {
        if (this.token) {
            this.user = JSON.parse(localStorage.getItem('user'));
            this.showApp();
        } else {
            this.showLogin();
        }
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                this.showApp();
            } else {
                this.showError('login-error', data.error);
            }
        } catch (error) {
            this.showError('login-error', 'Login failed');
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showLogin();
    }

    showLogin() {
        document.getElementById('login-section').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    }

    showApp() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('app').style.display = 'block';

        // Update user info
        document.getElementById('user-name').textContent = this.user.name;
        document.getElementById('user-role').textContent = this.getRoleName(this.user.role);

        // Show/hide navigation based on role
        this.updateNavigation();
        this.showView('patients');
    }

    getRoleName(role) {
        const roles = {
            'admin': 'Admin',
            'doctor': 'Doctor',
            'nurse': 'Nurse'
        };
        return roles[role] || role;
    }

    updateNavigation() {
        const nurseFormsBtn = document.getElementById('nurse-forms-btn');
        const doctorFormsBtn = document.getElementById('doctor-forms-btn');

        if (this.user.role === 'nurse') {
            nurseFormsBtn.style.display = 'inline-block';
            doctorFormsBtn.style.display = 'none';
        } else if (this.user.role === 'doctor') {
            nurseFormsBtn.style.display = 'none';
            doctorFormsBtn.style.display = 'inline-block';
        } else {
            nurseFormsBtn.style.display = 'inline-block';
            doctorFormsBtn.style.display = 'inline-block';
        }
    }

    showView(view) {
        this.currentView = view;

        // Update active navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${view}-btn`).classList.add('active');

        // Load view content
        switch (view) {
            case 'patients':
                this.loadPatients();
                break;
            case 'visits':
                this.loadVisits();
                break;
            case 'nurse-forms':
                this.loadNurseForms();
                break;
            case 'doctor-forms':
                this.loadDoctorForms();
                break;
        }
    }

    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await fetch(endpoint, { ...defaultOptions, ...options });
        return response;
    }

    async loadPatients() {
        this.showLoading();

        try {
            const response = await this.apiCall('/api/patients');
            const patients = await response.json();

            this.renderPatients(patients);
        } catch (error) {
            this.showError('content', 'خطأ في تحميل بيانات المرضى');
        }
    }

    renderPatients(patients) {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Patients</h2>
                    <button class="btn btn-primary" onclick="app.showPatientModal()">Add New Patient</button>
                </div>
                <div class="search-section">
                    <input type="text" id="patient-search" class="search-input" placeholder="Search patients...">
                </div>
                <ul class="patient-list" id="patient-list">
                    ${patients.map(patient => `
                        <li class="patient-item" onclick="app.showPatientModal(${patient.id})">
                            <div class="patient-info">
                                <div>
                                    <div class="patient-name">${patient.full_name}</div>
                                    <div class="patient-details">
                                        National ID: ${patient.national_id || 'Not specified'} |
                                        Mobile: ${patient.mobile || 'Not specified'} |
                                        Age: ${patient.age || 'Not specified'}
                                    </div>
                                </div>
                                <div class="actions">
                                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.createVisit(${patient.id})">Create Visit</button>
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        document.getElementById('content').innerHTML = html;

        // Add search functionality
        document.getElementById('patient-search').addEventListener('input', (e) => {
            this.filterPatients(e.target.value, patients);
        });
    }

    filterPatients(searchTerm, patients) {
        const filtered = patients.filter(patient =>
            patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (patient.national_id && patient.national_id.includes(searchTerm)) ||
            (patient.medical_number && patient.medical_number.includes(searchTerm))
        );
        this.renderPatients(filtered);
    }

    async loadVisits() {
        this.showLoading();

        try {
            const response = await this.apiCall('/api/visits');
            const visits = await response.json();

            this.renderVisits(visits);
        } catch (error) {
            this.showError('content', 'خطأ في تحميل بيانات الزيارات');
        }
    }

    renderVisits(visits) {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Visits</h2>
                </div>
                <ul class="visit-list">
                    ${visits.map(visit => `
                        <li class="visit-item" onclick="app.showVisitModal(${visit.id})">
                            <div class="visit-info">
                                <div>
                                    <div class="visit-patient">${visit.patient_name}</div>
                                    <div class="visit-details">
                                        Visit Date: ${new Date(visit.visit_date).toLocaleDateString('en-US')} |
                                        Status: <span class="status-badge status-${visit.status}">${this.getStatusName(visit.status)}</span>
                                    </div>
                                    <div class="visit-details">
                                        Nurse: ${visit.nurse_name || 'Not assigned'} |
                                        Doctor: ${visit.doctor_name || 'Not assigned'}
                                    </div>
                                </div>
                                <div class="actions">
                                    ${this.user.role === 'nurse' || this.user.role === 'admin' ?
                                        `<button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.showNurseForm(${visit.id})">Nurse Assessment</button>` : ''}
                                    ${this.user.role === 'doctor' || this.user.role === 'admin' ?
                                        `<button class="btn btn-sm btn-success" onclick="event.stopPropagation(); app.showDoctorForm(${visit.id})">Doctor Evaluation</button>` : ''}
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        document.getElementById('content').innerHTML = html;
    }

    getStatusName(status) {
        const statuses = {
            'open': 'Open',
            'in_progress': 'In Progress',
            'signed': 'Signed',
            'closed': 'Closed'
        };
        return statuses[status] || status;
    }

    showPatientModal(patientId = null) {
        const title = patientId ? 'Edit Patient' : 'Add New Patient';
        const patient = patientId ? {} : {}; // Would load patient data if editing

        const html = `
            <form id="patient-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" name="full_name" required>
                    </div>
                    <div class="form-group">
                        <label>National ID</label>
                        <input type="text" name="national_id">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Mobile Phone</label>
                        <input type="tel" name="mobile">
                    </div>
                    <div class="form-group">
                        <label>Date of Birth</label>
                        <input type="date" name="dob">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Age</label>
                        <input type="number" name="age">
                    </div>
                    <div class="form-group">
                        <label>Gender</label>
                        <select name="gender">
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Medical Number</label>
                        <input type="text" name="medical_number">
                    </div>
                    <div class="form-group">
                        <label>Diagnosis</label>
                        <input type="text" name="diagnosis">
                    </div>
                </div>
                <div class="form-group">
                    <label>Additional Contact Info (JSON)</label>
                    <textarea name="contact_info" placeholder='{"email": "patient@example.com", "address": "City, Country"}'></textarea>
                </div>
                <div class="actions" style="margin-top: 2rem;">
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal(title, html);

        // Form submission
        document.getElementById('patient-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.savePatient(new FormData(e.target), patientId);
        });
    }

    async savePatient(formData, patientId) {
        const data = Object.fromEntries(formData);

        try {
            const response = await this.apiCall(
                patientId ? `/api/patients/${patientId}` : '/api/patients',
                {
                    method: patientId ? 'PUT' : 'POST',
                    body: JSON.stringify(data)
                }
            );

            if (response.ok) {
                this.closeModal();
                this.loadPatients();
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch (error) {
            alert('Save failed');
        }
    }

    async createVisit(patientId) {
        try {
            const response = await this.apiCall('/api/visits', {
                method: 'POST',
                body: JSON.stringify({ patient_id: patientId })
            });

            if (response.ok) {
                alert('Visit created successfully');
                this.loadVisits();
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch (error) {
            alert('Failed to create visit');
        }
    }

    showNurseForm(visitId) {
        this.currentVisitId = visitId;
        this.loadNurseForm(visitId);
    }

    async loadNurseForm(visitId) {
        this.showLoading();

        try {
            const response = await this.apiCall(`/api/nurse-forms/${visitId}`);
            const formData = await response.json();

            this.renderNurseForm(formData, visitId);
        } catch (error) {
            this.showError('content', 'خطأ في تحميل نموذج الممرض');
        }
    }

    renderNurseForm(formData, visitId) {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Nurse Assessment</h2>
                    <div class="actions">
                        ${!formData.signed ? '<button class="btn btn-success" onclick="app.signNurseForm()">Sign Form</button>' : '<span class="status-badge status-signed">Signed</span>'}
                    </div>
                </div>

                <form id="nurse-form">
                    <input type="hidden" name="visit_id" value="${visitId}">
                    <input type="hidden" name="nurse_id" value="${this.user.id}">

                    <!-- Basic Screening -->
                    <div class="form-section">
                        <h3>Basic Screening</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Mode of Arrival</label>
                                <select name="arrival_mode">
                                    <option value="">Select</option>
                                    <option value="ambulatory" ${formData.arrival_mode === 'ambulatory' ? 'selected' : ''}>Ambulatory</option>
                                    <option value="stretcher" ${formData.arrival_mode === 'stretcher' ? 'selected' : ''}>Stretcher</option>
                                    <option value="chair" ${formData.arrival_mode === 'chair' ? 'selected' : ''}>Wheelchair</option>
                                    <option value="other" ${formData.arrival_mode === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Chief Complaint</label>
                                <input type="text" name="chief_complaint" value="${formData.chief_complaint || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Age Description</label>
                                <input type="text" name="age_text" value="${formData.age_text || ''}">
                            </div>
                            <div class="form-group">
                                <label>Accompanied By</label>
                                <select name="accompanied_by">
                                    <option value="">Select</option>
                                    <option value="spouse" ${formData.accompanied_by === 'spouse' ? 'selected' : ''}>Spouse</option>
                                    <option value="relative" ${formData.accompanied_by === 'relative' ? 'selected' : ''}>Relative</option>
                                    <option value="other" ${formData.accompanied_by === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Language Spoken</label>
                            <select name="language_spoken">
                                <option value="">Select</option>
                                <option value="Arabic" ${formData.language_spoken === 'Arabic' ? 'selected' : ''}>Arabic</option>
                                <option value="English" ${formData.language_spoken === 'English' ? 'selected' : ''}>English</option>
                                <option value="other" ${formData.language_spoken === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                    </div>

                    <!-- Vital Signs -->
                    <div class="form-section">
                        <h3>Vital Signs</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Temperature (°C)</label>
                                <input type="text" name="temp" value="${formData.temp || ''}">
                            </div>
                            <div class="form-group">
                                <label>Pulse (bpm)</label>
                                <input type="text" name="pulse" value="${formData.pulse || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Blood Pressure</label>
                                <input type="text" name="bp" placeholder="120/80" value="${formData.bp || ''}">
                            </div>
                            <div class="form-group">
                                <label>Respiratory Rate</label>
                                <input type="text" name="resp_rate" value="${formData.resp_rate || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>O2 Saturation (%)</label>
                                <input type="text" name="o2_saturation" value="${formData.o2_saturation || ''}">
                            </div>
                            <div class="form-group">
                                <label>Blood Sugar</label>
                                <input type="text" name="blood_sugar" value="${formData.blood_sugar || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Weight (kg)</label>
                                <input type="text" name="weight" value="${formData.weight || ''}">
                            </div>
                            <div class="form-group">
                                <label>Height (cm)</label>
                                <input type="text" name="height" value="${formData.height || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Psychosocial Assessment -->
                    <div class="form-section">
                        <h3>Psychosocial Assessment</h3>
                        <div class="form-group">
                            <label>Psychosocial History</label>
                            <textarea name="psychosocial_history">${formData.psychosocial_history || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Psychological State</label>
                                <select name="psychological_problem">
                                    <option value="">Select</option>
                                    <option value="anxious" ${formData.psychological_problem === 'anxious' ? 'selected' : ''}>Anxious</option>
                                    <option value="agitated" ${formData.psychological_problem === 'agitated' ? 'selected' : ''}>Agitated</option>
                                    <option value="depressed" ${formData.psychological_problem === 'depressed' ? 'selected' : ''}>Depressed</option>
                                    <option value="none" ${formData.psychological_problem === 'none' ? 'selected' : ''}>No problems</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Special Habits</label>
                                <input type="text" name="special_habits" placeholder="Smoking, etc." value="${formData.special_habits || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Allergies</label>
                                <select name="allergies">
                                    <option value="">Select</option>
                                    <option value="yes" ${formData.allergies === 'yes' ? 'selected' : ''}>Yes</option>
                                    <option value="no" ${formData.allergies === 'no' ? 'selected' : ''}>No</option>
                                    <option value="unknown" ${formData.allergies === 'unknown' ? 'selected' : ''}>Unknown</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Allergy Details</label>
                                <input type="text" name="allergies_details" value="${formData.allergies_details || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Nutritional Assessment -->
                    <div class="form-section">
                        <h3>Nutritional Assessment</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Diet Type</label>
                                <select name="diet">
                                    <option value="">Select</option>
                                    <option value="regular" ${formData.diet === 'regular' ? 'selected' : ''}>Regular</option>
                                    <option value="special" ${formData.diet === 'special' ? 'selected' : ''}>Special</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Appetite</label>
                                <select name="appetite">
                                    <option value="">Select</option>
                                    <option value="good" ${formData.appetite === 'good' ? 'selected' : ''}>Good</option>
                                    <option value="poor" ${formData.appetite === 'poor' ? 'selected' : ''}>Poor</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="gi_problems" ${formData.gi_problems ? 'checked' : ''}>
                                <label>GI Problems</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>GI Problems Details</label>
                            <textarea name="gi_problems_details">${formData.gi_problems_details || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="weight_loss" ${formData.weight_loss ? 'checked' : ''}>
                                <label>Weight Loss</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" name="weight_gain" ${formData.weight_gain ? 'checked' : ''}>
                                <label>Weight Gain</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" name="refer_to_nutritionist" ${formData.refer_to_nutritionist ? 'checked' : ''}>
                                <label>Refer to Nutritionist</label>
                            </div>
                        </div>
                    </div>

                    <!-- Functional Assessment -->
                    <div class="form-section">
                        <h3>Functional Assessment</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Self Care</label>
                                <select name="self_care_status">
                                    <option value="">Select</option>
                                    <option value="independent" ${formData.self_care_status === 'independent' ? 'selected' : ''}>Independent</option>
                                    <option value="needs_supervision" ${formData.self_care_status === 'needs_supervision' ? 'selected' : ''}>Needs Supervision</option>
                                    <option value="dependent" ${formData.self_care_status === 'dependent' ? 'selected' : ''}>Dependent</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Eating</label>
                                <select name="feeding_status">
                                    <option value="">Select</option>
                                    <option value="independent" ${formData.feeding_status === 'independent' ? 'selected' : ''}>Independent</option>
                                    <option value="needs_supervision" ${formData.feeding_status === 'needs_supervision' ? 'selected' : ''}>Needs Supervision</option>
                                    <option value="dependent" ${formData.feeding_status === 'dependent' ? 'selected' : ''}>Dependent</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Hygiene</label>
                                <select name="hygiene_status">
                                    <option value="">Select</option>
                                    <option value="independent" ${formData.hygiene_status === 'independent' ? 'selected' : ''}>Independent</option>
                                    <option value="needs_supervision" ${formData.hygiene_status === 'needs_supervision' ? 'selected' : ''}>Needs Supervision</option>
                                    <option value="dependent" ${formData.hygiene_status === 'dependent' ? 'selected' : ''}>Dependent</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Toileting</label>
                                <select name="toileting_status">
                                    <option value="">Select</option>
                                    <option value="independent" ${formData.toileting_status === 'independent' ? 'selected' : ''}>Independent</option>
                                    <option value="needs_supervision" ${formData.toileting_status === 'needs_supervision' ? 'selected' : ''}>Needs Supervision</option>
                                    <option value="dependent" ${formData.toileting_status === 'dependent' ? 'selected' : ''}>Dependent</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Ambulation</label>
                                <select name="ambulation_status">
                                    <option value="">Select</option>
                                    <option value="independent" ${formData.ambulation_status === 'independent' ? 'selected' : ''}>Independent</option>
                                    <option value="needs_supervision" ${formData.ambulation_status === 'needs_supervision' ? 'selected' : ''}>Needs Supervision</option>
                                    <option value="dependent" ${formData.ambulation_status === 'dependent' ? 'selected' : ''}>Dependent</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Assistive Equipment</label>
                                <select name="use_of_assistive_equipment">
                                    <option value="">Select</option>
                                    <option value="walker" ${formData.use_of_assistive_equipment === 'walker' ? 'selected' : ''}>Walker</option>
                                    <option value="wheelchair" ${formData.use_of_assistive_equipment === 'wheelchair' ? 'selected' : ''}>Wheelchair</option>
                                    <option value="none" ${formData.use_of_assistive_equipment === 'none' ? 'selected' : ''}>None</option>
                                    <option value="other" ${formData.use_of_assistive_equipment === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Musculoskeletal Notes</label>
                            <textarea name="musculoskeletal_notes">${formData.musculoskeletal_notes || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Musculoskeletal Pain</label>
                            <input type="text" name="pain_musculoskeletal" value="${formData.pain_musculoskeletal || ''}">
                        </div>
                    </div>

                    <!-- Pain Assessment -->
                    <div class="form-section">
                        <h3>Pain Assessment</h3>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="pain_present" ${formData.pain_present ? 'checked' : ''}>
                                <label>Pain Present</label>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Pain Intensity (0-10)</label>
                                <input type="number" name="pain_intensity" min="0" max="10" value="${formData.pain_intensity || ''}">
                            </div>
                            <div class="form-group">
                                <label>Pain Location</label>
                                <input type="text" name="pain_location" value="${formData.pain_location || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Pain Frequency</label>
                                <select name="pain_frequency">
                                    <option value="">Select</option>
                                    <option value="constant" ${formData.pain_frequency === 'constant' ? 'selected' : ''}>Constant</option>
                                    <option value="intermittent" ${formData.pain_frequency === 'intermittent' ? 'selected' : ''}>Intermittent</option>
                                    <option value="occasional" ${formData.pain_frequency === 'occasional' ? 'selected' : ''}>Occasional</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Pain Duration</label>
                                <input type="text" name="pain_duration" value="${formData.pain_duration || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Pain Character</label>
                                <select name="pain_character">
                                    <option value="">Select</option>
                                    <option value="sharp" ${formData.pain_character === 'sharp' ? 'selected' : ''}>Sharp</option>
                                    <option value="dull" ${formData.pain_character === 'dull' ? 'selected' : ''}>Dull</option>
                                    <option value="burning" ${formData.pain_character === 'burning' ? 'selected' : ''}>Burning</option>
                                    <option value="throbbing" ${formData.pain_character === 'throbbing' ? 'selected' : ''}>Throbbing</option>
                                    <option value="other" ${formData.pain_character === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Action Taken</label>
                                <input type="text" name="pain_action_taken" value="${formData.pain_action_taken || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Fall Risk Assessment -->
                    <div class="form-section">
                        <h3>Fall Risk Assessment</h3>
                        <div class="form-group">
                            <label>Fall Risk Score</label>
                            <input type="number" name="fall_risk_score" value="${formData.fall_risk_score || ''}">
                        </div>
                        <div class="form-group">
                            <label>Fall Risk Details (JSON)</label>
                            <textarea name="fall_risk_details" placeholder='{"history": true, "secondary_diagnosis": false, ...}'>${formData.fall_risk_details ? JSON.stringify(formData.fall_risk_details, null, 2) : ''}</textarea>
                        </div>
                    </div>

                    <!-- Educational Needs -->
                    <div class="form-section">
                        <h3>Educational Needs</h3>
                        <div class="form-group">
                            <label>Educational Notes</label>
                            <textarea name="education_notes">${formData.education_notes || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Educational Needs (JSON)</label>
                            <textarea name="educational_needs" placeholder='{"medication": true, "nutrition": false, ...}'>${formData.educational_needs ? JSON.stringify(formData.educational_needs, null, 2) : ''}</textarea>
                        </div>
                    </div>

                    <!-- Specialized Assessments -->
                    <div class="form-section">
                        <h3>Specialized Assessments</h3>
                        <div class="form-group">
                            <label>Elderly Assessment (JSON)</label>
                            <textarea name="elderly_assessment" placeholder='{"mobility": "limited", "cognitive": "intact", ...}'>${formData.elderly_assessment ? JSON.stringify(formData.elderly_assessment, null, 2) : ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Disabled Assessment (JSON)</label>
                            <textarea name="disabled_assessment" placeholder='{"type": "physical", "severity": "moderate", ...}'>${formData.disabled_assessment ? JSON.stringify(formData.disabled_assessment, null, 2) : ''}</textarea>
                        </div>
                    </div>

                    <div class="actions" style="margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary">Save Form</button>
                        <button type="button" class="btn btn-secondary" onclick="app.showView('visits')">Back</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('content').innerHTML = html;

        // Form submission
        document.getElementById('nurse-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveNurseForm(new FormData(e.target), formData.id);
        });
    }

    async saveNurseForm(formData, formId) {
        const data = Object.fromEntries(formData);

        // Convert checkbox values
        ['gi_problems', 'weight_loss', 'weight_gain', 'refer_to_nutritionist', 'pain_present'].forEach(field => {
            data[field] = formData.get(field) === 'on';
        });

        try {
            const response = await this.apiCall(
                formId ? `/api/nurse-forms/${formId}` : '/api/nurse-forms',
                {
                    method: formId ? 'PUT' : 'POST',
                    body: JSON.stringify(data)
                }
            );

            if (response.ok) {
                alert('Form saved successfully');
                this.loadNurseForm(this.currentVisitId);
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch (error) {
            alert('Save failed');
        }
    }

    signNurseForm() {
        this.showSignatureModal('nurse');
    }

    showDoctorForm(visitId) {
        this.currentVisitId = visitId;
        this.loadDoctorForm(visitId);
    }

    async loadDoctorForm(visitId) {
        this.showLoading();

        try {
            const response = await this.apiCall(`/api/doctor-forms/${visitId}`);
            const formData = await response.json();

            this.renderDoctorForm(formData, visitId);
        } catch (error) {
            this.showError('content', 'خطأ في تحميل نموذج الطبيب');
        }
    }

    renderDoctorForm(formData, visitId) {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Doctor Radiology Evaluation</h2>
                    <div class="actions">
                        ${!formData.signed ? '<button class="btn btn-success" onclick="app.signDoctorForm()">Sign Form</button>' : '<span class="status-badge status-signed">Signed</span>'}
                    </div>
                </div>

                <form id="doctor-form">
                    <input type="hidden" name="visit_id" value="${visitId}">
                    <input type="hidden" name="doctor_id" value="${this.user.id}">

                    <!-- Patient Information -->
                    <div class="form-section">
                        <h3>Patient Information</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Full Name</label>
                                <input type="text" name="patient_full_name" value="${formData.patient_full_name || ''}">
                            </div>
                            <div class="form-group">
                                <label>Exam Date</label>
                                <input type="date" name="exam_date" value="${formData.exam_date || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Mobile</label>
                                <input type="tel" name="mobile" value="${formData.mobile || ''}">
                            </div>
                            <div class="form-group">
                                <label>Medical Number</label>
                                <input type="text" name="medical_number" value="${formData.medical_number || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Date of Birth</label>
                                <input type="date" name="dob" value="${formData.dob || ''}">
                            </div>
                            <div class="form-group">
                                <label>Age</label>
                                <input type="number" name="age" value="${formData.age || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Gender</label>
                                <select name="gender">
                                    <option value="">Select</option>
                                    <option value="male" ${formData.gender === 'male' ? 'selected' : ''}>Male</option>
                                    <option value="female" ${formData.gender === 'female' ? 'selected' : ''}>Female</option>
                                    <option value="other" ${formData.gender === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Diagnosis</label>
                                <input type="text" name="diagnosis" value="${formData.diagnosis || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Study Information -->
                    <div class="form-section">
                        <h3>Study Information</h3>
                        <div class="form-group">
                            <label>Study Reason</label>
                            <input type="text" name="study_reason" placeholder="Why is the study being done?" value="${formData.study_reason || ''}">
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="splint_present" ${formData.splint_present ? 'checked' : ''}>
                                <label>Is there a splint/cast?</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Splint Notes</label>
                            <textarea name="splint_notes">${formData.splint_notes || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Chronic Disease</label>
                            <input type="text" name="chronic_disease" value="${formData.chronic_disease || ''}">
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="pacemaker" ${formData.pacemaker ? 'checked' : ''}>
                                <label>Pacemaker</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Implants</label>
                            <input type="text" name="implants" placeholder="Screws, plates, artificial joints" value="${formData.implants || ''}">
                        </div>
                        <div class="form-group">
                            <label>Pregnancy Status (for women)</label>
                            <select name="pregnancy_status">
                                <option value="">Select</option>
                                <option value="unknown" ${formData.pregnancy_status === 'unknown' ? 'selected' : ''}>Unknown</option>
                                <option value="yes" ${formData.pregnancy_status === 'yes' ? 'selected' : ''}>Yes</option>
                                <option value="no" ${formData.pregnancy_status === 'no' ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>

                    <!-- Clinical Information -->
                    <div class="form-section">
                        <h3>Clinical Information</h3>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="pain_numbness" ${formData.pain_numbness ? 'checked' : ''}>
                                <label>Pain or Numbness</label>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Pain Site</label>
                                <input type="text" name="pain_site" value="${formData.pain_site || ''}">
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" name="spinal_deformity" ${formData.spinal_deformity ? 'checked' : ''}>
                                <label>Spinal Deformity</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Spinal Deformity Details</label>
                            <textarea name="spinal_deformity_details">${formData.spinal_deformity_details || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="swelling" ${formData.swelling ? 'checked' : ''}>
                                <label>Swelling</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Swelling Site</label>
                            <input type="text" name="swelling_site" value="${formData.swelling_site || ''}">
                        </div>
                        <div class="form-group">
                            <label>Neurological Symptoms</label>
                            <input type="text" name="neuro_symptoms" placeholder="Headache, visual, hearing, imbalance" value="${formData.neuro_symptoms || ''}">
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="fever" ${formData.fever ? 'checked' : ''}>
                                <label>Fever</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Previous Surgeries (+ dates)</label>
                            <textarea name="surgeries">${formData.surgeries || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Tumor History</label>
                            <input type="text" name="tumor_history" value="${formData.tumor_history || ''}">
                        </div>
                        <div class="form-group">
                            <label>Previous Investigations</label>
                            <textarea name="previous_investigations">${formData.previous_investigations || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="previous_disc" ${formData.previous_disc ? 'checked' : ''}>
                                <label>Previous Disc/Herniation</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" name="meds_increase_fall_risk" ${formData.meds_increase_fall_risk ? 'checked' : ''}>
                                <label>Medications that increase fall risk</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Current Medication</label>
                            <textarea name="current_medication">${formData.current_medication || ''}</textarea>
                        </div>
                    </div>

                    <!-- Technical Parameters -->
                    <div class="form-section">
                        <h3>Technical Parameters</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>CTDIvol (mGy)</label>
                                <input type="text" name="ctd1vol" value="${formData.ctd1vol || ''}">
                            </div>
                            <div class="form-group">
                                <label>DLP (mGy·cm)</label>
                                <input type="text" name="dlp" value="${formData.dlp || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>kV</label>
                                <input type="text" name="kv" value="${formData.kv || ''}">
                            </div>
                            <div class="form-group">
                                <label>mAs</label>
                                <input type="text" name="mas" value="${formData.mas || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Findings -->
                    <div class="form-section">
                        <h3>Findings & Interpretation</h3>
                        <div class="form-group">
                            <label>Radiological Findings</label>
                            <textarea name="findings" rows="6" placeholder="Enter radiological findings and interpretation here...">${formData.findings || ''}</textarea>
                        </div>
                    </div>

                    <div class="actions" style="margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary">Save Form</button>
                        <button type="button" class="btn btn-secondary" onclick="app.showView('visits')">Back</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('content').innerHTML = html;

        // Form submission
        document.getElementById('doctor-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveDoctorForm(new FormData(e.target), formData.id);
        });
    }

    async saveDoctorForm(formData, formId) {
        const data = Object.fromEntries(formData);

        // Convert checkbox values
        ['splint_present', 'pacemaker', 'pain_numbness', 'spinal_deformity', 'swelling', 'fever', 'previous_disc', 'meds_increase_fall_risk'].forEach(field => {
            data[field] = formData.get(field) === 'on';
        });

        try {
            const response = await this.apiCall(
                formId ? `/api/doctor-forms/${formId}` : '/api/doctor-forms',
                {
                    method: formId ? 'PUT' : 'POST',
                    body: JSON.stringify(data)
                }
            );

            if (response.ok) {
                alert('Form saved successfully');
                this.loadDoctorForm(this.currentVisitId);
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch (error) {
            alert('Save failed');
        }
    }

    signDoctorForm() {
        this.showSignatureModal('doctor');
    }

    showSignatureModal(type) {
        document.getElementById('signature-modal').style.display = 'flex';
        this.signatureType = type;

        // Initialize canvas
        const canvas = document.getElementById('signature-canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let isDrawing = false;

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrawing(e.touches[0]);
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            draw(e.touches[0]);
        });
        canvas.addEventListener('touchend', stopDrawing);

        function startDrawing(e) {
            isDrawing = true;
            ctx.beginPath();
            ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
        }

        function draw(e) {
            if (!isDrawing) return;
            ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
            ctx.stroke();
        }

        function stopDrawing() {
            isDrawing = false;
        }
    }

    clearSignature() {
        const canvas = document.getElementById('signature-canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    async saveSignature() {
        const canvas = document.getElementById('signature-canvas');
        const signatureData = canvas.toDataURL('image/png');

        try {
            const endpoint = this.signatureType === 'nurse' ? `/api/nurse-forms/${this.currentFormId}` : `/api/doctor-forms/${this.currentFormId}`;
            const response = await this.apiCall(endpoint, {
                method: 'PUT',
                body: JSON.stringify({
                    signed: true,
                    signature_data: signatureData,
                    signed_at: new Date().toISOString()
                })
            });

            if (response.ok) {
                this.closeSignatureModal();
                if (this.signatureType === 'nurse') {
                    this.loadNurseForm(this.currentVisitId);
                } else {
                    this.loadDoctorForm(this.currentVisitId);
                }
                alert('Signature saved successfully');
            } else {
                const error = await response.json();
                alert('خطأ: ' + error.error);
            }
        } catch (error) {
            alert('خطأ في حفظ التوقيع');
        }
    }

    closeSignatureModal() {
        document.getElementById('signature-modal').style.display = 'none';
    }

    showModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    showLoading() {
        document.getElementById('content').innerHTML = '<div class="loading">Loading...</div>';
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        element.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

// Initialize the application
const app = new RadiologyApp();