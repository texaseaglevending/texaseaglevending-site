// Public menu: clean display names and categories for haha product ids.
// haha's shared catalog names are often messy or the wrong flavor, so the menu lists brands/products, not flavors.
// A stocked product that isn't mapped here still shows, under "New arrivals", with a lightly cleaned haha name.

export const CATEGORIES = [
  ["energy", "Energy drinks"],
  ["shakes", "Protein shakes & coffee"],
  ["bars", "Protein & snack bars"],
  ["jerky", "Jerky & meat snacks"],
  ["salty", "Chips & salty snacks"],
  ["nuts", "Nuts & trail mix"],
  ["candy", "Candy"],
  ["sweets", "Cookies & sweet treats"],
  ["focus", "Energy shots, caffeine & hydration"],
  ["pain", "Pain relief"],
  ["cold", "Cold, flu & allergy"],
  ["stomach", "Stomach & digestion"],
  ["care", "Personal care"],
  ["gum", "Gum & mints"],
  ["more", "Everyday essentials"],
  ["new", "New arrivals"],
];

export const MENU_MAP = {
  // Energy drinks
  "A2024052500022": ["C4 Energy", "energy"],
  "A2025102900015": ["C4 Energy", "energy"],
  "A2025110600001": ["Ghost Energy", "energy"],
  "A2025042400045": ["Ghost Energy", "energy"],
  "A2025122300015": ["Ghost Energy", "energy"],
  "A2025072900062": ["NOS Energy", "energy"],
  "A2026062100017": ["Liquid Death Sparkling Energy", "energy"],
  // Protein shakes & coffee
  "A2025092700060": ["Fairlife Protein Shake", "shakes"],
  "A2026071800038": ["Fairlife Nutrition Plan", "shakes"],
  "A2025052200006": ["Huel Black Edition", "shakes"],
  "A2025021100003": ["Muscle Milk", "shakes"],
  "A2026032600098": ["Muscle Milk Pro Series", "shakes"],
  "A2025041600002": ["Nurri Protein Shake", "shakes"],
  "A2026031700137": ["Nurri Protein Shake", "shakes"],
  "A2025070200047": ["Oikos Pro Protein Shake", "shakes"],
  "A2026040600035": ["Starbucks Coffee & Protein", "shakes"],
  "A2026011300004": ["Genius Gourmet Sparkling Protein", "shakes"],
  "A2025101800098": ["Genius Gourmet Sparkling Protein", "shakes"],
  // Protein & snack bars
  "A2025022200004": ["Built Puff Protein Bar", "bars"],
  "A2026031600059": ["Built Puff Protein Bar", "bars"],
  "A2025091500017": ["Built Puff Protein Bar", "bars"],
  "A2024100800007": ["Clif Builders Protein Bar", "bars"],
  "A2026020300084": ["Clif Builders Protein Bar", "bars"],
  "A2026052100117": ["Clif Builders Protein Bar", "bars"],
  "A2025102400079": ["Quest Protein Bar", "bars"],
  "A2024111000001": ["Quest Protein Bar", "bars"],
  "A2026101300150": ["Quest Protein Bar", "bars"],
  "A2026032300082": ["ONE Protein Bar", "bars"],
  "A2026022100011": ["ONE Protein Bar", "bars"],
  "A2024052300032": ["FITCRUNCH Protein Bar", "bars"],
  "A2024092300018": ["RXBAR", "bars"],
  "A2026022700067": ["KIZE Bar", "bars"],
  "A2026022700068": ["KIZE Bar", "bars"],
  "A2025040100022": ["KIZE Bar", "bars"],
  "A2025071900004": ["KIZE Bar", "bars"],
  "A2025041100040": ["Special K Protein Bar", "bars"],
  "A2025100500026": ["Nature's Bakery Fig Bar", "bars"],
  "A2025100500025": ["Nature's Bakery Fig Bar", "bars"],
  // Jerky & meat snacks
  "A2025022800025": ["Jack Link's Beef & Cheese", "jerky"],
  "A2025110700051": ["Think Jerky Turkey Jerky", "jerky"],
  "A2026010400022": ["Jalapeño Beef Sticks", "jerky"],
  "A2025060700024": ["Oscar Mayer P3 Protein Pack", "jerky"],
  "A2025060700023": ["Oscar Mayer P3 Protein Pack", "jerky"],
  // Chips & salty snacks
  "A2025032400019": ["Zapp's Potato Chips", "salty"],
  "A2025013100027": ["Zapp's Potato Chips", "salty"],
  "A2024123100013": ["Takis Fuego", "salty"],
  "A2024011600007": ["Doritos", "salty"],
  "A2026010500038": ["Cheetos Flamin' Hot", "salty"],
  "A2025042400028": ["Cheez-It", "salty"],
  "A2026031200073": ["Ritz Bits Cheese", "salty"],
  "A2026072700033": ["Pringles Grab & Go", "salty"],
  "A2024101800022": ["Combos", "salty"],
  "A2025020400032": ["Parm Crisps Snack Mix", "salty"],
  "A2024092200005": ["Kar's Sweet 'N Salty Mix", "salty"],
  // Nuts & trail mix
  "A2024112500004": ["Planters Cashews", "nuts"],
  "A2025032200032": ["Blue Diamond Almonds", "nuts"],
  "A2025011600015": ["Wonderful Pistachios", "nuts"],
  "A2026030600061": ["Sahale Snacks Glazed Mix", "nuts"],
  "A2025100800045": ["Sahale Snacks Glazed Mix", "nuts"],
  "A2026082100052": ["Beer Nuts Habanero", "nuts"],
  "A2026011600094": ["Power Up Trail Mix", "nuts"],
  "A2026011900006": ["Wild Roots Trail Mix", "nuts"],
  // Candy
  "A2025102000081": ["M&M's", "candy"],
  "A2025092600078": ["Snickers King Size", "candy"],
  "A2025060200027": ["Twix Share Size", "candy"],
  "A2024101800028": ["Reese's Pieces", "candy"],
  "A2024121200001": ["Buncha Crunch", "candy"],
  "A2024101800025": ["Butterfinger Bites", "candy"],
  "A2025040100026": ["Whoppers", "candy"],
  "A2025032300005": ["Junior Mints", "candy"],
  "A2024120300004": ["Hot Tamales", "candy"],
  "A2025030200017": ["Mike and Ike", "candy"],
  "A2025013100023": ["Skittles", "candy"],
  "A2025052300036": ["SweeTARTS Mini Chewy", "candy"],
  "A2025010100002": ["Kinder Bueno", "candy"],
  // Cookies & sweet treats
  "A2024020300003": ["Nutter Butter", "sweets"],
  "A2025012000012": ["Keebler Chips Deluxe Minis", "sweets"],
  "A2024111400002": ["Rice Krispies Treats", "sweets"],
  "A2025042900028": ["The Original Cookie Dough Bites", "sweets"],
  "A2024100500019": ["Fruit Pie", "sweets"],
  "A2024091500002": ["Otis Spunkmeyer Muffin", "sweets"],
  // Energy shots, caffeine & hydration
  "A2025071100032": ["5-hour Energy", "focus"],
  "A2024092100014": ["5-hour Energy", "focus"],
  "A2025092600038": ["NoDoz Caffeine", "focus"],
  "A2025041500038": ["Liquid I.V. Hydration Multiplier", "focus"],
  "A2026051800009": ["Liquid I.V. Hydration Multiplier", "focus"],
  "A2025092600007": ["Jelly Belly Sport Beans", "focus"],
  "A2025092600006": ["Jelly Belly Sport Beans", "focus"],
  "A2025090600016": ["Emergen-C", "focus"],
  "A2025092600013": ["Cheers After-Alcohol Aid", "focus"],
  "A2025092600029": ["Cheers Next Morning Aid", "focus"],
  // Pain relief
  "A2025092600034": ["Advil Liqui-Gels", "pain"],
  "A2024110500004": ["Tylenol", "pain"],
  "A2025092600036": ["Aleve", "pain"],
  "A2025092600023": ["Motrin IB", "pain"],
  "A2025062800007": ["Excedrin Extra Strength", "pain"],
  "A2025092600019": ["Bayer Aspirin", "pain"],
  "A2025092600040": ["Midol Complete", "pain"],
  // Cold, flu & allergy
  "A2025101000100": ["DayQuil Cold & Flu", "cold"],
  "A2025092600026": ["NyQuil Severe", "cold"],
  "A2025092600016": ["Tylenol Cold + Flu Severe", "cold"],
  "A2025092600012": ["Alka-Seltzer Plus Severe Cold & Flu", "cold"],
  "A2025082600007": ["Mucinex DM", "cold"],
  "A2025092600039": ["Claritin", "cold"],
  "A2025092600017": ["Zyrtec", "cold"],
  "A2025092600035": ["Allegra", "cold"],
  "A2025092600042": ["Benadryl", "cold"],
  "A2026051900003": ["Nasal Decongestant", "cold"],
  "A2025092600010": ["Ricola Cough Drops", "cold"],
  "A2025092600011": ["Ricola Cough Drops", "cold"],
  // Stomach & digestion
  "A2025092600043": ["Tums Chewy Bites", "stomach"],
  "A2025082500057": ["Pepto-Bismol", "stomach"],
  "A2025092600015": ["Pepcid Complete", "stomach"],
  "A2025092600025": ["Alka-Seltzer Original", "stomach"],
  "A2025092600027": ["Zantac 360", "stomach"],
  "A2025092600018": ["Dramamine", "stomach"],
  // Personal care
  "A2025100700044": ["Carmex Lip Balm", "care"],
  "A2025090100033": ["Blistex Medicated Lip Balm", "care"],
  "A2025030700034": ["Listerine Cool Mint", "care"],
  "A2025092600032": ["Crest Scope Minibrush", "care"],
  "A2025041400051": ["Visine", "care"],
  "A2026032500049": ["Burt's Bees Facial Towelettes", "care"],
  "A2026032500054": ["Gold Bond Lotion", "care"],
  "A2025102500002": ["Opti-Free Contact Solution & Case", "care"],
  // Gum & mints
  "A2025072600006": ["Trident Gum", "gum"],
  "A2025090300002": ["Trident Gum", "gum"],
  "A2025020300034": ["Trident Gum", "gum"],
  "A2025092600009": ["Trident Gum", "gum"],
  "A2025052800025": ["Mentos", "gum"],
  "A2025060100029": ["Mentos", "gum"],
  "A2026081700092": ["Altoids", "gum"],
  // Everyday essentials
  "A2025081000011": ["BIC Lighter", "more"],
  "A2025092600014": ["Earbuds (USB-C)", "more"],
};

export const LOCATIONS = {
  rr: { name: "Round Rock", machines: ["B101219", "B111755"] },
  sa: { name: "San Antonio", machines: ["B101231", "B111750"] },
};

// Light cleanup for an unmapped haha name: drop sizes and counts, tidy spacing.
export function cleanName(n) {
  return String(n || "")
    .replace(/[‘’]/g, "'")
    .replace(/\b\d+(\.\d+)?\s*(fl\s*oz|oz|ml|g|ct|count|pack|mg)\b\.?/gi, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[,\-–]+\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 60);
}
