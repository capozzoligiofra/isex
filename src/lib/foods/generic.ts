import type { FoodItem } from "./types";

type Row = [
  id: string,
  name: string,
  kcal: number,
  carbs: number,
  protein: number,
  fat: number,
  portions?: FoodItem["portions"],
];

/**
 * Average values per 100 g of common foods (CREA and USDA food composition
 * tables, rounded). Carbohydrates are available carbs, fibre excluded, as on
 * EU nutrition labels. Indicative values: packaged products vary.
 */
const ROWS: Row[] = [
  // Cereali e derivati
  ["pasta-secca", "Pasta di semola (cruda)", 356, 71, 13, 1.5, [{ label: "1 porzione", grams: 80 }]],
  ["pasta-cotta", "Pasta di semola (cotta)", 158, 31, 5.8, 0.9],
  ["riso-crudo", "Riso bianco (crudo)", 360, 79, 7, 0.6, [{ label: "1 porzione", grams: 80 }]],
  ["riso-cotto", "Riso bianco (cotto)", 130, 28, 2.7, 0.3],
  ["pane", "Pane comune", 270, 55, 8.5, 1.5, [{ label: "1 fetta", grams: 40 }]],
  ["pane-integrale", "Pane integrale", 250, 43, 12, 3.4, [{ label: "1 fetta", grams: 40 }]],
  ["fette-biscottate", "Fette biscottate", 410, 82, 11, 6, [{ label: "1 fetta", grams: 9 }]],
  ["avena", "Fiocchi d'avena", 372, 60, 13.5, 7, [{ label: "1 porzione", grams: 50 }]],
  ["corn-flakes", "Corn flakes", 378, 84, 7, 0.9, [{ label: "1 tazza", grams: 30 }]],
  ["muesli", "Muesli", 370, 66, 10, 6, [{ label: "1 porzione", grams: 50 }]],
  ["gallette-riso", "Gallette di riso", 387, 81, 8, 2.8, [{ label: "1 galletta", grams: 8 }]],
  ["cracker", "Cracker salati", 430, 70, 10, 11, [{ label: "1 pacchetto", grams: 25 }]],
  ["biscotti-secchi", "Biscotti secchi", 416, 84, 6.6, 7.9, [{ label: "1 biscotto", grams: 8 }]],
  ["couscous", "Cous cous (crudo)", 376, 72, 12.8, 0.6, [{ label: "1 porzione", grams: 80 }]],
  ["quinoa", "Quinoa (cruda)", 368, 57, 14, 6, [{ label: "1 porzione", grams: 80 }]],
  ["gnocchi", "Gnocchi di patate", 160, 34, 4, 0.5, [{ label: "1 porzione", grams: 200 }]],
  // Tuberi
  ["patate", "Patate", 77, 17, 2, 0.1, [{ label: "1 patata media", grams: 170 }]],
  ["patate-dolci", "Patate dolci", 86, 18, 1.6, 0.1, [{ label: "1 patata media", grams: 150 }]],
  // Frutta
  ["banana", "Banana", 89, 21, 1.1, 0.3, [{ label: "1 banana media", grams: 120 }]],
  ["mela", "Mela", 52, 12, 0.3, 0.2, [{ label: "1 mela media", grams: 180 }]],
  ["arancia", "Arancia", 47, 10, 0.9, 0.1, [{ label: "1 arancia media", grams: 150 }]],
  ["datteri", "Datteri secchi", 282, 67, 2.5, 0.4, [{ label: "1 dattero", grams: 8 }]],
  ["uvetta", "Uvetta", 299, 75, 3, 0.5, [{ label: "1 manciata", grams: 30 }]],
  ["succo-arancia", "Succo d'arancia", 45, 10.4, 0.7, 0.2, [{ label: "1 bicchiere", grams: 200 }]],
  // Dolcificanti e spalmabili
  ["miele", "Miele", 304, 82, 0.3, 0, [{ label: "1 cucchiaino", grams: 7 }]],
  ["marmellata", "Marmellata / confettura", 250, 60, 0.4, 0.1, [{ label: "1 cucchiaino", grams: 10 }]],
  ["zucchero", "Zucchero", 400, 100, 0, 0, [{ label: "1 cucchiaino", grams: 5 }]],
  ["burro-arachidi", "Burro d'arachidi", 588, 14, 25, 50, [{ label: "1 cucchiaio", grams: 15 }]],
  ["cioccolato-fondente", "Cioccolato fondente 70%", 570, 34, 9, 41, [{ label: "1 quadretto", grams: 10 }]],
  // Latte e derivati
  ["latte-ps", "Latte parzialmente scremato", 46, 4.9, 3.3, 1.6, [{ label: "1 tazza", grams: 250 }]],
  ["latte-intero", "Latte intero", 64, 4.8, 3.2, 3.6, [{ label: "1 tazza", grams: 250 }]],
  ["yogurt-greco-0", "Yogurt greco 0%", 57, 3.5, 10, 0.2, [{ label: "1 vasetto", grams: 170 }]],
  ["yogurt-bianco", "Yogurt bianco intero", 66, 4.3, 3.8, 3.9, [{ label: "1 vasetto", grams: 125 }]],
  ["parmigiano", "Parmigiano Reggiano", 392, 0, 33, 28, [{ label: "1 cucchiaio grattugiato", grams: 5 }]],
  ["mozzarella", "Mozzarella vaccina", 253, 0.7, 18.7, 19.5, [{ label: "1 mozzarella", grams: 125 }]],
  ["ricotta", "Ricotta vaccina", 146, 3.5, 8.8, 10.9],
  // Carne, pesce, uova
  ["uova", "Uova intere", 143, 0.7, 12.6, 9.5, [{ label: "1 uovo", grams: 55 }]],
  ["albume", "Albume d'uovo", 52, 0.7, 11, 0.2],
  ["pollo", "Petto di pollo (crudo)", 110, 0, 23, 1.5],
  ["tacchino", "Petto di tacchino (crudo)", 107, 0, 24, 1.2],
  ["manzo-magro", "Manzo magro (crudo)", 137, 0, 21, 5],
  ["salmone", "Salmone (crudo)", 208, 0, 20, 13],
  ["tonno-naturale", "Tonno al naturale (sgocciolato)", 100, 0, 23, 1, [{ label: "1 scatoletta", grams: 56 }]],
  ["prosciutto-crudo", "Prosciutto crudo", 268, 0, 26, 18, [{ label: "1 fetta", grams: 15 }]],
  ["bresaola", "Bresaola", 151, 0, 32, 2.6, [{ label: "1 fetta", grams: 10 }]],
  // Legumi
  ["lenticchie-cotte", "Lenticchie (cotte)", 116, 12, 9, 0.4],
  ["ceci-cotti", "Ceci (cotti)", 164, 20, 8.9, 2.6],
  // Verdure
  ["insalata", "Insalata verde", 15, 2, 1.4, 0.2],
  ["pomodori", "Pomodori", 18, 2.7, 0.9, 0.2],
  ["zucchine", "Zucchine", 17, 2.1, 1.2, 0.3],
  ["broccoli", "Broccoli", 34, 4, 2.8, 0.4],
  ["spinaci", "Spinaci", 23, 1.4, 2.9, 0.4],
  ["carote", "Carote", 41, 6.8, 0.9, 0.2],
  // Grassi e frutta secca
  ["olio-evo", "Olio extravergine d'oliva", 899, 0, 0, 99.9, [{ label: "1 cucchiaio", grams: 10 }]],
  ["burro", "Burro", 740, 0.6, 0.8, 82, [{ label: "1 noce", grams: 10 }]],
  ["mandorle", "Mandorle", 579, 9.5, 21, 50, [{ label: "1 manciata", grams: 30 }]],
  ["noci", "Noci", 654, 7, 15, 65, [{ label: "1 manciata", grams: 30 }]],
  // Prodotti per lo sport
  ["gel", "Gel energetico (generico)", 250, 62, 0, 0, [{ label: "1 gel", grams: 40 }]],
  ["barretta", "Barretta energetica (generica)", 370, 65, 6, 8, [{ label: "1 barretta", grams: 40 }]],
  ["maltodestrine", "Maltodestrine (polvere)", 380, 95, 0, 0, [{ label: "1 misurino", grams: 30 }]],
  ["isotonica", "Bevanda isotonica (pronta)", 24, 6, 0, 0, [{ label: "1 borraccia", grams: 500 }]],
  ["whey", "Proteine whey (polvere)", 390, 6, 78, 6, [{ label: "1 misurino", grams: 30 }]],
];

export const GENERIC_FOODS: FoodItem[] = ROWS.map(
  ([id, name, kcal, carbs, protein, fat, portions]) => ({
    source: "generic",
    id,
    name,
    kcal,
    carbs,
    protein,
    fat,
    portions,
  }),
);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Generic foods whose name contains every word of the query. */
export function searchGenericFoods(query: string, limit = 8): FoodItem[] {
  const words = normalize(query).split(" ").filter(Boolean);
  if (words.length === 0) return [];
  return GENERIC_FOODS.filter((food) => {
    const name = normalize(food.name);
    return words.every((w) => name.includes(w));
  })
    .sort((a, b) => {
      const aStarts = normalize(a.name).startsWith(words[0]) ? 0 : 1;
      const bStarts = normalize(b.name).startsWith(words[0]) ? 0 : 1;
      return aStarts - bStarts;
    })
    .slice(0, limit);
}
