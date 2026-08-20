import { useState, useEffect, useRef, useMemo } from "react";

/* ============================================================
   LA PLANCHE — gestion des menus de la semaine
   Un seul fichier. Se déploie tel quel sur Vercel (src/App.jsx).

   ─── SYNCHRO ENTRE VOS DEUX IPHONES ───────────────────────
   Par défaut l'app marche en local (un appareil).
   Pour partager le planning entre vous deux, crée un projet
   Supabase gratuit et colle ci-dessous ton URL + ta clé "anon".
   (Instructions complètes fournies séparément.)
   ============================================================ */
const SUPABASE_URL = "";        // ← ex : "https://xxxx.supabase.co"
const SUPABASE_ANON_KEY = "";   // ← ta clé publique "anon"
const FOYER_ID = "foyer";       // identifiant du foyer partagé

/* ============================================================
   RAYONS (ordre dans la liste de courses)
   ============================================================ */
const RAYONS = {
  FL: "Fruits & légumes",
  BP: "Boucherie & poissonnerie",
  CO: "Crémerie & œufs",
  FE: "Pâtes, riz & féculents",
  ES: "Épicerie salée",
  SU: "Épicerie sucrée",
  SG: "Surgelés",
  PA: "Pain",
  AU: "Autres",
};
const RAYON_ORDER = ["FL", "BP", "CO", "FE", "ES", "SU", "SG", "PA", "AU"];

/* ============================================================
   FAMILLES (pour l'équilibre + le tirage auto)
   ============================================================ */
const FAMILLES = {
  viande:    { label: "Viande",     color: "#C4553B" },
  volaille:  { label: "Volaille",   color: "#D98E33" },
  poisson:   { label: "Poisson",    color: "#3E7CA8" },
  oeufs:     { label: "Œufs",       color: "#E0B23B" },
  vege:      { label: "Végé",       color: "#4E9A5A" },
  feculent:  { label: "Féculent",   color: "#9A7BC4" },
  soupe:     { label: "Soupe",      color: "#6BA292" },
  salade:    { label: "Salade",     color: "#7FB04E" },
};

/* Ingrédient compact : [nom, quantité, unité, rayon] pour ~5 personnes */
const M = (id, nom, famille, tags, ing) => ({ id, nom, famille, tags, ing, type: "plat" });

/* ============================================================
   BANQUE DE PLATS PRINCIPAUX (~50) — faciles, rapides, pas chers
   ============================================================ */
