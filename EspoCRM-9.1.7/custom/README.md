# Real Estate Management System for EspoCRM

This custom module implements a comprehensive real estate project and property unit management system for EspoCRM 9.1.7.

## Features Implemented

### 1. Custom Entities

#### CProject
- **Name** (required)
- **Location** (text)
- **Description** (text area)
- **Status** (Active/Inactive)
- Standard EspoCRM fields (created/modified by/at, assigned user, teams)

#### CPropertyUnit
- **Unit Number** (required)
- **Status** (enum): Available, Shortlisted, Hold, Token Received, Booked, Cancelled
- **Hold Expiry Date** (date) - required when status is Hold
- **Project** (Link to CProject)
- **Hold Opportunity** (link to Opportunity – only one allowed)
- **Shortlisted Opportunities** (many-to-many link with Opportunity)
- **Token Date** (date) - auto-set when status changes to Token Received
- **Booking Date** (date) - auto-set when status changes to Booked
- Standard EspoCRM fields

### 2. Relationships
- One Project has many Property Units
- One Property Unit can be shortlisted by multiple Opportunities
- One Property Unit can be on hold by only one Opportunity

### 3. Status Logic
- **Default status** = Available
- **Shortlist**: Multiple clients (opportunities) can shortlist a unit
- **Hold**: Only one client can hold a unit at a time. When putting on hold, user must set "Hold Expiry Date" (defaults to 10 days)
- **Token Received and Booked**: Once a unit is in these statuses, only users with "Admin" role can change status back to Available
- **Cancelled**: Can only be moved back to Available by Admin

### 4. CSV Import
- Ability to import Property Units from a CSV file
- Template provided in `/custom/Espo/Custom/Resources/templates/import/CPropertyUnit.csv`
- Fields: Unit Number, Project Name, Status, Hold Expiry Date, Token Date, Booking Date, Assigned User

### 5. User Interface and Layouts
- **Detail, Edit, List views** for both entities
- **Related panels**:
  - In Project: show linked Units
  - In Opportunity: show shortlisted and held Units
- **Status dropdown** controlled with logic and permission checks in backend
- **Dynamic field visibility** based on status selection
- **Project Report Dashboard** with charts and statistics

### 6. Reporting Support
- Ability to filter units per project by status: Available, Booked, Cancelled
- Hold expiry tracking via date filter
- Visual project report with charts showing unit status distribution
- API endpoints for custom reporting

### 7. Automated Features
- **Automatic Hold Expiry Processing**: Scheduled job runs daily at 2 AM to process expired holds
- **Manual Expired Holds Processing**: Admin can manually trigger processing
- **Auto-date Setting**: Token Date and Booking Date are automatically set when status changes

## Installation

1. Deploy all files to the EspoCRM directory structure
2. Clear cache: `php command.php app-clear-cache`
3. Rebuild: `php command.php app-rebuild`
4. Set up scheduled job for processing expired holds (already configured to run daily)

## API Endpoints

### Process Expired Holds (Admin only)
```
POST /api/v1/CPropertyUnit/action/processExpiredHolds
```

### Get Available Units for Project
```
GET /api/v1/CPropertyUnit/action/getAvailableUnits?projectId=PROJECT_ID
```

### Get Project Report
```
GET /api/v1/CPropertyUnit/action/getProjectReport?projectId=PROJECT_ID
```

## Permissions and Security

- Admin-only status changes for certain transitions
- Field-level ACL controls
- Team and user assignment security
- Validation hooks to ensure data integrity

## Files Created

### Backend (PHP)
- `/custom/Espo/Custom/Entities/CProject.php`
- `/custom/Espo/Custom/Entities/CPropertyUnit.php`
- `/custom/Espo/Custom/Services/CProject.php`
- `/custom/Espo/Custom/Services/CPropertyUnit.php`
- `/custom/Espo/Custom/Controllers/CProject.php`
- `/custom/Espo/Custom/Controllers/CPropertyUnit.php`
- `/custom/Espo/Custom/Hooks/CPropertyUnit/StatusValidation.php`
- `/custom/Espo/Custom/Jobs/ProcessExpiredHolds.php`

### Metadata Configuration
- Entity definitions, scopes, client definitions, ACL definitions
- Layouts (detail, edit, list, listSmall)
- Routes, scheduled jobs, select definitions
- i18n translations

### Frontend (JavaScript)
- Custom field views for status logic
- List view with custom actions
- Project detail view with report panel
- Chart visualization for project reports

## Usage

1. **Create Projects**: Navigate to Projects tab and create new real estate projects
2. **Add Property Units**: Create property units and link them to projects
3. **Manage Status**: Update unit status according to sales process
4. **Import Units**: Use CSV import for bulk unit creation
5. **Track Opportunities**: Link opportunities to units for shortlisting and holding
6. **Monitor Reports**: View project dashboard for status analytics
7. **Process Holds**: Expired holds are automatically processed daily

## Technical Notes

- Compatible with EspoCRM 9.1.7
- Uses standard EspoCRM extension patterns
- Follows EspoCRM coding standards
- Implements proper validation and security measures
- Includes automated testing considerations