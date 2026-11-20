import { useRef, useState } from "react";
import {
  libraryEvents,
  eventHeading,
  eventId,
  type LibraryEvent,
} from "../lib/library-content";

function EventCard({ event }: { event: LibraryEvent }) {
  const [imageError, setImageError] = useState(false);
  const detailsUrl = event.link || `/Events/#${eventId(event.title)}`;

  return (
    <article className="event-card">
      <div className="event-card-image">
        {event.image && !imageError ? (
          <img
            src={event.image}
            alt={event.imageAlt || ""}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="event-card-image-placeholder" aria-hidden="true">📅</div>
        )}
      </div>
      <div className="event-card-content">
        <div className="event-card-header">
          <h3 className="event-card-title">{event.title}</h3>
          <span className="event-card-category">{event.category}</span>
        </div>
        <div className="event-card-details">
          <p className="event-card-date">{event.date} • {event.time}</p>
          <p className="event-card-description">{event.description}</p>
        </div>
        <a href={detailsUrl} className="event-card-btn">
          {event.link ? "Event details" : "View program information"}
        </a>
      </div>
    </article>
  );
}

export default function Events() {
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const updateArrows = () => {
    const track = trackRef.current;
    if (!track) return;
    setAtStart(track.scrollLeft <= 8);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 8);
  };

  const scroll = (direction: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction === "right" ? track.clientWidth * 0.75 : -track.clientWidth * 0.75,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  return (
    <section className="events-section" aria-labelledby="upcoming-events-title">
      <div className="events-header">
        <h2 className="events-title" id="upcoming-events-title">📅 {eventHeading}</h2>
        <a href="/Events/" className="events-view-all">View all events</a>
      </div>
      <div className="events-wrapper">
        <button
          type="button"
          className="events-arrow events-arrow-left"
          onClick={() => scroll("left")}
          disabled={atStart}
          aria-label="Scroll events left"
        >‹</button>
        <div ref={trackRef} className="events-track" onScroll={updateArrows}>
          {libraryEvents.map(event => <EventCard key={event.title} event={event} />)}
        </div>
        <button
          type="button"
          className="events-arrow events-arrow-right"
          onClick={() => scroll("right")}
          disabled={atEnd}
          aria-label="Scroll events right"
        >›</button>
      </div>
    </section>
  );
}
