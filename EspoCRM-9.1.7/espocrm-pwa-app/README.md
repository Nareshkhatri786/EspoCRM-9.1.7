# EspoCRM PWA - Progressive Web App

A Vue.js Progressive Web App (PWA) that integrates with EspoCRM via REST API, providing mobile-friendly access to CRM functionality with offline support.

## ✨ Features

### 🔐 Authentication
- **Secure Login**: Login with EspoCRM credentials
- **Token Management**: Automatic token handling and refresh
- **Multi-Server Support**: Connect to different EspoCRM instances

### 📊 Dashboard
- **Upcoming Tasks**: View and manage upcoming tasks
- **Upcoming Meetings**: View scheduled meetings
- **Recent Calls**: Track call history
- **Real-time Updates**: Auto-refresh every 5 minutes when online

### 📞 Click-to-Call
- **Direct Dialing**: Click-to-call with default mobile dialer
- **Contact Search**: Search and call contacts from EspoCRM
- **Call Logging**: After-call popup to log call status
- **Smart Integration**: Links calls to EspoCRM contacts/opportunities

### 🔔 Push Notifications
- **Task Reminders**: 15-minute advance notifications for tasks
- **Meeting Reminders**: 10-minute advance notifications for meetings
- **Background Notifications**: Works even when app is closed
- **Customizable**: Enable/disable notifications per type

### 📱 Progressive Web App
- **Installable**: Install on mobile and desktop devices
- **Offline Support**: Core functionality works offline
- **Background Sync**: Sync pending calls when back online
- **App-like Experience**: Full-screen, native-like interface

### ⚙️ Settings & Preferences
- **Notification Settings**: Customize notification preferences
- **Call Configuration**: Set default call duration and auto-logging
- **Connection Management**: Test and manage EspoCRM connection
- **Data Sync**: Manual sync and offline data management

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- EspoCRM 6.0+ instance with REST API enabled
- HTTPS enabled for push notifications (production)

### Installation

