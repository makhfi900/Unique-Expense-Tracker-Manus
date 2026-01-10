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

  // Enhanced location detection with multiple services and real IP detection
  const getLocationInfo = async () => {
    try {
      // Helper function for fetch with timeout using AbortController
      const fetchWithTimeout = async (url, timeoutMs = 5000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      // Multiple IP/location services for reliability
      // IMPORTANT: Geolocation services FIRST, IP-only service LAST as fallback
      const services = [
        {
          url: 'https://ipapi.co/json/',
          providesLocation: true,
          parser: (data) => ({
            ip: data.ip || 'Unknown',
            country: data.country_name || 'Unknown',
            region: data.region || 'Unknown',
            city: data.city || 'Unknown'
          })
        },
        {
          url: 'https://ipwho.is/',
          providesLocation: true,
          parser: (data) => ({
            ip: data.ip || 'Unknown',
            country: data.country || 'Unknown',
            region: data.region || 'Unknown',
            city: data.city || 'Unknown'
          })
        },
        {
          url: 'https://api.ip.sb/geoip',
          providesLocation: true,
          parser: (data) => ({
            ip: data.ip || 'Unknown',
            country: data.country || 'Unknown',
            region: data.region || 'Unknown',
            city: data.city || 'Unknown'
          })
        },
        {
          // IP-only fallback - last resort when geolocation services fail
          url: 'https://api.ipify.org?format=json',
          providesLocation: false,
          parser: (data) => ({ ip: data.ip, country: 'Unknown', region: 'Unknown', city: 'Unknown' })
        }
      ];

      // Try services in order
      for (const service of services) {
        try {
          const response = await fetchWithTimeout(service.url, 5000);

          if (response.ok) {
            const data = await response.json();
            const parsed = service.parser(data);

            // If we got a real IP (not localhost), check if location is valid
            if (parsed.ip && parsed.ip !== 'Unknown' && !parsed.ip.startsWith('127.')) {
              // For geolocation services, ensure we actually got location data
              if (service.providesLocation && parsed.country !== 'Unknown') {
                console.log('Successfully got location from:', service.url, parsed);
                return parsed;
              }
              // For IP-only service (last fallback), accept it even without location
              if (!service.providesLocation) {
                console.log('Got IP from fallback service:', service.url, parsed);
                return parsed;
              }
            }
          }
        } catch (error) {
          console.warn(`Location service ${service.url} failed:`, error.message);
          continue;
        }
      }
      
      // Enhanced WebRTC-based real IP detection as fallback
      const webrtcIP = await getRealIPViaWebRTC();
      if (webrtcIP) {
        return {
          country: 'Unknown (WebRTC)',
          region: 'Unknown (WebRTC)',
          city: 'Unknown (WebRTC)',
          ip: webrtcIP
        };
      }
      
      // Final fallback
      return {
        country: 'Unknown',
        region: 'Unknown', 
        city: 'Unknown',
        ip: '127.0.0.1'
      };
      
    } catch (error) {
      console.warn('All geolocation methods failed:', error.message);
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        ip: '127.0.0.1'
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
 * Enhanced WebRTC-based real IP detection
 */
export const getRealIPViaWebRTC = async () => {
  try {
    // Check if WebRTC is available
    if (typeof RTCPeerConnection === 'undefined') {
      console.warn('WebRTC not available in this environment');
      return null;
    }
    
    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };
    
    return new Promise((resolve) => {
      const rtc = new RTCPeerConnection(rtcConfig);
      const ips = new Set();
      let resolved = false;
      
      rtc.createDataChannel('');
      
      rtc.onicecandidate = (ice) => {
        if (ice.candidate) {
          // Extract IP address from ICE candidate
          const match = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(ice.candidate.candidate);
          if (match) {
            const ip = match[1];
            ips.add(ip);
            
            // Prefer public IPs over private ones
            if (!ip.startsWith('127.') && 
                !ip.startsWith('192.168.') && 
                !ip.startsWith('10.') && 
                !ip.startsWith('172.') &&
                !resolved) {
              resolved = true;
              console.log('Found real IP via WebRTC:', ip);
              resolve(ip);
              rtc.close();
            }
          }
        }
      };
      
      rtc.createOffer()
        .then(offer => rtc.setLocalDescription(offer))
        .catch(error => console.warn('WebRTC offer failed:', error));
      
      // Timeout after 3 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          // Return first IP found, even if private
          const firstIP = Array.from(ips)[0];
          console.log('WebRTC timeout, using first IP found:', firstIP || 'none');
          resolve(firstIP || null);
          rtc.close();
        }
      }, 3000);
    });
  } catch (error) {
    console.warn('WebRTC IP detection failed:', error);
    return null;
  }
};

/**
 * Create login activity record with enhanced real geolocation
 */
export const createLoginActivityData = async (userId, success = true, failureReason = null) => {
  const deviceInfo = getDeviceInfo();
  
  // Get enhanced location data with multiple fallbacks
  const locationInfo = await deviceInfo.getLocationInfo();
  
  // Log for debugging
  console.log('Login activity location info:', locationInfo);
  
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