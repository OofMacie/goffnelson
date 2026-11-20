import { requestWithMetadata } from "@tinacms/astro/data";
import client from "../../tina/__generated__/client";

export const getHome = () =>
  requestWithMetadata(
    client.queries.home({ relativePath: "home.json" }),
    { priority: "primary" },
  );

export const getBooks = () =>
  requestWithMetadata(client.queries.books({ relativePath: "books.json" }));

export const getEvents = () =>
  requestWithMetadata(client.queries.events({ relativePath: "events.json" }));
