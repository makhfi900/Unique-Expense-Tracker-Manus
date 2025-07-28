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

  // Get approximate location (this would typically use a geolocation API)
  const getLocationInfo = () => {
    // For now, return placeholder - in production you'd use a service like ipapi.co
    return {
      country: 'Unknown',
      region: 'Unknown', 
      city: 'Unknown'
    };
  };

  // Get IP address (approximate - client-side detection is limited)
  const getClientIP = async () => {
    try {
      // In production, you might use a service like ipapi.co or similar
      // For now, return placeholder
      return 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  };

  return {
    userAgent,
    deviceType: getDeviceType(),
    browser: getBrowser(),
    operatingSystem: getOperatingSystem(),
    locationInfo: getLocationInfo(),
    getClientIP
  };
};

/**
 * Create login activity record
 */
export const createLoginActivityData = async (userId, success = true, failureReason = null) => {
  const deviceInfo = getDeviceInfo();
  const clientIP = await deviceInfo.getClientIP();
  
  return {
    user_id: userId,
    ip_address: clientIP,
    user_agent: deviceInfo.userAgent,
    device_type: deviceInfo.deviceType,
    browser: deviceInfo.browser,
    operating_system: deviceInfo.operatingSystem,
    location_country: deviceInfo.locationInfo.country,
    location_region: deviceInfo.locationInfo.region,
    location_city: deviceInfo.locationInfo.city,
    success,
    failure_reason: failureReason,
    login_time: new Date().toISOString()
  };
};