#!/usr/bin/env node

/**
 * Development Startup Script
 * Shows clear deployment information for the full-stack app
 */

const { spawn } = require('child_process');

console.log('\n' + '='.repeat(70));
console.log('🚀 STARTING EXPENSE TRACKER - FULL DEVELOPMENT MODE');
console.log('='.repeat(70));
console.log('📦 Multi-App Architecture with Settings Foundation');
console.log('🏗️  Epic 1: Settings Foundation - COMPLETED');
console.log('='.repeat(70));

console.log('\n🔧 STARTING SERVICES:');
console.log('1. 📡 API Server (Backend) - Port 3001');
console.log('2. ⚛️  React Frontend (Vite) - Port 5173');
console.log('3. 🔗 Proxy Integration - API calls routed to backend');

console.log('\n📍 DEPLOYMENT URLS:');
console.log('• Frontend: http://localhost:5173');
console.log('• API Server: http://localhost:3001');
console.log('• Health Check: http://localhost:3001/api/health');

console.log('\n🎯 ACCESS INSTRUCTIONS:');
console.log('1. Open http://localhost:5173 in your browser');
console.log('2. Login as Administrator (mquresh900@gmail.com)');
console.log('3. Clear localStorage if needed to see Multi-App Hub');
console.log('4. Look for 3 tiles: Expenses, Exams, Settings');
console.log('5. Click purple Settings tile to access Epic 1 features');

console.log('\n⚙️  TROUBLESHOOTING:');
console.log('• No Settings tile? Clear browser localStorage');
console.log('• Going to expenses directly? Use "Multi-App Hub" button');
console.log('• API errors? Check Supabase environment variables');

console.log('\n' + '='.repeat(70));
console.log('Starting in 3 seconds...');
console.log('='.repeat(70) + '\n');

setTimeout(() => {
  // Run the concurrent development servers
  const child = spawn('npm', ['run', 'dev:full'], {
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (error) => {
    console.error('Failed to start development servers:', error);
  });

  child.on('close', (code) => {
    console.log(`\n🛑 Development servers stopped with code ${code}`);
  });
}, 3000);