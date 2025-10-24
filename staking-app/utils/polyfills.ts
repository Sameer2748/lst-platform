// Polyfills for Solana web3.js compatibility in React Native
// MUST be imported before any other modules that use Buffer

import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import 'react-native-url-polyfill/auto';

// Make Buffer available globally - this is critical for Solana
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// Ensure Buffer is available on globalThis as well
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

// Polyfill for crypto.getRandomValues if not available
if (typeof global.crypto === 'undefined') {
  // Use a simple crypto polyfill for React Native
  global.crypto = {
    getRandomValues: (arr: any) => {
      const crypto = require('react-native-get-random-values');
      return crypto.getRandomValues(arr);
    }
  };
}

// Ensure TextEncoder and TextDecoder are available
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('text-encoding').TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('text-encoding').TextDecoder;
}

// Polyfill for URL if not available
if (typeof global.URL === 'undefined') {
  global.URL = require('react-native-url-polyfill').URL;
}

// Polyfill for Event if not available (needed for some Solana libraries)
if (typeof global.Event === 'undefined') {
  global.Event = class Event {
    public type: string;
    public target: any;
    public currentTarget: any;
    public bubbles: boolean;
    public cancelable: boolean;
    public defaultPrevented: boolean;
    public eventPhase: number;
    public isTrusted: boolean;
    public timeStamp: number;

    constructor(type: string, eventInitDict?: any) {
      this.type = type;
      this.target = null;
      this.currentTarget = null;
      this.bubbles = eventInitDict?.bubbles || false;
      this.cancelable = eventInitDict?.cancelable || false;
      this.defaultPrevented = false;
      this.eventPhase = 0;
      this.isTrusted = false;
      this.timeStamp = Date.now();
    }

    preventDefault() {
      this.defaultPrevented = true;
    }

    stopPropagation() {
      // No-op for React Native
    }

    stopImmediatePropagation() {
      // No-op for React Native
    }
  };
}

// Polyfill for CustomEvent if not available
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent extends (global as any).Event {
    public detail: any;

    constructor(type: string, eventInitDict?: any) {
      super(type, eventInitDict);
      this.detail = eventInitDict?.detail || null;
    }
  };
}

// Polyfill for window if not available (some libraries expect it)
if (typeof global.window === 'undefined') {
  global.window = global;
}

// Additional DOM polyfills that might be needed
if (typeof global.document === 'undefined') {
  global.document = {
    createElement: () => ({}),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

// Polyfill for navigator if not available
if (typeof global.navigator === 'undefined') {
  global.navigator = {
    userAgent: 'React Native',
    platform: 'React Native',
  };
}

// Polyfill for location if not available
if (typeof global.location === 'undefined') {
  global.location = {
    href: 'https://localhost',
    origin: 'https://localhost',
    protocol: 'https:',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
  };
}

export {};
