import { useEffect, useMemo, useRef, useState } from "react";
import { libraryEvents, eventId } from "../lib/library-content";
import { safeLink, sanitizeImageSrc } from "../lib/safe-url";
import "./AdirondackCalendar.css";
import "./AdirondackCalendarRefinements.css";

/**
 * Events-only version of the Goff–Nelson architectural calendar.
 * No room availability API, booking handlers, patron data, or Supabase dependency.
 */
type LibraryEvent = {
  title: string; date: string; time: string; description: string; category: string;
  image?: string; imageAlt?: string; link?: string;
};

const events: LibraryEvent[] = libraryEvents;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PHONE = "518-359-9421";
const TEL = "tel:+15183599421";
const isISO = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);
const keyOf = (date: Date) =>
  [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const atNoon = (year: number, month: number, day: number) => new Date(year, month, day, 12);
const friendlyDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);

const tone = (event: LibraryEvent) =>
  /child|tot|story/i.test(event.category + " " + event.title) ? "lake"
  : /teen|young adult/i.test(event.category) ? "berry"
  : /craft|knit|yarn/i.test(event.category + " " + event.title) ? "gold"
  : /history|heritage/i.test(event.category + " " + event.title) ? "spruce"
  : /tech|computer/i.test(event.category + " " + event.title) ? "fern" : "maple";

function matchDay(rule: string) {
  return DAYS.findIndex(day => rule.toLowerCase().includes(day.toLowerCase()));
}
function ordinal(rule: string) {
  return /first/i.test(rule) ? 1 : /second/i.test(rule) ? 2 : /third/i.test(rule) ? 3
    : /fourth/i.test(rule) ? 4 : /last/i.test(rule) ? -1 : 0;
}
function occursOn(event: LibraryEvent, date: Date): boolean {
  const rule = event.date.trim();
  if (isISO(rule)) return rule === keyOf(date);
  const weekday = matchDay(rule);
  if (weekday < 0 || weekday !== date.getDay()) return false;
  if (/^every\s/i.test(rule)) return true;
  const nth = ordinal(rule);
  if (!nth) return false;
  if (nth === -1) return atNoon(date.getFullYear(), date.getMonth(), date.getDate() + 7).getMonth() !== date.getMonth();
  return Math.floor((date.getDate() - 1) / 7) + 1 === nth;
}
function isCalendarRule(event: LibraryEvent) {
  const rule = event.date.trim();
  return isISO(rule) || (matchDay(rule) >= 0 && (/^every\s/i.test(rule) || ordinal(rule) !== 0));
}
function monthStart(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "numeric", timeZone: "America/New_York"
  }).formatToParts(now);
  const year = Number(parts.find(p => p.type === "year")?.value || now.getFullYear());
  const month = Number(parts.find(p => p.type === "month")?.value || now.getMonth() + 1) - 1;
  return atNoon(year, month, 1);
}
function todayNewYork() {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/New_York"
  }).formatToParts(new Date());
  const field = (part: string) => parts.find(p => p.type === part)?.value || "";
  return [field("year"), field("month"), field("day")].join("-");
}
function useMonthDates(month: Date) {
  return useMemo(() => {
    const offset = month.getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells = Math.max(35, Math.ceil((offset + count) / 7) * 7);
    return Array.from({ length: cells }, (_, i) => atNoon(month.getFullYear(), month.getMonth(), 1 - offset + i));
  }, [month]);
}

