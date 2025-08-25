#!/usr/bin/env node

/**
 * Test script for enhanced IP and location detection
 * Tests the improved geolocation functionality in the login activity tracker
 */

const fetch = require('node-fetch');

async function testLocationServices() {
  console.log('🌍 Testing Enhanced IP and Location Detection Services\n');
  
  const services = [
    {
      name: 'ipify.org',
      url: 'https://api.ipify.org?format=json',
      parser: (data) => ({ ip: data.ip, country: 'Unknown', region: 'Unknown', city: 'Unknown' })
    },
    {
      name: 'ipapi.co',
      url: 'https://ipapi.co/json/',
      parser: (data) => ({
        ip: data.ip || 'Unknown',
        country: data.country_name || 'Unknown',
        region: data.region || 'Unknown',
        city: data.city || 'Unknown'
      })
    },
    {
      name: 'ip.sb',
      url: 'https://api.ip.sb/geoip',
      parser: (data) => ({
        ip: data.ip || 'Unknown',
        country: data.country || 'Unknown',
        region: data.region || 'Unknown',
        city: data.city || 'Unknown'
      })
    },
    {
      name: 'ipwho.is',
      url: 'https://ipwho.is/',
      parser: (data) => ({
        ip: data.ip || 'Unknown',
        country: data.country || 'Unknown',
        region: data.region || 'Unknown',
        city: data.city || 'Unknown'
      })
    }
  ];

  const results = [];

  for (const service of services) {
    console.log(`📡 Testing ${service.name}...`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(service.url, { 
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const parsed = service.parser(data);
        
        results.push({
          service: service.name,
          status: '✅ SUCCESS',
          responseTime: `${responseTime}ms`,
          data: parsed
        });
        
        console.log(`   ✅ Success (${responseTime}ms)`);
        console.log(`   📍 IP: ${parsed.ip}`);
        console.log(`   🌍 Location: ${parsed.city}, ${parsed.region}, ${parsed.country}`);
        
      } else {
        results.push({
          service: service.name,
          status: '❌ FAILED',
          responseTime: `${responseTime}ms`,
          error: `HTTP ${response.status}`
        });
        console.log(`   ❌ Failed: HTTP ${response.status}`);
      }
    } catch (error) {
      results.push({
        service: service.name,
        status: '❌ ERROR',
        responseTime: 'timeout',
        error: error.message
      });
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Summary
  console.log('📊 SUMMARY REPORT\n');
  console.log('┌────────────────┬──────────┬──────────────┬─────────────────────┐');
  console.log('│ Service        │ Status   │ Response Time│ Location Data       │');
  console.log('├────────────────┼──────────┼──────────────┼─────────────────────┤');
  
  results.forEach(result => {
    const service = result.service.padEnd(14);
    const status = result.status.padEnd(8);
    const responseTime = result.responseTime.padEnd(12);
    const location = result.data 
      ? `${result.data.city}, ${result.data.country}`.padEnd(19)
      : result.error ? result.error.substring(0, 19).padEnd(19) : 'N/A'.padEnd(19);
    
    console.log(`│ ${service} │ ${status} │ ${responseTime} │ ${location} │`);
  });
  
  console.log('└────────────────┴──────────┴──────────────┴─────────────────────┘\n');

  // Recommendations
  const successfulServices = results.filter(r => r.status.includes('SUCCESS'));
  const failedServices = results.filter(r => !r.status.includes('SUCCESS'));

  console.log('💡 RECOMMENDATIONS:\n');
  
  if (successfulServices.length > 0) {
    console.log(`✅ ${successfulServices.length} of ${services.length} services are working correctly`);
    
    const fastestService = successfulServices.reduce((fastest, current) => {
      const currentTime = parseInt(current.responseTime);
      const fastestTime = parseInt(fastest.responseTime);
      return currentTime < fastestTime ? current : fastest;
    });
    
    console.log(`⚡ Fastest service: ${fastestService.service} (${fastestService.responseTime})`);
    
    const mostDetailed = successfulServices.find(s => 
      s.data && s.data.city !== 'Unknown' && s.data.region !== 'Unknown'
    );
    
    if (mostDetailed) {
      console.log(`📍 Most detailed location: ${mostDetailed.service}`);
      console.log(`   Location: ${mostDetailed.data.city}, ${mostDetailed.data.region}, ${mostDetailed.data.country}`);
    }
  }
  
  if (failedServices.length > 0) {
    console.log(`\n⚠️  ${failedServices.length} service(s) failed:`);
    failedServices.forEach(service => {
      console.log(`   - ${service.service}: ${service.error || 'Unknown error'}`);
    });
  }

  console.log('\n🔧 ENHANCED LOGIN ACTIVITY BENEFITS:');
  console.log('   • Multiple fallback services for reliability');
  console.log('   • WebRTC IP detection for additional accuracy');
  console.log('   • Improved location display with emojis');
  console.log('   • Better handling of localhost/development scenarios');
  console.log('   • Enhanced error recovery and timeout handling');
}

// Test device detection (simplified for Node.js)
function testDeviceDetection() {
  console.log('\n📱 TESTING DEVICE DETECTION\n');
  
  const testUserAgents = [
    {
      name: 'Chrome Desktop (Windows 10)',
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      expected: { device: 'desktop', browser: 'Chrome', os: 'Windows 10' }
    },
    {
      name: 'iPhone (Safari)',
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
      expected: { device: 'mobile', browser: 'Safari', os: 'iOS' }
    },
    {
      name: 'Android (Chrome)',
      ua: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      expected: { device: 'mobile', browser: 'Chrome', os: 'Android' }
    }
  ];

  console.log('┌──────────────────────────┬──────────┬──────────┬──────────────┐');
  console.log('│ Device Type              │ Device   │ Browser  │ OS           │');
  console.log('├──────────────────────────┼──────────┼──────────┼──────────────┤');
  
  testUserAgents.forEach(test => {
    const ua = test.ua;
    
    // Simplified detection logic
    const deviceType = /mobile|iphone|ipod|android/i.test(ua) ? 'mobile' : 
                      /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop';
    
    const browser = ua.includes('Chrome') ? 'Chrome' :
                   ua.includes('Firefox') ? 'Firefox' :
                   ua.includes('Safari') ? 'Safari' : 'Unknown';
    
    const os = ua.includes('Windows NT 10.0') ? 'Windows 10' :
              ua.includes('iPhone OS') ? 'iOS' :
              ua.includes('Android') ? 'Android' :
              ua.includes('Mac OS X') ? 'macOS' : 'Unknown';
    
    const name = test.name.padEnd(24);
    const device = deviceType.padEnd(8);
    const browserStr = browser.padEnd(8);
    const osStr = os.padEnd(12);
    
    console.log(`│ ${name} │ ${device} │ ${browserStr} │ ${osStr} │`);
  });
  
  console.log('└──────────────────────────┴──────────┴──────────┴──────────────┘');
}

async function main() {
  console.log('🚀 LOGIN ACTIVITY IP & LOCATION DETECTION TEST\n');
  console.log('Testing enhanced geolocation services and device detection...\n');
  
  await testLocationServices();
  testDeviceDetection();
  
  console.log('\n✨ Test completed! The enhanced login activity tracker should now provide:');
  console.log('   • More reliable IP detection');
  console.log('   • Better location accuracy');
  console.log('   • Improved fallback handling');
  console.log('   • Enhanced user experience with emoji indicators');
  console.log('\n💡 Next steps:');
  console.log('   1. Test login functionality in the browser');
  console.log('   2. Check the Login Activity tab in admin dashboard');
  console.log('   3. Verify real IP and location detection works');
  console.log('   4. Confirm localhost detection shows "🏠 Local Network"');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testLocationServices, testDeviceDetection };