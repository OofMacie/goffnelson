import { defineConfig } from "storyblok/config";

export default defineConfig({
  region: (process.env.STORYBLOK_REGION ?? "eu") as "eu" | "us" | "cn" | "ca" | "ap",
  space: Number(process.env.STORYBLOK_SPACE_ID),
});
