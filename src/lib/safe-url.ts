/**
 * Guards for editor-supplied (CMS) values that end up in href/src attributes.
 * Staff can type anything into a Tina text field, so render-time checks stop
 * `javascript:` / `data:` URLs from ever reaching the page.
 */
import { sanitizeHref, sanitizeImageSrc } from '@tinacms/astro/sanitize';

export { sanitizeImageSrc };

/** A safe http(s)/mailto/relative link, or "" when the value is empty or unsafe. */
export const safeLink = (value: unknown): string => sanitizeHref(value, '');

/** A `tel:` link built only from digits and common phone punctuation, or "" otherwise. */
export function safeTelHref(value: unknown): string {
  if (typeof value !== 'string') return '';
  const phone = value.trim();
  return /^\+?[0-9()\-.\s]+$/.test(phone) ? `tel:${phone.replace(/[^\d+]/g, '')}` : '';
}

/** Makes a JSON string safe to place inside an inline <script> element. */
export const escapeForScript = (json: string): string => json.replace(/</g, '\\u003c');