const PLATS_BASE = [
  M("lasagnes", "Lasagnes bolognaise", "viande", ["four"], [
    ["Plaques de lasagnes", 1, "paquet", "FE"], ["Bœuf haché", 500, "g", "BP"],
    ["Sauce tomate", 2, "boîtes", "ES"], ["Oignon", 1, "u", "FL"],
    ["Emmental râpé", 150, "g", "CO"], ["Béchamel", 1, "brique", "ES"]]),
  M("hachis", "Hachis parmentier", "viande", ["four"], [
    ["Bœuf haché", 500, "g", "BP"], ["Pommes de terre", 1, "kg", "FL"],
    ["Oignon", 1, "u", "FL"], ["Lait", 20, "cl", "CO"], ["Beurre", 30, "g", "CO"],
    ["Emmental râpé", 100, "g", "CO"]]),
  M("steak-puree", "Steak haché & purée", "viande", ["rapide"], [
    ["Steaks hachés", 5, "u", "BP"], ["Pommes de terre", 1, "kg", "FL"],
    ["Lait", 20, "cl", "CO"], ["Beurre", 30, "g", "CO"]]),
  M("chili", "Chili con carne & riz", "viande", ["mijoté"], [
    ["Bœuf haché", 400, "g", "BP"], ["Haricots rouges", 1, "boîte", "ES"],
    ["Tomates concassées", 1, "boîte", "ES"], ["Riz", 300, "g", "FE"],
    ["Oignon", 1, "u", "FL"], ["Poivron", 1, "u", "FL"]]),
  M("boeuf-carottes", "Bœuf carottes", "viande", ["mijoté"], [
    ["Bœuf à mijoter", 700, "g", "BP"], ["Carottes", 800, "g", "FL"],
    ["Oignon", 2, "u", "FL"], ["Bouillon", 1, "cube", "ES"]]),
  M("saute-porc", "Sauté de porc & riz", "viande", ["mijoté"], [
    ["Sauté de porc", 600, "g", "BP"], ["Riz", 300, "g", "FE"],
    ["Oignon", 1, "u", "FL"], ["Sauce tomate", 1, "boîte", "ES"]]),
  M("boulettes", "Boulettes sauce tomate", "viande", ["rapide"], [
    ["Boulettes de viande", 500, "g", "BP"], ["Sauce tomate", 2, "boîtes", "ES"],
    ["Pâtes", 400, "g", "FE"], ["Oignon", 1, "u", "FL"]]),
  M("saucisses-lentilles", "Saucisses & lentilles", "viande", ["mijoté"], [
    ["Saucisses", 5, "u", "BP"], ["Lentilles", 400, "g", "FE"],
    ["Carottes", 2, "u", "FL"], ["Oignon", 1, "u", "FL"]]),
  M("saucisses-puree", "Saucisses purée", "viande", ["rapide"], [
    ["Saucisses", 5, "u", "BP"], ["Pommes de terre", 1, "kg", "FL"],
    ["Lait", 20, "cl", "CO"], ["Beurre", 30, "g", "CO"]]),
  M("gratin-jambon", "Gratin de pâtes au jambon", "viande", ["four"], [
    ["Pâtes", 400, "g", "FE"], ["Jambon", 4, "tranches", "BP"],
    ["Crème fraîche", 20, "cl", "CO"], ["Emmental râpé", 150, "g", "CO"]]),
  M("croque", "Croque-monsieur & salade", "viande", ["rapide"], [
    ["Pain de mie", 1, "paquet", "PA"], ["Jambon", 6, "tranches", "BP"],
    ["Emmental râpé", 150, "g", "CO"], ["Salade verte", 1, "u", "FL"]]),
  M("quiche-lorraine", "Quiche lorraine & salade", "viande", ["four"], [
    ["Pâte brisée", 1, "u", "FE"], ["Lardons", 200, "g", "BP"],
    ["Œufs", 4, "u", "CO"], ["Crème fraîche", 20, "cl", "CO"],
    ["Salade verte", 1, "u", "FL"]]),
  M("tartiflette", "Tartiflette", "viande", ["four", "hiver"], [
    ["Pommes de terre", 1, "kg", "FL"], ["Reblochon", 1, "u", "CO"],
    ["Lardons", 200, "g", "BP"], ["Oignon", 1, "u", "FL"]]),
  M("carbonara", "Pâtes carbonara", "viande", ["rapide"], [
    ["Pâtes", 400, "g", "FE"], ["Lardons", 200, "g", "BP"],
    ["Œufs", 3, "u", "CO"], ["Crème fraîche", 20, "cl", "CO"]]),
  M("riz-cantonais", "Riz cantonais", "viande", ["rapide"], [
    ["Riz", 300, "g", "FE"], ["Jambon", 3, "tranches", "BP"],
    ["Petits pois", 200, "g", "SG"], ["Œufs", 3, "u", "CO"]]),
  M("poulet-roti", "Poulet rôti & pommes de terre", "volaille", ["four"], [
    ["Poulet", 1, "u", "BP"], ["Pommes de terre", 1, "kg", "FL"],
    ["Oignon", 1, "u", "FL"]]),
  M("escalope-hv", "Escalope de poulet & haricots verts", "volaille", ["rapide"], [
    ["Escalopes de poulet", 5, "u", "BP"], ["Haricots verts", 600, "g", "SG"],
    ["Beurre", 20, "g", "CO"]]),
  M("curry-poulet", "Curry de poulet & riz", "volaille", ["mijoté"], [
    ["Blancs de poulet", 500, "g", "BP"], ["Lait de coco", 1, "boîte", "ES"],
    ["Riz", 300, "g", "FE"], ["Oignon", 1, "u", "FL"], ["Curry", 1, "sachet", "ES"]]),
  M("nuggets", "Nuggets maison & frites", "volaille", ["four"], [
    ["Blancs de poulet", 500, "g", "BP"], ["Chapelure", 150, "g", "ES"],
    ["Œufs", 2, "u", "CO"], ["Frites surgelées", 1, "sachet", "SG"]]),
  M("basquaise", "Poulet basquaise & riz", "volaille", ["mijoté"], [
    ["Cuisses de poulet", 5, "u", "BP"], ["Poivron", 2, "u", "FL"],
    ["Tomates concassées", 1, "boîte", "ES"], ["Riz", 300, "g", "FE"],
    ["Oignon", 1, "u", "FL"]]),
  M("dinde-legumes", "Émincé de dinde & poêlée de légumes", "volaille", ["rapide"], [
    ["Émincé de dinde", 500, "g", "BP"], ["Poêlée de légumes", 1, "sachet", "SG"],
    ["Riz", 250, "g", "FE"]]),
  M("cordon-bleu", "Cordon bleu & purée", "volaille", ["rapide"], [
    ["Cordons bleus", 5, "u", "BP"], ["Pommes de terre", 1, "kg", "FL"],
    ["Lait", 20, "cl", "CO"], ["Beurre", 30, "g", "CO"]]),
  M("wok-poulet", "Wok de poulet & nouilles", "volaille", ["rapide"], [
    ["Blancs de poulet", 400, "g", "BP"], ["Nouilles chinoises", 400, "g", "FE"],
    ["Poêlée de légumes", 1, "sachet", "SG"], ["Sauce soja", 1, "u", "ES"]]),
  M("poulet-coco", "Poulet coco & riz", "volaille", ["mijoté"], [
    ["Blancs de poulet", 500, "g", "BP"], ["Lait de coco", 1, "boîte", "ES"],
    ["Riz", 300, "g", "FE"], ["Oignon", 1, "u", "FL"]]),
  M("poisson-pane", "Poisson pané & riz", "poisson", ["rapide"], [
    ["Poisson pané", 1, "boîte", "SG"], ["Riz", 300, "g", "FE"],
    ["Citron", 1, "u", "FL"]]),
  M("saumon-brocolis", "Pavé de saumon & brocolis", "poisson", ["rapide"], [
    ["Pavés de saumon", 5, "u", "BP"], ["Brocolis", 700, "g", "SG"],
    ["Citron", 1, "u", "FL"]]),
  M("cabillaud-riz", "Cabillaud & riz basmati", "poisson", ["rapide"], [
    ["Dos de cabillaud", 5, "u", "BP"], ["Riz basmati", 300, "g", "FE"],
    ["Citron", 1, "u", "FL"], ["Crème fraîche", 20, "cl", "CO"]]),
  M("gratin-poisson", "Gratin de poisson", "poisson", ["four"], [
    ["Filets de poisson blanc", 600, "g", "BP"], ["Pommes de terre", 800, "g", "FL"],
    ["Crème fraîche", 20, "cl", "CO"], ["Emmental râpé", 100, "g", "CO"]]),
  M("thon-pates", "Thon à la tomate & pâtes", "poisson", ["rapide"], [
    ["Thon en boîte", 2, "boîtes", "ES"], ["Sauce tomate", 1, "boîte", "ES"],
    ["Pâtes", 400, "g", "FE"], ["Oignon", 1, "u", "FL"]]),
  M("colin-epinards", "Filet de colin & épinards", "poisson", ["rapide"], [
    ["Filets de colin", 5, "u", "BP"], ["Épinards", 600, "g", "SG"],
    ["Riz", 250, "g", "FE"], ["Crème fraîche", 20, "cl", "CO"]]),
  M("brandade", "Brandade de morue", "poisson", ["four"], [
    ["Morue", 500, "g", "BP"], ["Pommes de terre", 800, "g", "FL"],
    ["Lait", 20, "cl", "CO"], ["Ail", 2, "gousses", "FL"]]),
  M("omelette", "Omelette & salade", "oeufs", ["rapide"], [
    ["Œufs", 8, "u", "CO"], ["Salade verte", 1, "u", "FL"],
    ["Pommes de terre", 500, "g", "FL"]]),
  M("oeufs-cocotte", "Œufs cocotte & pain", "oeufs", ["rapide"], [
    ["Œufs", 6, "u", "CO"], ["Crème fraîche", 20, "cl", "CO"],
    ["Emmental râpé", 80, "g", "CO"], ["Baguette", 1, "u", "PA"]]),
  M("quiche-legumes", "Quiche aux légumes", "oeufs", ["four"], [
    ["Pâte brisée", 1, "u", "FE"], ["Œufs", 4, "u", "CO"],
    ["Crème fraîche", 20, "cl", "CO"], ["Courgette", 1, "u", "FL"],
    ["Emmental râpé", 100, "g", "CO"]]),
  M("frittata", "Frittata pommes de terre", "oeufs", ["rapide"], [
    ["Œufs", 8, "u", "CO"], ["Pommes de terre", 600, "g", "FL"],
    ["Oignon", 1, "u", "FL"], ["Lardons", 100, "g", "BP"]]),
  M("coquillettes", "Coquillettes gratinées jambon", "feculent", ["rapide"], [
    ["Coquillettes", 400, "g", "FE"], ["Jambon", 3, "tranches", "BP"],
    ["Beurre", 40, "g", "CO"], ["Emmental râpé", 120, "g", "CO"]]),
  M("pates-tomate", "Pâtes à la tomate & basilic", "vege", ["rapide"], [
    ["Pâtes", 400, "g", "FE"], ["Sauce tomate", 2, "boîtes", "ES"],
    ["Basilic", 1, "u", "FL"], ["Parmesan", 80, "g", "CO"]]),
  M("pates-pesto", "Pâtes au pesto", "vege", ["rapide"], [
    ["Pâtes", 400, "g", "FE"], ["Pesto", 1, "pot", "ES"],
    ["Parmesan", 80, "g", "CO"]]),
  M("risotto", "Risotto aux champignons", "vege", ["mijoté"], [
    ["Riz risotto", 350, "g", "FE"], ["Champignons", 400, "g", "FL"],
    ["Bouillon", 1, "cube", "ES"], ["Parmesan", 80, "g", "CO"],
    ["Oignon", 1, "u", "FL"]]),
  M("dauphinois", "Gratin dauphinois & salade", "vege", ["four"], [
    ["Pommes de terre", 1, "kg", "FL"], ["Crème fraîche", 40, "cl", "CO"],
    ["Lait", 20, "cl", "CO"], ["Salade verte", 1, "u", "FL"],
    ["Ail", 2, "gousses", "FL"]]),
  M("gratin-courgettes", "Gratin de courgettes", "vege", ["four"], [
    ["Courgettes", 4, "u", "FL"], ["Crème fraîche", 20, "cl", "CO"],
    ["Œufs", 2, "u", "CO"], ["Emmental râpé", 120, "g", "CO"],
    ["Riz", 200, "g", "FE"]]),
  M("ratatouille", "Ratatouille & riz", "vege", ["mijoté"], [
    ["Courgette", 2, "u", "FL"], ["Aubergine", 1, "u", "FL"],
    ["Poivron", 1, "u", "FL"], ["Tomates concassées", 1, "boîte", "ES"],
    ["Riz", 300, "g", "FE"], ["Oignon", 1, "u", "FL"]]),
  M("soupe-legumes", "Soupe de légumes & croûtons", "soupe", ["rapide"], [
    ["Poireaux", 2, "u", "FL"], ["Carottes", 3, "u", "FL"],
    ["Pommes de terre", 500, "g", "FL"], ["Baguette", 1, "u", "PA"]]),
  M("potiron", "Velouté de potiron & pain", "soupe", ["rapide", "hiver"], [
    ["Potiron", 1, "u", "FL"], ["Pommes de terre", 300, "g", "FL"],
    ["Crème fraîche", 20, "cl", "CO"], ["Baguette", 1, "u", "PA"]]),
  M("galettes-pdt", "Galettes de pommes de terre", "vege", ["rapide"], [
    ["Pommes de terre", 1, "kg", "FL"], ["Œufs", 2, "u", "CO"],
    ["Oignon", 1, "u", "FL"], ["Salade verte", 1, "u", "FL"]]),
  M("pizza", "Pizza maison", "vege", ["four"], [
    ["Pâte à pizza", 2, "u", "FE"], ["Sauce tomate", 1, "boîte", "ES"],
    ["Mozzarella", 2, "u", "CO"], ["Jambon", 3, "tranches", "BP"],
    ["Champignons", 200, "g", "FL"]]),
  M("tarte-poireaux", "Tarte aux poireaux", "vege", ["four"], [
    ["Pâte brisée", 1, "u", "FE"], ["Poireaux", 3, "u", "FL"],
    ["Œufs", 3, "u", "CO"], ["Crème fraîche", 20, "cl", "CO"]]),
  M("dahl", "Dahl de lentilles corail & riz", "vege", ["mijoté"], [
    ["Lentilles corail", 350, "g", "FE"], ["Lait de coco", 1, "boîte", "ES"],
    ["Tomates concassées", 1, "boîte", "ES"], ["Riz", 300, "g", "FE"],
    ["Oignon", 1, "u", "FL"]]),
  M("couscous-vege", "Semoule & légumes", "vege", ["rapide"], [
    ["Semoule", 350, "g", "FE"], ["Courgette", 1, "u", "FL"],
    ["Carottes", 2, "u", "FL"], ["Pois chiches", 1, "boîte", "ES"],
    ["Oignon", 1, "u", "FL"]]),
  M("salade-composee", "Salade composée complète", "salade", ["rapide", "été"], [
    ["Salade verte", 1, "u", "FL"], ["Tomates", 4, "u", "FL"],
    ["Maïs", 1, "boîte", "ES"], ["Thon en boîte", 1, "boîte", "ES"],
    ["Œufs", 4, "u", "CO"], ["Emmental", 150, "g", "CO"]]),
  M("buddha-bowl", "Buddha bowl boulgour", "salade", ["rapide", "été"], [
    ["Boulgour", 300, "g", "FE"], ["Pois chiches", 1, "boîte", "ES"],
    ["Carottes", 2, "u", "FL"], ["Concombre", 1, "u", "FL"],
    ["Feta", 150, "g", "CO"]]),
];

