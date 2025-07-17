# Installation and Setup Instructions

## Prerequisites
- EspoCRM 9.1.7 installed and running
- PHP 8.3+ with required extensions
- Database (MySQL/MariaDB) configured
- Web server (Apache/Nginx) configured

## Installation Steps

### 1. Deploy Custom Files
All custom files are already in place in the `/custom/` directory structure.

### 2. Clear Cache and Rebuild
```bash
# Clear application cache
php command.php app-clear-cache

# Rebuild the application to recognize new entities
php command.php app-rebuild
```

### 3. Set Permissions (if needed)
```bash
# Ensure proper file permissions
find custom/ -type f -exec chmod 644 {} \;
find custom/ -type d -exec chmod 755 {} \;
```

### 4. Access the Application
1. Log in to EspoCRM as an Administrator
2. Navigate to Administration > Entity Manager
3. Verify that "CProject" and "CPropertyUnit" entities are listed
4. Check that the new tabs appear in the main navigation

### 5. Configure Scheduled Jobs
1. Go to Administration > Scheduled Jobs
2. Find "Process Expired Holds" job (should be auto-created)
3. Ensure it's enabled and scheduled to run daily

### 6. Set Up User Permissions
1. Go to Administration > Roles
2. Edit user roles to grant access to CProject and CPropertyUnit entities
3. Configure field-level permissions as needed

## Post-Installation Testing

### Test Entity Creation
1. Create a new Project:
   - Navigate to Projects tab
   - Click "Create Project"
   - Fill in Name, Location, Description
   - Set Status to Active
   - Save

2. Create Property Units:
   - Navigate to Property Units tab
   - Click "Create Property Unit"
   - Fill in Unit Number
   - Link to the Project created above
   - Test different status transitions

### Test Status Workflow
1. Create a Property Unit with status "Available"
2. Change status to "Hold":
   - Should require Hold Expiry Date
   - Should require Hold Opportunity
3. Test admin-only restrictions:
   - Change status to "Booked"
   - Try to change back to "Available" as non-admin (should fail)

### Test CSV Import
1. Go to Property Units > Import
2. Use the template file from `/custom/Espo/Custom/Resources/templates/import/CPropertyUnit.csv`
3. Map fields correctly
4. Import and verify data

### Test Reporting
1. Open a Project record
2. Verify that the Project Report panel appears
3. Check that Property Units are listed in the related panel

### Test API Endpoints (Optional)
```bash
# Get project report (replace PROJECT_ID)
curl -X GET "http://your-domain/api/v1/CPropertyUnit/action/getProjectReport?projectId=PROJECT_ID" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Process expired holds (admin only)
curl -X POST "http://your-domain/api/v1/CPropertyUnit/action/processExpiredHolds" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Troubleshooting

### Entities Not Appearing
- Ensure cache is cleared: `php command.php app-clear-cache`
- Rebuild application: `php command.php app-rebuild`
- Check file permissions
- Verify JSON syntax in metadata files

### JavaScript Errors
- Check browser console for errors
- Ensure client-side files are properly deployed
- Clear browser cache
- Check that Chart.js library is available (for reporting charts)

### Permission Issues
- Verify user roles have access to new entities
- Check ACL definitions in `/custom/Espo/Custom/Resources/metadata/aclDefs/`
- Ensure proper team assignments

### Status Validation Not Working
- Check that hooks are properly deployed
- Verify no syntax errors in PHP files
- Check application logs for errors

## Configuration Options

### Customizing Hold Period Default
Edit `/client/custom/src/views/c-property-unit/fields/hold-expiry-date.js`:
```javascript
// Change this line to modify default hold period
holdDate.setDate(holdDate.getDate() + 10); // Currently 10 days
```

### Modifying Status Options
Edit `/custom/Espo/Custom/Resources/metadata/entityDefs/CPropertyUnit.json`:
```json
"status": {
    "options": ["Available", "Shortlisted", "Hold", "Token Received", "Booked", "Cancelled"]
}
```

### Customizing Report Charts
Edit `/client/custom/src/views/c-project/record/panels/project-report.js` to modify chart appearance and data.

## Support

For issues or customizations:
1. Check EspoCRM logs in `data/logs/`
2. Verify PHP error logs
3. Check browser console for JavaScript errors
4. Review the README.md for implementation details