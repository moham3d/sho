module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/contracts/visits/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'visits-junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],
  // Global test configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    },
  },
  // Test environment variables
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  // Setup files
  setupFiles: [
    '<rootDir>/tests/setup-env.js',
  ],
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/global-setup.js',
  globalTeardown: '<rootDir>/tests/global-teardown.js',
  // Maximum number of test workers
  maxWorkers: 4,
  // Test retry configuration
  retryTimes: 2,
  // Slow test threshold (in ms)
  slowTestThreshold: 10000,
  // Test name pattern
  testNamePattern: undefined,
  // Verbose output
  verbose: true,
  // Error formatting
  errorOnDeprecated: true,
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  // Detect open handles
  detectOpenHandles: true,
  // Detect leaks
  detectLeaks: true,
  // Fail on console.warn
  errorOnDeprecated: false,
  // Collect coverage from all files
  collectCoverage: false,
  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/dist/',
  ],
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'clover',
    'html',
  ],
  // Coverage threshold
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.pnp\\.[^\\/]+$',
  ],
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
  ],
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
  ],
  // Resolver configuration
  resolver: null,
  // Snapshot serializers
  snapshotSerializers: [],
  // Test regex
  testRegex: [
    '/tests/.*\\.(test|spec)\\.(ts|tsx|js)$',
  ],
  // Test URL
  testURL: 'http://localhost:3000',
  // Timers
  timers: 'real',
  // Use stdlib
  useStderr: false,
  // Watch path ignore patterns
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.git/',
  ],
  // Watch plugins
  watchPlugins: [],
  // Worker options
  workerIdleMemoryLimit: null,
  // Worker threads
  workerThreads: false,
  // Max workers
  maxWorkers: '50%',
  // Worker ID
  workerId: undefined,
  // Run tests by ID
  runTestsByPath: false,
  // Changed files with an ancestor
  changedSince: undefined,
  // Changed files
  onlyChanged: false,
  // List tests
  listTests: false,
  // Output file
  outputFile: undefined,
  // JSON output
  json: false,
  // Use standard reporters
  useStderr: false,
  // Test location in results
  testLocationInResults: false,
  // Add results
  addResults: false,
  // Verbose
  verbose: true,
  // Expand
  expand: false,
  // No coverage
  noCoverage: false,
  // All
  all: false,
  // Test path pattern
  testPathPattern: undefined,
  // No test path pattern
  noStackTrace: false,
  // Detect leaks
  detectLeaks: false,
  // Detect open handles
  detectOpenHandles: false,
  // Error on deprecated
  errorOnDeprecated: false,
  // Only failures
  onlyFailures: false,
  // Test name pattern
  testNamePattern: undefined,
  // Pass with no tests
  passWithNoTests: false,
  // Last commit
  lastCommit: false,
  // Changes since
  changedSince: undefined,
  // Only changed
  onlyChanged: false,
  // Collect coverage from all files
  collectCoverage: false,
  // Coverage directory
  coverageDirectory: 'coverage',
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'clover',
    'html',
  ],
  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/dist/',
  ],
  // Coverage threshold
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.pnp\\.[^\\/]+$',
  ],
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
  ],
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
  ],
  // Resolver configuration
  resolver: null,
  // Snapshot serializers
  snapshotSerializers: [],
  // Test regex
  testRegex: [
    '/tests/.*\\.(test|spec)\\.(ts|tsx|js)$',
  ],
  // Test URL
  testURL: 'http://localhost:3000',
  // Timers
  timers: 'real',
  // Use stdlib
  useStderr: false,
  // Watch path ignore patterns
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.git/',
  ],
  // Watch plugins
  watchPlugins: [],
  // Worker options
  workerIdleMemoryLimit: null,
  // Worker threads
  workerThreads: false,
  // Max workers
  maxWorkers: '50%',
  // Worker ID
  workerId: undefined,
  // Run tests by ID
  runTestsByPath: false,
  // Changed files with an ancestor
  changedSince: undefined,
  // Changed files
  onlyChanged: false,
  // List tests
  listTests: false,
  // Output file
  outputFile: undefined,
  // JSON output
  json: false,
  // Use standard reporters
  useStderr: false,
  // Test location in results
  testLocationInResults: false,
  // Add results
  addResults: false,
  // Verbose
  verbose: true,
  // Expand
  expand: false,
  // No coverage
  noCoverage: false,
  // All
  all: false,
  // Test path pattern
  testPathPattern: undefined,
  // No test path pattern
  noStackTrace: false,
  // Detect leaks
  detectLeaks: false,
  // Detect open handles
  detectOpenHandles: false,
  // Error on deprecated
  errorOnDeprecated: false,
  // Only failures
  onlyFailures: false,
  // Test name pattern
  testNamePattern: undefined,
  // Pass with no tests
  passWithNoTests: false,
  // Last commit
  lastCommit: false,
  // Changes since
  changedSince: undefined,
  // Only changed
  onlyChanged: false,
  // Collect coverage from all files
  collectCoverage: false,
  // Coverage directory
  coverageDirectory: 'coverage',
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'clover',
    'html',
  ],
  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/dist/',
  ],
  // Coverage threshold
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.pnp\\.[^\\/]+$',
  ],
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
  ],
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
  ],
  // Resolver configuration
  resolver: null,
  // Snapshot serializers
  snapshotSerializers: [],
  // Test regex
  testRegex: [
    '/tests/.*\\.(test|spec)\\.(ts|tsx|js)$',
  ],
  // Test URL
  testURL: 'http://localhost:3000',
  // Timers
  timers: 'real',
  // Use stdlib
  useStderr: false,
  // Watch path ignore patterns
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.git/',
  ],
  // Watch plugins
  watchPlugins: [],
  // Worker options
  workerIdleMemoryLimit: null,
  // Worker threads
  workerThreads: false,
  // Max workers
  maxWorkers: '50%',
  // Worker ID
  workerId: undefined,
  // Run tests by ID
  runTestsByPath: false,
  // Changed files with an ancestor
  changedSince: undefined,
  // Changed files
  onlyChanged: false,
  // List tests
  listTests: false,
  // Output file
  outputFile: undefined,
  // JSON output
  json: false,
  // Use standard reporters
  useStderr: false,
  // Test location in results
  testLocationInResults: false,
  // Add results
  addResults: false,
  // Verbose
  verbose: true,
  // Expand
  expand: false,
  // No coverage
  noCoverage: false,
  // All
  all: false,
  // Test path pattern
  testPathPattern: undefined,
  // No test path pattern
  noStackTrace: false,
  // Detect leaks
  detectLeaks: false,
  // Detect open handles
  detectOpenHandles: false,
  // Error on deprecated
  errorOnDeprecated: false,
  // Only failures
  onlyFailures: false,
  // Test name pattern
  testNamePattern: undefined,
  // Pass with no tests
  passWithNoTests: false,
  // Last commit
  lastCommit: false,
  // Changes since
  changedSince: undefined,
  // Only changed
  onlyChanged: false,
};