/* ============================================================
   BANQUE DE DESSERTS (optionnels)
   ============================================================ */
const D = (id, nom, ing) => ({ id, nom, ing, type: "dessert" });
const DESSERTS_BASE = [
  D("mousse-choco", "Mousse au chocolat", [
    ["Chocolat noir", 200, "g", "SU"], ["Œufs", 6, "u", "CO"]]),
  D("gateau-yaourt", "Gâteau au yaourt", [
    ["Yaourt nature", 1, "pot", "CO"], ["Farine", 250, "g", "SU"],
    ["Sucre", 150, "g", "SU"], ["Œufs", 3, "u", "CO"], ["Huile", 10, "cl", "ES"]]),
  D("crumble", "Crumble aux pommes", [
    ["Pommes", 6, "u", "FL"], ["Farine", 150, "g", "SU"],
    ["Beurre", 100, "g", "CO"], ["Sucre", 80, "g", "SU"]]),
  D("salade-fruits", "Salade de fruits", [
    ["Pommes", 2, "u", "FL"], ["Bananes", 3, "u", "FL"],
    ["Oranges", 2, "u", "FL"], ["Raisin", 250, "g", "FL"]]),
  D("riz-au-lait", "Riz au lait", [
    ["Riz rond", 150, "g", "FE"], ["Lait", 1, "l", "CO"], ["Sucre", 80, "g", "SU"]]),
  D("compote", "Compote maison", [
    ["Pommes", 8, "u", "FL"], ["Sucre", 50, "g", "SU"]]),
  D("clafoutis", "Clafoutis", [
    ["Cerises", 500, "g", "FL"], ["Farine", 100, "g", "SU"],
    ["Œufs", 3, "u", "CO"], ["Lait", 25, "cl", "CO"], ["Sucre", 100, "g", "SU"]]),
  D("tarte-pommes", "Tarte aux pommes", [
    ["Pâte feuilletée", 1, "u", "FE"], ["Pommes", 5, "u", "FL"],
    ["Sucre", 60, "g", "SU"]]),
  D("cookies", "Cookies", [
    ["Farine", 250, "g", "SU"], ["Beurre", 125, "g", "CO"],
    ["Sucre", 120, "g", "SU"], ["Pépites de chocolat", 150, "g", "SU"],
    ["Œufs", 1, "u", "CO"]]),
  D("crepes", "Crêpes", [
    ["Farine", 300, "g", "SU"], ["Œufs", 4, "u", "CO"],
    ["Lait", 60, "cl", "CO"], ["Beurre", 50, "g", "CO"]]),
  D("gaufres", "Gaufres", [
    ["Farine", 300, "g", "SU"], ["Œufs", 3, "u", "CO"],
    ["Lait", 50, "cl", "CO"], ["Beurre", 100, "g", "CO"], ["Sucre", 60, "g", "SU"]]),
  D("fromage-blanc", "Fromage blanc & coulis", [
    ["Fromage blanc", 1, "u", "CO"], ["Coulis de fruits", 1, "u", "SU"]]),
  D("tiramisu", "Tiramisu", [
    ["Mascarpone", 250, "g", "CO"], ["Œufs", 3, "u", "CO"],
    ["Biscuits cuillère", 1, "paquet", "SU"], ["Café", 1, "u", "AU"],
    ["Cacao", 1, "u", "SU"], ["Sucre", 80, "g", "SU"]]),
  D("banana-bread", "Banana bread", [
    ["Bananes", 3, "u", "FL"], ["Farine", 250, "g", "SU"],
    ["Sucre", 120, "g", "SU"], ["Œufs", 2, "u", "CO"], ["Beurre", 80, "g", "CO"]]),
];

