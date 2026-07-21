function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

export function appUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!baseUrl) return path;

  return new URL(path, trimTrailingSlash(baseUrl)).toString();
}