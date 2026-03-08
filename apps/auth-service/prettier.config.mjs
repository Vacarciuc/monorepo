/** @type {
 *   import('prettier').Config
 *   & import('@trivago/prettier-plugin-sort-imports').PrettierConfig
 * } */
const config = {
  singleQuote: true,
  semi: false,
  jsxSingleQuote: false,
  tabWidth: 2,
  arrowParens: 'always',
  bracketSpacing: true,
  trailingComma: 'all',
  useTabs: false,
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  printWidth: 80,
  quoteProps: 'preserve',
  importOrderParserPlugins: ["typescript", "decorators-legacy"],
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
  ],
  importOrder: ['^~/(.*)$', '^@/(.*)$', '^[./]'],
  importOrderCaseInsensitive: false,
  importOrderSeparation: true,
  importOrderGroupNamespaceSpecifiers: true,
  importOrderSortSpecifiers: true
}

export default config
