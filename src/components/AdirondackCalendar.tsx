import { useEffect, useMemo, useRef, useState } from "react";
import { libraryEvents, eventId } from "../lib/library-content";
import "./AdirondackCalendar.css";

type LibraryEvent = { title: string; date: string; time: string; description: string; category: string; image?: string; imageAlt?: string; link?: string; };
const calendarEvents: LibraryEvent[] = libraryEvents;
type BusySlot = { starts_at: string; ends_at: string };
type Availability = { enabled: boolean; busy: BusySlot[]; room: string; message?: string };
type View = "events" | "rooms";
type BookingStatus = "idle" | "sending" | "success" | "error";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LIBRARY_PHONE = "518-359-9421";
const eventTone = (event: LibraryEvent) => /child|tot|story/i.test(event.category + " " + event.title) ? "lake" : /teen|young adult/i.test(event.category) ? "berry" : /craft|knit|yarn/i.test(event.category + " " + event.title) ? "gold" : /history|heritage/i.test(event.category + " " + event.title) ? "spruce" : /tech|computer/i.test(event.category + " " + event.title) ? "fern" : "maple";
const LIBRARY_TEL = "tel:+15183599421";
const isISO = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const keyOf = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const atNoon = (year: number, month: number, date: number) => new Date(year, month, date, 12, 0, 0);
const friendlyDate = (date: Date) => new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
const matchDay = (text: string) => DAYS.findIndex(day => text.toLowerCase().includes(day.toLowerCase()));
const ordinal = (text: string) => /first/i.test(text) ? 1 : /second/i.test(text) ? 2 : /third/i.test(text) ? 3 : /fourth/i.test(text) ? 4 : /last/i.test(text) ? -1 : 0;

function occursOn(event: LibraryEvent, date: Date): boolean {
  const rule = event.date.trim();
  if (isISO(rule)) return rule === keyOf(date);
  const day = matchDay(rule);
  if (day < 0 || date.getDay() !== day) return false;
  if (/^every\s/i.test(rule)) return true;
  const nth = ordinal(rule);
  if (!nth) return false;
  if (nth === -1) return atNoon(date.getFullYear(), date.getMonth(), date.getDate() + 7).getMonth() !== date.getMonth();
  return Math.floor((date.getDate() - 1) / 7) + 1 === nth;
}
const isCalendarRule = (event: LibraryEvent) => isISO(event.date.trim()) || (matchDay(event.date) >= 0 && (/^every\s/i.test(event.date) || ordinal(event.date) !== 0));
const timeNY = (iso: string) => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(new Date(iso));
const ymdNY = (iso: string) => {
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/New_York" }).formatToParts(new Date(iso));
  const field = (key: string) => parts.find(p => p.type === key)?.value || "";
  return [field("year"), field("month"), field("day")].join("-");
};

const nextStart = () => {
  const now = new Date();
  const ny = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", timeZone: "America/New_York" }).formatToParts(now);
  const year = Number(ny.find(p => p.type === "year")?.value || now.getFullYear());
  const month = Number(ny.find(p => p.type === "month")?.value || now.getMonth() + 1) - 1;
  return atNoon(year, month, 1);
};
function useMonthDates(month: Date): Date[] {
  return useMemo(() => {
    const start = month.getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells = Math.max(35, Math.ceil((start + count) / 7) * 7);
    return Array.from({ length: cells }, (_, i) => atNoon(month.getFullYear(), month.getMonth(), 1 - start + i));
  }, [month]);
}

