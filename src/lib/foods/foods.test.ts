import { describe, expect, it } from "vitest";
import { GENERIC_FOODS, searchGenericFoods } from "./generic";
import { fromOffProduct } from "./openfoodfacts";

describe("generic foods", () => {
  it("has plausible energy values", () => {
    for (const f of GENERIC_FOODS) {
      const fromMacros = f.carbs * 4 + f.protein * 4 + f.fat * 9;
      // Fibre, alcohol and rounding explain small gaps.
      expect(Math.abs(fromMacros - f.kcal), f.name).toBeLessThan(Math.max(30, f.kcal * 0.15));
    }
  });

  it("searches ignoring case and accents", () => {
    expect(searchGenericFoods("PANE").map((f) => f.id)).toEqual(["pane", "pane-integrale"]);
    expect(searchGenericFoods("yogurt greco")[0].id).toBe("yogurt-greco-0");
    expect(searchGenericFoods("caffe")).toEqual([]);
    expect(searchGenericFoods("  ")).toEqual([]);
  });
});

describe("Open Food Facts mapping", () => {
  it("maps nutriments per 100 g", () => {
    const item = fromOffProduct({
      code: "8001234567890",
      product_name: "Spaghetti n.5",
      brands: "Marca, Altra",
      serving_quantity: "80",
      nutriments: {
        "energy-kcal_100g": 359,
        carbohydrates_100g: 71.2,
        proteins_100g: "13",
        fat_100g: 1.5,
      },
    });
    expect(item).toMatchObject({
      id: "8001234567890",
      name: "Spaghetti n.5",
      brand: "Marca",
      kcal: 359,
      carbs: 71.2,
      protein: 13,
      portions: [{ label: "1 porzione", grams: 80 }],
    });
  });

  it("falls back to kJ and prefers the Italian name", () => {
    const item = fromOffProduct({
      code: "1",
      product_name: "Oat bar",
      product_name_it: "Barretta d'avena",
      brands: ["Brand"],
      nutriments: { "energy-kj_100g": 1674, carbohydrates_100g: 60, proteins_100g: 8, fat_100g: 12 },
    });
    expect(item?.name).toBe("Barretta d'avena");
    expect(item?.kcal).toBe(400);
    expect(item?.brand).toBe("Brand");
  });

  it("skips products without nutrition data", () => {
    expect(fromOffProduct({ code: "2", product_name: "Mistero", nutriments: {} })).toBeNull();
  });
});
