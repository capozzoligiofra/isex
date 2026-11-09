import type { FoodItem } from "./types";

const USER_AGENT = "Carbura/0.1 (sports nutrition web app)";
const FIELDS = [
  "code",
  "product_name",
  "product_name_it",
  "brands",
  "nutriments",
  "serving_quantity",
].join(",");

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_it?: string;
  brands?: string | string[];
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
}

function num(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Maps an Open Food Facts product to a FoodItem, or null if it lacks nutrition data. */
export function fromOffProduct(p: OffProduct): FoodItem | null {
  const n = p.nutriments ?? {};
  const name = (p.product_name_it || p.product_name || "").trim();
  if (!p.code || !name) return null;

  let kcal = num(n["energy-kcal_100g"]);
  const kj = num(n["energy-kj_100g"]) ?? num(n["energy_100g"]);
  if (kcal == null && kj != null) kcal = kj / 4.184;
  const carbs = num(n["carbohydrates_100g"]);
  const protein = num(n["proteins_100g"]);
  const fat = num(n["fat_100g"]);
  if (kcal == null || carbs == null || protein == null || fat == null) return null;

  const brand = Array.isArray(p.brands) ? p.brands[0] : p.brands?.split(",")[0];
  const serving = num(p.serving_quantity);

  return {
    source: "openfoodfacts",
    id: p.code,
    name,
    brand: brand?.trim() || null,
    kcal: Math.round(kcal),
    carbs: round1(carbs),
    protein: round1(protein),
    fat: round1(fat),
    portions: serving && serving > 0 ? [{ label: "1 porzione", grams: serving }] : undefined,
  };
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) throw new Error(`Open Food Facts: HTTP ${res.status}`);
  return res.json();
}

export async function searchOpenFoodFacts(query: string, limit = 20): Promise<FoodItem[]> {
  const q = encodeURIComponent(query);
  let products: OffProduct[] = [];
  try {
    // Search-a-licious, the newer and faster search service.
    const data = (await getJson(
      `https://search.openfoodfacts.org/search?q=${q}&langs=it,en&page_size=${limit}&fields=${FIELDS}`,
    )) as { hits?: OffProduct[] };
    products = data.hits ?? [];
  } catch {
    // Classic search API as a fallback.
    const data = (await getJson(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=${limit}&fields=${FIELDS}`,
    )) as { products?: OffProduct[] };
    products = data.products ?? [];
  }
  return products.map(fromOffProduct).filter((f): f is FoodItem => f !== null);
}

export async function lookupBarcode(code: string): Promise<FoodItem | null> {
  const data = (await getJson(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}?fields=${FIELDS}`,
  )) as { status?: number; product?: OffProduct };
  if (data.status !== 1 || !data.product) return null;
  return fromOffProduct({ ...data.product, code: data.product.code ?? code });
}