/* ============================================================
   CRÉNEAUX DE LA SEMAINE
   Dîner tous les soirs. Déjeuner : mercredi + week-end.
   ============================================================ */
const SLOTS = [
  { day: "Lundi", meal: "Dîner" },
  { day: "Mardi", meal: "Dîner" },
  { day: "Mercredi", meal: "Déjeuner" },
  { day: "Mercredi", meal: "Dîner" },
  { day: "Jeudi", meal: "Dîner" },
  { day: "Vendredi", meal: "Dîner" },
  { day: "Samedi", meal: "Déjeuner" },
  { day: "Samedi", meal: "Dîner" },
  { day: "Dimanche", meal: "Déjeuner" },
  { day: "Dimanche", meal: "Dîner" },
];

/* ============================================================
   PERSISTANCE : window.storage (aperçu) → localStorage (Vercel)
   ============================================================ */
const KEY = "planche-foyer-v1";
const hasClaudeStore = typeof window !== "undefined" && window.storage;

async function localLoad() {
  if (hasClaudeStore) {
    try { const r = await window.storage.get(KEY, true); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  }
  try { const v = window.localStorage.getItem(KEY); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
async function localSave(data) {
  if (hasClaudeStore) {
    try { await window.storage.set(KEY, JSON.stringify(data), true); } catch {}
    return;
  }
  try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

/* --- Synchro Supabase (activée seulement si URL + clé renseignées) --- */
const cloudOn = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
const sbHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: "Bearer " + SUPABASE_ANON_KEY,
  "Content-Type": "application/json",
};
async function cloudLoad() {
  if (!cloudOn) return null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/menus?id=eq.${FOYER_ID}&select=data`,
      { headers: sbHeaders });
    const rows = await r.json();
    const d = rows && rows[0] ? rows[0].data : null;
    return d && Object.keys(d).length ? d : null;
  } catch { return null; }
}
async function cloudSave(data) {
  if (!cloudOn) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/menus?id=eq.${FOYER_ID}`, {
      method: "PATCH",
      headers: { ...sbHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ data, updated_at: new Date().toISOString() }),
    });
  } catch {}
}

/* ============================================================
   ÉTAT INITIAL
   ============================================================ */
function initialState() {
  return {
    updatedAt: 0,
    pool: PLATS_BASE,
    desserts: DESSERTS_BASE,
    plan: {},          // index créneau -> { platId, dessertId }
    locked: {},        // index créneau -> true (verrouillé)
    checked: {},       // nom d'ingrédient coché dans les courses
    extras: [],        // articles ajoutés à la main : { nom, done }
  };
}

/* ============================================================
   AGRÉGATION LISTE DE COURSES
   ============================================================ */
