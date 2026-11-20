import { defineConfig } from "tinacms";

// TinaCloud uses the Git branch being deployed. Staff content is stored in this repo.
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  "main";

// Tina does not block saving an empty list item, so required text is validated explicitly.
const stringField = (name: string, label: string, required = true) => ({
  type: "string" as const,
  name,
  label,
  required,
  ...(required && {
    ui: { validate: (value?: string) => (value?.trim() ? undefined : "This field is required.") },
  }),
});

const textField = (name: string, label: string) => {
  const field = stringField(name, label);
  return { ...field, ui: { ...field.ui, component: "textarea" } };
};

export default defineConfig({
  branch,
  // Astro uses PUBLIC_TINA_CLIENT_ID. Support the generic Tina/Next prefix as a fallback.
  clientId: (process.env.PUBLIC_TINA_CLIENT_ID || process.env.NEXT_PUBLIC_TINA_CLIENT_ID)?.trim(),
  // Prefer the documented key. CONTENT_READONLY is supported for the existing Vercel setup.
  token: (process.env.TINA_TOKEN || process.env.CONTENT_READONLY)?.trim(),
  build: { outputFolder: "admin", publicFolder: "public" },
  media: { tina: { mediaRoot: "images", publicFolder: "public" } },
  schema: {
    collections: [
      {
        name: "home",
        label: "Home page",
        path: "content/home",
        format: "json",
        ui: {
          router: () => "/",
          allowedActions: { create: false, delete: false },
        },
        fields: [
          stringField("title", "Internal title"),
          { type: "image", name: "heroImage", label: "Homepage photograph", required: true },
          stringField("heroAlt", "Describe the photograph for screen-reader users"),
          stringField("headline", "Main heading"),
          textField("introduction", "Welcome paragraph"),
        ],
      },
      {
        name: "events",
        label: "Events and programs",
        path: "content/events",
        format: "json",
        ui: { router: () => "/", allowedActions: { create: false, delete: false } },
        fields: [
          stringField("title", "Section heading"),
          {
            type: "object",
            name: "entries",
            label: "Programs",
            list: true,
            ui: { itemProps: (item: any) => ({ label: item?.title || "New program" }) },
            fields: [
              stringField("title", "Event name"),
              stringField("date", "Date or repeating schedule"),
              stringField("time", "Start time"),
              textField("description", "Event description"),
              stringField("category", "Audience or category"),
              { type: "image", name: "image", label: "Event photograph" },
              stringField("imageAlt", "Describe the photograph (if informative)", false),
              stringField("link", "More information URL (optional)", false),
            ],
          },
        ],
      },
      {
        name: "books",
        label: "Staff book picks",
        path: "content/books",
        format: "json",
        ui: { router: () => "/", allowedActions: { create: false, delete: false } },
        fields: [
          stringField("title", "Carousel heading"),
          {
            type: "object",
            name: "entries",
            label: "Featured books",
            list: true,
            ui: { itemProps: (item: any) => ({ label: item?.title || "New book" }) },
            fields: [
              stringField("title", "Book title"),
              stringField("author", "Author"),
              stringField("isbn", "ISBN (used for the cover when no image is chosen)", false),
              { type: "image", name: "cover", label: "Book cover (optional)" },
            ],
          },
        ],
      },
      {
        name: "settings",
        label: "Library information",
        path: "content/settings",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          stringField("title", "Internal title"),
          textField("about", "About the library"),
          stringField("address", "Street address"),
          stringField("phone", "Display phone number"),
          stringField("phoneLink", "Phone number for clickable links"),
          stringField("facebook", "Facebook profile URL"),
          {
            type: "object",
            name: "hours",
            label: "Opening hours",
            list: true,
            ui: { itemProps: (item: any) => ({ label: item?.label || "Opening hours" }) },
            fields: [
              stringField("label", "Days shown to visitors"),
              { type: "string", name: "days", label: "Day names (for search engines)", list: true },
              stringField("opens", "Opening time, 24-hour HH:MM", false),
              stringField("closes", "Closing time, 24-hour HH:MM", false),
              { type: "boolean", name: "closed", label: "Closed all day" },
            ],
          },
        ],
      },
    ],
  },
});
