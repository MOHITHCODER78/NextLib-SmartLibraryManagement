module.exports = function isValidIsbn(isbn) {
  // Remove any hyphens, spaces, or other non‑alphanumeric characters
  const cleaned = isbn.replace(/[^0-9X]/gi, '').toUpperCase();
  // ISBN‑10 check (first 9 digits + checksum digit which can be X)
  const isbn10 = /^[0-9]{9}[0-9X]$/;
  // ISBN‑13 check (13 digits)
  const isbn13 = /^[0-9]{13}$/;
  return isbn10.test(cleaned) || isbn13.test(cleaned);
};
