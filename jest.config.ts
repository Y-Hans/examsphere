import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/tests/e2e/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@prisma/client$': '<rootDir>/tests/mocks/prisma.ts',
  },
  collectCoverageFrom: [
    'src/modules/**/*.ts',
    'src/server/shared/**/*.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.actions.ts',
    '!src/**/*.index.ts',
  ],
};

export default createJestConfig(config);