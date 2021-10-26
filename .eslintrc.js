module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'standard-with-typescript'
  ],
  parserOptions: {
    ecmaVersion: 13,
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    project: './tsconfig.json',
    extraFileExtensions: ['.vue']
  },
  plugins: [
    'vue',
    '@typescript-eslint'
  ],
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly'
  },
  rules: {
    'no-unused-vars': 'off',
    'vue/script-setup-uses-vars': 'error',
    'vue/max-attributes-per-line': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/require-default-prop': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off'
  }
}
