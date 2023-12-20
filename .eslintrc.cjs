module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'standard',
    'plugin:svelte/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest', // latest ECMAScript standards
    sourceType: 'module'
  },
  plugins: [
    'svelte'
  ],
  overrides: [
    {
      files: ['*.svelte'],
      rules: {
        // Custom rules for Svelte files
      }
    }
  ],
  rules: {
    'import/first': 'off',
    'import/no-duplicates': 'off',
    'import/no-mutable-exports': 'off',
    'import/prefer-default-export': 'off',
    'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 2, maxEOF: 0 }] // standard
    // 'import/no-unresolved when using svelte3/named-blocks, pending this issue
  }
}
