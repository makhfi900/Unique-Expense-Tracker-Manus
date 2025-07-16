// API Request Caching Utility
// Provides intelligent caching for API requests to reduce load times

class ApiCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live for each cache entry
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
    this.maxSize = 100; // Maximum number of cached entries
  }

  // Generate cache key from URL and options
  generateKey(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body || '';
    const headers = JSON.stringify(options.headers || {});
    return `${method}:${url}:${body}:${headers}`;
  }

  // Check if cache entry is still valid
  isValid(key) {
    const ttl = this.ttl.get(key);
    if (!ttl) return false;
    
    const now = Date.now();
    if (now > ttl) {
      this.delete(key);
      return false;
    }
    return true;
  }

  // Get cached response
  get(url, options = {}) {
    const key = this.generateKey(url, options);
    
    if (!this.isValid(key)) {
      return null;
    }
    
    const cached = this.cache.get(key);
    if (cached) {
      // Move to end (LRU)
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached;
    }
    
    return null;
  }

  // Set cached response
  set(url, options = {}, response, customTTL = null) {
    const key = this.generateKey(url, options);
    const ttl = customTTL || this.getTTLForRequest(url, options);
    
    // Clean up expired entries
    this.cleanup();
    
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.delete(oldestKey);
    }
    
    this.cache.set(key, response);
    this.ttl.set(key, Date.now() + ttl);
  }

  // Delete specific cache entry
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  // Clear all cache entries
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  // Clear cache entries matching pattern
  clearPattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
  }

  // Get appropriate TTL based on request type
  getTTLForRequest(url, options) {
    const method = options.method || 'GET';
    
    // Don't cache mutations
    if (method !== 'GET') {
      return 0;
    }
    
    // Custom TTL for different endpoints
    if (url.includes('/categories')) {
      return 10 * 60 * 1000; // 10 minutes for categories
    }
    
    if (url.includes('/users')) {
      return 5 * 60 * 1000; // 5 minutes for users
    }
    
    if (url.includes('/expenses')) {
      return 2 * 60 * 1000; // 2 minutes for expenses
    }
    
    if (url.includes('/analytics')) {
      return 30 * 1000; // 30 seconds for analytics
    }
    
    return this.defaultTTL;
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.keys()).map(key => ({
        key,
        ttl: this.ttl.get(key),
        expiresIn: this.ttl.get(key) - Date.now()
      }))
    };
  }

  // Invalidate cache entries when data changes
  invalidateRelated(url, options = {}) {
    const patterns = [];
    
    if (url.includes('/expenses')) {
      patterns.push('GET:/expenses');
      patterns.push('GET:/analytics');
    }
    
    if (url.includes('/categories')) {
      patterns.push('GET:/categories');
      patterns.push('GET:/expenses');
      patterns.push('GET:/analytics');
    }
    
    if (url.includes('/users')) {
      patterns.push('GET:/users');
      patterns.push('GET:/expenses');
    }
    
    patterns.forEach(pattern => this.clearPattern(pattern));
  }
}

// Cache implementation for API responses
class CachedApiClient {
  constructor(apiCall, cache = new ApiCache()) {
    this.apiCall = apiCall;
    this.cache = cache;
    this.pendingRequests = new Map(); // Prevent duplicate requests
  }

  async call(url, options = {}) {
    const method = options.method || 'GET';
    const cacheKey = this.cache.generateKey(url, options);
    
    // For GET requests, try cache first
    if (method === 'GET') {
      const cached = this.cache.get(url, options);
      if (cached) {
        return cached;
      }
      
      // Check for pending request
      if (this.pendingRequests.has(cacheKey)) {
        return this.pendingRequests.get(cacheKey);
      }
    }
    
    // Make the API call
    const request = this.makeRequest(url, options);
    
    // Store pending request for GET requests
    if (method === 'GET') {
      this.pendingRequests.set(cacheKey, request);
    }
    
    try {
      const response = await request;
      
      // Cache successful GET responses
      if (method === 'GET' && response) {
        this.cache.set(url, options, response);
      }
      
      // Invalidate related cache entries for mutations
      if (method !== 'GET') {
        this.cache.invalidateRelated(url, options);
      }
      
      return response;
    } finally {
      // Clean up pending request
      if (method === 'GET') {
        this.pendingRequests.delete(cacheKey);
      }
    }
  }

  async makeRequest(url, options) {
    try {
      return await this.apiCall(url, options);
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }

  // Prefetch data for improved UX
  async prefetch(urls) {
    const promises = urls.map(url => {
      const cached = this.cache.get(url);
      if (!cached) {
        return this.call(url).catch(() => null); // Ignore prefetch errors
      }
      return Promise.resolve(cached);
    });
    
    await Promise.all(promises);
  }

  // Clear cache and pending requests
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache statistics
  getStats() {
    return {
      cache: this.cache.getStats(),
      pendingRequests: this.pendingRequests.size
    };
  }
}

// Cache instance for reuse
const apiCache = new ApiCache();

// Export functions for easy use
export { ApiCache, CachedApiClient, apiCache };

// Helper function to create cached API client
export function createCachedApiClient(apiCall) {
  return new CachedApiClient(apiCall, apiCache);
}

// Pre-configured cache strategies
export const cacheStrategies = {
  // Fast changing data
  realtime: (url, options) => apiCache.getTTLForRequest(url, options) * 0.1,
  
  // Slow changing data
  stable: (url, options) => apiCache.getTTLForRequest(url, options) * 5,
  
  // Session-based caching
  session: () => 30 * 60 * 1000, // 30 minutes
  
  // No caching
  none: () => 0
};

// Cache warming function for important data
export async function warmCache(apiClient, routes = []) {
  const defaultRoutes = [
    '/categories',
    '/users',
    '/expenses?limit=10'
  ];
  
  const routesToWarm = routes.length > 0 ? routes : defaultRoutes;
  
  try {
    await Promise.all(
      routesToWarm.map(route => 
        apiClient.call(route).catch(() => null)
      )
    );
  } catch (error) {
    console.warn('Cache warming failed:', error);
  }
}

export default apiCache;