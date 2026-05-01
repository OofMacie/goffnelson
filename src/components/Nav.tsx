import { useState, useRef, useEffect } from "react"

const menuData = [
    {
        label: "Books & More",
        hasSearch: true,
        columns: [
            {
                heading: "THINGS WE LEND",
                links: [
                    { text: "Books, eBooks & AudioBooks", note: "" },
                    { text: "Movies & DVDs", note: "" },
                    { text: "Museum Passes", note: "" },
                    { text: "CDs & Music", note: "" },
                    { text: "Large Print", note: "" },
                    { text: "Audiobooks", note: "" },
                ],
            },
        ],
        promos: [
            { title: "Adirondack History Room", desc: "Photos, yearbooks & local history archives", color: "#e8f4e8" },
            { title: "Library of Things", desc: "Borrow more than just books", color: "#e8eef4" },
        ],
    },
    {
        label: "Events & Programs",
        hasSearch: false,
        columns: [
            {
                heading: "EVENTS",
                links: [
                    { text: "All Events Calendar", note: "" },
                    { text: "Tupper Tots", note: "Story time for little ones" },
                    { text: "Tupper Teens", note: "After school programs" },
                ],
            },
            {
                heading: "BY AUDIENCE",
                links: [
                    { text: "Kids", note: "" },
                    { text: "Teens", note: "" },
                    { text: "Adults", note: "" },
                    { text: "BOCES HSE / GED", note: "Evening classes" },
                ],
            },
        ],
        promos: [
            { title: "Yarn Social", desc: "Join our weekly knit & crochet group", color: "#f4eee8" },
            { title: "Tabata with Courtney", desc: "Free fitness classes at the library", color: "#f0e8f4" },
        ],
    },
    {
        label: "Online Resources",
        hasSearch: false,
        columns: [
            {
                heading: "DIGITAL",
                links: [
                    { text: "eBooks & Audiobooks", note: "Free via OverDrive / Libby" },
                    { text: "Databases", note: "Research & reference tools" },
                    { text: "Library of Things", note: "" },
                    { text: "Historic Tupper Lake Photos", note: "NYHeritage archive" },
                    { text: "Links & Resources", note: "" },
                ],
            },
        ],
        promos: [
            { title: "OverDrive / Libby", desc: "Thousands of free eBooks & audiobooks with your card", color: "#e8f4e8" },
            { title: "NYHeritage Archive", desc: "Explore historic Tupper Lake photos & yearbooks", color: "#e8eef4" },
        ],
    },
    {
        label: "About",
        hasSearch: false,
        columns: [
            {
                heading: "VISIT US",
                links: [
                    { text: "Hours & Location", note: "41 Lake Street, Tupper Lake NY" },
                    { text: "Contact Us", note: "518-359-9421" },
                    { text: "History of the Library", note: "" },
                    { text: "Board of Trustees", note: "" },
                    { text: "Policies & Annual Report", note: "" },
                ],
            },
            {
                heading: "SUPPORT",
                links: [
                    { text: "Donate", note: "Support your local library" },
                    { text: "Get a Library Card", note: "Free for all residents" },
                    { text: "Volunteer", note: "" },
                    { text: "Room Reservations", note: "" },
                ],
            },
        ],
        promos: [
            { title: "Donate Today", desc: "Your support keeps the library thriving for everyone", color: "#f4eee8" },
            { title: "Get a Card", desc: "Free library cards for all Tupper Lake residents", color: "#e8f4e8" },
        ],
    },
]

const CATALOG = "https://cefls.ent.sirsi.net/client/en_US/default/search/results?te=&lm=TUP"

const pills = [
    { label: "New Arrivals", href: `${CATALOG}&rw=0&sort=NEWLY_ACQUIRED` },
    { label: "Kids Books", href: `${CATALOG}&q=children` },
    { label: "Teen Reads", href: `${CATALOG}&q=young+adult` },
    { label: "Large Print", href: `${CATALOG}&q=large+print` },
    { label: "Audiobooks", href: `${CATALOG}&q=audiobook` },
    { label: "DVDs", href: `${CATALOG}&q=dvd` },
    { label: "Graphic Novels", href: `${CATALOG}&q=graphic+novel` },
    { label: "Adirondack History", href: `${CATALOG}&q=adirondack` },
    { label: "Events", href: "https://tupperlakepubliclibrary.org/events/" },
]

const promoEmojis = ["🌲", "📚", "🎧", "🏔️", "🧶", "💪", "📖", "🗂️"]

