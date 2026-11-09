"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { addFoodEntry } from "@/app/actions/food";
import type { FoodItem } from "@/lib/foods/types";
import { fmt } from "@/lib/format";
import { Field, FormMessage, SubmitButton } from "./form";
import { buttonClass, cx, inputClass } from "./ui";

interface SearchResult {
  generic: FoodItem[];
  products: FoodItem[];
  warning?: string;
}

function FoodRow({ food, onSelect }: { food: FoodItem; onSelect: (f: FoodItem) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(food)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-2"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{food.name}</div>
          <div className="truncate text-xs text-muted">
            {food.brand ? `${food.brand} · ` : ""}
            per 100 g: {fmt(food.kcal)} kcal · C {fmt(food.carbs, 1)} · P {fmt(food.protein, 1)} · G {fmt(food.fat, 1)}
          </div>
        </div>
      </button>
    </li>
  );
}

function Section({ title, foods, onSelect }: { title: string; foods: FoodItem[]; onSelect: (f: FoodItem) => void }) {
  if (foods.length === 0) return null;
  return (
    <div>
      <h3 className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <ul>
        {foods.map((f) => (
          <FoodRow key={`${f.source}-${f.id}`} food={f} onSelect={onSelect} />
        ))}
      </ul>
    </div>
  );
}

function Hidden({ values }: { values: Record<string, string | number | null | undefined> }) {
  return (
    <>
      {Object.entries(values).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v ?? ""} />
      ))}
    </>
  );
}

function QuantityForm({
  food,
  date,
  slot,
  onBack,
}: {
  food: FoodItem;
  date: string;
  slot: string;
  onBack: () => void;
}) {
  const [state, action] = useActionState(addFoodEntry, undefined);
  const [grams, setGrams] = useState(String(food.portions?.[0]?.grams ?? 100));
  const g = Number(grams.replace(",", ".")) || 0;
  const factor = g / 100;

  return (
    <form action={action} className="space-y-4">
      <Hidden
        values={{
          date,
          meal_slot: slot,
          name: food.name,
          brand: food.brand,
          source: food.source,
          source_id: food.source === "manual" ? "" : food.id,
          basis: "per100",
          kcal: food.kcal,
          carbs: food.carbs,
          protein: food.protein,
          fat: food.fat,
        }}
      />
      <button type="button" onClick={onBack} className={cx(buttonClass.ghost, "-ml-3")}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Cerca un altro alimento
      </button>
      <div>
        <h2 className="text-lg font-semibold">{food.name}</h2>
        {food.brand && <p className="text-sm text-muted">{food.brand}</p>}
      </div>

      <Field label="Quantità (g)" htmlFor="grams" error={state?.fieldErrors?.grams}>
        <input
          id="grams"
          name="grams"
          inputMode="decimal"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          className={inputClass}
          autoFocus
        />
      </Field>
      {food.portions && food.portions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {food.portions.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setGrams(String(p.grams))}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium transition hover:bg-surface-2"
            >
              {p.label} · {fmt(p.grams)} g
            </button>
          ))}
        </div>
      )}

      <div className="tabular grid grid-cols-4 gap-2 text-center">
        {[
          ["kcal", food.kcal, ""],
          ["Carbo", food.carbs, " g"],
          ["Proteine", food.protein, " g"],
          ["Grassi", food.fat, " g"],
        ].map(([label, per100, unit]) => (
          <div key={label as string} className="rounded-xl bg-surface-2 px-2 py-2">
            <div className="text-[11px] text-muted">{label}</div>
            <div className="font-semibold">
              {fmt((per100 as number) * factor)}
              {unit}
            </div>
          </div>
        ))}
      </div>

      <FormMessage state={state} />
      <SubmitButton className="w-full">Aggiungi al diario</SubmitButton>
    </form>
  );
}

