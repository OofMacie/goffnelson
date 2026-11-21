import { useEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from 'react';
import Icon from './Icon';
import { CATALOG, catalogSearchUrl, menus, pills, type Menu } from '../lib/nav-data';
import '../styles/nav.css';

type Panel = { kind: 'menu'; index: number } | { kind: 'search' } | { kind: 'drawer' } | null;
type OpenPanel = Exclude<Panel, null>;

const MOBILE_QUERY = '(max-width: 74.99rem)';
const openCatalog = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

// ─── Search input shared by the search panel, mega menu and mobile drawer ───
interface SearchFieldProps {
  label: string;
  placeholder: string;
  variant?: 'outlined' | 'filled';
  autoFocus?: boolean;
  onSubmit: (query: string) => void;
}

function SearchField({
  label,
  placeholder,
  variant = 'outlined',
  autoFocus,
  onSubmit,
}: SearchFieldProps) {
  const [query, setQuery] = useState('');

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim()) onSubmit(query);
  };

  return (
    <form className={`search-field search-field--${variant}`} role="search" onSubmit={submit}>
      <Icon name="search" />
      <input
        type="search"
        className="search-field__input"
        placeholder={placeholder}
        aria-label={label}
        value={query}
        autoFocus={autoFocus}
        onChange={(event) => setQuery(event.target.value)}
      />
    </form>
  );
}

// ─── Menu content, shared by the desktop mega menu and the mobile accordion ───
function MenuLinks({ links }: { links: Menu['columns'][number]['links'] }) {
  return links.map((link) => (
    <a key={link.text} href={link.text === "All Events Calendar" ? "/Events/" : "#"} className="nav__link">
      {link.text}
      {link.note && <span className="nav__note">{link.note}</span>}
    </a>
  ));
}

