module.exports = {
  globals: {
    __PATH_PREFIX__: true,
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint", "simple-import-sort", "jsx-a11y"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "eslint-config-prettier",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "plugin:jsx-a11y/recommended",
      ],
      rules: {
        "simple-import-sort/imports": "error",
        "simple-import-sort/exports": "error",
        "import/no-extraneous-dependencies": "error",
      },
    },
  ],
};
