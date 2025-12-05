module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'no-unused-vars': 'warn',
    'no-useless-escape': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'import/no-anonymous-default-export': 'warn',
    'default-case': 'warn',
    'react/jsx-no-undef': 'error'
  },
  env: {
    browser: true,
    es2021: true,
    node: true
  }
};
