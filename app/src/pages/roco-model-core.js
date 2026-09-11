import data from './roco-data.json';

export const BALL_KEYS = ['fairy', 'advanced', 'net'];
export const calibration = data.calibration;
export const presets = data.presets;
export const observed = data.records.filter(row => row.kind === 'observed');
export const simulations = data.records.filter(row => row.kind === 'simulated');
export const ballNames = {fairy:{zh:'童话球',en:'Fairy Tale Ball'},advanced:{zh:'高级咕噜球',en:'Advanced Gulu Ball'},net:{zh:'网兜球',en:'Net Ball'}};

/** Port of the audited V6 calculate(): full precision ratios, display rounding only. */
export function calculate(counts, multiplier) {
  if (!counts || Object.keys(counts).length !== 3 || !BALL_KEYS.every(key => Number.isSafeInteger(counts[key]) && counts[key] >= 0) || typeof multiplier !== 'number' || !Number.isFinite(multiplier) || multiplier <= 0) return {status:'invalid',outputs:null};
  const sum = fn => BALL_KEYS.reduce((total,key) => total + fn(key),0);
  const total = sum(key => counts[key]);
  const cost = sum(key => counts[key] * calibration[key].unit_price);
  if (!Number.isSafeInteger(total) || !Number.isSafeInteger(cost)) return {status:'invalid',outputs:null};
  const shiny = sum(key => counts[key] * calibration[key].shiny_records / calibration[key].balls);
  const material = sum(key => counts[key] * calibration[key].material / calibration[key].balls);
  const income = sum(key => counts[key] * calibration[key].raw_income / calibration[key].balls);
  const conditional = income * multiplier;
  if (!Number.isFinite(conditional)) return {status:'invalid',outputs:null};
  const probability = total ? -Math.expm1(sum(key => counts[key] * Math.log1p(-calibration[key].shiny_records / calibration[key].balls))) : 0;
  return {status:total?'ready':'empty',outputs:{total_balls:total,personal_ball_cost:cost,expected_shiny_records:shiny,probability_at_least_one_under_assumptions:probability,expected_material:material,expected_raw_income:income,income_multiplier_scenario:multiplier,expected_conditional_income:conditional,expected_conditional_net:conditional-cost,expected_income_cost_ratio:cost?conditional/cost:null,expected_material_at_least_30:material>=30,picture_book_income_model:null}};
}

export function parseCounts(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const counts = {};
  for (const key of BALL_KEYS) {
    const value = raw[key];
    if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return null;
    counts[key] = Number(value);
    if (!Number.isSafeInteger(counts[key])) return null;
  }
  return counts;
}

export const text = (value,lang) => value?.[lang === 'en'?'en':'zh'] ?? value;
export const number = (value,digits=0) => value == null ? '—' : new Intl.NumberFormat('en-US',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value);
export const money = (value,lang) => value == null ? '—' : lang === 'en' ? `${number(value / 1e6,2)}m` : `${number(value / 1e4,1)}万`;

export const recordImage = id => ['01','02','03','04','05','06','07','10'].includes(id.slice(-2)) ? `/assets/roco/test-${id.slice(-2)}.png` : null;
export default data;
