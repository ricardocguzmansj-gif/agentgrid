/**
 * Sanitiza una variable de entorno para producción.
 * Elimina el carácter BOM (Byte Order Mark) y espacios innecesarios.
 */
export function sanitizeEnv(value: string | undefined): string | undefined {
  if (!value) return value;
  // Elimina \uFEFF (BOM) y espacios al principio/final
  return value.replace(/^\uFEFF/g, '').trim();
}
