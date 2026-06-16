import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  firebaseRulesPlugin.configs['flat/recommended'],
  {
    ignores: [
      'dist/**/*',
      'node_modules/**/*',
      '**/*.min.js',
      'firebase-applet-config.json',
      'src/components/ui/**/*',
      'scripts/dist/**/*',
      'coverage/**/*',
      '.stryker-tmp/**/*'
    ]
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'warn',
      'no-undef': 'off',
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "LabeledStatement[label.name='stub']",
          message: " Stubovi nisu dozvoljeni u produkcionom kodu."
        }
      ]
    }
  },
  {
    files: ['**/*.cjs', '**/*.mjs'],
    rules: { 'no-undef': 'off' }
  },
  {
    files: ['src/components/**/*.ts', 'src/components/**/*.tsx', 'src/pages/**/*.ts', 'src/pages/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'firebase/firestore',
              message: ' Direktan pristup Firestore-u iz komponenti je zabranjen. Koristite Express API BFF sloj.'
            },
            {
              name: '@firebase/firestore',
              message: ' Direktan pristup Firestore-u iz komponenti je zabranjen. Koristite Express API BFF sloj.'
            },
            {
              name: 'axios',
              message: ' Direktan axios import u komponentama je zabranjen. Koristite servise preko TanStack Query.'
            }
          ]
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='useEffect'] CallExpression[callee.name='fetch']",
          message: " Raw fetch u useEffect je zabranjen. Koristite TanStack React Query hooks."
        }
      ]
    }
  }
);