1. **Clone/Download the project**
   ```bash
   # Extract the espocrm-pwa-app folder from this repository
   cd espocrm-pwa-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

### Deployment

#### Static Hosting (Recommended)
Deploy the `dist` folder to any static hosting service:
- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect your GitHub repo
- **GitHub Pages**: Upload `dist` contents
- **AWS S3**: Upload to S3 bucket with static hosting
- **Firebase Hosting**: Use Firebase CLI

#### Web Server
Serve the `dist` folder with any web server:
```bash
# Nginx example
server {
    listen 443 ssl;
    server_name your-pwa-domain.com;
    root /path/to/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 📋 Usage Guide

### First Time Setup

1. **Open the PWA** in your browser
2. **Enter EspoCRM Details**:
   - Server URL: `https://your-espocrm.com`
   - Username: Your EspoCRM username
   - Password: Your EspoCRM password
3. **Enable Notifications** (optional but recommended)
4. **Install the App** when prompted (mobile/desktop)

### Making Calls

#### Option 1: Direct Number
1. Go to Dashboard
2. Enter phone number in "Call a number" field
3. Click "📞 Call" button
4. Phone dialer opens automatically
5. After call, popup appears to log call details

#### Option 2: Contact Search
1. Type contact name in "Search & Call Contact"
2. Select contact from search results
3. Choose phone number (mobile/office)
4. Call is logged automatically with contact information

### Call Logging

After each call, you'll see a popup to:
- ✅ Mark as "Answered" or ❌ "Not Answered"
- 📝 Add call notes (if answered)
- 📅 Schedule follow-up actions
- 💾 Save to EspoCRM automatically

### Notifications

The app will notify you:
- **15 minutes before tasks** start
- **10 minutes before meetings** start
- **When app updates** are available
- **When back online** after being offline

### Offline Mode

When offline, you can:
- ✅ View cached dashboard data
- ✅ Make calls and log them locally
- ✅ Access settings and preferences
- ⏳ Pending calls sync when back online

## 🔧 Configuration

### EspoCRM Setup

Ensure your EspoCRM instance has:
```php
// In config.php or through Admin panel
'corsEnabled' => true,
'corsAllowedOrigins' => ['https://your-pwa-domain.com'],
'corsAllowedHeaders' => ['Content-Type', 'Authorization'],
```

### API Permissions

Required EspoCRM API scopes:
- `User` - Read user information
- `Task` - Read tasks
- `Meeting` - Read meetings  
- `Call` - Create and read calls
- `Contact` - Read and search contacts

### Push Notifications

For production push notifications:
1. **HTTPS Required**: Deploy with SSL certificate
2. **Service Worker**: Automatically registered
3. **Notification Permission**: Requested on first use

## 📱 PWA Installation

### Mobile (iOS/Android)
1. Open the PWA in Safari/Chrome
2. Tap "Add to Home Screen" when prompted
3. Or use browser menu → "Add to Home Screen"

### Desktop (Chrome/Edge)
1. Open the PWA in browser
2. Click install icon in address bar
3. Or use browser menu → "Install App"

### Features After Installation
- 🏠 Home screen icon
- 🖥️ Full-screen experience
- 📱 Native app-like navigation
- 🔔 System notifications
- ⚡ Faster loading

## 🛠️ Technical Architecture

### Frontend Stack
- **Vue 3** - Reactive framework
- **Vue Router 4** - SPA routing
- **Vite** - Build tool and dev server
- **PWA Plugin** - Service worker and manifest
- **Axios** - HTTP client for API calls

### PWA Features
- **Service Worker** - Caching and offline support
- **Web App Manifest** - Installation and app metadata
- **Background Sync** - Sync when back online
- **Push API** - Browser notifications
- **Cache API** - Offline data storage

### State Management
- **Reactive Stores** - Vue 3 reactive objects
- **Local Storage** - Persistent data storage
- **Session Management** - Token and user data

### API Integration
- **REST API** - EspoCRM REST endpoints
- **Authentication** - Bearer token auth
- **Error Handling** - Retry logic and offline fallback
- **Background Sync** - Queue failed requests

## 🔒 Security Considerations

### Data Protection
- 🔐 **No Credentials Stored**: Only auth tokens stored locally
- 🌐 **HTTPS Required**: Secure communication in production
- 🔒 **CORS Validation**: Server-side origin validation
- 🚫 **No Sensitive Data**: Call logs stored with minimal info

### Best Practices
- Use strong EspoCRM passwords
- Enable 2FA on EspoCRM accounts
- Deploy PWA with HTTPS
- Regularly update dependencies

## 🎨 Customization

### Branding
Edit `src/App.vue` and `public/manifest.json`:
```javascript
// Manifest.json
{
  "name": "Your Company CRM",
  "theme_color": "#your-color",
  "background_color": "#your-bg"
}
```

### Features
Add/remove features by editing:
- `src/views/` - Page components
- `src/services/` - API and notification services
- `src/stores/` - State management

## 🐛 Troubleshooting

### Common Issues

**Login Fails**
- ✅ Check EspoCRM URL format: `https://domain.com`
- ✅ Verify CORS settings in EspoCRM
- ✅ Confirm username/password

**Notifications Don't Work**
- ✅ Grant notification permission
- ✅ Use HTTPS in production
- ✅ Check browser compatibility

**PWA Won't Install**
- ✅ Serve over HTTPS
- ✅ Valid manifest.json
- ✅ Service worker registered

**Offline Mode Issues**
- ✅ Clear browser cache
- ✅ Refresh service worker
- ✅ Check network tab in dev tools

### Debug Mode
Enable console logging:
```javascript
// In browser console
localStorage.setItem('debug', 'true')
location.reload()
```

## 📞 Support

For technical support:
1. Check the troubleshooting guide above
2. Review browser console for errors  
3. Test with different browsers
4. Verify EspoCRM configuration

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **EspoCRM** - CRM platform
- **Vue.js** - Frontend framework
- **PWA Community** - Best practices and patterns