export default function EventLibraryCalendar() {
  const [month, setMonth] = useState(monthStart);
  const [category, setCategory] = useState("All programs");
  const [displayMode, setDisplayMode] = useState<"calendar" | "list">("calendar");
  const [selected, setSelected] = useState<Date | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [openedEvent, setOpenedEvent] = useState<LibraryEvent | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const wasViewingDetails = useRef(false);

  const days = useMonthDates(month);
  const categories = ["All programs", ...Array.from(new Set(events.map(e => e.category).filter(Boolean)))];
  const visible = category === "All programs" ? events : events.filter(e => e.category === category);
  const undated = visible.filter(e => !isCalendarRule(e));
  const dateEvents = (date: Date) => visible.filter(event => occursOn(event, date));
  const monthTitle = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(month);
  const today = todayNewYork();
  const monthEvents = days.filter(date => date.getMonth() === month.getMonth())
    .flatMap(date => dateEvents(date).map(event => ({ date, event })));
  const selectedEvents = selected ? dateEvents(selected) : [];
  const displayedEvent = selectedEvents.length ? selectedEvents[slideIndex % selectedEvents.length] : null;

  const openDate = (date: Date, event?: LibraryEvent) => {
    setSelected(date);
    setSlideIndex(0);
    setOpenedEvent(event || null);
    wasViewingDetails.current = false;
    dialog.current?.showModal();
  };
  const close = () => {
    if (dialog.current?.open) dialog.current.close();
    setSelected(null);
    setOpenedEvent(null);
    wasViewingDetails.current = false;
  };
  useEffect(() => {
    if (!selected || !dialog.current?.open) return;
    if (openedEvent) backRef.current?.focus();
    else if (wasViewingDetails.current) cardRef.current?.focus();
    wasViewingDetails.current = Boolean(openedEvent);
  }, [openedEvent, selected]);

  return (
    <section className="adk" aria-label="Goff–Nelson library programs calendar">
      <header className="adk-hero">
        <div className="adk-hero-inner">
          <div className="adk-hero-copy">
            <span className="adk-eyebrow">GOFF–NELSON MEMORIAL LIBRARY · TUPPER LAKE, NY</span>
            <h1>Events <span className="adk-gold">&amp; Programs</span></h1>
            <p>Explore library events and programs. Select a date for details.</p>
          </div>
        </div>
      </header>

      <div className="adk-edition" aria-label="Community almanac">
        <div className="adk-edition-first"><span className="adk-printer-mark" aria-hidden="true">✦</span><span>THE TUPPER LAKE COMMUNITY ALMANAC</span></div>
        <span className="adk-edition-rule" aria-hidden="true" />
        <span className="adk-edition-meta">Rooted in Tupper Lake · Made for neighbors</span>
      </div>

      <div className="adk-facade" aria-label="Calendar framed by the Goff–Nelson Memorial Library building">
        <div className="adk-facade-roof" aria-hidden="true">
          <picture>
            <source media="(max-width: 600px)" srcSet="/images/goff-nelson-calendar-roof-mobile.svg" type="image/svg+xml" />
            <img src="/images/goff-nelson-calendar-roof.svg" alt="" width="1100" height="210" decoding="async" />
          </picture>
        </div>
        <div className="adk-facade-nameplate">
          <span className="adk-nameplate-number" aria-hidden="true">41</span>
          <span className="adk-nameplate-text"><small>GOFF–NELSON MEMORIAL</small><strong>LIBRARY</strong></span>
          <span className="adk-nameplate-detail">A PLACE TO GATHER SINCE 1914</span>
        </div>

        <div className="adk-calendar-shell">
          <div className="adk-topline adk-topline-compact">
            <div className="adk-guide-identity">
              <span className="adk-guide-sunburst" aria-hidden="true">✳</span>
              <div className="adk-guide-words">
                <span className="adk-eyebrow">THE COMMUNITY ALMANAC</span>
                <h2>Programs &amp; gatherings</h2>
              </div>
            </div>
            <div className="adk-guide-tools">
              <label className="adk-filter">Show
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <div className="adk-display-toggle" role="group" aria-label="Choose event display">
                <button type="button" aria-pressed={displayMode === "calendar"} onClick={() => setDisplayMode("calendar")}>Calendar</button>
                <button type="button" aria-pressed={displayMode === "list"} onClick={() => setDisplayMode("list")}>List</button>
              </div>
            </div>
          </div>

          <div className="adk-month-toolbar">
            <button type="button" className="adk-month-arrow" onClick={() => setMonth(atNoon(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
            <h3 aria-live="polite">{monthTitle}</h3>
            <button type="button" className="adk-month-arrow" onClick={() => setMonth(atNoon(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">›</button>
            <button type="button" className="adk-today" onClick={() => setMonth(monthStart())}>Today</button>
          </div>

          {displayMode === "list" ? (
            <div className="adk-agenda" role="list" aria-label={monthTitle + " events"}>
              {monthEvents.length ? monthEvents.map(({ date, event }, i) => (
                <div className={"adk-agenda-row adk-tone-" + tone(event)} role="listitem" key={keyOf(date) + "-" + eventId(event.title) + "-" + i}>
                  <div className="adk-agenda-date" aria-hidden="true">
                    <span>{new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)}</span>
                    <strong>{date.getDate()}</strong>
                  </div>
                  <div className="adk-agenda-content">
                    <span className="adk-event-tag">{event.category}</span>
                    <h3>{event.title}</h3>
                    <p>{event.time}</p>
                  </div>
                  <button type="button" onClick={() => openDate(date, event)} aria-label={"Details for " + event.title + " on " + friendlyDate(date)}>
                    Details <span aria-hidden="true">↗</span>
                  </button>
                </div>
              )) : <p className="adk-agenda-empty">No programs are listed for this month. Try another month or category.</p>}
            </div>
          ) : (
            <>
              <div className="adk-weekdays" aria-hidden="true">
                {DAYS.map(day => <span key={day}><span className="adk-longday">{day.slice(0, 3)}</span><span className="adk-shortday">{day.slice(0, 1)}</span></span>)}
              </div>
              <div className="adk-grid" role="group" aria-label={monthTitle + " library events calendar"}>
                {days.map(date => {
                  const items = dateEvents(date);
                  const inMonth = date.getMonth() === month.getMonth();
                  return (
                    <button type="button" key={keyOf(date)}
                      aria-label={friendlyDate(date) + ": " + items.length + " listed programs"}
                      className={"adk-day" + (!inMonth ? " adk-day-muted" : "") + (keyOf(date) === today ? " adk-day-today" : "")}
                      onClick={() => openDate(date)}>
                      <span className="adk-number">{date.getDate()}</span>
                      <span className="adk-day-events">
                        {items.slice(0, 2).map((event, i) => (
                          <span key={eventId(event.title) + "-" + i} className={"adk-event-chip adk-tone-" + tone(event)}>{event.title}</span>
                        ))}
                        {items.length > 2 && <span className="adk-more">+{items.length - 2} more</span>}
                      </span>
                      {items.length > 0 && <span className="adk-dots" aria-hidden="true"><i /><i /></span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <p className="adk-footnote">Programs may change; please confirm event times with library staff.</p>
        </div>

        <div className="adk-facade-lower">
          <div className="adk-facade-entry" aria-hidden="true">
            <span className="adk-entry-window" /><span className="adk-entry-window" /><span className="adk-entry-handle" />
          </div>
          <div className="adk-facade-lower-copy">
            <strong>Your library is full of life.</strong>
            <span>41 Lake Street · Tupper Lake, New York</span>
          </div>
          <a className="adk-facade-action" href={TEL}>Questions? Call {PHONE} <span aria-hidden="true">↗</span></a>
        </div>
        <div className="adk-facade-foundation" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
      </div>

      {undated.length > 0 && (
        <details className="adk-other">
          <summary>Programs awaiting a specific calendar date ({undated.length})</summary>
          <div>{undated.map((event, i) => (
            <article key={eventId(event.title) + "-" + i}>
              <h3>{event.title}</h3>
              <p>{event.date} · {event.time} — {event.description}</p>
            </article>
          ))}</div>
        </details>
      )}
      <p className="adk-art-credit">Historical artwork: <a href="https://commons.wikimedia.org/wiki/File:AmCyc_Adirondack_Mountains_-_view_from_Placid_Lake.jpg" target="_blank" rel="noopener noreferrer">John Filmer, <em>The American Cyclopædia</em> (1879)</a>. The engraving depicts the Lake Placid region, not the library building.</p>

      <dialog ref={dialog} className="adk-dialog" onClose={close}
        onClick={event => { if (event.target === dialog.current) close(); }}
        aria-label={selected ? "Programs for " + friendlyDate(selected) : "Calendar date details"}>
        {selected && (
          <div className="adk-dialog-inner">
            <div className="adk-dialog-heading">
              <div><span className="adk-eyebrow">AT THE LIBRARY</span><h2>{friendlyDate(selected)}</h2></div>
              <button type="button" className="adk-close" aria-label="Close event details" onClick={close}>×</button>
            </div>
            <div className="adk-dialog-items">
              {openedEvent ? (
                <article className="adk-full-event">
                  <button type="button" ref={backRef} className="adk-back" onClick={() => setOpenedEvent(null)}>‹ Back to this date</button>
                  {sanitizeImageSrc(openedEvent.image) && (
                    <img className="adk-event-photo" src={sanitizeImageSrc(openedEvent.image)} alt={openedEvent.imageAlt || ""} loading="lazy" />
                  )}
                  <span className="adk-event-tag">{openedEvent.category}</span>
                  <h3>{openedEvent.title}</h3>
                  <p className="adk-event-when"><strong>{openedEvent.time}</strong> · {openedEvent.date}</p>
                  <p>{openedEvent.description}</p>
                  {safeLink(openedEvent.link) && <a className="adk-event-link" href={safeLink(openedEvent.link)}>Open full program information ↗</a>}
                </article>
              ) : selectedEvents.length && displayedEvent ? (
                <div className="adk-slide-wrap" role="region" aria-roledescription="carousel" aria-label={"Programs for " + friendlyDate(selected)}>
                  <div className="adk-slide-count" aria-live="polite">{slideIndex % selectedEvents.length + 1} of {selectedEvents.length} program{selectedEvents.length === 1 ? "" : "s"}</div>
                  <button type="button" ref={cardRef} className={"adk-slide-card adk-tone-" + tone(displayedEvent)} onClick={() => setOpenedEvent(displayedEvent)}
                    aria-label={"Read more about " + displayedEvent.title}>
                    {sanitizeImageSrc(displayedEvent.image) && <img src={sanitizeImageSrc(displayedEvent.image)} alt="" loading="lazy" />}
                    <span className="adk-slide-information">
                      <span className="adk-event-tag">{displayedEvent.category}</span>
                      <strong>{displayedEvent.title}</strong>
                      <small>{displayedEvent.time} · {displayedEvent.date}</small>
                      <span className="adk-slide-more">More details <span aria-hidden="true">↗</span></span>
                    </span>
                  </button>
                  {selectedEvents.length > 1 && (
                    <div className="adk-slide-controls">
                      <button type="button" onClick={() => setSlideIndex(i => (i - 1 + selectedEvents.length) % selectedEvents.length)} aria-label="Previous program">‹</button>
                      <span aria-hidden="true">{selectedEvents.map((event, i) => (
                        <i key={eventId(event.title) + "-" + i} className={i === slideIndex % selectedEvents.length ? "active" : ""} />
                      ))}</span>
                      <button type="button" onClick={() => setSlideIndex(i => (i + 1) % selectedEvents.length)} aria-label="Next program">›</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="adk-empty-day">
                  <p>No programs listed for this date.</p>
                  <p>Check with the library for last-minute additions.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
