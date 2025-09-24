module.exports = {
  // Basic formatting
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // JSX formatting
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  // Other formatting
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',

  // Override specific patterns
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: '*.yml',
      options: {
        printWidth: 80,
      },
    },
    {
      files: '*.html',
      options: {
        printWidth: 120,
      },
    },
  ],
};