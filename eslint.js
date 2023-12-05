module.exports = {
  env: {
    browser: true,
    es2022: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'airbnb',
    'airbnb-typescript',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  plugins: ['prettier', 'react', 'react-hooks', '@typescript-eslint'],
  ignorePatterns: ['*.js'],
  rules: {
    'operator-linebreak': [
      'error',
      'after',
      {
        overrides: {
          '?': 'ignore',
          ':': 'ignore',
        },
      },
    ],
    semi: 'off',
    'jsx-a11y/label-has-associated-control': 0,
    '@typescript-eslint/semi': 0,
    '@typescript-eslint/indent': 0,
    'implicit-arrow-linebreak': 'off',
    'no-confusing-arrow': 'off',
    'comma-dangle': 'off',
    '@typescript-eslint/comma-dangle': ['off'],
    'object-curly-newline': 'off',
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    'react/react-in-jsx-scope': 'off',
    'prefer-destructuring': [
      'error',
      {
        object: true,
        array: false,
      },
    ],
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': [0],
    'react/require-default-props': [0],
    'react/function-component-definition': [
      2,
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'import/order': [
      2,
      {
        groups: ['builtin', 'external', 'internal'],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['react'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'arrow-body-style': [0, 'never'],
  },
}
