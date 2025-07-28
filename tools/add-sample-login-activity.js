const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addSampleLoginActivity() {
  console.log('Adding sample login activity data...');
  
  // Get users
  const { data: users } = await supabase.from('users').select('id, email');
  
  if (!users?.length) {
    console.log('No users found');
    return;
  }
  
  const adminUser = users.find(u => u.email === 'admin1@test.com');
  const officerUser = users.find(u => u.email === 'officer1@test.com');
  
  // Sample login activities
  const sampleActivities = [
    {
      user_id: adminUser?.id,
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      device_type: 'desktop',
      browser: 'Chrome',
      operating_system: 'Windows',
      location_country: 'India',
      location_city: 'Mumbai',
      location_region: 'Maharashtra',
      success: true,
      login_time: '2025-07-27 09:30:00'
    },
    {
      user_id: officerUser?.id,
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
      device_type: 'mobile',
      browser: 'Safari',
      operating_system: 'iOS',
      location_country: 'India',
      location_city: 'Delhi',
      location_region: 'Delhi',
      success: true,
      login_time: '2025-07-27 10:15:00'
    },
    {
      user_id: adminUser?.id,
      ip_address: '192.168.1.102',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      device_type: 'desktop',
      browser: 'Chrome',
      operating_system: 'macOS',
      location_country: 'India',
      location_city: 'Bangalore',
      location_region: 'Karnataka',
      success: true,
      login_time: '2025-07-26 14:20:00'
    },
    {
      user_id: officerUser?.id,
      ip_address: '10.0.0.50',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      device_type: 'desktop',
      browser: 'Firefox',
      operating_system: 'Windows',
      location_country: 'India',
      location_city: 'Chennai',
      location_region: 'Tamil Nadu',
      success: false,
      failure_reason: 'Invalid password',
      login_time: '2025-07-26 16:45:00'
    },
    {
      user_id: adminUser?.id,
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      device_type: 'desktop',
      browser: 'Chrome',
      operating_system: 'Linux',
      location_country: 'Local',
      location_city: 'Local',
      location_region: 'Local',
      success: true,
      login_time: '2025-07-27 18:00:00'
    }
  ];
  
  for (const activity of sampleActivities) {
    if (activity.user_id) {
      const { error } = await supabase.from('login_activities').insert(activity);
      
      if (error) {
        console.log('Error adding login activity:', error.message);
      } else {
        console.log('Added login activity for:', activity.success ? 'successful' : 'failed', 'login');
      }
    }
  }
  
  console.log('Sample login activity data added successfully!');
  
  // Check total login activities
  const { data: activities } = await supabase.from('login_activities').select('*');
  console.log('Total login activities in database:', activities?.length || 0);
}

addSampleLoginActivity().catch(console.error);