export default function Nav() {
    const [open, setOpen] = useState<number | null>(null)
    const [searchOpen, setSearchOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = () => setWidth(window.innerWidth)
        window.addEventListener("resize", handler)
        return () => window.removeEventListener("resize", handler)
    }, [])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(null)
                setSearchOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const doSearch = (q: string) => {
        if (!q.trim()) return
        window.open(`${CATALOG}&q=${encodeURIComponent(q.trim())}`, "_blank")
    }

    const handleSearchClick = () => {
        setSearchOpen(!searchOpen)
        setOpen(null)
    }

    const handleMenuClick = (i: number) => {
        setOpen(open === i ? null : i)
        setSearchOpen(false)
    }

    return (
        <div ref={ref} style={{ width: "100%", fontFamily: "sans-serif", position: "relative", zIndex: 100 }}>
            {/* Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: 64, background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)", boxSizing: "border-box" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", marginRight: 40 }}>
                    Goff-Nelson Memorial Library
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: width > 1200 ? 8 : width > 900 ? 4 : 0 }}>
                    {menuData.map((menu, i) => (
                        <button
                            key={i}
                            onClick={() => handleMenuClick(i)}
                            style={{ background: open === i ? "rgba(0,0,0,0.06)" : "none", border: "none", padding: "8px 16px", fontSize: 13, color: "#1a1a1a", cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", fontWeight: open === i ? 600 : 400 }}
                        >
                            {menu.label}
                            <span style={{ fontSize: 8, display: "inline-block", transform: open === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}>▾</span>
                        </button>
                    ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={handleSearchClick} style={{ display: "flex", alignItems: "center", gap: 7, background: searchOpen ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.04)", border: "none", borderRadius: 22, padding: "7px 16px", fontSize: 13, color: "#666", cursor: "pointer", whiteSpace: "nowrap" }}>
                        🔍 Search
                    </button>
                    <button style={{ background: "#2d6a4f", border: "none", borderRadius: 22, padding: "7px 18px", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}>
                        Get a Card
                    </button>
                </div>
            </div>

            {/* Search dropdown */}
            {searchOpen && (
                <div style={{ position: "absolute", top: 64, left: 0, right: 0, background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 16px 40px rgba(0,0,0,0.1)", zIndex: 200, padding: "32px 40px 28px", boxSizing: "border-box" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 700, margin: "0 auto 20px" }}>
                        <div style={{ flex: 1, display: "flex", alignItems: "center", border: "2px solid #222", borderRadius: 30, padding: "10px 18px", gap: 10, background: "#fff" }}>
                            <span>🔍</span>
                            <input
                                style={{ border: "none", background: "transparent", fontSize: 15, outline: "none", flex: 1, color: "#333" }}
                                placeholder="Search the library"
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") doSearch(query) }}
                            />
                        </div>
                        <button
                            onClick={() => window.open(CATALOG, "_blank")}
                            style={{ display: "flex", alignItems: "center", gap: 8, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 30, padding: "12px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                        >
                            Filters
                        </button>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 12, textAlign: "center", display: "block" }}>Browse Popular Topics</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 800, margin: "0 auto" }}>
                        {pills.map((pill, i) => (
                            <a key={i} href={pill.href} target="_blank" style={{ display: "inline-block", padding: "7px 16px", borderRadius: 30, border: "1.5px solid #ccc", fontSize: 13, color: "#333", textDecoration: "none", background: "#fff" }}>
                                {pill.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Mega menu */}
            {open !== null && (
                <div style={{ position: "absolute", top: 64, left: 0, right: 0, background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 16px 40px rgba(0,0,0,0.1)", zIndex: 200, padding: "32px 40px", boxSizing: "border-box", display: "flex" }}>
                    <div style={{ flex: 1 }}>
                        {menuData[open].hasSearch && (
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: "flex", alignItems: "center", background: "#f5f5f5", borderRadius: 30, padding: "10px 18px", gap: 10, maxWidth: 480 }}>
                                    <span>🔍</span>
                                    <input
                                        style={{ border: "none", background: "transparent", fontSize: 14, outline: "none", flex: 1, color: "#333" }}
                                        placeholder="Search everything we lend"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                const val = (e.target as HTMLInputElement).value
                                                window.open(`${CATALOG}&q=${encodeURIComponent(val.trim())}`, "_blank")
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        <div style={{ display: "flex", gap: 48 }}>
                            {menuData[open].columns.map((col, j) => (
                                <div key={j} style={{ minWidth: 160 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#2d6a4f", marginBottom: 14, display: "block" }}>{col.heading}</span>
                                    {col.links.map((link, k) => (
                                        <a key={k} href="#" style={{ display: "block", fontSize: 13, color: "#222", textDecoration: "none", padding: "5px 0", lineHeight: 1.4 }}>
                                            {link.text}
                                            {link.note !== "" && <span style={{ display: "block", fontSize: 11, color: "#999", marginTop: 1 }}>{link.note}</span>}
                                        </a>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 420, paddingLeft: 48, borderLeft: "1px solid rgba(0,0,0,0.07)", marginLeft: 48 }}>
                        {menuData[open].promos.map((promo, p) => (
                            <div key={p} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 10, cursor: "pointer", border: "1px solid rgba(0,0,0,0.06)", background: promo.color }}>
                                <div style={{ width: 64, height: 48, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: "rgba(255,255,255,0.6)" }}>
                                    {promoEmojis[open * 2 + p] || "📚"}
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 3 }}>{promo.title}</div>
                                    <div style={{ fontSize: 12, color: "#777", lineHeight: 1.4 }}>{promo.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}