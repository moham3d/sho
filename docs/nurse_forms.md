-- Table for General Sheet (X-Ray MRI CT) - SH.MR.FRM.03
CREATE TABLE radiology_examination_form (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_full_name VARCHAR(255) COMMENT 'اسم المريض رباعي',
    examination_date DATE COMMENT 'تاريخ اليوم',
    mobile_number VARCHAR(20) COMMENT 'رقم الموبايل',
    gender VARCHAR(10) COMMENT 'ذكر/انثى',
    age INT COMMENT 'السن',
    medical_number VARCHAR(50) COMMENT 'الرقم الطبي',
    date_of_birth DATE COMMENT 'تاريخ الميلاد',
    diagnosis TEXT COMMENT 'التشخيص',
    ctd1vol VARCHAR(50) COMMENT 'CTD1vol',
    dlp VARCHAR(50) COMMENT 'DLP',
    kv VARCHAR(50) COMMENT 'KV',
    mas VARCHAR(50) COMMENT 'MAs',
    reason_for_examination TEXT COMMENT 'سبب اجراء الفحص',
    gypsum_splint_presence BOOLEAN COMMENT 'هل يوجد جبيره جبس بمكان عمل الأشعة',
    xrays_before_splint BOOLEAN COMMENT 'احضار صور الأشعة قبل تركيب الجبيره',
    chronic_diseases TEXT COMMENT 'أمراض مزمنة',
    pacemaker BOOLEAN COMMENT 'جهاز منظم لضربات القلب',
    slats_screws_artificial_joints BOOLEAN COMMENT 'شرائح - مسامير - مفاصل صناعية',
    pregnancy_status BOOLEAN COMMENT 'وجود حمل',
    pain_numbness TEXT COMMENT 'ألم - تنميل - حرقان',
    pain_numbness_location TEXT COMMENT 'مكان وامتداد الألم',
    spinal_deformities BOOLEAN COMMENT 'تشوهات أو إعوجاج في العمود الفقري',
    swelling BOOLEAN COMMENT 'تورم',
    swelling_location TEXT COMMENT 'مكان التورم',
    headache_visual_troubles_hearing_problems_imbalance TEXT COMMENT 'صداع - مشاكل في النظر - السمع - عدم إتزان',
    fever BOOLEAN COMMENT 'ارتفاع درجة الحرارة',
    previous_operations TEXT COMMENT 'عمليات سابقة وتواريخها',
    tumor_history BOOLEAN COMMENT 'تاريخ مرضى لأي أورام',
    tumor_location_type TEXT COMMENT 'مكان ونوع الورم',
    previous_investigations TEXT COMMENT 'فحوصات أشعة سابقة',
    disc_problems BOOLEAN COMMENT 'انزلاق غضروفي',
    fall_risk_medications TEXT COMMENT 'أدوية تسبب نعاس أو دوار أو عدم اتزان',
    current_medications TEXT COMMENT 'أدوية حاليا',
    patient_signature VARCHAR(255) COMMENT 'توقيع المريض',
    doctor_signature VARCHAR(255) COMMENT 'توقيع الطبيب',
    form_number VARCHAR(20) DEFAULT 'SH.MR.FRM.03' COMMENT 'رقم النموذج'
);




