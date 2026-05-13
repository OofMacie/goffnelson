import { useState, useRef } from "react"

interface Event {
  title: string
  date: string
  time: string
  description: string
  category: string
  image: string
}


const LIBRARY_EVENTS: Event[] = [
  {
    title: "Story Time for Tots",
    date: "Every Tuesday",
    time: "10:30 AM",
    description: "Interactive stories and songs for children ages 2-5",
    category: "Children's Programs",
    image: "/images/ChildrensRoom/20250719_101707.jpg"
  },
  {
    title: "Teen Game Night",
    date: "First Friday",
    time: "6:00 PM",
    description: "Board games, video games, and snacks for teens",
    category: "Teen Programs",
    image: "/images/YoungAdult/20250917_113824.jpg"
  },
  {
    title: "Community Garden",
    date: "Second Wednesday",
    time: "7:00 PM",
    description: "Monthly discussion of current fiction and non-fiction",
    category: "Adult Programs",
    image: "/images/CommunityGarden/1000015930.jpg"
  },
  {
    title: "Computer Basics Workshop",
    date: "Third Thursday",
    time: "2:00 PM",
    description: "Learn essential computer skills and internet safety",
    category: "Technology",
    image: "/images/Lobby/20250714_185812.jpg"
  },
  {
    title: "Adirondack History Talk",
    date: "Fourth Monday",
    time: "6:30 PM",
    description: "Local history presentation and Q&A session",
    category: "Community",
    image: "/images/CommunityGarden/garden.png"
  },
  {
    title: "Yarn Social",
    date: "Every Wednesday",
    time: "1:00 PM",
    description: "Knitting, crocheting, and crafting with friends",
    category: "Crafts",
    image: "/images/CommunityGarden/1000015928.jpg"
  }
]

// Separate component so each card tracks its own state
function EventCard({ event }: { event: Event }) {
  const [imageError, setImageError] = useState(false)

  return (
    <article className="event-card">
      <div className="event-card-image">
        {imageError ? (
          <div className="event-card-image-placeholder">
            📅
          </div>
        ) : (
          <img
            src={event.image}
            alt={`Event image for ${event.title}`}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
          />
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
        <a href="#" className="event-card-btn">Learn More</a>
      </div>
    </article>
  )
}

export default function Events() {
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
    <section className="events-section" aria-label="Upcoming library events">
      <div className="events-header">
        <h2 className="events-title">📅 Upcoming Events</h2>
        <a
          href="#"
          className="events-view-all"
        >
          View Calendar →
        </a>
      </div>

      <div className="events-wrapper">
        <button className="events-arrow events-arrow-left"
          onClick={() => scroll("left")} disabled={atStart} aria-label="Scroll left">‹</button>

        <div ref={trackRef} className="events-track" onScroll={updateArrows}>
          {LIBRARY_EVENTS.map((event, i) => <EventCard key={`${event.title}-${i}`} event={event} />)}
        </div>

        <button className="events-arrow events-arrow-right"
          onClick={() => scroll("right")} disabled={atEnd} aria-label="Scroll right">›</button>
      </div>
    </section>
  )
}
