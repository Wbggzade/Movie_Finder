module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended', // ✅ Add this
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'prettier'], // ✅ Add 'prettier' here
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'prettier/prettier': [
      'error',
      {
        printWidth: 120,
        trailingComma: 'es5',
        semi: true,
        jsxSingleQuote: true,
        singleQuote: true,
        useTabs: true,
        endOfLine: 'auto',
      },
    ],
    'max-len': ['error', { code: 130 }],
    'no-duplicate-imports': 'error'
  },
};
