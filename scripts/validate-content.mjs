/**
 * Dependency-free integrity checks for Git-backed CMS content.
 * This is not a WCAG conformance test.
 */
import { readFileSync } from "node:fs";

const load = (path) =>
  JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
const events = load("content/events/events.json");
const books = load("content/books/books.json");
const home = load("content/home/home.json");
const settings = load("content/settings/settings.json");

const problems = [];
const check = (ok, message) => { if (!ok) problems.push(message); };
const text = (value) => typeof value === "string" && value.trim().length > 0;
const isSafeUrl = (url) =>
  !url || /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url);

check(text(home.headline), "Missing home page headline");
check(text(home.introduction), "Missing home page description");
check(text(home.heroImage), "Missing home page image");
check(text(home.heroAlt), "Home page image needs alternative text");
const titles = new Set();
for (const [i, event] of events.entries.entries()) {
  const name = `Event ${i + 1}`;
  for (const field of ["title", "date", "time", "description", "category"]) {
    check(text(event[field]), `${name} missing ${field}`);
  }
  check(!event.image || text(event.imageAlt), `${name} image lacks alt text`);
  check(isSafeUrl(event.link), `${name} has an invalid URL`);
  check(!titles.has(event.title), `${name} title appears twice`);
  titles.add(event.title);
}
for (const [i, book] of books.entries.entries()) {
  check(text(book.title), `Book ${i + 1} needs a title`);
  check(text(book.cover), `Book ${i + 1} needs an image`);
}
check(text(settings.address), "Missing library address");
check(text(settings.phoneLink), "Missing contact telephone");
check(Array.isArray(settings.hours) && settings.hours.length > 0, "Missing hours");
for (const item of settings.hours) {
  check(text(item.label), "Hours entry missing a label");
  check(Array.isArray(item.days) && item.days.length > 0, "Hours entry missing days");
  check(item.closed || (/^([01]\d|2[0-3]):[0-5]\d$/.test(item.opens) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(item.closes)),
    `Hours invalid for ${item.label}`);
}
if (problems.length) {
  problems.forEach(item => console.error(`✗ ${item}`));
  process.exitCode = 1;
} else {
  console.log(`✓ Content valid: ${events.entries.length} events, ${books.entries.length} books.`);
}