export default function AdirondackCalendar({ initialView = "events" }: { initialView?: View }) {
  const [month, setMonth] = useState(nextStart);
  const [view, setView] = useState<View>(initialView);
  const [selected, setSelected] = useState<Date | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [openedEvent, setOpenedEvent] = useState<LibraryEvent | null>(null);
  const [demoStep, setDemoStep] = useState<"time" | "review" | "complete">("time");
  const [demoSlot, setDemoSlot] = useState("10:00");

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("All programs");
  const [displayMode, setDisplayMode] = useState<"calendar" | "list">("calendar");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("idle");
  const [bookingError, setBookingError] = useState("");
  const [moneyCollected, setMoneyCollected] = useState(false);
  const [staffContact, setStaffContact] = useState({ name: "", email: "", phone: "", purpose: "" });
  const [turnstileWidget, setTurnstileWidget] = useState<string | null>(null);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const days = useMonthDates(month);
  const categories = ["All programs", ...Array.from(new Set(calendarEvents.map(e => e.category).filter(Boolean)))];
  const visible = category === "All programs" ? calendarEvents : calendarEvents.filter(e => e.category === category);
  const unscheduled = visible.filter(e => !isCalendarRule(e));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "rooms") setView("rooms");
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAvailability(null);
    fetch("/api/rooms/availability?month=" + keyOf(month).slice(0, 7) + "&room=simmons", { credentials: "same-origin" })
      .then(async r => {
        const json = await r.json();
        if (!r.ok && !json?.enabled) return { enabled: false, busy: [], room: "simmons", message: "Live room availability is not connected yet." };
        return json as Availability;
      })
      .then(data => { if (active) setAvailability(data); })
      .catch(() => { if (active) setAvailability({ enabled: false, busy: [], room: "simmons", message: "Room availability is currently unavailable." }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month]);

  useEffect(() => {
    if (!selected || !availability?.enabled || !import.meta.env.PUBLIC_TURNSTILE_SITE_KEY) return;
    const existing = document.querySelector('script[data-library-turnstile]');
    const onReady = () => setTurnstileLoaded(true);
    if (window.turnstile) { onReady(); return; }
    if (existing) { existing.addEventListener("load", onReady); return () => existing.removeEventListener("load", onReady); }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.libraryTurnstile = "true";
    script.addEventListener("load", onReady);
    document.head.appendChild(script);
    return () => script.removeEventListener("load", onReady);
  }, [selected, availability?.enabled]);

  useEffect(() => {
    if (!turnstileLoaded || !selected || !availability?.enabled || !turnstileContainer.current || turnstileWidget) return;
    if (!window.turnstile || !import.meta.env.PUBLIC_TURNSTILE_SITE_KEY) return;
    const id = window.turnstile.render(turnstileContainer.current, { sitekey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY, theme: "light", action: "room_request" });
    setTurnstileWidget(id);
  }, [turnstileLoaded, selected, availability?.enabled, turnstileWidget]);

  const openDate = (date: Date, nextView?: View) => {
    if (nextView) setView(nextView);
    setSelected(date);
    setSlideIndex(0);
    setOpenedEvent(null);
    setDemoStep("time");
    setDemoSlot("10:00");
    setBookingStatus("idle");
    setBookingError("");
    dialog.current?.showModal();
  };
  const close = () => {
    dialog.current?.close();
    if (turnstileWidget && window.turnstile) window.turnstile.remove(turnstileWidget);
    setTurnstileWidget(null);
    setSelected(null);
    setOpenedEvent(null);
    setDemoStep("time");
    setBookingStatus("idle");
  };
  const changeMonth = (n: number) => setMonth(atNoon(month.getFullYear(), month.getMonth() + n, 1));
  const dateEvents = (date: Date) => visible.filter(e => occursOn(e, date));
  const busyFor = (date: Date) => (availability?.busy || []).filter(slot => ymdNY(slot.starts_at) === keyOf(date));
  const monthTitle = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(month);
  const isActive = (date: Date) => date.getMonth() === month.getMonth();
  const today = ymdNY(new Date().toISOString());
  const agendaEntries = days.filter(date => date.getMonth() === month.getMonth()).flatMap(date => dateEvents(date).map(event => ({ date, event })));
  const selectedDayEvents = selected ? dateEvents(selected) : [];
  const displayedEvent = selectedDayEvents.length ? selectedDayEvents[slideIndex % selectedDayEvents.length] : null;
  const sampleSlots = [{ start: "10:00", end: "11:00", busy: false },{ start: "11:00", end: "12:00", busy: true },{ start: "12:00", end: "13:00", busy: false },{ start: "13:00", end: "14:00", busy: false },{ start: "14:00", end: "15:00", busy: true },{ start: "15:00", end: "16:00", busy: false }];
  const demoChoice = sampleSlots.find(slot => slot.start === demoSlot) || sampleSlots[0];

  async function requestBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !availability?.enabled || !window.turnstile || !turnstileWidget) return;
    const token = window.turnstile.getResponse(turnstileWidget);
    if (!token) { setBookingError("Complete the spam-protection check first."); return; }
    const start = new Date(keyOf(selected) + "T" + startTime + ":00");
    const end = new Date(keyOf(selected) + "T" + endTime + ":00");
    if (end <= start) { setBookingError("The end time must be later than the start time."); return; }
    setBookingStatus("sending");
    setBookingError("");
    try {
      const result = await fetch("/api/rooms/request", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: "simmons", date: keyOf(selected), startTime, endTime, ...staffContact, collectsMoney: moneyCollected, turnstileToken: token })
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data?.message || "The request couldn't be submitted.");
      setBookingStatus("success");
      setAvailability(current => current ? { ...current, busy: [...current.busy, { starts_at: data.starts_at, ends_at: data.ends_at }] } : current);
    } catch (error) {
      setBookingStatus("error");
      setBookingError(error instanceof Error ? error.message : "Please contact the library to request this time.");
      window.turnstile.reset(turnstileWidget);
    }
  }

  return (
    <section className="adk" aria-label="Library events and room requests">
      <header className="adk-hero">
        <div className="adk-hero-inner">
          <div className="adk-hero-copy">
            <span className="adk-eyebrow">GOFF–NELSON MEMORIAL LIBRARY · TUPPER LAKE, NY</span>
            <h1>{view === "events" ? <>Events <span className="adk-gold">&amp; Programs</span></> : <>Meeting Room <span className="adk-gold">Requests</span></>}</h1>
            <p>{view === "events"
              ? "Find stories, workshops, and community gatherings at your library. Select a date to explore what's on."
              : "See the Simmons Room schedule and request a time for your next gathering. All requests require staff approval."}</p>
            <nav className="adk-mode" aria-label="Calendar and room options">
              <button type="button" aria-pressed={view === "events"} className={view === "events" ? "adk-mode-active" : ""} onClick={() => setView("events")}>Events &amp; programs</button>
              <button type="button" aria-pressed={view === "rooms"} className={view === "rooms" ? "adk-mode-active" : ""} onClick={() => setView("rooms")}>Room availability</button>
            </nav>
          </div>
        </div>
      </header>

      <div className="adk-edition" aria-label="Community almanac">
        <div className="adk-edition-first"><span className="adk-printer-mark" aria-hidden="true">✦</span><span>THE TUPPER LAKE COMMUNITY ALMANAC</span></div>
        <span className="adk-edition-rule" aria-hidden="true" />
        <span className="adk-edition-meta">Rooted in Tupper Lake · Made for neighbors</span>
      </div>

      <div className="adk-facade" aria-label="Calendar framed by the architecture of the Goff–Nelson Memorial Library">
        <div className="adk-facade-roof" aria-hidden="true">
          <img src="/images/goff-nelson-calendar-roof.svg" alt="" width="1100" height="210" decoding="async" />
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
              <span className="adk-eyebrow">{view === "events" ? "THE COMMUNITY ALMANAC" : "THE SIMMONS ROOM"}</span>
              <h2>{view === "events" ? "Programs & gatherings" : "Meeting room calendar"}</h2>
            </div>
          </div>
          <div className="adk-guide-tools">
            {view === "events" ? (
              <>
                <label className="adk-filter">Show
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <div className="adk-display-toggle" role="group" aria-label="Choose event display">
                  <button type="button" aria-pressed={displayMode === "calendar"} onClick={() => setDisplayMode("calendar")}>Calendar</button>
                  <button type="button" aria-pressed={displayMode === "list"} onClick={() => setDisplayMode("list")}>List</button>
                </div>
              </>
            ) : (
              <span className="adk-room-topline-note">Community use · Staff approval required</span>
            )}
          </div>
        </div>
        <div className="adk-month-toolbar">
          <button type="button" className="adk-month-arrow" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
          <h3 aria-live="polite">{monthTitle}</h3>
          <button type="button" className="adk-month-arrow" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
          <button type="button" className="adk-today" onClick={() => setMonth(nextStart())}>Today</button>
        </div>

        {view === "events" && displayMode === "list" ? (
          <div className="adk-agenda" role="list" aria-label={monthTitle + " events"}>
            {agendaEntries.length ? agendaEntries.map(({ date, event }, i) => (
              <div className={"adk-agenda-row adk-tone-" + eventTone(event)} role="listitem" key={keyOf(date) + "-" + eventId(event.title) + "-" + i}>
                <div className="adk-agenda-date" aria-hidden="true"><span>{new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)}</span><strong>{date.getDate()}</strong></div>
                <div className="adk-agenda-content"><span className="adk-event-tag">{event.category}</span><h3>{event.title}</h3><p>{event.time}</p></div>
                <button type="button" onClick={() => { openDate(date); setOpenedEvent(event); }} aria-label={"Details for " + event.title + " on " + friendlyDate(date)}>Details <span aria-hidden="true">↗</span></button>
              </div>
            )) : <p className="adk-agenda-empty">No programs are listed for this month. Try another month or another category.</p>}
          </div>
        ) : (
          <>
        <div className="adk-weekdays" aria-hidden="true">{DAYS.map(day => <span key={day}><span className="adk-longday">{day.slice(0, 3)}</span><span className="adk-shortday">{day.slice(0, 1)}</span></span>)}</div>
        <div className="adk-grid" role="group" aria-label={monthTitle + " " + (view === "events" ? "events calendar" : "room schedule")}>
          {days.map(date => {
            const eventItems = dateEvents(date);
            const busy = busyFor(date);
            const count = eventItems.length;
            return (
              <button type="button" aria-label={friendlyDate(date) + ": " + (view === "events" ? count + " listed programs" : availability?.enabled ? busy.length + " unavailable periods" : "availability not confirmed")} key={keyOf(date)} className={"adk-day" + (!isActive(date) ? " adk-day-muted" : "") + (keyOf(date) === today ? " adk-day-today" : "")} onClick={() => openDate(date)}>
                <span className="adk-number">{date.getDate()}</span>
                {view === "events" ? <span className="adk-day-events">{eventItems.slice(0, 2).map(e => <span className={"adk-event-chip adk-tone-" + eventTone(e)} key={eventId(e.title)}>{e.title}</span>)}{count > 2 && <span className="adk-more">+{count - 2} more</span>}</span> : <span className="adk-day-events">{availability?.enabled ? (busy.length ? <span className="adk-reserved">{busy.length} unavailable</span> : <span className="adk-see-times">See times</span>) : <span className="adk-unknown">Try demo</span>}</span>}
                {view === "events" && count > 0 && <span className="adk-dots" aria-hidden="true"><i /><i /></span>}
              </button>
            );
          })}
        </div>

          </>
        )}
        <p className="adk-footnote">{view === "events" ? "Recurring programs are shown based on the published listings. Dates and times should be confirmed with library staff." : loading ? "Checking room schedule…" : availability?.enabled ? "Reserved times are shown without patrons' personal information. Requests require library approval." : "Online availability and requests aren't active yet. Call the library for an up-to-date schedule."}</p>
        {view === "rooms" && (
          <section className="adk-room-integrated" aria-labelledby="adk-room-integrated-title">
            <div className="adk-room-integrated-text">
              <span className="adk-eyebrow">ROOM USE AT GOFF–NELSON</span>
              <h3 id="adk-room-integrated-title">The Simmons Room</h3>
              <p>Community room use is generally free. Events collecting money require staff review. A request is not confirmed until approved.</p>
            </div>
            <a href={LIBRARY_TEL}>Questions? Call {LIBRARY_PHONE}</a>
          </section>
        )}
      </div>
        <div className="adk-facade-lower">
          <div className="adk-facade-entry" aria-hidden="true">
            <span className="adk-entry-window" />
            <span className="adk-entry-window" />
            <span className="adk-entry-handle" />
          </div>
          <div className="adk-facade-lower-copy">
            <strong>{view === "events" ? "Your library is full of life." : "The Simmons Room welcomes community gatherings."}</strong>
            <span>41 Lake Street · Tupper Lake, New York</span>
          </div>
          <a className="adk-facade-action" href={view === "events" ? "/Rooms/" : "/Events/"}>
            {view === "events" ? "Explore room requests" : "Explore library events"} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="adk-facade-foundation" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/></div>
      </div>

      {view === "events" && unscheduled.length > 0 && <details className="adk-other"><summary>Programs awaiting a specific calendar date ({unscheduled.length})</summary><div>{unscheduled.map(event => <article key={eventId(event.title)}><h3>{event.title}</h3><p>{event.date} · {event.time} — {event.description}</p></article>)}</div></details>}
      <p className="adk-art-credit">Historical artwork: <a href="https://commons.wikimedia.org/wiki/File:AmCyc_Adirondack_Mountains_-_view_from_Placid_Lake.jpg" target="_blank" rel="noreferrer">John Filmer, <em>The American Cyclopædia</em> (1879)</a>. Engraving is from the Lake Placid region, not the library building.</p>

      <dialog
        ref={dialog}
        className={"adk-dialog" + (view === "rooms" ? " adk-dialog-room" : "")}
        onClose={close}
        onClick={(event) => { if (event.target === dialog.current) close(); }}
        aria-label={selected ? "Details for " + friendlyDate(selected) : "Date details"}
      >
        {selected && (
          <div className="adk-dialog-inner">
            <div className="adk-dialog-heading">
              <div>
                <span className="adk-eyebrow">{view === "events" ? "AT THE LIBRARY" : "SIMMONS ROOM"}</span>
                <h2>{friendlyDate(selected)}</h2>
              </div>
              <button type="button" className="adk-close" aria-label="Close date popup" onClick={close}>×</button>
            </div>

            {view === "events" ? (
              <div className="adk-dialog-items">
                {openedEvent ? (
                  <article className="adk-full-event">
                    <button className="adk-back" type="button" onClick={() => setOpenedEvent(null)}>‹ Back to this date</button>
                    {openedEvent.image && <img className="adk-event-photo" src={openedEvent.image} alt={openedEvent.imageAlt || ""} loading="lazy" />}
                    <span className="adk-event-tag">{openedEvent.category}</span>
                    <h3>{openedEvent.title}</h3>
                    <p className="adk-event-when"><strong>{openedEvent.time}</strong> · {openedEvent.date}</p>
                    <p>{openedEvent.description}</p>
                    {openedEvent.link && <a className="adk-event-link" href={openedEvent.link}>Open full program information ↗</a>}
                  </article>
                ) : selectedDayEvents.length && displayedEvent ? (
                  <div className="adk-slide-wrap" role="region" aria-roledescription="carousel" aria-label={"Programs for " + friendlyDate(selected)}>
                    <div className="adk-slide-count" aria-live="polite">{slideIndex % selectedDayEvents.length + 1} of {selectedDayEvents.length} program{selectedDayEvents.length === 1 ? "" : "s"}</div>
                    <button className={"adk-slide-card adk-tone-" + eventTone(displayedEvent)} type="button" onClick={() => setOpenedEvent(displayedEvent)} aria-label={"Read more about " + displayedEvent.title}>
                      {displayedEvent.image && <img src={displayedEvent.image} alt="" loading="lazy" />}
                      <span className="adk-slide-information">
                        <span className="adk-event-tag">{displayedEvent.category}</span>
                        <strong>{displayedEvent.title}</strong>
                        <small>{displayedEvent.time} · {displayedEvent.date}</small>
                        <span className="adk-slide-more">More details <span aria-hidden="true">↗</span></span>
                      </span>
                    </button>
                    {selectedDayEvents.length > 1 && (
                      <div className="adk-slide-controls">
                        <button type="button" onClick={() => setSlideIndex(i => (i - 1 + selectedDayEvents.length) % selectedDayEvents.length)} aria-label="Previous event">‹</button>
                        <span aria-hidden="true">{selectedDayEvents.map((event, i) => <i key={eventId(event.title) + i} className={i === slideIndex % selectedDayEvents.length ? "active" : ""} />)}</span>
                        <button type="button" onClick={() => setSlideIndex(i => (i + 1) % selectedDayEvents.length)} aria-label="Next event">›</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="adk-empty-day">
                    <p>No listed programs on this date.</p>
                    <p>Check with the library for last-minute additions.</p>
                  </div>
                )}
                {!openedEvent && <button type="button" className="adk-quiet-link" onClick={() => { close(); setView("rooms"); }}>Need to reserve a room instead?</button>}
              </div>
            ) : (
              <div className="adk-dialog-items">
                {!availability?.enabled ? (
                  <div className="adk-demo" aria-label="Room booking demonstration">
                    <div className="adk-demo-ribbon"><strong>INTERACTIVE DEMO</strong><span>Sample times only · No information is sent</span></div>
                    {demoStep === "time" && (
                      <>
                        <h3>Choose a time</h3>
                        <p>This sample schedule shows how patrons will see open and unavailable periods once live bookings are connected.</p>
                        <div className="adk-demo-slots" role="group" aria-label="Choose a sample time">
                          {sampleSlots.map(slot => (
                            <button type="button" key={slot.start} disabled={slot.busy} aria-pressed={!slot.busy && demoSlot === slot.start}
                              className={"adk-demo-slot" + (slot.busy ? " busy" : demoSlot === slot.start ? " selected" : "")}
                              onClick={() => setDemoSlot(slot.start)}>
                              <span>{slot.start}–{slot.end}</span><small>{slot.busy ? "Unavailable" : demoSlot === slot.start ? "Selected" : "Sample opening"}</small>
                            </button>
                          ))}
                        </div>
                        <button type="button" className="adk-submit" onClick={() => setDemoStep("review")}>Continue to review ›</button>
                      </>
                    )}
                    {demoStep === "review" && (
                      <>
                        <button type="button" className="adk-back" onClick={() => setDemoStep("time")}>‹ Change sample time</button>
                        <h3>Review your request</h3>
                        <div className="adk-demo-review">
                          <p><strong>Room</strong><span>Simmons Room</span></p>
                          <p><strong>Date</strong><span>{friendlyDate(selected)}</span></p>
                          <p><strong>Sample time</strong><span>{demoChoice.start}–{demoChoice.end}</span></p>
                          <p><strong>Room use</strong><span>Generally free · Subject to approval</span></p>
                        </div>
                        <label className="adk-check"><input type="checkbox" checked={moneyCollected} onChange={e => setMoneyCollected(e.target.checked)} /><span>This event will charge admission or collect money; staff should review it.</span></label>
                        <p className="adk-demo-explain">The real request form will also collect contact details privately and verify the request before submitting it to staff.</p>
                        <button type="button" className="adk-submit" onClick={() => setDemoStep("complete")}>Preview request submitted ›</button>
                      </>
                    )}
                    {demoStep === "complete" && (
                      <div className="adk-demo-finished" role="status">
                        <span aria-hidden="true">✓</span>
                        <h3>Sample request: pending approval</h3>
                        <p>In the live system, library staff would review the request and confirm or decline it. This was a demonstration: <strong>nothing was booked or sent</strong>.</p>
                        <button type="button" className="adk-back" onClick={() => setDemoStep("time")}>Try another sample time</button>
                      </div>
                    )}
                    <div className="adk-demo-call">For a real reservation today, <a href={LIBRARY_TEL}>call {LIBRARY_PHONE}</a>.</div>
                  </div>
                ) : (
                  <>
                    <h3>Available room requests</h3>
                    <p className="adk-room-disclaimer">Times marked unavailable may be pending or approved bookings. All new requests need staff approval.</p>
                    {busyFor(selected).length ? <ul className="adk-busy-list">{busyFor(selected).map((slot, i) => <li key={i}>Unavailable: {timeNY(slot.starts_at)}–{timeNY(slot.ends_at)}</li>)}</ul> : <p>No existing room requests shown for this date.</p>}
                    {bookingStatus === "success" ? (
                      <div role="status" className="adk-success"><h3>Request received</h3><p>Your request is pending staff approval. This is not a confirmed reservation.</p></div>
                    ) : (
                      <form className="adk-form" onSubmit={requestBooking}>
                        <h4>Request a room time</h4>
                        <div className="adk-form-two">
                          <label>Start time<input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} min="09:00" max="21:00" step="1800" required /></label>
                          <label>End time<input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} min="09:00" max="21:00" step="1800" required /></label>
                        </div>
                        <label>Your name<input type="text" autoComplete="name" maxLength={100} value={staffContact.name} onChange={e => setStaffContact(c => ({ ...c, name: e.target.value }))} required /></label>
                        <label>Email address<input type="email" autoComplete="email" maxLength={200} value={staffContact.email} onChange={e => setStaffContact(c => ({ ...c, email: e.target.value }))} required /></label>
                        <label>Phone (optional)<input type="tel" autoComplete="tel" maxLength={40} value={staffContact.phone} onChange={e => setStaffContact(c => ({ ...c, phone: e.target.value }))} /></label>
                        <label>What is the gathering for?<textarea rows={3} maxLength={600} value={staffContact.purpose} onChange={e => setStaffContact(c => ({ ...c, purpose: e.target.value }))} required /></label>
                        <label className="adk-check"><input type="checkbox" checked={moneyCollected} onChange={e => setMoneyCollected(e.target.checked)} /><span>This event will collect money or charge admission (staff review required).</span></label>
                        <div ref={turnstileContainer} className="adk-turnstile" aria-label="Spam protection" />
                        {bookingError && <p role="alert" className="adk-error">{bookingError}</p>}
                        <button className="adk-submit" type="submit" disabled={bookingStatus === "sending" || !turnstileWidget}>{bookingStatus === "sending" ? "Sending request…" : "Submit for staff approval"}</button>
                      </form>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </dialog>
    </section>
  );
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; theme: string; action: string }) => string;
      getResponse: (id: string) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}
