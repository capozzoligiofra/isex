/** A food with nutrition values per 100 g (or 100 ml for drinks). */
export interface FoodItem {
  source: "generic" | "openfoodfacts" | "manual";
  id: string;
  name: string;
  brand?: string | null;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  /** Suggested portions, e.g. "1 banana media" = 120 g. */
  portions?: { label: string; grams: number }[];
}
