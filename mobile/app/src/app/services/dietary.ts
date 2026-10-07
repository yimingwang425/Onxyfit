/** Allergen codes understood by the backend (see the Allergen enum). */
export const ALLERGEN_OPTIONS: { value: string; label: string }[] = [
  { value: 'PEANUT', label: 'Peanuts' },
  { value: 'TREE_NUT', label: 'Tree nuts' },
  { value: 'DAIRY', label: 'Dairy' },
  { value: 'EGG', label: 'Eggs' },
  { value: 'FISH', label: 'Fish' },
  { value: 'SHELLFISH', label: 'Shellfish' },
  { value: 'SOY', label: 'Soy' },
  { value: 'GLUTEN', label: 'Gluten' },
  { value: 'SESAME', label: 'Sesame' },
];

export const HEALTH_DISCLAIMER_SHORT =
  'OnyxFit provides general fitness and nutrition information, not medical advice.';

export const HEALTH_DISCLAIMER =
  'OnyxFit provides general fitness and nutrition information and is not a substitute for professional medical advice, diagnosis or treatment. ' +
  'Plans are generated automatically and may contain mistakes. ' +
  'Talk to a doctor before starting a new diet or exercise programme, especially if you are pregnant, under 18, or have a medical condition, an injury or a history of disordered eating. ' +
  'Stop exercising and seek medical help if you feel pain, dizziness or shortness of breath.';

export const ALLERGY_DISCLAIMER =
  'Meal plans are AI-generated. We filter out the allergens you list, but this is not guaranteed: always check every ingredient and product label yourself.';

/** 'PEANUT,DAIRY' -> ['PEANUT', 'DAIRY'] */
export function parseAllergies(value: string | null | undefined): string[] {
  if (!value) return [];
  const known = ALLERGEN_OPTIONS.map(o => o.value);
  return value.split(',').map(v => v.trim().toUpperCase()).filter(v => known.includes(v));
}

/** 'PEANUT,DAIRY' -> 'Peanuts, Dairy' */
export function allergyLabels(value: string | null | undefined): string {
  return parseAllergies(value)
    .map(code => ALLERGEN_OPTIONS.find(o => o.value === code)?.label ?? code)
    .join(', ');
}

/** How much cooking the user is up for; meal plans stay within it. */
export const COOKING_EFFORT_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: 'MINIMAL', label: 'Barely cook', hint: 'Assemble, boil or microwave' },
  { value: 'SIMPLE', label: 'Keep it simple', hint: 'Quick one-pan meals' },
  { value: 'ENTHUSIAST', label: 'Happy to cook', hint: 'Proper recipes are fine' },
];
