# EspoCRM Progressive Web App (PWA)

A modern, mobile-first Progressive Web App for EspoCRM that provides access to key CRM functionality on mobile devices.

## 🚀 Features

### ✅ Core Functionality
- **User Authentication**: Secure login with EspoCRM credentials
- **Dashboard**: Overview of upcoming tasks, meetings, and recent calls
- **Tasks Management**: View, filter, and update tasks with status tracking
- **Meetings**: View scheduled meetings with join functionality
- **Contacts**: Browse and search contacts with integrated calling features

### 📞 Click-to-Call Integration
- **Direct Dialing**: Tap any phone number to call using device's default dialer
- **Multiple Numbers**: Support for both office and mobile numbers
- **Call Logging**: After-call popup to log call outcomes
- **Status Tracking**: Record calls as Answered, Not Answered, Busy, or Voicemail
- **Duration Tracking**: Log call duration and notes
- **Automatic CRM Integration**: Calls are automatically logged in EspoCRM

### 🔔 Smart Notifications
- **Web Push Notifications**: Reminders for upcoming tasks and meetings
- **Overdue Alerts**: Notifications for overdue tasks
- **Meeting Reminders**: Alerts 15 minutes before meetings
- **Interactive Actions**: Mark tasks complete or snooze directly from notifications

### 📱 Progressive Web App Features
- **Offline Support**: Works without internet connection using cached data
- **Installable**: Add to home screen on mobile and desktop
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Fast Loading**: Cached resources for instant access
- **Service Worker**: Background sync and offline capabilities

## 🛠 Installation

### Automatic Installation
The PWA is automatically integrated into EspoCRM during installation. Simply run:

```bash
./install-pwa.sh
```

### Manual Installation
1. Build the PWA:
   ```bash
   cd pwa
   npm install
   npm run build
   ```

2. Copy built files to EspoCRM public directory:
   ```bash
   cp -r pwa/dist/* public/pwa/
   ```

3. Configure web server to serve PWA routes

## 📋 Usage

### Accessing the PWA
- **Web Browser**: Navigate to `/pwa` relative to your EspoCRM installation
- **Mobile**: Add to home screen for app-like experience
- **Desktop**: Install through browser for standalone app

### Making Calls
1. Navigate to Contacts section
2. Tap any phone number to initiate call
3. Use device's dialer to complete call
4. Return to PWA - after-call popup will appear
5. Select call outcome and add notes
6. Call is automatically logged in EspoCRM

### Notifications
1. Allow notifications when prompted
2. Receive alerts for upcoming events
3. Use notification actions to quickly respond
4. Snooze reminders as needed

## 🏗 Architecture

### Frontend Stack
- **Vue.js 3**: Modern reactive framework
- **Vite**: Fast build tool and dev server
- **PWA Plugin**: Service worker and manifest generation
- **Axios**: HTTP client for API communication

### Key Components
- `src/App.vue`: Main application shell
- `src/services/auth.js`: Authentication service
- `src/services/api.js`: EspoCRM API integration
- `src/services/notifications.js`: Push notification handling
- `src/components/CallPopup.vue`: After-call logging interface

### API Integration
- **REST API**: Connects to EspoCRM's built-in REST API
- **Authentication**: Token-based auth with secure storage
- **Real-time Sync**: Periodic data refresh
- **Offline Caching**: Service worker caches API responses

## 🔧 Configuration

### API Endpoints
The PWA automatically detects the EspoCRM API at `/api/v1/`. No configuration needed.

### Notification Settings
```javascript
// Customize notification timing in src/services/notifications.js
const reminderTime = new Date(eventTime.getTime() - 15 * 60 * 1000); // 15 minutes
```

### Call Integration
```javascript
// Configure call outcomes in src/components/CallPopup.vue
const callStatuses = ['Answered', 'Not Answered', 'Busy', 'Voicemail'];
```

## 📱 Device Support

### Mobile Browsers
- **iOS Safari**: Full PWA support with home screen installation
- **Android Chrome**: Complete PWA features including notifications
- **Android Firefox**: Basic PWA support

### Desktop Browsers
- **Chrome**: Full PWA installation and notification support
- **Edge**: Complete PWA features
- **Firefox**: Basic PWA support (limited installation)

## 🔄 Development

### Development Server
```bash
cd pwa
npm run dev
```

### Building for Production
```bash
cd pwa
npm run build
```

### Adding Features
1. Create new Vue components in `src/components/`
2. Add new views in `src/views/`
3. Extend API service in `src/services/api.js`
4. Update routing in `src/router.js`

## 🐛 Troubleshooting

### Common Issues

**PWA Not Loading**
- Check that `/pwa` URL is accessible
- Verify .htaccess rewrite rules are working
- Ensure built files exist in `public/pwa/`

**Notifications Not Working**
- Check browser notification permissions
- Verify HTTPS is enabled (required for notifications)
- Test in supported browsers (Chrome, Safari)

**Call Logging Fails**
- Verify EspoCRM API access and authentication
- Check network connectivity
- Review browser console for API errors

**Offline Mode Issues**
- Clear browser cache and reload
- Check service worker registration
- Verify network status detection

### Debug Mode
Enable debug logging by adding to localStorage:
```javascript
localStorage.setItem('pwa-debug', 'true');
```

## 📈 Performance

### Optimization Features
- **Code Splitting**: Lazy loading of route components
- **Asset Compression**: Gzipped resources
- **Image Optimization**: Compressed PWA icons
- **Caching Strategy**: Aggressive caching with cache-first approach

### Metrics
- **First Load**: ~60KB gzipped JavaScript
- **Subsequent Loads**: <1KB (cached)
- **Offline Support**: Full functionality without network

## 🔒 Security

### Authentication
- **Token-based**: Secure API token storage
- **Session Management**: Automatic logout on token expiry
- **HTTPS Required**: Secure communication only

### Data Protection
- **Local Storage**: Minimal sensitive data caching
- **API Security**: All requests authenticated
- **Permission-based**: Respects EspoCRM user permissions

## 📄 License

This PWA is integrated with EspoCRM and follows the same licensing terms as the main EspoCRM application.

## 🤝 Contributing

To contribute to the PWA:
1. Fork the repository
2. Create feature branch
3. Make changes in `pwa/` directory
4. Test thoroughly on mobile and desktop
5. Submit pull request

## 📞 Support

For PWA-specific issues:
1. Check browser console for errors
2. Verify service worker registration
3. Test API connectivity
4. Review EspoCRM logs for API issues

For general EspoCRM support, visit the main EspoCRM documentation.