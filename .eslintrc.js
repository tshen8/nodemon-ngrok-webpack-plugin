module.exports = {
  parser: 'babel-eslint',
  extends: 'airbnb-base',
  plugins: ['import'],
  env: {
    jest: true,
    node: true
  },
  rules: {
    'no-console': 0
  }
};