function buildShoppingList(state) {
  const byId = {};
  state.pool.forEach((p) => (byId[p.id] = p));
  state.desserts.forEach((d) => (byId[d.id] = d));
  const acc = {}; // clé nom|unité -> { nom, qty, unite, rayon }
  Object.values(state.plan).forEach((slot) => {
    if (!slot) return;
    [slot.platId, slot.dessertId].forEach((id) => {
      const item = id && byId[id];
      if (!item) return;
      item.ing.forEach(([nom, qty, unite, rayon]) => {
        const k = nom + "|" + unite;
        if (!acc[k]) acc[k] = { nom, qty: 0, unite, rayon };
        acc[k].qty += typeof qty === "number" ? qty : 0;
        if (typeof qty !== "number") acc[k].free = true;
      });
    });
  });
  const groups = {};
  Object.values(acc).forEach((it) => {
    (groups[it.rayon] = groups[it.rayon] || []).push(it);
  });
  return RAYON_ORDER.filter((r) => groups[r]).map((r) => ({
    rayon: r,
    label: RAYONS[r],
    items: groups[r].sort((a, b) => a.nom.localeCompare(b.nom)),
  }));
}

/* ============================================================
   TIRAGE AUTOMATIQUE DE LA SEMAINE
   Variété : pas de doublon, pas 2× la même famille d'affilée.
   Respecte les créneaux verrouillés.
   ============================================================ */
function autoPlan(state) {
  const plan = { ...state.plan };
  const used = new Set();
  SLOTS.forEach((_, i) => {
    if (state.locked[i] && plan[i] && plan[i].platId) used.add(plan[i].platId);
  });
  const pool = [...state.pool];
  for (let i = 0; i < SLOTS.length; i++) {
    if (state.locked[i]) continue;
    const prevFam = i > 0 && plan[i - 1] && plan[i - 1].platId
      ? (pool.find((p) => p.id === plan[i - 1].platId) || {}).famille : null;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    let pick = shuffled.find((p) => !used.has(p.id) && p.famille !== prevFam);
    if (!pick) pick = shuffled.find((p) => !used.has(p.id));
    if (!pick) pick = shuffled[0];
    used.add(pick.id);
    plan[i] = { platId: pick.id, dessertId: plan[i] ? plan[i].dessertId : null };
  }
  return plan;
}

/* ============================================================
   COMPOSANT PRINCIPAL
   ============================================================ */
