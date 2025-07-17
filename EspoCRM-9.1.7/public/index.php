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
