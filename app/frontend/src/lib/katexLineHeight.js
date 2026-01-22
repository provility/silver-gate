const TALL_CONTENT_KEYWORDS = [
  'matrix}', 'array}',           // Matrices
  'frac{', 'dfrac{', 'cfrac{',   // Fractions
  'sum_', 'prod_', 'int_',       // Limits
  'sqrt{',                        // Square roots
  'stackrel{', 'overset{', 'underset{',
];

export function isNeededExtraLineHeight(latexString) {
  if (!latexString) return false;
  const lowerContent = latexString.toLowerCase();
  return TALL_CONTENT_KEYWORDS.some((keyword) =>
    lowerContent.includes(keyword.toLowerCase())
  );
}

export default isNeededExtraLineHeight;