-- Table for Nursing Assessment and Evaluation - SH.MR.FRM.05
CREATE TABLE nursing_assessment_form (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Patient Arrival and Basic Information
    mode_of_arrival VARCHAR(50) COMMENT 'بيمشي علي قدمه/اسعاف/متحرك كرسي/نقالة/أخرى',
    chief_complains TEXT COMMENT 'الشكوي الحالية',
    age INT COMMENT 'العمر',
    accompanied_by VARCHAR(50) COMMENT 'زوج/قريب/أخرى',
    language_spoken VARCHAR(50) COMMENT 'عربي/إنجليزي/أخرى',
    
    -- VITAL SIGNS
    temp DECIMAL(4,1) COMMENT 'الحرارة درجة (°C)',
    pulse INT COMMENT 'النبض (b/min)',
    bp_systolic INT COMMENT 'ضغط الدم الانقباضي (mmHg)',
    bp_diastolic INT COMMENT 'ضغط الدم الانبساطي (mmHg)',
    resp_rate INT COMMENT 'معدل التنفس (/min)',
    o2_saturation INT COMMENT 'تشبع الاكسجين (%)',
    blood_sugar DECIMAL(10,2) COMMENT 'سكر الدم (mg/dl)',
    weight DECIMAL(10,2) COMMENT 'الوزن (kg)',
    height DECIMAL(10,2) COMMENT 'الطول (cm)',
    
    -- Psychosocial History
    psychological_problem VARCHAR(100) COMMENT 'المشكلة النفسية',
    psychological_problem_other TEXT COMMENT 'تفاصيل أخرى للمشكلة النفسية',
    smoking BOOLEAN COMMENT 'التدخين',
    
    -- ALLERGIES
    allergies_recorded BOOLEAN COMMENT 'هل تم تسجيل الحساسية',
    allergies_medication BOOLEAN COMMENT 'حساسية للأدوية',
    allergies_food BOOLEAN COMMENT 'حساسية للطعام',
    allergies_other BOOLEAN COMMENT 'حساسية أخرى',
    allergies_other_specify TEXT COMMENT 'تفاصيل الحساسية الأخرى',
    
    -- Nutritional Screening
    diet_type VARCHAR(100) COMMENT 'نوع الغذاء',
    diet_special_specify TEXT COMMENT 'تفاصيل الغذاء الخاص',
    appetite VARCHAR(20) COMMENT 'الشهية',
    gi_problems BOOLEAN COMMENT 'مشاكل الجهاز الهضمي',
    weight_loss BOOLEAN COMMENT 'فقدان الوزن',
    weight_gain BOOLEAN COMMENT 'زيادة الوزن',
    gi_problems_specify TEXT COMMENT 'تفاصيل مشاكل الجهاز الهضمي',
    refer_to_nutritionist BOOLEAN COMMENT 'الإحالة إلى أخصائي تغذية',
    
    -- Functional Assessment
    self_caring_feeding VARCHAR(50) COMMENT 'الاعتناء بالذات: التغذية',
    self_caring_hygiene VARCHAR(50) COMMENT 'الاعتناء بالذات: النظافة الشخصية',
    self_caring_toileting VARCHAR(50) COMMENT 'الاعتناء بالذات: قضاء الحاجة',
    self_caring_ambulation VARCHAR(50) COMMENT 'الاعتناء بالذات: التنقل',
    
    musculoskeletal_condition VARCHAR(100) COMMENT 'الحالة العضلية/العضمية',
    musculoskeletal_pain_location TEXT COMMENT 'مكان الألم العضلي',
    
    assisting_equipment VARCHAR(100) COMMENT 'أجهزة المساعدة',
    assisting_equipment_other TEXT COMMENT 'تفاصيل أجهزة المساعدة الأخرى',
    
    -- Educational Need Assessment
    edu_no_needs_identified BOOLEAN COMMENT 'لا توجد احتياجات تعليمية',
    edu_medication_use BOOLEAN COMMENT 'تثقيف حول استخدام الدواء',
    edu_nutrition_diet BOOLEAN COMMENT 'تثقيف حول التغذية والنظام الغذائي',
    edu_medical_equipment BOOLEAN COMMENT 'تثقيف حول استخدام الأجهزة الطبية',
    edu_rehabilitation_techniques BOOLEAN COMMENT 'تثقيف حول تقنيات التأهيل',
    edu_medication_food_interactions BOOLEAN COMMENT 'تثقيف حول تفاعلات الدواء والغذاء',
    edu_pain_other_symptoms BOOLEAN COMMENT 'تثقيف حول الألم والأعراض الأخرى',
    edu_fall_risk BOOLEAN COMMENT 'تثقيف حول مخاطر السقوط',
    edu_other BOOLEAN COMMENT 'تثقيف آخر',
    edu_other_specify TEXT COMMENT 'تفاصيل التثقيف الآخر',
    
    -- Pain Assessment
    pain_identified BOOLEAN COMMENT 'تم تحديد الألم',
    pain_intensity INT COMMENT 'شدة الألم',
    pain_location TEXT COMMENT 'مكان الألم',
    pain_frequency TEXT COMMENT 'تكرار الألم',
    pain_duration TEXT COMMENT 'مدة الألم',
    pain_character TEXT COMMENT 'طبيعة الألم',
    pain_action_taken TEXT COMMENT 'الإجراء المتبع للألم',
    pain_score INT COMMENT 'تقييم الألم',
    
    -- Fall Assessment for Adults (Modified Morse Fall Scale)
    fall_adult_history_falling BOOLEAN COMMENT 'سقوط سابق في آخر 3 أشهر',
    fall_adult_secondary_diagnosis BOOLEAN COMMENT 'أمراض مصاحبة رئيسية',
    fall_adult_ambulatory_aid VARCHAR(50) COMMENT 'عكاز/مشاية/كرسي متحرك',
    fall_adult_iv_heparin BOOLEAN COMMENT 'محاليل وريدية مستمرة',
    fall_adult_gait VARCHAR(50) COMMENT 'حركة المريض',
    fall_adult_mental_status VARCHAR(50) COMMENT 'الحالة الذهنية',
    fall_adult_total_score INT COMMENT 'مجموع نقاط مورس',
    fall_adult_risk_level VARCHAR(20) COMMENT 'مستوى خطر السقوط',
    
    -- Fall Assessment for Children (Humpty Dumpty Scale)
    fall_child_age_score INT COMMENT 'درجة العمر',
    fall_child_gender_score INT COMMENT 'درجة الجنس',
    fall_child_diagnosis_score INT COMMENT 'درجة التشخيص',
    fall_child_diagnosis_specify TEXT COMMENT 'تفاصيل التشخيص',
    fall_child_cognitive_score INT COMMENT 'درجة الإدراك',
    fall_child_environmental_score INT COMMENT 'درجة العوامل البيئية',
    fall_child_surgery_anesthesia_score INT COMMENT 'درجة الجراحة/التخدير',
    fall_child_medication_score INT COMMENT 'درجة الأدوية',
    fall_child_total_score INT COMMENT 'مجموع نقاط همتي دمبتي',
    fall_child_risk_level VARCHAR(20) COMMENT 'مستوى خطر السقوط',
    
    -- Neglect and Abuse
    neglect_abuse BOOLEAN COMMENT 'إيذاء/إهمال',
    neglect_abuse_specify TEXT COMMENT 'تفاصيل الإيذاء/الإهمال',
    
    -- Elderly Assessment
    elderly_daily_activities VARCHAR(50) COMMENT 'الأنشطة اليومية',
    elderly_cognitive VARCHAR(100) COMMENT 'التقييم المعرفي',
    elderly_mood VARCHAR(20) COMMENT 'تقييم المزاج',
    elderly_speech_disorder BOOLEAN COMMENT 'اضطراب النطق',
    elderly_hearing_disorder BOOLEAN COMMENT 'اضطراب السمع',
    elderly_vision_disorder BOOLEAN COMMENT 'اضطراب الرؤية',
    elderly_sleep_disorder BOOLEAN COMMENT 'اضطراب النوم',
    
    -- Disabled Patients Assessment
    disability_type VARCHAR(50) COMMENT 'نوع الإعاقة',
    disability_other TEXT COMMENT 'تفاصيل الإعاقة الأخرى',
    assistive_devices_available BOOLEAN COMMENT 'توفر أجهزة مساعدة',
    
    -- Signature
    assessment_date DATE COMMENT 'تاريخ التقييم',
    assessment_time TIME COMMENT 'وقت التقييم',
    nurse_signature VARCHAR(255) COMMENT 'توقيع الممرض',
    
    form_number VARCHAR(20) DEFAULT 'SH.MR.FRM.05' COMMENT 'رقم النموذج'
);
