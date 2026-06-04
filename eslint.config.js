// 🛡️ [SECURITY-ENT-GUARD] Provereno i zasticeno od regresije
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
      'src/components/ui/**/*' // Ignore generated shadcn UI components just in case
    ]
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'off', // handled by TS
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }], // enforce structured services instead of console.log debris
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='setInterval']",
          message: "🚫 IN-MEMORY INTERVAL DETECTED: Upotreba setInterval je strogo zabranjena u novom runtime kodu na backendu. Koristite BullMQ za asinkroni pozadinski rad."
        },
        {
          selector: "LabeledStatement[label.name='stub']",
          message: "🚫 STUB ENFORCEMENT: Labele i stubovi nisu dozvoljeni u produkcionom kodu."
        }
      ]
    }
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
              message: '🚫 DIRECT CLIENT FIRESTORE BYPASS DETECTED: Zabranjen je direktan pristup Firestore-u iz komponenti i stranica. Sve operacije moraju ici preko Express API BFF sloja (/server/routes/api.routes.ts) i TanStack Query.'
            },
            {
              name: '@firebase/firestore',
              message: '🚫 DIRECT CLIENT FIRESTORE BYPASS DETECTED: Zabranjen je direktan pristup Firestore-u iz komponenti i stranica. Sve operacije moraju ici preko Express API BFF sloja (/server/routes/api.routes.ts) i TanStack Query.'
            },
            {
              name: 'axios',
              message: '🚫 DIRECT AXIOS IMPORT DETECTED: Komponente ne smeju direktno importovati axios. Koristite servise u src/services i pozivajte ih preko TanStack Query-ja.'
            }
          ]
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='useEffect'] CallExpression[callee.name='fetch']",
          message: "🚫 RAW FETCH IN USEEFFECT DETECTED: Zabranjeno preuzimanje podataka golo u komponentama. Obavezna upotreba TanStack React Query hooks!"
        }
      ]
    }
  }
);

