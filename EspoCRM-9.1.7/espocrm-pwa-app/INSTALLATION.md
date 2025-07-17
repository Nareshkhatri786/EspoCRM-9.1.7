# EspoCRM PWA - Installation & Deployment Guide

## 📦 Package Contents

This Vue.js Progressive Web App provides:
- **Complete PWA for EspoCRM integration**
- **Mobile-first responsive design**
- **Offline functionality and call logging**
- **Push notifications for tasks/meetings**
- **Click-to-call with default mobile dialer**
- **Installable on mobile and desktop**

## 🎯 What This App Does

### Core Features
1. **Secure EspoCRM Login** - Connect to any EspoCRM instance
2. **Dashboard** - View upcoming tasks, meetings, and recent calls
3. **Click-to-Call** - Call contacts or direct numbers
4. **Call Logging** - After-call popup to log call status to EspoCRM
5. **Push Notifications** - Reminders for tasks and meetings
6. **Offline Support** - Works without internet, syncs when reconnected
7. **PWA Installation** - Install like a native app on any device

### User Workflow
1. User logs in with EspoCRM credentials
2. Dashboard shows upcoming activities from EspoCRM
3. User can search contacts or enter phone numbers
4. Click "Call" opens default mobile dialer
5. After call, popup asks "Answered" or "Not Answered"
6. If answered, user can add notes
7. Call data is automatically logged to EspoCRM

## 🚀 Quick Deployment

### Option 1: Netlify (Easiest)
1. **Build the app**:
   ```bash
   cd espocrm-pwa-app
   npm install
   npm run build
   ```

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Drag the `dist` folder to Netlify deploy area
   - Your PWA is now live!

3. **Custom Domain** (optional):
   - In Netlify dashboard, go to Domain settings
   - Add your custom domain

### Option 2: Vercel
1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/espocrm-pwa
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub repo
   - Deploy automatically

### Option 3: Your Own Server
1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Upload `dist` folder** to your web server

3. **Configure web server** (Nginx example):
   ```nginx
   server {
       listen 443 ssl;
       server_name your-pwa-domain.com;
       root /path/to/dist;
       
       # SSL configuration
       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;
       
       # PWA routing
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

## 🔧 EspoCRM Configuration

### Enable CORS (Required)
In your EspoCRM `data/config.php`:
```php
<?php
return [
    // ... existing config
    'corsEnabled' => true,
    'corsAllowedOrigins' => [
        'https://your-pwa-domain.com',
        'http://localhost:5173', // For development
    ],
    'corsAllowedHeaders' => [
        'Content-Type',
        'Authorization',
        'X-Requested-With'
    ],
];
```

### API User (Recommended)
1. Create a dedicated API user in EspoCRM
2. Assign appropriate roles:
   - Read access to: Users, Tasks, Meetings, Calls, Contacts
   - Create access to: Calls
3. Use this user for PWA authentication

### Required Entities
Ensure these entities are available in your EspoCRM:
- ✅ Users
- ✅ Tasks  
- ✅ Meetings
- ✅ Calls
- ✅ Contacts

## 📱 User Setup Guide

### For End Users

1. **Access the PWA**:
   - Open `https://your-pwa-domain.com` in any browser
   - Or scan QR code if provided

2. **First Login**:
   ```
   Server URL: https://your-espocrm.com
   Username: your-espocrm-username
   Password: your-espocrm-password
   ```

3. **Install the App** (optional but recommended):
   - **Mobile**: Tap "Add to Home Screen" when prompted
   - **Desktop**: Click install icon in browser address bar

4. **Enable Notifications**:
   - Click "Enable Notifications" button
   - Allow notification permission
   - Get reminders for tasks/meetings

### Making Calls

**Option A - Direct Number**:
1. Enter phone number in dashboard
2. Click "📞 Call"
3. Phone dialer opens
4. Make your call
5. Fill in call log popup

**Option B - Contact Search**:
1. Type contact name
2. Select from search results
3. Choose phone number
4. Call is automatically linked to contact

## 🔒 Security Setup

### Production Checklist
- ✅ Deploy with HTTPS (required for PWA features)
- ✅ Configure CORS properly in EspoCRM
- ✅ Use strong passwords for EspoCRM accounts
- ✅ Consider 2FA for EspoCRM users
- ✅ Regular security updates

### HTTPS Certificate
For free SSL certificates:
```bash
# Using Certbot (Let's Encrypt)
sudo certbot --nginx -d your-pwa-domain.com
```

## 🌐 Multi-Instance Setup

To support multiple EspoCRM instances:

1. **Deploy separate PWAs** for each instance
2. **Or customize the login** to remember multiple servers:

```javascript
// In src/stores/auth.js
const servers = [
  { name: 'Production', url: 'https://crm.company.com' },
  { name: 'Testing', url: 'https://test-crm.company.com' }
]
```

## 🎨 Customization Options

### Branding
Edit `public/manifest.json`:
```json
{
  "name": "Your Company CRM",
  "short_name": "YourCRM",
  "theme_color": "#your-brand-color"
}
```

### Features
Enable/disable features in `src/stores/`:
- Call logging: `src/stores/call.js`
- Notifications: `src/services/notifications.js`
- Dashboard items: `src/views/Dashboard.vue`

## 📊 Monitoring & Analytics

### Usage Tracking
Add Google Analytics or similar:
```html
<!-- In index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking
Add Sentry or similar:
```bash
npm install @sentry/vue
```

## 🔧 Troubleshooting

### Common Issues

**CORS Errors**:
```
Access to XMLHttpRequest at 'https://crm.com/api/v1/...' 
from origin 'https://pwa.com' has been blocked by CORS policy
```
**Solution**: Configure CORS in EspoCRM config.php

**PWA Not Installing**:
- Ensure HTTPS is enabled
- Check manifest.json is valid
- Verify service worker registration

**Notifications Not Working**:
- HTTPS required for push notifications
- User must grant permission
- Check browser notification settings

**Calls Not Logging**:
- Verify EspoCRM API permissions
- Check user has "Create Call" access
- Confirm internet connection

### Debug Mode
Enable in browser console:
```javascript
localStorage.setItem('debug', 'true')
location.reload()
```

## 📞 Support

### For Administrators
1. Verify EspoCRM CORS configuration
2. Check API user permissions
3. Test with admin account first
4. Review server logs for errors

### For Users
1. Clear browser cache if having issues
2. Try different browser
3. Check internet connection
4. Contact your IT administrator

## 🎯 Success Checklist

After deployment, verify:
- ✅ PWA loads at your domain
- ✅ Login works with EspoCRM credentials
- ✅ Dashboard shows EspoCRM data
- ✅ Click-to-call opens phone dialer
- ✅ Call logging popup appears after calls
- ✅ Notifications work (if enabled)
- ✅ PWA can be installed on devices
- ✅ Works offline (cached data)

## 📈 Next Steps

1. **Train Users**: Provide training on PWA features
2. **Monitor Usage**: Track adoption and usage patterns
3. **Gather Feedback**: Collect user feedback for improvements
4. **Scale Up**: Deploy to more users/departments
5. **Customize**: Add company-specific features

Your EspoCRM PWA is now ready for production use! 🎉