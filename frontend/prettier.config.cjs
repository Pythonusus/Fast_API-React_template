// Prettier settings for frontend code style.
// See https://prettier.io/docs/en/options.html for more information.

module.exports = {
  // Always end statements with semicolons. Example: `const x = 1;`
  semi: true,

  // Use double quotes in JS/TS strings.
  singleQuote: false,

  // Use double quotes in JSX props too.
  jsxSingleQuote: false,

  // Two-space indentation.
  tabWidth: 2,

  // Wrap long lines around this width.
  printWidth: 80,

  // Keep trailing commas for cleaner diffs.
  trailingComma: "all",

  // Keep spaces inside object braces. Example: `{ name: "Alex" }`
  bracketSpacing: true,

  // Force LF (`\n`) line endings across all environments.
  // Prevents noisy diffs between Windows and Unix-like systems.
  endOfLine: "lf",

  // Always include parens in arrow params.
  // Example: `(x) => x + 1` instead of `x => x + 1`
  arrowParens: "always",
};
