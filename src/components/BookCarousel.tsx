import { useState, useRef } from "react"

interface Book {
  title: string
  author: string
  isbn: string
  cover: string
}

const CATALOG = "https://cefls.ent.sirsi.net/client/en_US/default"

const catalogSearch = (title: string) =>
  `${CATALOG}/search/results?te=&lm=TUP&q=${encodeURIComponent(title)}&qf=TITLE`

// Spring Staff Picks — Adirondacks, nature & wildflowers. Update each season.
const STAFF_PICKS: Book[] = [
  {
    title: "Braiding Sweetgrass",
    author: "Robin Wall Kimmerer",
    isbn: "9781571313560",
    cover: "https://covers.openlibrary.org/b/isbn/9781571313560-L.jpg",
  },
  {
    title: "A Walk in the Woods",
    author: "Bill Bryson",
    isbn: "9780767902519",
    cover: "https://covers.openlibrary.org/b/isbn/9780767902519-L.jpg",
  },
  {
    title: "Pilgrim at Tinker Creek",
    author: "Annie Dillard",
    isbn: "9780061233326",
    cover: "https://covers.openlibrary.org/b/isbn/9780061233326-L.jpg",
  },
  {
    title: "The Hidden Life of Trees",
    author: "Peter Wohlleben",
    isbn: "9781771642484",
    cover: "https://covers.openlibrary.org/b/isbn/9781771642484-L.jpg",
  },
  {
    title: "The God of the Woods",
    author: "Liz Moore",
    isbn: "9780593418932",
    cover: "https://covers.openlibrary.org/b/isbn/9780593418932-L.jpg",
  },
  {
    title: "A Sand County Almanac",
    author: "Aldo Leopold",
    isbn: "9780345345059",
    cover: "https://covers.openlibrary.org/b/isbn/9780345345059-L.jpg",
  },
  {
    title: "The Signature of All Things",
    author: "Elizabeth Gilbert",
    isbn: "9780670024858",
    cover: "https://covers.openlibrary.org/b/isbn/9780670024858-L.jpg",
  },
  {
    title: "H Is for Hawk",
    author: "Helen Macdonald",
    isbn: "9780802123411",
    cover: "https://covers.openlibrary.org/b/isbn/9780802123411-L.jpg",
  },
  {
    title: "The Overstory",
    author: "Richard Powers",
    isbn: "9780393356687",
    cover: "https://covers.openlibrary.org/b/isbn/9780393356687-L.jpg",
  },
  {
    title: "Woodswoman",
    author: "Anne LaBastille",
    isbn: "9780140153347",
    cover: "https://covers.openlibrary.org/b/isbn/9780140153347-L.jpg",
  },
]

// Separate component so each card tracks its own image-failed state
function BookCard({ book }: { book: Book }) {
  const [failed, setFailed] = useState(false)
  const url = catalogSearch(book.title)
  return (
    <article className="book-card">
      <a href={url} target="_blank" rel="noopener noreferrer"
         className="book-card-cover-link" aria-label={`View ${book.title} in catalog`}>
        <div className="book-card-cover">
          {failed ? (
            <div className="book-card-placeholder" aria-hidden="true">
              <span>{book.title.slice(0, 2).toUpperCase()}</span>
            </div>
          ) : (
            <img src={book.cover} alt={`Cover of ${book.title}`}
                 loading="lazy" decoding="async" onError={() => setFailed(true)} />
          )}
        </div>
      </a>
      <div className="book-card-info">
        <p className="book-card-title">{book.title}</p>
        {book.author && <p className="book-card-author">{book.author}</p>}
        <a href={url} className="book-card-btn" target="_blank" rel="noopener noreferrer">Find It</a>
      </div>
    </article>
  )
}

export function BookCarousel() {
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const updateArrows = () => {
    const t = trackRef.current
    if (!t) return
    setAtStart(t.scrollLeft <= 8)
    setAtEnd(t.scrollLeft + t.clientWidth >= t.scrollWidth - 8)
  }

  const scroll = (dir: "left" | "right") => {
    const t = trackRef.current
    if (!t) return
    t.scrollBy({ left: dir === "right" ? t.clientWidth * 0.75 : -(t.clientWidth * 0.75), behavior: "smooth" })
  }

  return (
    <section className="carousel-section" aria-label="Spring staff picks">
      <div className="carousel-header">
        <h2 className="carousel-title">🌱 Spring Staff Picks</h2>
        <a
          href={`${CATALOG}/search/results?te=&lm=TUP&sort=NEWLY_ACQUIRED&rw=0`}
          className="carousel-view-all"
          target="_blank"
          rel="noopener noreferrer"
        >
          New arrivals →
        </a>
      </div>

      <div className="carousel-wrapper">
        <button className="carousel-arrow carousel-arrow-left"
          onClick={() => scroll("left")} disabled={atStart} aria-label="Scroll left">‹</button>

        <div ref={trackRef} className="carousel-track" onScroll={updateArrows}>
          {STAFF_PICKS.map((book, i) => <BookCard key={`${book.isbn}-${i}`} book={book} />)}
        </div>

        <button className="carousel-arrow carousel-arrow-right"
          onClick={() => scroll("right")} disabled={atEnd} aria-label="Scroll right">›</button>
      </div>
    </section>
  )
}
