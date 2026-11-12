// Texas sales tax type for each product, by name. Used to back tax out of tax-included vending prices.
//   exempt = OTC drugs (Drug Facts label) and dietary supplements (Supplement Facts label)
//   food   = food products: tax on 50% of vending receipts (34 TAC 3.293(d)(2)); includes candy that contains flour
//   full   = candy, soft drinks and everything else: tax on 100% of receipts
// "check" lists products whose label still needs to be confirmed; they use the type given here until then.
export const RATE = 0.0825;

const EXEMPT = /tylenol|advil|ibuprofen|aleve|motrin|bayer|aspirin|excedrin|midol|benadryl|claritin|allegra|zyrtec|zantac|pepcid|tums|pepto|pesto bismol|alka.?seltzer|dayquil|nyquil|mucinex|dramamine|nodoz|visine|nasal|ricola|blistex|carmex|listerine|emergen|5.?hour|cheers/i;
const FOOD = /chip|pringles|doritos|cheetos|takis|zapp|zap’s|ruffles|sun chips|cheez|chex|gardetto|combos|munchies|ritz|lance|cracker|pretzel|nut|cashew|almond|pistachio|peanut|pecan|sunflower|seed|trail ?mix|power up|wild ?roots|jerky|beef|stick|p3 |cookie|oreo|nutter|milano|crumbs|keebler|muffin|krispies|nutella|apple pie|protein bar|builders|clif|cliff|built|quest|one protein|fitcrunch|rx ?bar|rxbar|kize|fig bar|kind|nature valley|nv granola|special k|huel|fairlife|muscle milk|nurri|oikos|starbucks|super coffee|genius|twix|kinder|parm crisps|sahale|kar’s|kar's|beer nuts|jimmy|bigs|cracker jack|whoppers|buncha crunch|snack mix|otis/i;
const CHECK = /liquid ?i\.?v|opti-free|sport beans|celsius/i;

export function taxType(name) {
  const n = String(name || "");
  if (EXEMPT.test(n)) return "exempt";
  if (CHECK.test(n)) return "full";
  if (/candy|m&m|skittles|mike|tamales|sweetarts|nerds|junior mints|reese|butterfinger|snickers|milk duds|trident|tident|mentos|altoids|gum|tootsie|spree/i.test(n)) return "full";
  if (FOOD.test(n)) return "food";
  return "full";
}
export const needsCheck = (name) => CHECK.test(String(name || ""));
// Share of a tax-included price that is sales tax, by type.
export const taxShare = (type) => { const s = type === "exempt" ? 0 : type === "food" ? 0.5 : 1; return (RATE * s) / (1 + RATE * s); };