function MegaMenu({ menu, id }: { menu: Menu; id: string }) {
  return (
    <div className="nav__panel nav__desktop" id={id}>
      <div className="nav__mega container">
        <div className="nav__mega-main">
          {menu.hasSearch && (
            <SearchField
              variant="filled"
              label="Search everything the library lends"
              placeholder="Search everything we lend"
              onSubmit={(query) => openCatalog(catalogSearchUrl(query))}
            />
          )}
          <div className="nav__columns">
            {menu.columns.map((column) => (
              <div key={column.heading} className="nav__column">
                <span className="nav__column-heading">{column.heading}</span>
                <MenuLinks links={column.links} />
              </div>
            ))}
          </div>
        </div>
        <div className="nav__promos">
          {menu.promos.map((promo) => (
            <div
              key={promo.title}
              className="promo"
              style={{ '--promo-bg': promo.color } as CSSProperties}
            >
              <span className="promo__icon">
                <Icon name={promo.icon} />
              </span>
              <div>
                <div className="promo__title">{promo.title}</div>
                <div className="promo__desc">{promo.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchPanel({ id }: { id: string }) {
  return (
    <div className="nav__panel nav__desktop" id={id}>
      <div className="nav__search-panel container">
        <div className="nav__search-row">
          <SearchField
            label="Search the library catalog"
            placeholder="Search the library"
            autoFocus
            onSubmit={(query) => openCatalog(catalogSearchUrl(query))}
          />
          <button
            type="button"
            className="button button--primary"
            onClick={() => openCatalog(CATALOG)}
          >
            Browse All
          </button>
        </div>
        <span className="nav__topics-heading">Browse Popular Topics</span>
        <div className="nav__pills">
          {pills.map((pill) => (
            <a
              key={pill.label}
              href={pill.href}
              className="nav__pill"
              target="_blank"
              rel="noopener noreferrer"
            >
              {pill.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileSection({ menu }: { menu: Menu }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="drawer__section">
      <button
        type="button"
        className="drawer__toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {menu.label}
        <span className="nav__chevron" data-open={expanded}>
          <Icon name="chevron-down" />
        </span>
      </button>
      {expanded && (
        <div className="drawer__links">
          <MenuLinks links={menu.columns.flatMap((column) => column.links)} />
        </div>
      )}
    </div>
  );
}

function MobileDrawer({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="nav__drawer nav__mobile" id="nav-drawer">
      <div className="drawer__search">
        <SearchField
          label="Search the library catalog"
          placeholder="Search the library catalog…"
          onSubmit={(query) => {
            openCatalog(catalogSearchUrl(query));
            onNavigate();
          }}
        />
      </div>
      {menus.map((menu) => (
        <MobileSection key={menu.label} menu={menu} />
      ))}
      <div className="drawer__contact">
        <p>
          <Icon name="map-pin" /> 41 Lake Street, Tupper Lake NY 12986
        </p>
        <p>
          <Icon name="phone" /> <a href="tel:+15183599421">518-359-9421</a>
        </p>
      </div>
    </div>
  );
}

// ─── Main Nav ───────────────────────────────────────────────────────────────
export default function Nav() {
  const [panel, setPanel] = useState<Panel>(null);
  const ref = useRef<HTMLElement>(null);

  const isOpen = (kind: OpenPanel['kind'], index?: number) =>
    panel?.kind === kind && (panel.kind !== 'menu' || panel.index === index);
  const toggle = (next: OpenPanel) =>
    setPanel(isOpen(next.kind, next.kind === 'menu' ? next.index : undefined) ? null : next);

  // Dismiss on outside click or Escape (WCAG 1.4.13).
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setPanel(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // The drawer is mobile-only: lock page scroll while it is open and close it if the viewport grows.
  const drawerOpen = isOpen('drawer');
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    const query = window.matchMedia(MOBILE_QUERY);
    const onChange = () => {
      if (!query.matches) setPanel(null);
    };
    query.addEventListener('change', onChange);
    return () => {
      document.body.style.overflow = '';
      query.removeEventListener('change', onChange);
    };
  }, [drawerOpen]);

  return (
    <nav ref={ref} className="nav" aria-label="Main">
      <div className="nav__bar">
        <div className="nav__bar-inner container">
          <a href="/" className="nav__brand">
            <img src="/assets/logo2.png" className="nav__logo" alt="" width="104" height="40" />
            <span>
              Goff-Nelson <span className="nav__brand-sub">Memorial Library</span>
            </span>
          </a>

          <ul className="nav__menu nav__desktop">
            {menus.map((menu, index) => (
              <li key={menu.label}>
                <button
                  type="button"
                  className="nav__trigger"
                  aria-expanded={isOpen('menu', index)}
                  aria-controls={`nav-menu-${index}`}
                  onClick={() => toggle({ kind: 'menu', index })}
                >
                  <span className="nav__trigger-label">
                    {menu.label}
                    <span className="nav__chevron" data-open={isOpen('menu', index)}>
                      <Icon name="chevron-down" />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="nav__actions">
            <button
              type="button"
              className="button nav__search-toggle nav__desktop"
              aria-expanded={isOpen('search')}
              aria-controls="nav-search"
              onClick={() => toggle({ kind: 'search' })}
            >
              <Icon name="search" /> Search
            </button>
            <button type="button" className="button button--primary nav__desktop">
              Get a Card
            </button>

            <a
              href={`${CATALOG}&rw=0`}
              className="button button--primary nav__mobile"
              target="_blank"
              rel="noopener noreferrer"
            >
              Search Catalog
            </a>
            <button
              type="button"
              className="nav__hamburger nav__mobile"
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={drawerOpen}
              aria-controls="nav-drawer"
              onClick={() => toggle({ kind: 'drawer' })}
            >
              <span className="nav__hamburger-bar" />
              <span className="nav__hamburger-bar" />
              <span className="nav__hamburger-bar" />
            </button>
          </div>
        </div>
      </div>

      {isOpen('search') && <SearchPanel id="nav-search" />}
      {panel?.kind === 'menu' && (
        <MegaMenu menu={menus[panel.index]} id={`nav-menu-${panel.index}`} />
      )}
      {drawerOpen && <MobileDrawer onNavigate={() => setPanel(null)} />}
    </nav>
  );
}
