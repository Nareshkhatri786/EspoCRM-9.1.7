#!/bin/bash

# EspoCRM PWA Auto-Installation Script
# This script integrates the PWA into EspoCRM installation

ESPO_ROOT="/home/runner/work/EspoCRM-9.1.7/EspoCRM-9.1.7/EspoCRM-9.1.7"
PWA_SOURCE="$ESPO_ROOT/pwa/dist"
PWA_TARGET="$ESPO_ROOT/public/pwa"

echo "=== EspoCRM PWA Installation ==="

# Check if EspoCRM directory exists
if [ ! -d "$ESPO_ROOT" ]; then
    echo "❌ EspoCRM directory not found: $ESPO_ROOT"
    exit 1
fi

# Check if PWA build exists
if [ ! -d "$PWA_SOURCE" ]; then
    echo "❌ PWA build not found. Running build first..."
    cd "$ESPO_ROOT/pwa"
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ PWA build failed"
        exit 1
    fi
fi

# Create PWA directory in public
echo "📁 Creating PWA directory..."
mkdir -p "$PWA_TARGET"

# Copy PWA files
echo "📋 Copying PWA files..."
cp -r "$PWA_SOURCE"/* "$PWA_TARGET/"

# Create PWA access point in main public directory
echo "🔗 Creating PWA access points..."

# Create a redirect from /pwa to /public/pwa
cat > "$ESPO_ROOT/public/index.php" << 'EOF'
<?php
// PWA Access Point for EspoCRM
// This file handles PWA routing

$requestUri = $_SERVER['REQUEST_URI'];
$publicRoot = dirname(__FILE__);
$espoRoot = dirname($publicRoot);

// Handle PWA routes
if (strpos($requestUri, '/pwa') === 0) {
    $pwaPath = $requestUri === '/pwa' ? '/pwa/' : $requestUri;
    
    if ($pwaPath === '/pwa/') {
        // Serve PWA index
        $pwaIndex = $publicRoot . '/pwa/index.html';
        if (file_exists($pwaIndex)) {
            header('Content-Type: text/html');
            readfile($pwaIndex);
            exit;
        }
    } else {
        // Serve PWA assets
        $filePath = $publicRoot . $pwaPath;
        if (file_exists($filePath)) {
            $extension = pathinfo($filePath, PATHINFO_EXTENSION);
            $mimeTypes = [
                'css' => 'text/css',
                'js' => 'application/javascript',
                'json' => 'application/json',
                'png' => 'image/png',
                'ico' => 'image/x-icon',
                'svg' => 'image/svg+xml',
                'woff' => 'font/woff',
                'woff2' => 'font/woff2'
            ];
            
            if (isset($mimeTypes[$extension])) {
                header('Content-Type: ' . $mimeTypes[$extension]);
            }
            
            readfile($filePath);
            exit;
        }
    }
}

// Default: redirect to main EspoCRM
header('Location: ../index.php');
exit;
EOF

# Update main .htaccess to handle PWA routing
echo "⚙️  Updating .htaccess for PWA routing..."

if [ -f "$ESPO_ROOT/.htaccess" ]; then
    # Backup original .htaccess
    cp "$ESPO_ROOT/.htaccess" "$ESPO_ROOT/.htaccess.backup"
    
    # Add PWA routing rules
    cat > "$ESPO_ROOT/.htaccess.new" << 'EOF'
# EspoCRM PWA Integration
RewriteEngine On

# PWA Routes
RewriteRule ^pwa/?$ public/pwa/index.html [L]
RewriteRule ^pwa/(.*)$ public/pwa/$1 [L]

# Service Worker (must be served from root for scope)
RewriteRule ^sw\.js$ public/pwa/sw.js [L]
RewriteRule ^manifest\.webmanifest$ public/pwa/manifest.webmanifest [L]

# Original EspoCRM rules below:
EOF
    
    # Append original .htaccess content (skip first RewriteEngine line if exists)
    grep -v "^RewriteEngine On" "$ESPO_ROOT/.htaccess" >> "$ESPO_ROOT/.htaccess.new"
    
    # Replace .htaccess
    mv "$ESPO_ROOT/.htaccess.new" "$ESPO_ROOT/.htaccess"
fi

# Create PWA menu integration
echo "📱 Creating PWA menu integration..."

# Create custom menu item for PWA
mkdir -p "$ESPO_ROOT/custom/Espo/Custom/Resources/metadata/app"

cat > "$ESPO_ROOT/custom/Espo/Custom/Resources/metadata/app/menu.json" << 'EOF'
{
    "quickCreate": {
        "pwaApp": {
            "url": "/pwa",
            "label": "Mobile App",
            "target": "_blank",
            "iconClass": "fas fa-mobile-alt"
        }
    }
}
EOF

# Create PWA link in user menu
mkdir -p "$ESPO_ROOT/custom/Espo/Custom/Resources/metadata/clientDefs"

cat > "$ESPO_ROOT/custom/Espo/Custom/Resources/metadata/clientDefs/User.json" << 'EOF'
{
    "menu": {
        "detail": {
            "pwaApp": {
                "label": "Open Mobile App",
                "action": "openPwaApp",
                "iconClass": "fas fa-mobile-alt"
            }
        }
    }
}
EOF

# Create JavaScript handler for PWA link
mkdir -p "$ESPO_ROOT/client/custom/src/views/user"

cat > "$ESPO_ROOT/client/custom/src/views/user/detail.js" << 'EOF'
define('custom:views/user/detail', 'views/record/detail', function (Dep) {
    
    return Dep.extend({
        
        actionOpenPwaApp: function () {
            window.open('/pwa', '_blank');
        }
        
    });
});
EOF

# Create installation notice
cat > "$ESPO_ROOT/PWA_INSTALLATION.md" << 'EOF'
# EspoCRM PWA Installation Complete

## Access the PWA

The EspoCRM Progressive Web App has been successfully installed and is available at:

- **URL**: `/pwa` (relative to your EspoCRM installation)
- **Full URL**: `https://yourdomain.com/pwa`

## Features

✅ **User Authentication**: Login with EspoCRM credentials
✅ **Dashboard**: View upcoming tasks and meetings  
✅ **Tasks Management**: View, update, and complete tasks
✅ **Meetings**: View meetings with join/mark as held functionality
✅ **Contacts**: Browse contacts with click-to-call feature
✅ **Click-to-Call**: Tap phone numbers to dial using device's default dialer
✅ **After-Call Logging**: Popup to log call status (Answered/Not Answered/Busy/Voicemail)
✅ **Web Push Notifications**: Reminders for tasks and meetings
✅ **Offline Support**: Works offline with cached data
✅ **PWA Installation**: Installable on mobile and desktop devices

## Installation on Mobile/Desktop

### Mobile (iOS/Android)
1. Open the PWA URL in Safari (iOS) or Chrome (Android)
2. Tap the share button (iOS) or menu (Android)
3. Select "Add to Home Screen"
4. The app icon will appear on your home screen

### Desktop (Chrome/Edge)
1. Open the PWA URL in Chrome or Edge
2. Look for the install icon in the address bar
3. Click "Install" to add to desktop

## API Integration

The PWA automatically connects to your EspoCRM REST API at `/api/v1/`. 

## Customization

- PWA source code is in `/pwa/` directory
- Build with `npm run build` in the pwa directory
- Customize features in `/pwa/src/` directory

## Support

For PWA-specific issues, check the browser console and service worker logs.
EOF

echo ""
echo "✅ EspoCRM PWA Installation Complete!"
echo ""
echo "📱 Access your PWA at: /pwa"
echo "📖 Read PWA_INSTALLATION.md for details"
echo ""
echo "🔧 To rebuild PWA:"
echo "   cd pwa && npm run build && ./install-pwa.sh"
echo ""