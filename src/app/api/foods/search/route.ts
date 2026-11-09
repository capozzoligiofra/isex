import { NextResponse, type NextRequest } from "next/server";
import { getUserId } from "@/lib/data";
import { searchGenericFoods } from "@/lib/foods/generic";
import { lookupBarcode, searchOpenFoodFacts } from "@/lib/foods/openfoodfacts";
import type { FoodItem } from "@/lib/foods/types";

export async function GET(request: NextRequest) {
  if (!(await getUserId())) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ generic: [], products: [] });

  const generic = searchGenericFoods(q);
  let products: FoodItem[] = [];
  let warning: string | undefined;
  try {
    if (/^\d{8,14}$/.test(q)) {
      const product = await lookupBarcode(q);
      products = product ? [product] : [];
      if (!product) warning = "Nessun prodotto trovato con questo codice a barre.";
    } else {
      products = await searchOpenFoodFacts(q);
    }
  } catch {
    warning = "Open Food Facts non risponde: mostro solo gli alimenti di base.";
  }

  return NextResponse.json({ generic, products, warning });
}
