const domain = process.env.EXPO_PUBLIC_DOMAIN;

export const apiBase = domain ? `https://${domain}` : "";

export const apiUrl = (path: string) => `${apiBase}${path}`;
