module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/no-deprecated-slot-attribute': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    /* TODO - remove these: */
    'prefer-const' : 'off',
    'no-var' : 'off',
    'no-mixed-spaces-and-tabs' : 'off',
    'prefer-rest-params' : 'off',
    'prefer-spread' : 'off',
    '@typescript-eslint/no-use-before-define' : 'off',
    '@typescript-eslint/no-empty-function' : 'off',
    '@typescript-eslint/no-inferrable-types' : 'off',
    'no-case-declarations' : 'off',
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        jest: true
      }
    }
  ]
}
