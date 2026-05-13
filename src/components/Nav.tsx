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
                    { text: "All Events Calendar", note: "", href: "/Events" },
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

// ─── Mobile accordion section ──────────────────────────────────────────────
function MobileSection({ menu, index }: { menu: typeof menuData[0]; index: number }) {
    const [expanded, setExpanded] = useState(false)
    return (
        <div style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            <button
                onClick={() => setExpanded(!expanded)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", fontSize: 15, fontWeight: 600, color: "#1a1a1a", cursor: "pointer", textAlign: "left" }}
            >
                {menu.label}
                <span style={{ fontSize: 30, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
            </button>
            {expanded && (
                <div style={{ padding: "0 20px 16px" }}>
                    {menu.columns.flatMap(col => col.links).map((link, k) => (
                        <a key={k} href="#" style={{ display: "block", padding: "9px 0", fontSize: 14, color: "#333", textDecoration: "none", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                            {link.text}
                            {link.note && <span style={{ display: "block", fontSize: 12, color: "#999", marginTop: 2 }}>{link.note}</span>}
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Main Nav ───────────────────────────────────────────────────────────────
export default function Nav() {
    const [open, setOpen] = useState<number | null>(null)
    const [searchOpen, setSearchOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener("resize", handler)
        return () => window.removeEventListener("resize", handler)
    }, [])

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(null)
                setSearchOpen(false)
                setMobileOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : ""
        return () => { document.body.style.overflow = "" }
    }, [mobileOpen])

    const doSearch = (q: string) => {
        if (!q.trim()) return
        window.open(`${CATALOG}&q=${encodeURIComponent(q.trim())}`, "_blank")
    }

    // ── Mobile layout ──────────────────────────────────────────────────────
    if (isMobile) {
        return (
            <div ref={ref} style={{ width: "100%", fontFamily: "sans-serif", position: "relative", zIndex: 200 }}>
                {/* Mobile bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 56, background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.1)", boxSizing: "border-box" }}>
                    <span style={{ fontSize: 30, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.25 }}>
                        Goff-Nelson<br /><span style={{ fontWeight: 400, fontSize: 12, color: "#555" }}>Memorial Library</span>
                    </span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <a
                            href={`${CATALOG}&rw=0`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ background: "#2d6a4f", border: "none", borderRadius: 20, padding: "7px 14px", fontSize: 12, fontWeight: 600, color: "#fff", textDecoration: "none", whiteSpace: "nowrap" }}
                        >
                            Search Catalog
                        </a>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileOpen}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5, alignItems: "center", justifyContent: "center" }}
                        >
                            {/* Hamburger / X icon */}
                            <span style={{ display: "block", width: 22, height: 2, background: "#333", borderRadius: 2, transform: mobileOpen ? "translateY(7px) rotate(45deg)" : "none", transition: "transform 0.2s" }} />
                            <span style={{ display: "block", width: 22, height: 2, background: "#333", borderRadius: 2, opacity: mobileOpen ? 0 : 1, transition: "opacity 0.2s" }} />
                            <span style={{ display: "block", width: 22, height: 2, background: "#333", borderRadius: 2, transform: mobileOpen ? "translateY(-7px) rotate(-45deg)" : "none", transition: "transform 0.2s" }} />
                        </button>
                    </div>
                </div>

                {/* Mobile drawer */}
                {mobileOpen && (
                    <div style={{ position: "fixed", top: 56, left: 0, right: 0, bottom: 0, background: "#fff", zIndex: 300, overflowY: "auto" }}>
                        {/* Quick search */}
                        <div style={{ padding: "16px 20px", background: "#f8f6f0", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                            <div style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 24, border: "1.5px solid #ccc", padding: "9px 16px", gap: 8 }}>
                                <span style={{ fontSize: 14 }}>🔍</span>
                                <input
                                    style={{ border: "none", background: "transparent", fontSize: 14, outline: "none", flex: 1, color: "#333" }}
                                    placeholder="Search the library catalog…"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") { doSearch(query); setMobileOpen(false) } }}
                                />
                            </div>
                        </div>

                        {/* Accordion sections */}
                        {menuData.map((menu, i) => (
                            <MobileSection key={i} menu={menu} index={i} />
                        ))}

                        {/* Footer links */}
                        <div style={{ padding: "20px", background: "#f8f6f0", marginTop: 8 }}>
                            <p style={{ fontSize: 13, color: "#555", margin: "0 0 4px" }}>📍 41 Lake Street, Tupper Lake NY 12986</p>
                            <p style={{ fontSize: 13, color: "#555", margin: 0 }}>📞 <a href="tel:+15183599421" style={{ color: "#2d6a4f", textDecoration: "none" }}>518-359-9421</a></p>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // ── Desktop layout ─────────────────────────────────────────────────────
    return (
        <div ref={ref} style={{ width: "100%", fontFamily: "sans-serif", position: "relative", zIndex: 100 }}>
            {/* Desktop bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: 64, background: "var(--nav-bg)", borderBottom: "1px solid rgba(0,0,0,0.08)", boxSizing: "border-box" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--nav-text)", whiteSpace: "nowrap", marginRight: 40 }}>
                    Goff-Nelson Memorial Library
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {menuData.map((menu, i) => (
                        <button
                            key={i}
                            onClick={() => { setOpen(open === i ? null : i); setSearchOpen(false) }}
                            style={{ background: open === i ? "rgba(255,255,255,0.15)" : "none", border: "none", padding: "8px 14px", fontSize: 13, color: open === i ? "var(--nav-active)" : "var(--nav-text)", cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", fontWeight: open === i ? 600 : 400 }}
                        >
                            {menu.label}
                            {/* ▼ Dropdown arrow size — increase fontSize to make it bigger */}
                            <span style={{ fontSize: 15, display: "inline-block", transform: open === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}>▾</span>
                        </button>
                    ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => { setSearchOpen(!searchOpen); setOpen(null) }} style={{ display: "flex", alignItems: "center", gap: 7, background: searchOpen ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)", border: "none", borderRadius: 22, padding: "7px 16px", fontSize: 13, color: "var(--nav-text)", cursor: "pointer", whiteSpace: "nowrap" }}>
                        🔍 Search
                    </button>
                    <button style={{ background: "var(--nav-active)", border: "none", borderRadius: 22, padding: "7px 18px", fontSize: 13, fontWeight: 600, color: "var(--nav-text)", cursor: "pointer", whiteSpace: "nowrap" }}>
                        Get a Card
                    </button>
                </div>
            </div>

            {/* Search dropdown */}
            {searchOpen && (
                <div style={{ position: "absolute", top: 64, left: 0, right: 0, background: "var(--nav-dropdown-bg)", borderBottom: "1px solid var(--card-border)", boxShadow: "0 16px 40px rgba(0,0,0,0.1)", zIndex: 200, padding: "32px 40px 28px", boxSizing: "border-box" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 700, margin: "0 auto 20px" }}>
                        <div style={{ flex: 1, display: "flex", alignItems: "center", border: "2px solid var(--card-text)", borderRadius: 30, padding: "10px 18px", gap: 10, background: "var(--card-bg)" }}>
                            <span>🔍</span>
                            <input
                                style={{ border: "none", background: "transparent", fontSize: 15, outline: "none", flex: 1, color: "var(--card-text)" }}
                                placeholder="Search the library"
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") doSearch(query) }}
                            />
                        </div>
                        <button
                            onClick={() => window.open(CATALOG, "_blank")}
                            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--hero-btn)", color: "var(--hero-btn-text)", border: "none", borderRadius: 30, padding: "12px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                        >
                            Browse All
                        </button>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--card-heading)", marginBottom: 12, textAlign: "center", display: "block" }}>Browse Popular Topics</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 800, margin: "0 auto" }}>
                        {pills.map((pill, i) => (
                            <a key={i} href={pill.href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "7px 16px", borderRadius: 30, border: "1.5px solid var(--card-border)", fontSize: 13, color: "var(--card-text)", textDecoration: "none", background: "var(--card-bg)" }}>
                                {pill.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Mega menu */}
            {open !== null && (
                <div style={{ position: "absolute", top: 64, left: 0, right: 0, background: "var(--card-bg)", borderBottom: "1px solid var(--card-border)", boxShadow: "0 16px 40px rgba(0,0,0,0.1)", zIndex: 200, padding: "32px 40px", boxSizing: "border-box", display: "flex" }}>
                    <div style={{ flex: 1 }}>
                        {menuData[open].hasSearch && (
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: "flex", alignItems: "center", background: "var(--card-surface)", borderRadius: 30, padding: "10px 18px", gap: 10, maxWidth: 480 }}>
                                    <span>🔍</span>
                                    <input
                                        style={{ border: "none", background: "transparent", fontSize: 14, outline: "none", flex: 1, color: "var(--card-text)" }}
                                        placeholder="Search everything we lend"
                                        onKeyDown={e => {
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
                                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--event-tag-text)", marginBottom: 14, display: "block" }}>{col.heading}</span>
                                    {col.links.map((link, k) => (
                                        <a key={k} href="link.href" style={{ display: "block", fontSize: 13, color: "var(--card-text)", textDecoration: "none", padding: "5px 0", lineHeight: 1.4 }}>
                                            {link.text}
                                            {link.note !== "" && <span style={{ display: "block", fontSize: 11, color: "var(--card-meta)", marginTop: 1 }}>{link.note}</span>}
                                        </a>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 280, paddingLeft: 40, borderLeft: "1px solid var(--card-border)", marginLeft: 40 }}>
                        {menuData[open].promos.map((promo, p) => (
                            <div key={p} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 10, cursor: "pointer", border: "1px solid rgba(0,0,0,0.06)", background: promo.color }}>
                                <div style={{ width: 48, height: 48, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: "rgba(255,255,255,0.6)" }}>
                                    {promoEmojis[open * 2 + p] || "📚"}
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--card-heading)", marginBottom: 3 }}>{promo.title}</div>
                                    <div style={{ fontSize: 12, color: "var(--card-meta)", lineHeight: 1.4 }}>{promo.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
