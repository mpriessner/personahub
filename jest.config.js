module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/cli.ts',
    '!src/commands/**',
    '!src/core/engine.ts',  // Tested in Story 2.5
    '!src/utils/**',        // Tested in Story 2.5
    '!src/index.ts'
  ],
  coverageThreshold: {
    'src/storage/database.ts': {
      branches: 70,
      functions: 90,
      lines: 85,
      statements: 85
    },
    'src/core/config.ts': {
      branches: 90,
      functions: 100,
      lines: 95,
      statements: 95
    },
    'src/storage/files.ts': {
      branches: 75,
      functions: 100,
      lines: 90,
      statements: 90
    }
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};
