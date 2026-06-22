import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '';
  },
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  headers() {
    return new Headers();
  },
  cookies() {
    return {
      get: jest.fn(),
      getAll: jest.fn(),
      set: jest.fn(),
    };
  },
}));

// Mock Auth.js
jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue(null),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Global cleanup
afterEach(() => {
  jest.clearAllMocks();
});