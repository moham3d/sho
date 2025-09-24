# Al-Shorouk Radiology Management System

A complete single-file web application for managing radiology patient workflows, including patient registration, nurse assessments, doctor evaluations, and digital signatures.

## Features

### Patient Management
- Complete patient registration with all demographic information
- Search and filter patients
- Medical history tracking

### Visit Management
- Create and track patient visits
- Assign nurses and doctors to visits
- Status tracking (open, in-progress, signed, closed)

### Nurse Assessment Forms
Complete nursing assessment including:
- Basic screening and vital signs
- Psychosocial assessment
- Nutritional evaluation
- Functional assessment
- Pain assessment
- Fall risk evaluation
- Educational needs assessment
- Specialized assessments for elderly and disabled patients

### Doctor Evaluation Forms
Comprehensive radiology assessment including:
- Patient information and clinical history
- Study parameters and technical details
- Clinical findings and interpretations
- Radiation dose tracking (CTDIvol, DLP)
- Digital signature capability

### Authentication & Authorization
- Role-based access control (Admin, Doctor, Nurse)
- JWT-based authentication
- Secure password hashing

### Digital Signatures
- Canvas-based signature capture
- Secure signature storage
- Audit trail with timestamps

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
     - Admin: admin / admin
     - Doctor: doctor / doctor
     - Nurse: nurse / nurse

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