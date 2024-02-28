module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['perfectionist', 'unused-imports', '@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'import/prefer-default-export': 0,
    'unused-imports/no-unused-imports': 1,
    'unused-imports/no-unused-vars': [
      0,
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    // perfectionist
    // https://eslint-plugin-perfectionist.azat.io/
    'perfectionist/sort-named-imports': [
      1,
      {
        order: 'asc',
        type: 'line-length',
      },
    ],
    'perfectionist/sort-named-exports': [
      1,
      {
        order: 'asc',
        type: 'line-length',
      },
    ],
    'perfectionist/sort-exports': [
      1,
      {
        order: 'asc',
        type: 'line-length',
      },
    ],
    'perfectionist/sort-imports': [
      1,
      {
        order: 'asc',
        type: 'line-length',
        'newlines-between': 'always',
        'internal-pattern': ['src/**'],
      },
    ],
  },
};
