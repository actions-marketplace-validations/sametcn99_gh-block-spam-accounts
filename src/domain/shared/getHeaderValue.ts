export function getHeaderValue(
  headers: Record<string, string | number | string[] | undefined>,
  name: string,
): string | null {
  const headerValue = headers[name.toLowerCase()] ?? headers[name];

  if (typeof headerValue === "string") {
    return headerValue;
  }

  if (typeof headerValue === "number") {
    return String(headerValue);
  }

  if (Array.isArray(headerValue)) {
    return headerValue.join(", ");
  }

  return null;
}
