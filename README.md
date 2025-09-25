# Al-Shorouk Radiology Management System

A complete single-file web application for managing radiology patient workflows, including patient registration, nurse assessments, doctor evaluations, and digital signatures.

## Features

### 🔧 Admin Panel (NEW!)
- **Comprehensive Dashboard**: Real-time statistics and system overview
- **User Management**: Full CRUD operations for all system users with role assignment
- **Enhanced Patient Management**: Advanced search, bulk operations, structured contact forms
- **Visit Management**: Complete visit tracking with status management and form access
- **Forms Management**: Overview and management of all submitted forms
- **System Statistics**: Visual charts and analytics for better insights

### 👥 Patient Management
- Complete patient registration with structured multi-step forms
- **Enhanced Contact Information**: No more JSON! User-friendly forms with:
  - Emergency contact details with relationship tracking
  - Insurance information management
  - Medical history and allergies tracking
  - Structured address and communication preferences
- Advanced search and filtering capabilities
- Medical history tracking with comprehensive notes

### 🏥 Visit Management
- Create and track patient visits with enhanced workflow
- Assign nurses and doctors to visits with role-based access
- Status tracking (open, in-progress, signed, closed)
- Direct access to associated forms from visit management
- Enhanced visit details with comprehensive patient context

### 👩‍⚕️ Nurse Assessment Forms
**Multi-step user-friendly forms** including:
- **Step 1: Basic Screening** - Arrival mode, complaints, demographics
- **Step 2: Vital Signs** - Temperature, BP, pulse, O2 saturation, weight/height
- **Step 3: Psychosocial Assessment** - History, psychological state, habits
- **Step 4: Specialized Assessments** - Nutritional, functional, pain, fall risk
- Real-time validation with helpful error messages
- Print-friendly layouts matching professional medical forms

### 👨‍⚕️ Doctor Evaluation Forms
**Comprehensive radiology assessment** with:
- Patient information and clinical history with auto-population
- Study parameters and technical details
- Clinical findings and interpretations
- Radiation dose tracking (CTDIvol, DLP)
- Professional print layouts for documentation
- Digital signature capability with audit trail

### 🖨️ Professional Print System (NEW!)
- **PDF-like Form Layouts**: Print forms that match professional medical documentation
- **Print-optimized CSS**: Proper spacing, headers, and medical form structure
- **Facility Branding**: Automatic headers with facility information and timestamps
- **Multiple Print Modes**: Individual forms, complete patient records, or administrative reports

### 🔐 Authentication & Authorization
- Enhanced role-based access control (Admin, Doctor, Nurse)
- JWT-based authentication with extended session management
- Secure password hashing with bcrypt
- Admin-only functions with proper permission validation

### ✍️ Digital Signatures & Validation
- Canvas-based signature capture for all forms
- Secure signature storage with encryption
- Comprehensive audit trail with timestamps
- **Real-time Form Validation** (NEW!):
  - Email and phone number format validation
  - Medical data range validation (vital signs, ages, etc.)
  - Required field enforcement with clear error messages
  - Field-level validation feedback

### 📱 Enhanced User Experience
- **Multi-step Forms**: Complex forms broken into logical, navigable sections
- **Next/Previous Navigation**: User-friendly form progression
- **Real-time Validation**: Immediate feedback on data entry errors
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Loading States**: Clear feedback during data operations
- **Error Handling**: Comprehensive error messages and recovery options

## Technology Stack

- **Backend**: Express.js with SQLite database
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Authentication**: JWT with bcrypt password hashing
- **Database**: SQLite with complete schema for all form fields
- **UI**: English interface with responsive design

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run the Application**
   ```bash
   npm start
   ```

3. **Access the Application**
   - Open your browser and navigate to `http://localhost:3000`
   - Default login credentials:
     - **Admin**: admin / admin *(Full system access + Admin Panel)*
     - **Doctor**: doctor / doctor *(Form access + Patient management)*
     - **Nurse**: nurse / nurse *(Form creation + Patient registration)*

4. **Admin Panel Access**
   - Login as admin to access the comprehensive admin panel
   - Navigate through Dashboard, User Management, Patient Management, Visit Management, and Forms Management
   - Create new users, manage system data, and monitor system usage

5. **Enhanced Features**
   - Use the new multi-step patient forms for better data entry experience
   - Print forms using the "Print Form" buttons for professional documentation
   - Leverage real-time validation for accurate data entry
   - Access comprehensive statistics and system insights through the admin dashboard

## Database Schema

The application includes a complete SQLite database with the following tables:

- `users`: User accounts with roles
- `patients`: Complete patient demographic information
- `visits`: Patient visit tracking
- `nurse_forms`: Comprehensive nursing assessment data
- `doctor_forms`: Complete radiology evaluation data

All form fields from the original documentation are included without simplification.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Visits
- `GET /api/visits` - List all visits
- `POST /api/visits` - Create new visit

### Nurse Forms
- `GET /api/nurse-forms/:visitId` - Get nurse form for visit
- `POST /api/nurse-forms` - Create nurse form
- `PUT /api/nurse-forms/:id` - Update nurse form

### Doctor Forms
- `GET /api/doctor-forms/:visitId` - Get doctor form for visit
- `POST /api/doctor-forms` - Create doctor form
- `PUT /api/doctor-forms/:id` - Update doctor form

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control
- Input validation and sanitization
- Secure signature storage

## Browser Support

- Modern browsers with ES6+ support
- Mobile-responsive design
- Touch-friendly signature capture

## Development

The application is designed as a single-file deployment for easy setup and maintenance. All components are included in the main `app.js` file, with static frontend files served from the `public/` directory.

## License

MIT License - see package.json for details