/**
 * Jest Polyfills
 * Provides browser APIs that are not available in Node.js test environment
 */

// Polyfill for URLSearchParams (used in routing)
import { URLSearchParams } from 'url';
global.URLSearchParams = URLSearchParams;

// Polyfill for TextEncoder/TextDecoder (used by some crypto operations)
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock crypto.subtle for authentication testing
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      sign: jest.fn().mockResolvedValue(new ArrayBuffer(64)),
      verify: jest.fn().mockResolvedValue(true),
    },
    getRandomValues: jest.fn((arr) => {
      // Fill with random values
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock CSS.supports for feature detection
global.CSS = {
  supports: jest.fn((property, value) => {
    // Mock common CSS feature support
    const supportedFeatures = {
      'display': ['flex', 'grid', 'block', 'inline'],
      'position': ['sticky', 'fixed', 'relative', 'absolute'],
      'overflow': ['auto', 'hidden', 'scroll'],
    };
    
    return supportedFeatures[property]?.includes(value) ?? false;
  }),
  escape: jest.fn((str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
};

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(clearTimeout);

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn((cb) => setTimeout(cb, 0));
global.cancelIdleCallback = jest.fn(clearTimeout);

// Mock scrollTo and scroll behavior
global.scrollTo = jest.fn();
global.scroll = jest.fn();

// Mock document.elementFromPoint for touch testing
document.elementFromPoint = jest.fn(() => null);
document.elementsFromPoint = jest.fn(() => []);

// Mock getBoundingClientRect for layout testing
Element.prototype.getBoundingClientRect = jest.fn(function() {
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    top: 0,
    right: 100,
    bottom: 100,
    left: 0,
    toJSON: () => ({})
  };
});

// Mock getComputedStyle for responsive testing
global.getComputedStyle = jest.fn((element) => ({
  getPropertyValue: jest.fn(),
  fontSize: '16px',
  width: '100px',
  height: '100px',
  minWidth: '0px',
  minHeight: '0px',
  display: 'block',
  position: 'static',
  overflow: 'visible',
  overflowX: 'visible',
  overflowY: 'visible',
  touchAction: 'auto',
  transform: 'none',
  opacity: '1',
  zIndex: 'auto'
}));

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
}));

// Mock clipboard API for copy/paste functionality
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(),
    readText: jest.fn().mockResolvedValue(''),
  },
  writable: true,
});

// Mock geolocation API
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn((success) => success({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10
      }
    })),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
  writable: true,
});

// Mock touch events support
global.TouchEvent = class TouchEvent extends Event {
  constructor(type, options = {}) {
    super(type, options);
    this.touches = options.touches || [];
    this.targetTouches = options.targetTouches || [];
    this.changedTouches = options.changedTouches || [];
  }
};

// Mock File and FileReader for file upload testing
global.File = class File {
  constructor(bits, name, options = {}) {
    this.bits = bits;
    this.name = name;
    this.size = bits.reduce((size, bit) => size + bit.length, 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

global.FileReader = class FileReader extends EventTarget {
  constructor() {
    super();
    this.result = null;
    this.error = null;
    this.readyState = FileReader.EMPTY;
  }
  
  static get EMPTY() { return 0; }
  static get LOADING() { return 1; }
  static get DONE() { return 2; }
  
  readAsText() {
    setTimeout(() => {
      this.readyState = FileReader.DONE;
      this.result = 'mock file content';
      this.dispatchEvent(new Event('load'));
    }, 10);
  }
  
  readAsDataURL() {
    setTimeout(() => {
      this.readyState = FileReader.DONE;
      this.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ=';
      this.dispatchEvent(new Event('load'));
    }, 10);
  }
};