export default function App() {
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("semaine");
  const [picker, setPicker] = useState(null); // { slot, kind }
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState("");
  const skipSave = useRef(true);

  // Chargement initial (cloud prioritaire, sinon local)
  useEffect(() => {
    (async () => {
      const cloud = await cloudLoad();
      const local = await localLoad();
      const base = initialState();
      const loaded = cloud || local || {};
      setState({ ...base, ...loaded,
        pool: (loaded.pool && loaded.pool.length) ? loaded.pool : base.pool,
        desserts: (loaded.desserts && loaded.desserts.length) ? loaded.desserts : base.desserts });
      skipSave.current = false;
    })();
  }, []);

  // Sauvegarde à chaque changement
  useEffect(() => {
    if (!state || skipSave.current) return;
    const stamped = { ...state, updatedAt: Date.now() };
    localSave(stamped);
    cloudSave(stamped);
  }, [state]);

  // Synchro : relit le cloud toutes les 5 s et au retour sur l'app
  useEffect(() => {
    if (!cloudOn) return;
    const pull = async () => {
      const cloud = await cloudLoad();
      if (cloud && cloud.updatedAt > (stateRef.current?.updatedAt || 0)) {
        skipSave.current = true;
        setState((s) => ({ ...s, ...cloud }));
        setTimeout(() => (skipSave.current = false), 300);
      }
    };
    const id = setInterval(pull, 5000);
    window.addEventListener("focus", pull);
    return () => { clearInterval(id); window.removeEventListener("focus", pull); };
  }, []);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 1800); };

  if (!state) return <div style={{ padding: 40, fontFamily: "Inter, sans-serif" }}>Chargement…</div>;

  const byId = {};
  state.pool.forEach((p) => (byId[p.id] = p));
  state.desserts.forEach((d) => (byId[d.id] = d));

  const setSlot = (i, patch) =>
    setState((s) => ({ ...s, plan: { ...s.plan, [i]: { ...s.plan[i], ...patch } } }));
  const toggleLock = (i) =>
    setState((s) => ({ ...s, locked: { ...s.locked, [i]: !s.locked[i] } }));

  const doAuto = () => { setState((s) => ({ ...s, plan: autoPlan(s) })); flash("Semaine complétée"); };
  const clearWeek = () => setState((s) => ({ ...s, plan: {}, locked: {} }));

  const list = buildShoppingList(state);
  const filledCount = SLOTS.filter((_, i) => state.plan[i] && state.plan[i].platId).length;

  const familleTally = {};
  SLOTS.forEach((_, i) => {
    const p = state.plan[i] && byId[state.plan[i].platId];
    if (p) familleTally[p.famille] = (familleTally[p.famille] || 0) + 1;
  });

  return (
    <div className="app">
      <Style />

      <header className="topbar">
        <div className="brand">
          <span className="mark">▤</span>
          <span>La Planche</span>
        </div>
        {cloudOn
          ? <span className="sync on">Partagé</span>
          : <span className="sync off">Cet appareil</span>}
      </header>

      <main className="content">
        {tab === "semaine" && (
          <section>
            <div className="week-head">
              <div>
                <h1>Cette semaine</h1>
                <p className="sub">{filledCount}/{SLOTS.length} repas prévus</p>
              </div>
              <button className="wand" onClick={doAuto}>✦ Compléter</button>
            </div>

            {filledCount > 0 && (
              <div className="tally">
                {Object.entries(familleTally).map(([f, n]) => (
                  <span key={f} className="tally-chip"
                        style={{ borderColor: FAMILLES[f].color, color: FAMILLES[f].color }}>
                    <i style={{ background: FAMILLES[f].color }} />{FAMILLES[f].label} ×{n}
                  </span>
                ))}
              </div>
            )}

            <div className="board">
              {SLOTS.map((slot, i) => {
                const plat = state.plan[i] && byId[state.plan[i].platId];
                const dessert = state.plan[i] && byId[state.plan[i].dessertId];
                const locked = state.locked[i];
                return (
                  <div key={i} className={"card" + (locked ? " locked" : "")}>
                    <div className="card-day">
                      <span>{slot.day}</span>
                      <span className="meal">{slot.meal}</span>
                      <button className="lock" onClick={() => toggleLock(i)}
                              title={locked ? "Déverrouiller" : "Verrouiller"}>
                        {locked ? "🔒" : "🔓"}
                      </button>
                    </div>

                    <button className="pick main" onClick={() => setPicker({ slot: i, kind: "plat" })}>
                      {plat ? (
                        <span className="pick-filled">
                          <i className="dot" style={{ background: FAMILLES[plat.famille].color }} />
                          {plat.nom}
                        </span>
                      ) : <span className="pick-empty">＋ Choisir un plat</span>}
                    </button>

                    <button className="pick dessert" onClick={() => setPicker({ slot: i, kind: "dessert" })}>
                      {dessert
                        ? <span className="pick-filled small">🍰 {dessert.nom}</span>
                        : <span className="pick-empty small">＋ Dessert (option)</span>}
                    </button>
                  </div>
                );
              })}
            </div>

            {filledCount > 0 && (
              <button className="ghost wide" onClick={clearWeek}>Vider la semaine</button>
            )}
          </section>
        )}

        {tab === "plats" && (
          <section>
            <div className="week-head">
              <div><h1>Les plats</h1><p className="sub">{state.pool.length} plats · {state.desserts.length} desserts</p></div>
              <button className="wand" onClick={() => setAddOpen(true)}>＋ Ajouter</button>
            </div>
            <PoolList
              pool={state.pool} desserts={state.desserts}
              onRemove={(id, kind) => setState((s) => ({
                ...s,
                pool: kind === "plat" ? s.pool.filter((p) => p.id !== id) : s.pool,
                desserts: kind === "dessert" ? s.desserts.filter((d) => d.id !== id) : s.desserts,
              }))}
            />
          </section>
        )}

        {tab === "courses" && (
          <section>
            <div className="week-head">
              <div><h1>Liste de courses</h1><p className="sub">D'après les repas prévus</p></div>
            </div>
            {list.length === 0 && state.extras.length === 0 && (
              <div className="empty">Choisis des repas dans « Cette semaine » et la liste se remplit toute seule.</div>
            )}
            {list.map((g) => (
              <div key={g.rayon} className="rayon">
                <h3>{g.label}</h3>
                {g.items.map((it) => {
                  const on = state.checked[it.nom];
                  return (
                    <label key={it.nom} className={"line" + (on ? " done" : "")}>
                      <input type="checkbox" checked={!!on}
                             onChange={() => setState((s) => ({ ...s, checked: { ...s.checked, [it.nom]: !s.checked[it.nom] } }))} />
                      <span className="qty">{it.free ? "" : it.qty} {it.unite}</span>
                      <span className="nom">{it.nom}</span>
                    </label>
                  );
                })}
              </div>
            ))}

            <div className="rayon">
              <h3>À rajouter</h3>
              {state.extras.map((e, idx) => (
                <label key={idx} className={"line" + (e.done ? " done" : "")}>
                  <input type="checkbox" checked={e.done}
                         onChange={() => setState((s) => {
                           const ex = [...s.extras]; ex[idx] = { ...ex[idx], done: !ex[idx].done }; return { ...s, extras: ex };
                         })} />
                  <span className="nom">{e.nom}</span>
                  <button className="x" onClick={(ev) => { ev.preventDefault();
                    setState((s) => ({ ...s, extras: s.extras.filter((_, k) => k !== idx) })); }}>×</button>
                </label>
              ))}
              <ExtraAdd onAdd={(nom) => setState((s) => ({ ...s, extras: [...s.extras, { nom, done: false }] }))} />
            </div>
          </section>
        )}
      </main>

      <nav className="tabbar">
        {[["semaine", "Semaine", "▤"], ["plats", "Plats", "🍽"], ["courses", "Courses", "🛒"]].map(([k, l, ic]) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
            <span className="ic">{ic}</span><span>{l}</span>
          </button>
        ))}
      </nav>

      {picker && (
        <Picker
          kind={picker.kind}
          items={picker.kind === "plat" ? state.pool : state.desserts}
          current={state.plan[picker.slot] && (picker.kind === "plat" ? state.plan[picker.slot].platId : state.plan[picker.slot].dessertId)}
          onClose={() => setPicker(null)}
          onPick={(id) => { setSlot(picker.slot, picker.kind === "plat" ? { platId: id } : { dessertId: id }); setPicker(null); }}
          onClear={() => { setSlot(picker.slot, picker.kind === "plat" ? { platId: null } : { dessertId: null }); setPicker(null); }}
        />
      )}

      {addOpen && (
        <AddDish
          onClose={() => setAddOpen(false)}
          onAdd={(dish) => {
            setState((s) => dish.type === "plat"
              ? { ...s, pool: [dish, ...s.pool] }
              : { ...s, desserts: [dish, ...s.desserts] });
            setAddOpen(false); flash("Ajouté");
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ============================================================
   SOUS-COMPOSANTS
   ============================================================ */
function Picker({ kind, items, current, onPick, onClear, onClose }) {
  const [q, setQ] = useState("");
  const [fam, setFam] = useState("tous");
  const filtered = items.filter((it) => {
    if (q && !it.nom.toLowerCase().includes(q.toLowerCase())) return false;
    if (kind === "plat" && fam !== "tous" && it.famille !== fam) return false;
    return true;
  });
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{kind === "plat" ? "Choisir un plat" : "Choisir un dessert"}</h2>
          <button className="x big" onClick={onClose}>×</button>
        </div>
        <input className="search" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        {kind === "plat" && (
          <div className="fam-filter">
            <button className={fam === "tous" ? "on" : ""} onClick={() => setFam("tous")}>Tous</button>
            {Object.entries(FAMILLES).map(([f, v]) => (
              <button key={f} className={fam === f ? "on" : ""} style={fam === f ? { background: v.color, borderColor: v.color, color: "#fff" } : {}}
                      onClick={() => setFam(f)}>{v.label}</button>
            ))}
          </div>
        )}
        <div className="sheet-list">
          {current && <button className="opt clear" onClick={onClear}>Retirer le choix actuel</button>}
          {filtered.map((it) => (
            <button key={it.id} className={"opt" + (it.id === current ? " sel" : "")} onClick={() => onPick(it.id)}>
              {kind === "plat"
                ? <i className="dot" style={{ background: FAMILLES[it.famille].color }} />
                : <span className="emoji">🍰</span>}
              <span>{it.nom}</span>
            </button>
          ))}
          {filtered.length === 0 && <div className="empty">Aucun résultat.</div>}
        </div>
      </div>
    </div>
  );
}

function PoolList({ pool, desserts, onRemove }) {
  const [view, setView] = useState("plats");
  const items = view === "plats" ? pool : desserts;
  return (
    <>
      <div className="fam-filter">
        <button className={view === "plats" ? "on" : ""} onClick={() => setView("plats")}>Plats</button>
        <button className={view === "desserts" ? "on" : ""} onClick={() => setView("desserts")}>Desserts</button>
      </div>
      <div className="pool">
        {items.map((it) => (
          <div key={it.id} className="pool-row">
            {view === "plats"
              ? <i className="dot" style={{ background: FAMILLES[it.famille].color }} />
              : <span className="emoji">🍰</span>}
            <span className="pool-name">{it.nom}</span>
            <button className="x" onClick={() => onRemove(it.id, view === "plats" ? "plat" : "dessert")}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}

function ExtraAdd({ onAdd }) {
  const [v, setV] = useState("");
  return (
    <div className="extra-add">
      <input placeholder="Ajouter un article…" value={v}
             onChange={(e) => setV(e.target.value)}
             onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onAdd(v.trim()); setV(""); } }} />
      <button onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(""); } }}>＋</button>
    </div>
  );
}

function AddDish({ onAdd, onClose }) {
  const [type, setType] = useState("plat");
  const [nom, setNom] = useState("");
  const [fam, setFam] = useState("vege");
  const [rows, setRows] = useState([{ nom: "", qty: "", unite: "", rayon: "FL" }]);
  const setRow = (i, k, val) => setRows((r) => r.map((row, idx) => idx === i ? { ...row, [k]: val } : row));
  const addRow = () => setRows((r) => [...r, { nom: "", qty: "", unite: "", rayon: "FL" }]);
  const save = () => {
    if (!nom.trim()) return;
    const ing = rows.filter((r) => r.nom.trim()).map((r) => [
      r.nom.trim(), r.qty ? Number(r.qty) || r.qty : "", r.unite, r.rayon]);
    const id = nom.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);
    onAdd(type === "plat"
      ? { id, nom: nom.trim(), famille: fam, tags: [], ing, type: "plat" }
      : { id, nom: nom.trim(), ing, type: "dessert" });
  };
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head"><h2>Nouveau plat</h2><button className="x big" onClick={onClose}>×</button></div>
        <div className="sheet-list form">
          <div className="fam-filter">
            <button className={type === "plat" ? "on" : ""} onClick={() => setType("plat")}>Plat</button>
            <button className={type === "dessert" ? "on" : ""} onClick={() => setType("dessert")}>Dessert</button>
          </div>
          <input className="search" placeholder="Nom du plat" value={nom} onChange={(e) => setNom(e.target.value)} />
          {type === "plat" && (
            <div className="fam-filter wrap">
              {Object.entries(FAMILLES).map(([f, v]) => (
                <button key={f} className={fam === f ? "on" : ""}
                        style={fam === f ? { background: v.color, borderColor: v.color, color: "#fff" } : {}}
                        onClick={() => setFam(f)}>{v.label}</button>
              ))}
            </div>
          )}
          <p className="form-label">Ingrédients (pour la liste de courses)</p>
          {rows.map((r, i) => (
            <div key={i} className="ing-row">
              <input placeholder="Ingrédient" value={r.nom} onChange={(e) => setRow(i, "nom", e.target.value)} />
              <input placeholder="Qté" className="q" value={r.qty} onChange={(e) => setRow(i, "qty", e.target.value)} />
              <input placeholder="unité" className="u" value={r.unite} onChange={(e) => setRow(i, "unite", e.target.value)} />
              <select value={r.rayon} onChange={(e) => setRow(i, "rayon", e.target.value)}>
                {RAYON_ORDER.map((rc) => <option key={rc} value={rc}>{RAYONS[rc]}</option>)}
              </select>
            </div>
          ))}
          <button className="ghost" onClick={addRow}>＋ Ingrédient</button>
          <button className="wand wide" onClick={save}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */
function Style() {
  return (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Inter:wght@400;500;600&display=swap');
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    :root {
      --bg: #F4F1E9; --ink: #23281F; --muted: #6E7566;
      --primary: #3C6E47; --accent: #E8873B; --card: #FFFFFF;
      --line: #E4DFD2; --shadow: 0 1px 2px rgba(35,40,31,.06), 0 4px 14px rgba(35,40,31,.05);
    }
    .app { min-height: 100vh; background: var(--bg); color: var(--ink);
      font-family: Inter, system-ui, sans-serif; padding-bottom: 78px; }
    h1 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 26px; font-weight: 800;
      letter-spacing: -.02em; margin: 0; }
    h2 { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 20px; margin: 0; }
    h3 { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 13px;
      text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin: 22px 0 8px; }
    .sub { color: var(--muted); font-size: 13px; margin: 3px 0 0; }

    .topbar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center;
      justify-content: space-between; padding: 14px 18px; background: var(--bg);
      border-bottom: 1px solid var(--line); }
    .brand { display: flex; align-items: center; gap: 8px; font-family: 'Bricolage Grotesque', sans-serif;
      font-weight: 800; font-size: 18px; letter-spacing: -.02em; }
    .brand .mark { color: var(--primary); font-size: 20px; }
    .sync { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; }
    .sync.on { background: #E3F0E6; color: var(--primary); }
    .sync.off { background: #F0ECE0; color: var(--muted); }

    .content { padding: 18px 16px 8px; max-width: 640px; margin: 0 auto; }
    .week-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 14px; }

    .wand { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 14px;
      background: var(--primary); color: #fff; border: none; border-radius: 12px;
      padding: 11px 15px; cursor: pointer; box-shadow: var(--shadow); white-space: nowrap; }
    .wand:active { transform: scale(.97); }
    .wand.wide { width: 100%; margin-top: 14px; padding: 14px; }

    .tally { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
    .tally-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600;
      border: 1.5px solid; border-radius: 999px; padding: 3px 10px; background: #fff; }
    .tally-chip i { width: 7px; height: 7px; border-radius: 50%; }

    .board { display: flex; flex-direction: column; gap: 10px; }
    .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px;
      padding: 12px 14px; box-shadow: var(--shadow); }
    .card.locked { border-color: var(--primary); }
    .card-day { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
    .card-day > span:first-child { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 15px; }
    .card-day .meal { font-size: 11px; font-weight: 600; color: var(--muted);
      background: #F0ECE0; padding: 2px 8px; border-radius: 999px; }
    .lock { margin-left: auto; background: none; border: none; font-size: 15px; cursor: pointer; opacity: .8; }

    .pick { display: block; width: 100%; text-align: left; border: 1px dashed var(--line);
      background: #FAF8F2; border-radius: 11px; padding: 11px 12px; cursor: pointer;
      font-family: Inter, sans-serif; font-size: 15px; color: var(--ink); margin-top: 6px; }
    .pick.main { font-weight: 600; }
    .pick:active { background: #F2EEE3; }
    .pick-empty { color: var(--muted); }
    .pick-empty.small, .pick-filled.small { font-size: 13px; }
    .pick-filled { display: inline-flex; align-items: center; gap: 8px; }
    .dot { width: 9px; height: 9px; border-radius: 50%; flex: none; display: inline-block; }

    .ghost { background: none; border: 1px solid var(--line); color: var(--muted);
      border-radius: 11px; padding: 10px 14px; font-family: Inter; font-size: 14px; cursor: pointer; }
    .ghost.wide { width: 100%; margin-top: 12px; }

    .tabbar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 10; display: flex;
      background: #fff; border-top: 1px solid var(--line); padding: 6px 6px calc(6px + env(safe-area-inset-bottom)); }
    .tabbar button { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
      background: none; border: none; padding: 8px 0; font-family: Inter; font-size: 11px;
      color: var(--muted); cursor: pointer; font-weight: 600; }
    .tabbar button.active { color: var(--primary); }
    .tabbar .ic { font-size: 20px; }

    .rayon h3 { margin-top: 20px; }
    .line { display: flex; align-items: center; gap: 11px; padding: 11px 4px; border-bottom: 1px solid var(--line);
      cursor: pointer; }
    .line input[type=checkbox] { width: 20px; height: 20px; accent-color: var(--primary); flex: none; }
    .line .qty { font-variant-numeric: tabular-nums; font-weight: 600; font-size: 13px; color: var(--muted);
      min-width: 62px; }
    .line .nom { font-size: 15px; flex: 1; }
    .line.done .nom, .line.done .qty { text-decoration: line-through; opacity: .45; }
    .line .x { margin-left: auto; }
    .x { background: none; border: none; color: var(--muted); font-size: 22px; line-height: 1; cursor: pointer; padding: 0 4px; }
    .x.big { font-size: 30px; }

    .extra-add { display: flex; gap: 8px; margin-top: 10px; }
    .extra-add input { flex: 1; border: 1px solid var(--line); border-radius: 10px; padding: 11px 12px;
      font-family: Inter; font-size: 15px; }
    .extra-add button { background: var(--primary); color: #fff; border: none; border-radius: 10px;
      width: 46px; font-size: 20px; cursor: pointer; }

    .pool { display: flex; flex-direction: column; }
    .pool-row { display: flex; align-items: center; gap: 11px; padding: 12px 4px; border-bottom: 1px solid var(--line); }
    .pool-name { flex: 1; font-size: 15px; }
    .emoji { font-size: 15px; }

    .empty { color: var(--muted); font-size: 14px; text-align: center; padding: 32px 16px; line-height: 1.5; }

    .sheet-bg { position: fixed; inset: 0; z-index: 20; background: rgba(35,40,31,.4);
      display: flex; align-items: flex-end; justify-content: center; }
    .sheet { background: var(--bg); width: 100%; max-width: 640px; max-height: 88vh; border-radius: 22px 22px 0 0;
      padding: 16px 16px calc(16px + env(safe-area-inset-bottom)); display: flex; flex-direction: column;
      animation: up .22s ease; }
    @keyframes up { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .sheet-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .search { width: 100%; border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px;
      font-family: Inter; font-size: 16px; background: #fff; }
    .fam-filter { display: flex; gap: 7px; overflow-x: auto; padding: 12px 0 4px; }
    .fam-filter.wrap { flex-wrap: wrap; overflow: visible; }
    .fam-filter button { white-space: nowrap; border: 1px solid var(--line); background: #fff; color: var(--muted);
      border-radius: 999px; padding: 7px 13px; font-family: Inter; font-size: 13px; font-weight: 600; cursor: pointer; }
    .fam-filter button.on { background: var(--primary); border-color: var(--primary); color: #fff; }

    .sheet-list { overflow-y: auto; margin-top: 6px; }
    .opt { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: #fff;
      border: 1px solid var(--line); border-radius: 12px; padding: 14px; margin-bottom: 8px;
      font-family: Inter; font-size: 15px; color: var(--ink); cursor: pointer; }
    .opt.sel { border-color: var(--primary); background: #E3F0E6; }
    .opt.clear { color: var(--accent); justify-content: center; font-weight: 600; }
    .opt:active { transform: scale(.99); }

    .form .form-label { font-size: 13px; font-weight: 600; color: var(--muted); margin: 16px 0 8px; }
    .ing-row { display: flex; gap: 6px; margin-bottom: 7px; }
    .ing-row input, .ing-row select { border: 1px solid var(--line); border-radius: 9px; padding: 9px;
      font-family: Inter; font-size: 14px; background: #fff; min-width: 0; }
    .ing-row input:first-child { flex: 1; }
    .ing-row .q { width: 52px; } .ing-row .u { width: 64px; } .ing-row select { width: 96px; }

    .toast { position: fixed; bottom: 92px; left: 50%; transform: translateX(-50%); z-index: 30;
      background: var(--ink); color: #fff; padding: 10px 18px; border-radius: 999px; font-size: 14px;
      font-weight: 600; box-shadow: var(--shadow); }
    @media (prefers-reduced-motion: reduce) { .sheet { animation: none; } }
    `}</style>
  );
}
