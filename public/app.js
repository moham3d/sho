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
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
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
            this.showError('login-error', 'خطأ في الاتصال');
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
            'admin': 'مدير',
            'doctor': 'طبيب',
            'nurse': 'ممرض'
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
                    <h2 class="card-title">المرضى</h2>
                    <button class="btn btn-primary" onclick="app.showPatientModal()">إضافة مريض جديد</button>
                </div>
                <div class="search-section" style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                    <input type="text" id="patient-search" placeholder="البحث عن مريض..." style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;">
                </div>
                <ul class="patient-list" id="patient-list">
                    ${patients.map(patient => `
                        <li class="patient-item" onclick="app.showPatientModal(${patient.id})">
                            <div class="patient-info">
                                <div>
                                    <div class="patient-name">${patient.full_name}</div>
                                    <div class="patient-details">
                                        الرقم القومي: ${patient.national_id || 'غير محدد'} |
                                        رقم الهاتف: ${patient.mobile || 'غير محدد'} |
                                        العمر: ${patient.age || 'غير محدد'}
                                    </div>
                                </div>
                                <div class="actions">
                                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.createVisit(${patient.id})">إنشاء زيارة</button>
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
                    <h2 class="card-title">الزيارات</h2>
                </div>
                <ul class="visit-list">
                    ${visits.map(visit => `
                        <li class="visit-item" onclick="app.showVisitModal(${visit.id})">
                            <div class="visit-info">
                                <div>
                                    <div class="visit-patient">${visit.patient_name}</div>
                                    <div class="visit-details">
                                        تاريخ الزيارة: ${new Date(visit.visit_date).toLocaleDateString('ar-EG')} |
                                        الحالة: <span class="status-badge status-${visit.status}">${this.getStatusName(visit.status)}</span>
                                    </div>
                                    <div class="visit-details">
                                        الممرض: ${visit.nurse_name || 'غير محدد'} |
                                        الطبيب: ${visit.doctor_name || 'غير محدد'}
                                    </div>
                                </div>
                                <div class="actions">
                                    ${this.user.role === 'nurse' || this.user.role === 'admin' ?
                                        `<button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.showNurseForm(${visit.id})">تقييم الممرض</button>` : ''}
                                    ${this.user.role === 'doctor' || this.user.role === 'admin' ?
                                        `<button class="btn btn-sm btn-success" onclick="event.stopPropagation(); app.showDoctorForm(${visit.id})">تقييم الطبيب</button>` : ''}
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
            'open': 'مفتوح',
            'in_progress': 'قيد التنفيذ',
            'signed': 'موقع',
            'closed': 'مغلق'
        };
        return statuses[status] || status;
    }

    showPatientModal(patientId = null) {
        const title = patientId ? 'تعديل بيانات المريض' : 'إضافة مريض جديد';
        const patient = patientId ? {} : {}; // Would load patient data if editing

        const html = `
            <form id="patient-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>الاسم الكامل *</label>
                        <input type="text" name="full_name" required>
                    </div>
                    <div class="form-group">
                        <label>الرقم القومي</label>
                        <input type="text" name="national_id">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>رقم الهاتف</label>
                        <input type="tel" name="mobile">
                    </div>
                    <div class="form-group">
                        <label>تاريخ الميلاد</label>
                        <input type="date" name="dob">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>العمر</label>
                        <input type="number" name="age">
                    </div>
                    <div class="form-group">
                        <label>الجنس</label>
                        <select name="gender">
                            <option value="">اختر</option>
                            <option value="male">ذكر</option>
                            <option value="female">أنثى</option>
                            <option value="other">أخرى</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>رقم المريض الطبي</label>
                        <input type="text" name="medical_number">
                    </div>
                    <div class="form-group">
                        <label>التشخيص</label>
                        <input type="text" name="diagnosis">
                    </div>
                </div>
                <div class="form-group">
                    <label>معلومات الاتصال الإضافية (JSON)</label>
                    <textarea name="contact_info" placeholder='{"email": "patient@example.com", "address": "القاهرة"}'></textarea>
                </div>
                <div class="actions" style="margin-top: 2rem;">
                    <button type="submit" class="btn btn-primary">حفظ</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">إلغاء</button>
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
                alert('خطأ: ' + error.error);
            }
        } catch (error) {
            alert('خطأ في الحفظ');
        }
    }

    async createVisit(patientId) {
        try {
            const response = await this.apiCall('/api/visits', {
                method: 'POST',
                body: JSON.stringify({ patient_id: patientId })
            });

            if (response.ok) {
                alert('تم إنشاء الزيارة بنجاح');
                this.loadVisits();
            } else {
                const error = await response.json();
                alert('خطأ: ' + error.error);
            }
        } catch (error) {
            alert('خطأ في إنشاء الزيارة');
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
                    <h2 class="card-title">تقييم الممرض</h2>
                    <div class="actions">
                        ${!formData.signed ? '<button class="btn btn-success" onclick="app.signNurseForm()">توقيع النموذج</button>' : '<span class="status-badge status-signed">موقع</span>'}
                    </div>
                </div>

                <form id="nurse-form">
                    <input type="hidden" name="visit_id" value="${visitId}">
                    <input type="hidden" name="nurse_id" value="${this.user.id}">

                    <!-- Basic Screening -->
                    <div class="form-section">
                        <h3>التقييم الأساسي</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>طريقة الوصول</label>
                                <select name="arrival_mode">
                                    <option value="">اختر</option>
                                    <option value="ambulatory">سير ذاتي</option>
                                    <option value="stretcher">نقالة</option>
                                    <option value="chair">كرسي متحرك</option>
                                    <option value="other">أخرى</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>الشكوي الحالية</label>
                                <input type="text" name="chief_complaint" value="${formData.chief_complaint || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>وصف العمر</label>
                                <input type="text" name="age_text" value="${formData.age_text || ''}">
                            </div>
                            <div class="form-group">
                                <label>مرافق من</label>
                                <select name="accompanied_by">
                                    <option value="">اختر</option>
                                    <option value="spouse">زوج/زوجة</option>
                                    <option value="relative">قريب</option>
                                    <option value="other">أخرى</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>اللغة المنطوقة</label>
                            <select name="language_spoken">
                                <option value="">اختر</option>
                                <option value="Arabic">عربي</option>
                                <option value="English">إنجليزي</option>
                                <option value="other">أخرى</option>
                            </select>
                        </div>
                    </div>

                    <!-- Vital Signs -->
                    <div class="form-section">
                        <h3>العلامات الحيوية</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>درجة الحرارة (°C)</label>
                                <input type="text" name="temp" value="${formData.temp || ''}">
                            </div>
                            <div class="form-group">
                                <label>النبض (ضربة/دقيقة)</label>
                                <input type="text" name="pulse" value="${formData.pulse || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>ضغط الدم</label>
                                <input type="text" name="bp" placeholder="120/80" value="${formData.bp || ''}">
                            </div>
                            <div class="form-group">
                                <label>معدل التنفس</label>
                                <input type="text" name="resp_rate" value="${formData.resp_rate || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>تشبع الأكسجين (%)</label>
                                <input type="text" name="o2_saturation" value="${formData.o2_saturation || ''}">
                            </div>
                            <div class="form-group">
                                <label>سكر الدم</label>
                                <input type="text" name="blood_sugar" value="${formData.blood_sugar || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>الوزن (كجم)</label>
                                <input type="text" name="weight" value="${formData.weight || ''}">
                            </div>
                            <div class="form-group">
                                <label>الطول (سم)</label>
                                <input type="text" name="height" value="${formData.height || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Psychosocial Assessment -->
                    <div class="form-section">
                        <h3>التقييم النفسي والاجتماعي</h3>
                        <div class="form-group">
                            <label>التاريخ النفسي والاجتماعي</label>
                            <textarea name="psychosocial_history">${formData.psychosocial_history || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>الحالة النفسية</label>
                                <select name="psychological_problem">
                                    <option value="">اختر</option>
                                    <option value="anxious">قلق</option>
                                    <option value="agitated">هيجان</option>
                                    <option value="depressed">اكتئاب</option>
                                    <option value="none">لا توجد مشاكل</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>العوائد الخاصة</label>
                                <input type="text" name="special_habits" placeholder="التدخين، إلخ" value="${formData.special_habits || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>الحساسية</label>
                                <select name="allergies">
                                    <option value="">اختر</option>
                                    <option value="yes">نعم</option>
                                    <option value="no">لا</option>
                                    <option value="unknown">غير معروف</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>تفاصيل الحساسية</label>
                                <input type="text" name="allergies_details" value="${formData.allergies_details || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Nutritional Assessment -->
                    <div class="form-section">
                        <h3>التقييم التغذوي</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>النظام الغذائي</label>
                                <select name="diet">
                                    <option value="">اختر</option>
                                    <option value="regular">عادي</option>
                                    <option value="special">خاص</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>الشهية</label>
                                <select name="appetite">
                                    <option value="">اختر</option>
                                    <option value="good">جيدة</option>
                                    <option value="poor">ضعيفة</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="gi_problems" ${formData.gi_problems ? 'checked' : ''}>
                                <label>مشاكل في الجهاز الهضمي</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>تفاصيل مشاكل الجهاز الهضمي</label>
                            <textarea name="gi_problems_details">${formData.gi_problems_details || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="weight_loss" ${formData.weight_loss ? 'checked' : ''}>
                                <label>فقدان وزن</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" name="weight_gain" ${formData.weight_gain ? 'checked' : ''}>
                                <label>زيادة وزن</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" name="refer_to_nutritionist" ${formData.refer_to_nutritionist ? 'checked' : ''}>
                                <label>إحالة لأخصائي تغذية</label>
                            </div>
                        </div>
                    </div>

                    <!-- Functional Assessment -->
                    <div class="form-section">
                        <h3>التقييم الوظيفي</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>الاعتماد على الذات</label>
                                <select name="self_care_status">
                                    <option value="">اختر</option>
                                    <option value="independent">مستقل</option>
                                    <option value="needs_supervision">يحتاج مساعدة</option>
                                    <option value="dependent">معتمد</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>الأكل</label>
                                <select name="feeding_status">
                                    <option value="">اختر</option>
                                    <option value="independent">مستقل</option>
                                    <option value="needs_supervision">يحتاج مساعدة</option>
                                    <option value="dependent">معتمد</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>النظافة</label>
                                <select name="hygiene_status">
                                    <option value="">اختر</option>
                                    <option value="independent">مستقل</option>
                                    <option value="needs_supervision">يحتاج مساعدة</option>
                                    <option value="dependent">معتمد</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>التبول/التغوط</label>
                                <select name="toileting_status">
                                    <option value="">اختر</option>
                                    <option value="independent">مستقل</option>
                                    <option value="needs_supervision">يحتاج مساعدة</option>
                                    <option value="dependent">معتمد</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>الحركة</label>
                                <select name="ambulation_status">
                                    <option value="">اختر</option>
                                    <option value="independent">مستقل</option>
                                    <option value="needs_supervision">يحتاج مساعدة</option>
                                    <option value="dependent">معتمد</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>استخدام المعينات</label>
                                <select name="use_of_assistive_equipment">
                                    <option value="">اختر</option>
                                    <option value="walker">عكاز</option>
                                    <option value="wheelchair">كرسي متحرك</option>
                                    <option value="none">لا يوجد</option>
                                    <option value="other">أخرى</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>ملاحظات عضلية هيكلية</label>
                            <textarea name="musculoskeletal_notes">${formData.musculoskeletal_notes || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>ألم عضلي هيكلي</label>
                            <input type="text" name="pain_musculoskeletal" value="${formData.pain_musculoskeletal || ''}">
                        </div>
                    </div>

                    <!-- Pain Assessment -->
                    <div class="form-section">
                        <h3>تقييم الألم</h3>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="pain_present" ${formData.pain_present ? 'checked' : ''}>
                                <label>يوجد ألم</label>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>شدة الألم (0-10)</label>
                                <input type="number" name="pain_intensity" min="0" max="10" value="${formData.pain_intensity || ''}">
                            </div>
                            <div class="form-group">
                                <label>موقع الألم</label>
                                <input type="text" name="pain_location" value="${formData.pain_location || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>تكرار الألم</label>
                                <select name="pain_frequency">
                                    <option value="">اختر</option>
                                    <option value="constant">مستمر</option>
                                    <option value="intermittent">متقطع</option>
                                    <option value="occasional">أحياناً</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>مدة الألم</label>
                                <input type="text" name="pain_duration" value="${formData.pain_duration || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>طبيعة الألم</label>
                                <select name="pain_character">
                                    <option value="">اختر</option>
                                    <option value="sharp">حاد</option>
                                    <option value="dull">ممل</option>
                                    <option value="burning">حارق</option>
                                    <option value="throbbing">نابض</option>
                                    <option value="other">أخرى</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>الإجراء المتخذ</label>
                                <input type="text" name="pain_action_taken" value="${formData.pain_action_taken || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Fall Risk Assessment -->
                    <div class="form-section">
                        <h3>تقييم خطر السقوط</h3>
                        <div class="form-group">
                            <label>درجة خطر السقوط</label>
                            <input type="number" name="fall_risk_score" value="${formData.fall_risk_score || ''}">
                        </div>
                        <div class="form-group">
                            <label>تفاصيل تقييم خطر السقوط (JSON)</label>
                            <textarea name="fall_risk_details" placeholder='{"history": true, "secondary_diagnosis": false, ...}'>${formData.fall_risk_details ? JSON.stringify(formData.fall_risk_details, null, 2) : ''}</textarea>
                        </div>
                    </div>

                    <!-- Educational Needs -->
                    <div class="form-section">
                        <h3>الاحتياجات التعليمية</h3>
                        <div class="form-group">
                            <label>ملاحظات تعليمية</label>
                            <textarea name="education_notes">${formData.education_notes || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>الاحتياجات التعليمية (JSON)</label>
                            <textarea name="educational_needs" placeholder='{"medication": true, "nutrition": false, ...}'>${formData.educational_needs ? JSON.stringify(formData.educational_needs, null, 2) : ''}</textarea>
                        </div>
                    </div>

                    <!-- Specialized Assessments -->
                    <div class="form-section">
                        <h3>التقييمات المتخصصة</h3>
                        <div class="form-group">
                            <label>تقييم كبار السن (JSON)</label>
                            <textarea name="elderly_assessment" placeholder='{"mobility": "limited", "cognitive": "intact", ...}'>${formData.elderly_assessment ? JSON.stringify(formData.elderly_assessment, null, 2) : ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>تقييم المعاقين (JSON)</label>
                            <textarea name="disabled_assessment" placeholder='{"type": "physical", "severity": "moderate", ...}'>${formData.disabled_assessment ? JSON.stringify(formData.disabled_assessment, null, 2) : ''}</textarea>
                        </div>
                    </div>

                    <div class="actions" style="margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary">حفظ النموذج</button>
                        <button type="button" class="btn btn-secondary" onclick="app.showView('visits')">العودة</button>
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
                alert('تم حفظ النموذج بنجاح');
                this.loadNurseForm(this.currentVisitId);
            } else {
                const error = await response.json();
                alert('خطأ: ' + error.error);
            }
        } catch (error) {
            alert('خطأ في الحفظ');
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
                    <h2 class="card-title">تقييم الطبيب - الأشعة</h2>
                    <div class="actions">
                        ${!formData.signed ? '<button class="btn btn-success" onclick="app.signDoctorForm()">توقيع النموذج</button>' : '<span class="status-badge status-signed">موقع</span>'}
                    </div>
                </div>

                <form id="doctor-form">
                    <input type="hidden" name="visit_id" value="${visitId}">
                    <input type="hidden" name="doctor_id" value="${this.user.id}">

                    <!-- Patient Information -->
                    <div class="form-section">
                        <h3>معلومات المريض</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>الاسم الكامل</label>
                                <input type="text" name="patient_full_name" value="${formData.patient_full_name || ''}">
                            </div>
                            <div class="form-group">
                                <label>تاريخ الفحص</label>
                                <input type="date" name="exam_date" value="${formData.exam_date || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>رقم الهاتف</label>
                                <input type="tel" name="mobile" value="${formData.mobile || ''}">
                            </div>
                            <div class="form-group">
                                <label>رقم المريض الطبي</label>
                                <input type="text" name="medical_number" value="${formData.medical_number || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>تاريخ الميلاد</label>
                                <input type="date" name="dob" value="${formData.dob || ''}">
                            </div>
                            <div class="form-group">
                                <label>العمر</label>
                                <input type="number" name="age" value="${formData.age || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>الجنس</label>
                                <select name="gender">
                                    <option value="">اختر</option>
                                    <option value="male" ${formData.gender === 'male' ? 'selected' : ''}>ذكر</option>
                                    <option value="female" ${formData.gender === 'female' ? 'selected' : ''}>أنثى</option>
                                    <option value="other" ${formData.gender === 'other' ? 'selected' : ''}>أخرى</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>التشخيص</label>
                                <input type="text" name="diagnosis" value="${formData.diagnosis || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Study Information -->
                    <div class="form-section">
                        <h3>معلومات الدراسة</h3>
                        <div class="form-group">
                            <label>سبب الدراسة</label>
                            <input type="text" name="study_reason" placeholder="لماذا تتم الدراسة؟" value="${formData.study_reason || ''}">
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="splint_present" ${formData.splint_present ? 'checked' : ''}>
                                <label>هل يوجد جبس؟</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>ملاحظات الجبس</label>
                            <textarea name="splint_notes">${formData.splint_notes || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>الأمراض المزمنة</label>
                            <input type="text" name="chronic_disease" value="${formData.chronic_disease || ''}">
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="pacemaker" ${formData.pacemaker ? 'checked' : ''}>
                                <label>ناظمة قلبية</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>الزرعات</label>
                            <input type="text" name="implants" placeholder="مسامير، صفائح، مفاصل صناعية" value="${formData.implants || ''}">
                        </div>
                        <div class="form-group">
                            <label>حالة الحمل (للنساء)</label>
                            <select name="pregnancy_status">
                                <option value="">اختر</option>
                                <option value="unknown" ${formData.pregnancy_status === 'unknown' ? 'selected' : ''}>غير معروف</option>
                                <option value="yes" ${formData.pregnancy_status === 'yes' ? 'selected' : ''}>نعم</option>
                                <option value="no" ${formData.pregnancy_status === 'no' ? 'selected' : ''}>لا</option>
                            </select>
                        </div>
                    </div>

                    <!-- Clinical Information -->
                    <div class="form-section">
                        <h3>المعلومات السريرية</h3>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="pain_numbness" ${formData.pain_numbness ? 'checked' : ''}>
                                <label>ألم أو خدر</label>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>موقع الألم</label>
                                <input type="text" name="pain_site" value="${formData.pain_site || ''}">
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" name="spinal_deformity" ${formData.spinal_deformity ? 'checked' : ''}>
                                <label>تشوه فقري</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>تفاصيل التشوه الفقري</label>
                            <textarea name="spinal_deformity_details">${formData.spinal_deformity_details || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="swelling" ${formData.swelling ? 'checked' : ''}>
                                <label>تورم</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>موقع التورم</label>
                            <input type="text" name="swelling_site" value="${formData.swelling_site || ''}">
                        </div>
                        <div class="form-group">
                            <label>الأعراض العصبية</label>
                            <input type="text" name="neuro_symptoms" placeholder="صداع، بصري، سمعي، عدم توازن" value="${formData.neuro_symptoms || ''}">
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="fever" ${formData.fever ? 'checked' : ''}>
                                <label>حمى</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>العمليات الجراحية السابقة (+ تواريخ)</label>
                            <textarea name="surgeries">${formData.surgeries || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>تاريخ الورم</label>
                            <input type="text" name="tumor_history" value="${formData.tumor_history || ''}">
                        </div>
                        <div class="form-group">
                            <label>التحقيقات السابقة</label>
                            <textarea name="previous_investigations">${formData.previous_investigations || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="previous_disc" ${formData.previous_disc ? 'checked' : ''}>
                                <label>قرص سابق/انزلاق</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" name="meds_increase_fall_risk" ${formData.meds_increase_fall_risk ? 'checked' : ''}>
                                <label>أدوية تزيد من خطر السقوط</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>الأدوية الحالية</label>
                            <textarea name="current_medication">${formData.current_medication || ''}</textarea>
                        </div>
                    </div>

                    <!-- Technical Parameters -->
                    <div class="form-section">
                        <h3>المعلمات الفنية</h3>
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
                        <h3>النتائج والتفسير</h3>
                        <div class="form-group">
                            <label>النتائج الإشعاعية</label>
                            <textarea name="findings" rows="6" placeholder="اكتب النتائج والتفسير الإشعاعي هنا...">${formData.findings || ''}</textarea>
                        </div>
                    </div>

                    <div class="actions" style="margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary">حفظ النموذج</button>
                        <button type="button" class="btn btn-secondary" onclick="app.showView('visits')">العودة</button>
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
                alert('تم حفظ النموذج بنجاح');
                this.loadDoctorForm(this.currentVisitId);
            } else {
                const error = await response.json();
                alert('خطأ: ' + error.error);
            }
        } catch (error) {
            alert('خطأ في الحفظ');
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
                alert('تم التوقيع بنجاح');
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
        document.getElementById('content').innerHTML = '<div class="loading">جاري التحميل...</div>';
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        element.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

// Initialize the application
const app = new RadiologyApp();