function ManualForm({ date, slot }: { date: string; slot: string }) {
  const [state, action] = useActionState(addFoodEntry, undefined);
  const err = state?.fieldErrors ?? {};
  const v = state?.values ?? {};
  return (
    <form action={action} className="space-y-4">
      <Hidden values={{ date, meal_slot: slot, source: "manual", basis: "total" }} />
      <p className="text-sm text-muted">Inserisci i valori della porzione che hai mangiato.</p>
      <Field label="Nome" htmlFor="m-name" error={err.name}>
        <input id="m-name" name="name" required maxLength={200} defaultValue={v.name} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantità (g)" htmlFor="m-grams" error={err.grams}>
          <input id="m-grams" name="grams" inputMode="decimal" defaultValue={v.grams ?? "100"} required className={inputClass} />
        </Field>
        <Field label="Calorie (kcal)" htmlFor="m-kcal" error={err.kcal}>
          <input id="m-kcal" name="kcal" inputMode="decimal" required defaultValue={v.kcal} className={inputClass} />
        </Field>
        <Field label="Carboidrati (g)" htmlFor="m-carbs" error={err.carbs}>
          <input id="m-carbs" name="carbs" inputMode="decimal" defaultValue={v.carbs ?? "0"} className={inputClass} />
        </Field>
        <Field label="Proteine (g)" htmlFor="m-protein" error={err.protein}>
          <input id="m-protein" name="protein" inputMode="decimal" defaultValue={v.protein ?? "0"} className={inputClass} />
        </Field>
        <Field label="Grassi (g)" htmlFor="m-fat" error={err.fat}>
          <input id="m-fat" name="fat" inputMode="decimal" defaultValue={v.fat ?? "0"} className={inputClass} />
        </Field>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="w-full">Aggiungi al diario</SubmitButton>
    </form>
  );
}

export function FoodPicker({
  date,
  slot,
  recent,
  suggested,
}: {
  date: string;
  slot: string;
  recent: FoodItem[];
  suggested: FoodItem[];
}) {
  const [tab, setTab] = useState<"search" | "manual">("search");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FoodItem | null>(null);

  const q = query.trim();
  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        setResult(await res.json());
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setResult({ generic: [], products: [], warning: "Ricerca non riuscita. Riprova." });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const showResults = q.length >= 2 && result !== null;
  const empty = useMemo(
    () => showResults && result.generic.length === 0 && result.products.length === 0,
    [showResults, result],
  );

  if (selected) {
    return <QuantityForm food={selected} date={date} slot={slot} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 rounded-xl bg-surface-2 p-1 text-sm font-semibold">
        {(["search", "manual"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cx("rounded-lg py-2 transition", tab === t ? "bg-surface shadow-sm" : "text-muted")}
          >
            {t === "search" ? "Cerca" : "Inserisci a mano"}
          </button>
        ))}
      </div>

      {tab === "manual" ? (
        <ManualForm date={date} slot={slot} />
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca un alimento o un codice a barre"
              aria-label="Cerca un alimento"
              className={cx(inputClass, "pl-9")}
              autoFocus
            />
          </div>
          <div className="-mx-3 mt-2">
            {q.length < 2 && (
              <>
                <Section title="Recenti" foods={recent} onSelect={setSelected} />
                <Section title="Suggeriti" foods={suggested} onSelect={setSelected} />
              </>
            )}
            {q.length >= 2 && loading && !result && (
              <p className="px-3 py-4 text-sm text-muted">Ricerca in corso…</p>
            )}
            {showResults && (
              <>
                <Section title="Alimenti di base" foods={result.generic} onSelect={setSelected} />
                <Section title="Prodotti (Open Food Facts)" foods={result.products} onSelect={setSelected} />
                {result.warning && <p className="px-3 py-2 text-xs text-muted">{result.warning}</p>}
                {empty && (
                  <p className="px-3 py-4 text-sm text-muted">
                    Nessun risultato. Prova con un altro nome oppure inseriscilo a mano.
                  </p>
                )}
                {loading && <p className="px-3 py-2 text-xs text-muted">Aggiornamento…</p>}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
