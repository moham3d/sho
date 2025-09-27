**App objectives:**
- Digitalize radiology workflow by replaceing paper forms doctor_form.pdf and nurse_form.pdf with web forms.

**Admin scenarios:**
- User management: create, update, delete users.
- Patient management: update, view patient records.
- Patient records: view patient history, allergies, medications.
- Visit oversight: manage patient visits, track status.
- Reports: generate user activity and patient visit reports.

**Nurse scenarios:**
- Patient search: find patients by name or ID (SSN).
- Patient assessments: conduct initial patient evaluations.
- Form submissions: submit patient information and assessments.
- Form calculates age from SSN and auto-fills current date and decides the Morse Fall Scale if child, age < 18, adult >= 18 or elderly >= 65.


**Doctor scenarios:**
- Doctor start radiology assessment for a patient after nursing assessment is complete.
- Dashboard: view waiting patients (Nursing assessment complete) and pending assessments.
- Fill radiology form: complete and submit radiology assessments.

**Visit workflow:**
1. Nurse completes initial patient assessment.
2. Doctor fills out and submits radiology form.
3. Visit marked as complete.