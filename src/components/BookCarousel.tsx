import { useRef, useState } from "react";
import { bookHeading, staffPicks, type StaffPick } from "../lib/library-content";

const CATALOG = "https://cefls.ent.sirsi.net/client/en_US/default";

const catalogSearch = (title: string) =>
  `${CATALOG}/search/results?te=&lm=TUP&q=${encodeURIComponent(title)}&qf=TITLE`;

function BookCard({ book }: { book: StaffPick }) {
  const [failed, setFailed] = useState(false);
  const url = catalogSearch(book.title);
  return (
    <article className="book-card">
      <a href={url} target="_blank" rel="noopener noreferrer"
         className="book-card-cover-link" aria-label={`View ${book.title} in the library catalog`}>
        <div className="book-card-cover">
          {!failed && book.cover ? (
            <img src={book.cover} alt={`Cover of ${book.title}`}
                 loading="lazy" decoding="async" onError={() => setFailed(true)} />
          ) : (
            <div className="book-card-placeholder" aria-hidden="true">
              <span>{book.title.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
        </div>
      </a>
      <div className="book-card-info">
        <h3 className="book-card-title">{book.title}</h3>
        {book.author && <p className="book-card-author">{book.author}</p>}
        <a href={url} className="book-card-btn" target="_blank" rel="noopener noreferrer">Find in catalog</a>
      </div>
    </article>
  );
}

export function BookCarousel() {
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
    <section className="carousel-section" aria-labelledby="staff-picks-title">
      <div className="carousel-header">
        <h2 className="carousel-title" id="staff-picks-title">📚 {bookHeading}</h2>
        <a href={`${CATALOG}/search/results?te=&lm=TUP&sort=NEWLY_ACQUIRED&rw=0`}
           className="carousel-view-all" target="_blank" rel="noopener noreferrer">
          New arrivals
        </a>
      </div>
      <div className="carousel-wrapper">
        <button type="button" className="carousel-arrow carousel-arrow-left"
          onClick={() => scroll("left")} disabled={atStart} aria-label="Scroll books left">‹</button>
        <div ref={trackRef} className="carousel-track" onScroll={updateArrows}>
          {staffPicks.map(book => <BookCard key={book.isbn || book.title} book={book} />)}
        </div>
        <button type="button" className="carousel-arrow carousel-arrow-right"
          onClick={() => scroll("right")} disabled={atEnd} aria-label="Scroll books right">›</button>
      </div>
    </section>
  );
}
