# PWA Task Manager

A complete Progressive Web App (PWA) built with vanilla JavaScript, HTML, and CSS for managing tasks with offline support and responsive design.

## Features

- ✅ **Progressive Web App**: Installable with proper manifest and service worker
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🔄 **Offline Support**: Service worker caches resources for offline access
- 💾 **Local Storage**: Tasks are saved locally in the browser
- 📊 **Task Statistics**: View total, completed, and pending tasks
- 🔍 **Task Filtering**: Filter tasks by all, pending, or completed
- 📤 **Export Functionality**: Export tasks as JSON file
- 🎨 **Modern UI**: Clean, intuitive interface with smooth animations
- 🌙 **Dark Mode Support**: Automatic dark mode based on system preference
- 🔔 **Notifications**: In-app notifications for user actions
- 📶 **Online/Offline Indicator**: Shows current connection status

## Installation

### As a PWA
1. Open the app in a supported browser (Chrome, Firefox, Safari, Edge)
2. Look for the "Install" button that appears after a few seconds
3. Click "Install" to add the app to your home screen/applications

### Manual Installation
1. Clone or download the repository
2. Open `index.html` in a web browser
3. The app will work immediately with all features

## File Structure

```
pwa-task-manager/
├── index.html          # Main application HTML
├── style.css           # CSS styles with responsive design
├── app.js             # JavaScript application logic
├── service-worker.js   # Service worker for offline support
├── manifest.json      # PWA manifest file
├── icons/             # App icons in various sizes
│   ├── icon.svg       # SVG icon
│   └── icon-*.png     # PNG icons for different sizes
└── README.md          # This file
```

## Technical Details

### PWA Requirements Met
- ✅ Manifest file with proper PWA settings
- ✅ Service worker for caching and offline support
- ✅ Responsive design that works on mobile devices
- ✅ HTTPS ready (works on localhost and HTTPS domains)
- ✅ App icons in multiple sizes
- ✅ Proper meta tags for mobile web apps

### Browser Support
- Chrome 45+
- Firefox 44+
- Safari 11.1+
- Edge 17+

### Storage
- Uses `localStorage` for persistent task storage
- Service worker caches static assets for offline access
- No server or database required

## Usage

### Adding Tasks
- Type a task in the input field
- Click "Add" or press Enter
- Tasks appear immediately in the list

### Managing Tasks
- Click the checkbox to mark tasks as complete/incomplete
- Click the delete (🗑️) button to remove tasks
- Use filter buttons to view all, pending, or completed tasks

### Additional Features
- **Clear All**: Remove all tasks at once
- **Export**: Download tasks as a JSON file
- **Statistics**: View task counts at the top of the app

## Development

The app is built with vanilla web technologies:
- **HTML5**: Semantic markup with PWA meta tags
- **CSS3**: Modern CSS with flexbox, grid, and responsive design
- **JavaScript ES6+**: Modular code with classes and modern APIs
- **Service Worker API**: For offline functionality
- **Web App Manifest**: For PWA installation

### Key JavaScript Classes
- `TaskManager`: Main application class handling all functionality
- Uses localStorage API for data persistence
- Service worker registration and management
- Event-driven architecture for user interactions

## License

This project is provided as-is for educational and demonstration purposes.

## Browser Compatibility

This PWA works in all modern browsers and can be installed on:
- Desktop: Windows, macOS, Linux
- Mobile: iOS (Safari), Android (Chrome)
- Supports both standalone and browser modes