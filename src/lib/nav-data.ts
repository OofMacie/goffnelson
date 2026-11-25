import type { IconName } from './icons';

export const CATALOG = 'https://cefls.ent.sirsi.net/client/en_US/default/search/results?te=&lm=TUP';

export interface MenuLink {
  text: string;
  note: string;
  href?: string;
}

export interface Menu {
  label: string;
  hasSearch: boolean;
  columns: { heading: string; links: MenuLink[] }[];
  promos: { title: string; icon: IconName; desc: string; color: string }[];
}

export interface Pill {
  label: string;
  href: string;
}

export const catalogSearchUrl = (query: string) =>
  `${CATALOG}&q=${encodeURIComponent(query.trim())}`;

export const menus: Menu[] = [
  {
    label: 'Books & More',
    hasSearch: true,
    columns: [
      {
        heading: 'THINGS WE LEND',
        links: [
          { text: 'Books, eBooks & AudioBooks', note: '' },
          { text: 'Movies & DVDs', note: '' },
          { text: 'Museum Passes', note: '' },
          { text: 'CDs & Music', note: '' },
          { text: 'Large Print', note: '' },
          { text: 'Audiobooks', note: '' },
        ],
      },
    ],
    promos: [
      {
        title: 'Adirondack History Room',
        icon: 'archive',
        desc: 'Photos, yearbooks & local history archives',
        color: '#e8f4e8',
      },
      {
        title: 'Library of Things',
        icon: 'package',
        desc: 'Borrow more than just books',
        color: '#e8eef4',
      },
    ],
  },
  {
    label: 'Events & Programs',
    hasSearch: false,
    columns: [
      {
        heading: 'EVENTS',
        links: [
          { text: 'All Events Calendar', href: '/Events/' note: '' },
          { text: 'Tupper Tots', note: 'Story time for little ones' },
          { text: 'Tupper Teens', note: 'After school programs' },
        ],
      },
      {
        heading: 'BY AUDIENCE',
        links: [
          { text: 'Kids', note: '' },
          { text: 'Teens', note: '' },
          { text: 'Adults', note: '' },
          { text: 'BOCES HSE / GED', note: 'Evening classes' },
        ],
      },
    ],
    promos: [
      {
        title: 'Yarn Social',
        icon: 'users',
        desc: 'Join our weekly knit & crochet group',
        color: '#f4eee8',
      },
      {
        title: 'Tabata with Courtney',
        icon: 'dumbbell',
        desc: 'Free fitness classes at the library',
        color: '#f0e8f4',
      },
    ],
  },
  {
    label: 'Online Resources',
    hasSearch: false,
    columns: [
      {
        heading: 'DIGITAL',
        links: [
          { text: 'eBooks & Audiobooks', note: 'Free via OverDrive / Libby' },
          { text: 'Databases', note: 'Research & reference tools' },
          { text: 'Library of Things', note: '' },
          { text: 'Historic Tupper Lake Photos', note: 'NYHeritage archive' },
          { text: 'Links & Resources', note: '' },
        ],
      },
    ],
    promos: [
      {
        title: 'OverDrive / Libby',
        icon: 'headphones',
        desc: 'Thousands of free eBooks & audiobooks with your card',
        color: '#e8f4e8',
      },
      {
        title: 'NYHeritage Archive',
        icon: 'landmark',
        desc: 'Explore historic Tupper Lake photos & yearbooks',
        color: '#e8eef4',
      },
    ],
  },
  {
    label: 'About',
    hasSearch: false,
    columns: [
      {
        heading: 'VISIT US',
        links: [
          { text: 'Hours & Location', note: '41 Lake Street, Tupper Lake NY' },
          { text: 'Contact Us', note: '518-359-9421' },
          { text: 'History of the Library', note: '' },
          { text: 'Board of Trustees', href: '/BoardofTrustrees/', note: '' },
          { text: 'Policies & Annual Report', note: '' },
        ],
      },
      {
        heading: 'SUPPORT',
        links: [
          { text: 'Donate', note: 'Support your local library' },
          { text: 'Get a Library Card', note: 'Free for all residents' },
          { text: 'Volunteer', note: '' },
          { text: 'Room Reservations', note: '' },
        ],
      },
    ],
    promos: [
      {
        title: 'Donate Today',
        icon: 'heart-handshake',
        desc: 'Your support keeps the library thriving for everyone',
        color: '#f4eee8',
      },
      {
        title: 'Get a Card',
        icon: 'id-card',
        desc: 'Free library cards for all Tupper Lake residents',
        color: '#e8f4e8',
      },
    ],
  },
];

export const pills: Pill[] = [
  { label: 'New Arrivals', href: `${CATALOG}&rw=0&sort=NEWLY_ACQUIRED` },
  { label: 'Kids Books', href: `${CATALOG}&q=children` },
  { label: 'Teen Reads', href: `${CATALOG}&q=young+adult` },
  { label: 'Large Print', href: `${CATALOG}&q=large+print` },
  { label: 'Audiobooks', href: `${CATALOG}&q=audiobook` },
  { label: 'DVDs', href: `${CATALOG}&q=dvd` },
  { label: 'Graphic Novels', href: `${CATALOG}&q=graphic+novel` },
  { label: 'Adirondack History', href: `${CATALOG}&q=adirondack` },
  { label: 'Events', href: '/Events/' },
];
