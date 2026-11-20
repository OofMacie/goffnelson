import type { IslandRegistry } from "@tinacms/astro/experimental";
import type { QueryResult } from "@tinacms/astro/data";
import type { BooksQuery, EventsQuery, HomeQuery } from "../../tina/__generated__/types";
import HomeBody from "../components/cms/HomeBody.astro";
import BookCarousel from "../components/cms/BookCarousel.astro";
import EventCarousel from "../components/cms/EventCarousel.astro";
import { getBooks, getEvents, getHome } from "./tina-data";

export const islands: IslandRegistry = {
  home: {
    fetch: () => getHome(),
    component: HomeBody,
    wrapper: { tag: "div" },
    propsFromData: (result) => ({
      data: (result as QueryResult<HomeQuery>).data?.home,
    }),
  },
  books: {
    fetch: () => getBooks(),
    component: BookCarousel,
    wrapper: { tag: "div" },
    propsFromData: (result) => ({
      data: (result as QueryResult<BooksQuery>).data?.books,
    }),
  },
  events: {
    fetch: () => getEvents(),
    component: EventCarousel,
    wrapper: { tag: "div" },
    propsFromData: (result) => ({
      data: (result as QueryResult<EventsQuery>).data?.events,
    }),
  },
};
