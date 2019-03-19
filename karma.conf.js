module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai', 'karma-typescript'],
    files: ['delegated-events.ts', 'test/test.ts'],
    preprocessors: {
      '**/*.ts': 'karma-typescript',
      '*.ts': 'karma-typescript',
    },
    reporters: ['progress', 'karma-typescript'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['ChromeHeadless'],
    singleRun: false,
    concurrency: Infinity,
  });
};
