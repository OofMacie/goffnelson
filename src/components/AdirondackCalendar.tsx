import { useEffect, useMemo, useRef, useState } from "react";
import { libraryEvents, eventId, type LibraryEvent } from "../lib/library-content";
import "./AdirondackCalendar.css";

type BusySlot = { starts_at: string; ends_at: string };
type Availability = { enabled: boolean; busy: BusySlot[]; room: string; message?: string };
type View = "events" | "rooms";
type BookingStatus = "idle" | "sending" | "success" | "error";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ENGRAVING = "https://upload.wikimedia.org/wikipedia/commons/0/0a/AmCyc_Adirondack_Mountains_-_view_from_Placid_Lake.jpg";
const LIBRARY_PHONE = "518-359-9421";
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
const ymdNY = (iso: string) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/New_York" }).format(new Date(iso));

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

export default function AdirondackCalendar() {
  const [month, setMonth] = useState(nextStart);
  const [view, setView] = useState<View>("events");
  const [selected, setSelected] = useState<Date | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("All programs");
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
  const categories = ["All programs", ...Array.from(new Set(libraryEvents.map(e => e.category).filter(Boolean)))];
  const visible = category === "All programs" ? libraryEvents : libraryEvents.filter(e => e.category === category);
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
    const id = window.turnstile.render(turnstileContainer.current, { sitekey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY, theme: "light" });
    setTurnstileWidget(id);
  }, [turnstileLoaded, selected, availability?.enabled, turnstileWidget]);

  const openDate = (date: Date, nextView?: View) => {
    if (nextView) setView(nextView);
    setSelected(date);
    setBookingStatus("idle");
    setBookingError("");
    dialog.current?.showModal();
  };
  const close = () => {
    dialog.current?.close();
    if (turnstileWidget && window.turnstile) window.turnstile.remove(turnstileWidget);
    setTurnstileWidget(null);
    setSelected(null);
    setBookingStatus("idle");
  };
  const changeMonth = (n: number) => setMonth(atNoon(month.getFullYear(), month.getMonth() + n, 1));
  const dateEvents = (date: Date) => visible.filter(e => occursOn(e, date));
  const busyFor = (date: Date) => (availability?.busy || []).filter(slot => ymdNY(slot.starts_at) === keyOf(date));
  const monthTitle = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(month);
  const isActive = (date: Date) => date.getMonth() === month.getMonth();
  const today = keyOf(new Date());

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
      <div className="adk-hero">
        <div className="adk-hero-copy">
          <span className="adk-eyebrow">GOFF–NELSON MEMORIAL LIBRARY · TUPPER LAKE, NY</span>
          <h1>Gatherings in the <em>Adirondacks.</em></h1>
          <p>Discover library programs, see what's happening this month, and request a space for your next gathering.</p>
          <div className="adk-mode" role="group" aria-label="What would you like to see?">
            <button type="button" aria-pressed={view === "events"} className={view === "events" ? "adk-mode-active" : ""} onClick={() => setView("events")}>Events & programs</button>
            <button type="button" aria-pressed={view === "rooms"} className={view === "rooms" ? "adk-mode-active" : ""} onClick={() => setView("rooms")}>Room requests</button>
          </div>
        </div>
        <figure className="adk-engraving">
          <img src={ENGRAVING} width="1951" height="1189" alt="Original nineteenth-century wood engraving of mountains and forest surrounding Placid Lake" />
          <figcaption>1879 Adirondack engraving · John Filmer · Public domain</figcaption>
        </figure>
      </div>

      <div className="adk-calendar-shell">
        <div className="adk-topline">
          <div>
            <p className="adk-eyebrow">{view === "events" ? "THE COMMUNITY ALMANAC" : "THE SIMMONS ROOM"}</p>
            <h2>{view === "events" ? "Find a gathering" : "Plan a room request"}</h2>
            <p>{view === "events" ? "Select a date to see what's happening." : "Select a date to review published availability and request a time."}</p>
          </div>
          {view === "events" && <label className="adk-filter">Show <select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></label>}
        </div>
        <div className="adk-month-toolbar">
          <button type="button" className="adk-month-arrow" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
          <h3 aria-live="polite">{monthTitle}</h3>
          <button type="button" className="adk-month-arrow" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
          <button type="button" className="adk-today" onClick={() => setMonth(nextStart())}>Today</button>
        </div>

        <div className="adk-weekdays" aria-hidden="true">{DAYS.map(day => <span key={day}><span className="adk-longday">{day.slice(0, 3)}</span><span className="adk-shortday">{day.slice(0, 1)}</span></span>)}</div>
        <div className="adk-grid" role="grid" aria-label={monthTitle + " " + (view === "events" ? "events calendar" : "room schedule")}>
          {days.map(date => {
            const eventItems = dateEvents(date);
            const busy = busyFor(date);
            const count = eventItems.length;
            return (
              <button type="button" role="gridcell" aria-label={friendlyDate(date) + ": " + (view === "events" ? count + " listed programs" : availability?.enabled ? busy.length + " room reservations" : "availability not confirmed")} key={keyOf(date)} className={"adk-day" + (!isActive(date) ? " adk-day-muted" : "") + (keyOf(date) === today ? " adk-day-today" : "")} onClick={() => openDate(date)}>
                <span className="adk-number">{date.getDate()}</span>
                {view === "events" ? <span className="adk-day-events">{eventItems.slice(0, 2).map(e => <span className="adk-event-chip" key={eventId(e.title)}>{e.title}</span>)}{count > 2 && <span className="adk-more">+{count - 2} more</span>}</span> : <span className="adk-day-events">{availability?.enabled ? (busy.length ? <span className="adk-reserved">{busy.length} reserved</span> : <span className="adk-see-times">See times</span>) : <span className="adk-unknown">Check with staff</span>}</span>}
                {view === "events" && count > 0 && <span className="adk-dots" aria-hidden="true"><i /><i /></span>}
              </button>
            );
          })}
        </div>
        <p className="adk-footnote">{view === "events" ? "Recurring programs are shown based on the published listings. Dates and times should be confirmed with library staff." : loading ? "Checking room schedule…" : availability?.enabled ? "Reserved times are shown without patrons' personal information. Requests require library approval." : "Online availability and requests aren't active yet. Call the library for an up-to-date schedule."}</p>
      </div>

      {view === "rooms" && (
        <section className="adk-room-note">
          <div><span className="adk-eyebrow">A SPACE FOR THE COMMUNITY</span><h2>The Simmons Room</h2><p>Room use is generally free under the library's current practice. If your event collects money, please disclose that in your request so staff can review the arrangements. A request is not a confirmed reservation until approved.</p></div>
          <div className="adk-room-contact"><strong>Need to speak with staff?</strong><span>Call {LIBRARY_PHONE} for room availability and arrangements.</span><a href={LIBRARY_TEL}>Call the library</a></div>
        </section>
      )}
      {view === "events" && unscheduled.length > 0 && <details className="adk-other"><summary>Programs awaiting a specific calendar date ({unscheduled.length})</summary><div>{unscheduled.map(event => <article key={eventId(event.title)}><h3>{event.title}</h3><p>{event.date} · {event.time} — {event.description}</p></article>)}</div></details>}
      <p className="adk-art-credit">Historical artwork: <a href="https://commons.wikimedia.org/wiki/File:AmCyc_Adirondack_Mountains_-_view_from_Placid_Lake.jpg" target="_blank" rel="noreferrer">John Filmer, <em>The American Cyclopædia</em> (1879)</a>. Engraving is from the Lake Placid region, not the library building.</p>

      <dialog ref={dialog} className="adk-dialog" onClose={close} aria-label={selected ? "Details for " + friendlyDate(selected) : "Date details"}>
        {selected && <div className="adk-dialog-inner">
          <div className="adk-dialog-heading"><div><span className="adk-eyebrow">YOUR SELECTED DAY</span><h2>{friendlyDate(selected)}</h2></div><button type="button" className="adk-close" aria-label="Close date details" onClick={close}>×</button></div>
          {view === "events" ? <div className="adk-dialog-items">{dateEvents(selected).length ? dateEvents(selected).map(event => <article className="adk-item" key={eventId(event.title)}><span>{event.category}</span><h3>{event.title}</h3><p><strong>{event.time}</strong> · {event.date}</p><p>{event.description}</p>{event.link && <a href={event.link}>Event details</a>}</article>) : <p>There are no currently listed programs for this date. You can still contact us about upcoming activities.</p>}<button type="button" className="adk-quiet-link" onClick={() => { close(); setView("rooms"); }}>Looking for a room instead?</button></div> : <div className="adk-dialog-items">
            <h3>Simmons Room</h3>
            {!availability?.enabled ? <div className="adk-not-connected"><strong>Availability not confirmed online</strong><p>The secure booking service has not been connected to the library database yet. No time shown here should be assumed available.</p><a href={LIBRARY_TEL}>Call {LIBRARY_PHONE}</a></div> : <>
              <h4>Reserved times</h4>
              {busyFor(selected).length ? <ul className="adk-busy-list">{busyFor(selected).map((slot, i) => <li key={i}><span className="adk-status-dot" /> Reserved: {timeNY(slot.starts_at)}–{timeNY(slot.ends_at)}</li>)}</ul> : <p>No reservations currently shown for this date. Staff approval is still required.</p>}
              {bookingStatus === "success" ? <div role="status" className="adk-success"><h3>Request received</h3><p>Thank you! Your requested time is pending staff approval. This is not a confirmed reservation.</p></div> : <form className="adk-form" onSubmit={requestBooking}>
                <h4>Request a room time</h4>
                <div className="adk-form-two"><label>Start time<input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} min="09:00" max="21:00" step="1800" required /></label><label>End time<input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} min="09:00" max="21:00" step="1800" required /></label></div>
                <label>Your name<input type="text" autoComplete="name" maxLength={100} value={staffContact.name} onChange={e => setStaffContact(c => ({ ...c, name: e.target.value }))} required /></label>
                <label>Email address<input type="email" autoComplete="email" maxLength={200} value={staffContact.email} onChange={e => setStaffContact(c => ({ ...c, email: e.target.value }))} required /></label>
                <label>Phone (optional)<input type="tel" autoComplete="tel" maxLength={40} value={staffContact.phone} onChange={e => setStaffContact(c => ({ ...c, phone: e.target.value }))} /></label>
                <label>What is the gathering for?<textarea rows={3} maxLength={600} value={staffContact.purpose} onChange={e => setStaffContact(c => ({ ...c, purpose: e.target.value }))} required /></label>
                <label className="adk-check"><input type="checkbox" checked={moneyCollected} onChange={e => setMoneyCollected(e.target.checked)} /><span>Our event will collect money or charge admission (staff review required; this does not mean a booking fee).</span></label>
                <div ref={turnstileContainer} className="adk-turnstile" aria-label="Spam protection" />
                {bookingError && <p role="alert" className="adk-error">{bookingError}</p>}
                <button className="adk-submit" type="submit" disabled={bookingStatus === "sending" || !turnstileWidget}>{bookingStatus === "sending" ? "Sending request…" : "Submit request for approval"}</button>
              </form>}
            </>}
          </div>}
        </div>}
      </dialog>
    </section>
  );
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; theme: string }) => string;
      getResponse: (id: string) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}
