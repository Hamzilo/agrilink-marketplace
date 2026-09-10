/** Shared category constants. Kept in sync with src/convex/app.ts. */
export const CATEGORY_OPTIONS = [
  { name: "Grains", slug: "grains" },
  { name: "Vegetables", slug: "vegetables" },
  { name: "Fruits", slug: "fruits" },
  { name: "Tubers", slug: "tubers" },
  { name: "Livestock", slug: "livestock" },
  { name: "Poultry", slug: "poultry" },
  { name: "Fish", slug: "fish" },
  { name: "Farm Produce", slug: "farm-produce" },
  { name: "Other", slug: "other" },
] as const;

export const UNIT_OPTIONS = [
  "kg",
  "bag",
  "crate",
  "bunch",
  "basket",
  "ton",
  "paint rubber",
  "piece",
  "litre",
  "tray",
] as const;
