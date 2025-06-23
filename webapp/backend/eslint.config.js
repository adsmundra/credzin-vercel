const js = require('@eslint/js');
const globals = require('globals');
const pluginSecurity = require('eslint-plugin-security');
const pluginNode = require('eslint-plugin-n');

module.exports = [
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: globals.node,
    },
    plugins: {
      js,
      security: pluginSecurity,
      n: pluginNode,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginNode.configs.recommended.rules,
      ...pluginSecurity.configs.recommended.rules,
      'no-console': ['warn', { allow: ['log', 'warn', 'error'] }],
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      curly: 'error',
      'n/no-process-exit': 'off',
      'no-unused-vars': 'warn',
      'security/detect-object-injection': 'off',
    },
  },
];
