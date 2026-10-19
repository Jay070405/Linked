// Choose Not to Lose (D4): the prototype's insurance arithmetic, copied from
// d4-choose-not-to-lose-prototype/src/model.ts (round 2, Oct 19 2026) with the types removed. USD in integer cents; no
// floats for money. The plans are fictional. cntl-model.test.mjs repeats the prototype's own tests against this copy.

export const plans = [
  {id: 'a', name: 'Plan A', monthlyPremium: 18000, deductible: 150000, coinsuranceBps: 2000, oopMax: 600000},
  {id: 'b', name: 'Plan B', monthlyPremium: 23000, deductible: 150000, coinsuranceBps: 2000, oopMax: 600000},
  {id: 'c', name: 'Plan C', monthlyPremium: 11000, deductible: 320000, coinsuranceBps: 3000, oopMax: 750000},
  {id: 'd', name: 'Plan D', monthlyPremium: 30000, deductible: 50000, coinsuranceBps: 1000, oopMax: 350000},
];
export const scenarios = [
  {id: 'low', label: '$300 in covered bills', short: '$300', charges: 30000},
  {id: 'typical', label: '$4,000 in covered bills', short: '$4,000', charges: 400000},
  {id: 'high', label: '$40,000 in covered bills', short: '$40,000', charges: 4000000},
];
export const money = cents => new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2}).format(cents / 100);
export const rate = basisPoints => `${basisPoints / 100}%`;
export const annualPremium = plan => plan.monthlyPremium * 12;
export const worstYear = plan => annualPremium(plan) + plan.oopMax;
export function cost(plan, allowedCharges) {
  if (!Number.isSafeInteger(allowedCharges) || allowedCharges < 0) throw new RangeError('Charges must be non-negative integer cents.');
  if (![plan.monthlyPremium, plan.deductible, plan.oopMax, plan.coinsuranceBps].every(Number.isSafeInteger) || plan.monthlyPremium < 0 || plan.deductible < 0 || plan.oopMax < plan.deductible || plan.coinsuranceBps < 0 || plan.coinsuranceBps > 10000) throw new RangeError('Invalid plan terms.');
  const premium = annualPremium(plan);
  const deductible = Math.min(allowedCharges, plan.deductible);
  const remainingCharges = Math.max(0, allowedCharges - deductible);
  const uncappedCoinsurance = Math.round(remainingCharges * plan.coinsuranceBps / 10000);
  const coinsurance = Math.min(uncappedCoinsurance, plan.oopMax - deductible);
  const outOfPocket = deductible + coinsurance;
  return {premium, deductible, coinsurance, outOfPocket, total: premium + outOfPocket, capped: uncappedCoinsurance > coinsurance, remainingCharges};
}
export const scenarioCost = (plan, scenario) => cost(plan, scenarios.find(s => s.id === scenario).charges);
export const premiumDifference = (more, less) => annualPremium(more) - annualPremium(less);
export const totalDifference = (more, less, scenario) => scenarioCost(more, scenario).total - scenarioCost(less, scenario).total;

/** Sufficient all-spend proof: every cost-sharing term is no worse, premium strictly less. Coverage and network must
    be identical; this dataset explicitly assumes that. */
export function dominates(less, more) {
  return annualPremium(less) < annualPremium(more) && less.deductible <= more.deductible && less.coinsuranceBps <= more.coinsuranceBps && less.oopMax <= more.oopMax;
}
export const dominator = plan => plans.find(other => dominates(other, plan));
export const rankedPlans = scenario => [...plans].sort((a, b) => scenarioCost(a, scenario).total - scenarioCost(b, scenario).total || a.id.localeCompare(b.id));
