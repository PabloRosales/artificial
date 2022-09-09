module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        "plugin:prettier/recommended"
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'prettier'],
    "rules": {
        'prettier/prettier': 'error',
        "@typescript-eslint/no-empty-function": ["error", { "allow": ["arrowFunctions"] }]
    },
    root: true,
};
