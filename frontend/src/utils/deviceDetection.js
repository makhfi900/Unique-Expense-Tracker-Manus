/**
 * Device and browser detection utilities for login activity tracking
 */

export const getDeviceInfo = () => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Server-side';
  
  // Detect device type
  const getDeviceType = () => {
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  };

  // Detect browser
  const getBrowser = () => {
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('SamsungBrowser')) return 'Samsung Browser';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    return 'Unknown';
  };

  // Detect operating system
  const getOperatingSystem = () => {
    if (userAgent.includes('Windows NT 10.0')) return 'Windows 10';
    if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (userAgent.includes('Windows NT 6.2')) return 'Windows 8';
    if (userAgent.includes('Windows NT 6.1')) return 'Windows 7';
    if (userAgent.includes('Windows NT')) return 'Windows';
    if (userAgent.includes('Mac OS X')) return 'macOS';
    if (userAgent.includes('iPhone OS')) return 'iOS';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Unknown';
  };

  // Get real location info using ipapi.co service
  const getLocationInfo = async () => {
    try {
      // Use ipapi.co for production-ready geolocation
      const response = await fetch('https://ipapi.co/json/', {
        timeout: 5000 // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error('Geolocation service unavailable');
      }
      
      const data = await response.json();
      
      return {
        country: data.country_name || 'Unknown',
        region: data.region || 'Unknown',
        city: data.city || 'Unknown',
        ip: data.ip || 'Unknown'
      };
    } catch (error) {
      console.warn('Geolocation failed, using fallback:', error.message);
      // Fallback to basic detection
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        ip: '127.0.0.1' // Valid IP format for database inet type
      };
    }
  };

  // Get real client IP (will be fetched as part of location info)
  const getClientIP = async () => {
    try {
      const locationInfo = await getLocationInfo();
      return locationInfo.ip;
    } catch (error) {
      return '127.0.0.1'; // Valid IP format for database inet type
    }
  };

  return {
    userAgent,
    deviceType: getDeviceType(),
    browser: getBrowser(),
    operatingSystem: getOperatingSystem(),
    getLocationInfo,
    getClientIP
  };
};

/**
 * Create login activity record with real geolocation
 */
export const createLoginActivityData = async (userId, success = true, failureReason = null) => {
  const deviceInfo = getDeviceInfo();
  
  // Get real location data asynchronously
  const locationInfo = await deviceInfo.getLocationInfo();
  
  return {
    user_id: userId,
    ip_address: locationInfo.ip,
    user_agent: deviceInfo.userAgent,
    device_type: deviceInfo.deviceType,
    browser: deviceInfo.browser,
    operating_system: deviceInfo.operatingSystem,
    location_country: locationInfo.country,
    location_region: locationInfo.region,
    location_city: locationInfo.city,
    success,
    failure_reason: failureReason,
    login_time: new Date().toISOString()
  };
};