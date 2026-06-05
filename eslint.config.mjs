import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import reactHooks from 'eslint-plugin-react-hooks';

// Minimal flat config: only strips unused imports. Intentionally narrow so
// `eslint .` (the `lint` script) stays fast and noise-free; expand with
// recommended rule sets later if a fuller lint is desired.
export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next.config.mjs',
      'eslint.config.mjs',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    // Not enabling react-hooks rules, so its disable directives read as
    // "unused" — don't report those.
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'unused-imports': unusedImports,
      // Registered (not enabled) so existing `// eslint-disable react-hooks/*`
      // directives in the source resolve instead of erroring as unknown rules.
      'react-hooks': reactHooks,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
    },
  },
);
