import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FoodPicker } from "@/components/food-picker";
import { Card, buttonClass, cx } from "@/components/ui";
import { getRecentFoods, getToday, requireProfile } from "@/lib/data";
import { formatDayLong, isIsoDate } from "@/lib/dates";
import { GENERIC_FOODS } from "@/lib/foods/generic";
import type { FoodItem } from "@/lib/foods/types";

export const metadata: Metadata = { title: "Aggiungi alimento" };

const FUELING_SLOT = "allenamento";
const SUGGESTED_MEAL = ["pasta-secca", "riso-crudo", "pane", "avena", "banana", "yogurt-greco-0", "uova", "pollo"];
const SUGGESTED_FUELING = ["gel", "barretta", "maltodestrine", "isotonica", "banana", "datteri"];

export default async function AddFoodPage({ searchParams }: PageProps<"/diario/aggiungi">) {
  const profile = await requireProfile();
  const { data, pasto } = await searchParams;
  const date = isIsoDate(data) ? data : await getToday();
  const slot = typeof pasto === "string" ? pasto : "";
  const meal = profile.meals.find((m) => m.id === slot);
  if (!meal && slot !== FUELING_SLOT) notFound();

  const recentEntries = await getRecentFoods();
  const recent: FoodItem[] = recentEntries.map((e) => {
    const k = 100 / e.grams;
    return {
      source: e.source,
      id: e.sourceId ?? e.id,
      name: e.name,
      brand: e.brand,
      kcal: Math.round(e.kcal * k),
      carbs: Math.round(e.carbsG * k * 10) / 10,
      protein: Math.round(e.proteinG * k * 10) / 10,
      fat: Math.round(e.fatG * k * 10) / 10,
      portions: [{ label: "Ultima volta", grams: e.grams }],
    };
  });
  const suggestedIds = slot === FUELING_SLOT ? SUGGESTED_FUELING : SUGGESTED_MEAL;
  const suggested = suggestedIds
    .map((id) => GENERIC_FOODS.find((f) => f.id === id))
    .filter((f): f is FoodItem => Boolean(f));

  return (
    <>
      <Link href={`/oggi?data=${date}#pasto-${slot}`} className={cx(buttonClass.ghost, "-ml-3 mb-2")}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Torna alla giornata
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">
        {meal ? meal.name : "Rifornimento in allenamento"}
      </h1>
      <p className="mb-4 text-sm text-muted">{formatDayLong(date)}</p>
      <Card>
        <FoodPicker date={date} slot={slot} recent={recent} suggested={suggested} />
      </Card>
    </>
  );
}
