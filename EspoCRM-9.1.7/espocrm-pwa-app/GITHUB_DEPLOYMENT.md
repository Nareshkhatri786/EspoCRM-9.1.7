# GitHub Deployment Guide

## 📤 Upload to GitHub

Follow these steps to upload the complete EspoCRM PWA to GitHub:

### Option 1: GitHub Web Interface (Easiest)

1. **Create New Repository**:
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name: `espocrm-pwa`
   - Description: `Vue.js Progressive Web App for EspoCRM integration`
   - Make it Public or Private
   - ✅ Add README file
   - Click "Create repository"

2. **Upload Files**:
   - Click "uploading an existing file"
   - **Drag the entire `espocrm-pwa-app` folder** contents
   - Or select all files from the folder:
     ```
     src/
     public/
     package.json
     vite.config.js
     index.html
     README.md
     INSTALLATION.md
     .gitignore
     ```

3. **Commit Changes**:
   - Scroll down to "Commit changes"
   - Title: `Initial commit: Complete EspoCRM PWA`
   - Description: `Vue.js PWA with call management, notifications, and offline support`
   - Click "Commit changes"

### Option 2: Command Line (Advanced)

1. **Initialize Repository**:
   ```bash
   cd espocrm-pwa-app
   git init
   git add .
   git commit -m "Initial commit: Complete EspoCRM PWA"
   ```

2. **Create GitHub Repository**:
   - Go to GitHub and create new repository
   - Copy the repository URL

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/yourusername/espocrm-pwa.git
   git branch -M main
   git push -u origin main
   ```

## 🚀 Automatic Deployment

### Deploy to Netlify from GitHub

1. **Connect Repository**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Choose GitHub
   - Select your `espocrm-pwa` repository

2. **Build Settings**:
   ```
   Base directory: (leave empty)
   Build command: npm run build
   Publish directory: dist
   ```

3. **Deploy**:
   - Click "Deploy site"
   - Your PWA will be live at a Netlify URL
   - Add custom domain if needed

### Deploy to Vercel from GitHub

1. **Import Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Auto-Configuration**:
   - Vercel automatically detects Vite
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Deploy**:
   - Click "Deploy"
   - Your PWA will be live immediately

### Deploy to GitHub Pages

1. **Add GitHub Actions Workflow**:
   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         
         - name: Setup Node.js
           uses: actions/setup-node@v2
           with:
             node-version: '18'
             
         - name: Install dependencies
           run: npm install
           
         - name: Build
           run: npm run build
           
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings
   - Scroll to "Pages"
   - Source: "Deploy from a branch"
   - Branch: `gh-pages`
   - Your PWA will be live at `https://yourusername.github.io/espocrm-pwa`

## 📁 Repository Structure

Your GitHub repository should contain:

```
espocrm-pwa/
├── src/
│   ├── components/
│   │   └── CallPopup.vue
│   ├── services/
│   │   ├── api.js
│   │   └── notifications.js
│   ├── stores/
│   │   ├── auth.js
│   │   └── call.js
│   ├── views/
│   │   ├── Dashboard.vue
│   │   ├── Login.vue
│   │   └── Settings.vue
│   ├── App.vue
│   └── main.js
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   ├── apple-touch-icon.png
│   └── favicon.ico
├── package.json
├── vite.config.js
├── index.html
├── README.md
├── INSTALLATION.md
├── GITHUB_DEPLOYMENT.md
└── .gitignore
```

## 🏷️ Repository Tags & Releases

### Create Release

1. **Tag the Version**:
   ```bash
   git tag -a v1.0.0 -m "Initial release: EspoCRM PWA v1.0.0"
   git push origin v1.0.0
   ```

2. **Create GitHub Release**:
   - Go to repository → Releases
   - Click "Create a new release"
   - Tag: `v1.0.0`
   - Title: `EspoCRM PWA v1.0.0`
   - Description:
     ```markdown
     ## 🎉 Initial Release
     
     Complete Vue.js Progressive Web App for EspoCRM integration.
     
     ### ✨ Features
     - 🔐 Secure EspoCRM authentication
     - 📊 Dashboard with tasks and meetings
     - 📞 Click-to-call with mobile dialer
     - 🔔 Push notifications for reminders
     - 📱 PWA installable on mobile/desktop
     - 🌐 Offline support and background sync
     
     ### 🚀 Quick Start
     1. Download source code
     2. Follow INSTALLATION.md
     3. Deploy to your preferred hosting
     
     ### 📋 Requirements
     - EspoCRM 6.0+
     - Node.js 16+
     - HTTPS for production
     ```

## 🔗 Share Your Repository

### For Public Sharing

Add these badges to your README.md:

```markdown
# EspoCRM PWA

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/espocrm-pwa)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/espocrm-pwa)

![PWA](https://img.shields.io/badge/PWA-Ready-blue)
![Vue.js](https://img.shields.io/badge/Vue.js-3-green)
![Mobile Friendly](https://img.shields.io/badge/Mobile-Friendly-brightgreen)
```

### Demo Links

Add live demo links:
```markdown
## 🌐 Live Demo

- **Demo Site**: https://your-demo.netlify.app
- **Documentation**: https://github.com/yourusername/espocrm-pwa
```

## 👥 Collaboration

### For Team Development

1. **Branch Protection**:
   - Go to Settings → Branches
   - Add rule for `main` branch
   - Require pull request reviews

2. **Issues Template**:
   Create `.github/ISSUE_TEMPLATE/bug_report.md`:
   ```markdown
   ---
   name: Bug report
   about: Create a report to help us improve
   ---
   
   **Describe the bug**
   A clear description of the bug.
   
   **EspoCRM Version**
   - Version: [e.g. 7.5.0]
   
   **Browser/Device**
   - Browser: [e.g. Chrome, Safari]
   - Device: [e.g. iPhone 12, Desktop]
   
   **Steps to reproduce**
   1. Go to '...'
   2. Click on '....'
   3. See error
   ```

3. **Pull Request Template**:
   Create `.github/pull_request_template.md`:
   ```markdown
   ## Changes
   
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   
   ## Description
   
   Brief description of changes.
   
   ## Testing
   
   - [ ] Tested on mobile
   - [ ] Tested offline mode
   - [ ] Tested call logging
   ```

## 📊 Analytics & Tracking

### Repository Insights

Monitor your repository:
- **Traffic**: See page views and clones
- **Releases**: Track download statistics
- **Issues**: Monitor bug reports and feature requests
- **Contributors**: See who's contributing

Your EspoCRM PWA is now ready for GitHub! 🚀