#!/usr/bin/env node

/**
 * PWA Validation Script
 * Validates that all PWA requirements are properly implemented
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');

console.log('🔍 Validating PWA Implementation...\n');

let validationPassed = true;
const errors = [];
const warnings = [];
const success = [];

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  errors.push('❌ dist directory not found. Run npm run build first.');
  validationPassed = false;
}

// Validate manifest.json
const manifestPath = path.join(distPath, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    // Required manifest fields
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      errors.push(`❌ manifest.json missing required fields: ${missingFields.join(', ')}`);
      validationPassed = false;
    } else {
      success.push('✅ manifest.json exists with all required fields');
    }
    
    // Check icons
    if (manifest.icons && manifest.icons.length > 0) {
      const requiredSizes = ['192x192', '512x512'];
      const availableSizes = manifest.icons.map(icon => icon.sizes);
      const missingSizes = requiredSizes.filter(size => !availableSizes.includes(size));
      
      if (missingSizes.length > 0) {
        warnings.push(`⚠️  manifest.json missing recommended icon sizes: ${missingSizes.join(', ')}`);
      } else {
        success.push('✅ manifest.json has required icon sizes (192x192, 512x512)');
      }
    }
    
  } catch (error) {
    errors.push(`❌ manifest.json is invalid JSON: ${error.message}`);
    validationPassed = false;
  }
} else {
  errors.push('❌ manifest.json not found in dist directory');
  validationPassed = false;
}

// Validate service worker
const swPath = path.join(distPath, 'sw.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // Check for required SW features
  const requiredFeatures = [
    'install',
    'activate', 
    'fetch',
    'caches.open',
    'cache.addAll'
  ];
  
  const missingFeatures = requiredFeatures.filter(feature => !swContent.includes(feature));
  
  if (missingFeatures.length > 0) {
    errors.push(`❌ sw.js missing required features: ${missingFeatures.join(', ')}`);
    validationPassed = false;
  } else {
    success.push('✅ sw.js exists with all required service worker features');
  }
} else {
  errors.push('❌ sw.js not found in dist directory');
  validationPassed = false;
}

// Validate HTML PWA meta tags
const indexPath = path.join(distPath, 'index.html');
if (fs.existsSync(indexPath)) {
  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  // Required meta tags
  const requiredMeta = [
    'manifest',
    'theme-color',
    'apple-mobile-web-app-capable',
    'application-name'
  ];
  
  const missingMeta = requiredMeta.filter(meta => !htmlContent.includes(meta));
  
  if (missingMeta.length > 0) {
    errors.push(`❌ index.html missing PWA meta tags: ${missingMeta.join(', ')}`);
    validationPassed = false;
  } else {
    success.push('✅ index.html contains all required PWA meta tags');
  }
} else {
  errors.push('❌ index.html not found in dist directory');
  validationPassed = false;
}

// Validate PWA icons
const iconsPath = path.join(distPath, 'icons');
if (fs.existsSync(iconsPath)) {
  const requiredIcons = [
    'icon-16x16.png',
    'icon-32x32.png', 
    'icon-192x192.png',
    'icon-512x512.png'
  ];
  
  const missingIcons = requiredIcons.filter(icon => !fs.existsSync(path.join(iconsPath, icon)));
  
  if (missingIcons.length > 0) {
    errors.push(`❌ Missing required PWA icons: ${missingIcons.join(', ')}`);
    validationPassed = false;
  } else {
    success.push('✅ All required PWA icons are present');
  }
} else {
  errors.push('❌ icons directory not found in dist directory');
  validationPassed = false;
}

// Validate PWA utilities
const pwaUtilsPath = path.join(__dirname, 'src', 'utils', 'pwaUtils.js');
if (fs.existsSync(pwaUtilsPath)) {
  success.push('✅ PWA utilities implemented');
} else {
  warnings.push('⚠️  PWA utilities not found - some offline features may not work');
}

// Validate PWA hooks  
const pwaHooksPath = path.join(__dirname, 'src', 'hooks', 'usePWA.js');
if (fs.existsSync(pwaHooksPath)) {
  success.push('✅ PWA React hooks implemented');
} else {
  warnings.push('⚠️  PWA React hooks not found - some PWA features may not be available');
}

// Output results
console.log('📊 Validation Results:\n');

if (success.length > 0) {
  console.log('✅ Passed:');
  success.forEach(item => console.log(`  ${item}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(item => console.log(`  ${item}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Errors:');
  errors.forEach(item => console.log(`  ${item}`));
  console.log('');
}

// Final result
if (validationPassed) {
  console.log('🎉 PWA validation passed! Your app is ready to be installed as a PWA.');
  console.log('\n📱 To test your PWA:');
  console.log('  1. Run: npm run preview');
  console.log('  2. Open the app in Chrome/Edge');
  console.log('  3. Look for the install button in the address bar');
  console.log('  4. Test offline functionality by going offline in DevTools');
  process.exit(0);
} else {
  console.log('💥 PWA validation failed. Please fix the errors above.');
  process.exit(1);
}