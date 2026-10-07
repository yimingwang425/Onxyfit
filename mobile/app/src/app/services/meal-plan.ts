import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { PlanService, AIPlan } from './plan.service';

export interface Meal {
  name: string;
  calories: number;
  macros: { p: number; c: number; f: number };
  ingredients: string[];
  recipe: string[];
  amazonLink?: string;
}

export interface DailyPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snack: Meal;
  aiData?: AIPlan;
  aiSuggestedCalories?: number;
  /** True when no meals could be generated for this day; the meal slots are placeholders. */
  unavailable?: boolean;
  /** Why, when unavailable: the user's restrictions could not be met, or the service failed. */
  unavailableReason?: 'restrictions' | 'service';
}

export interface WeeklyPlan {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  dayShort: string;
  plan: DailyPlan | null;
}

@Injectable({
  providedIn: 'root',
})
export class MealPlanService {
  private useMock = false;

  private mockMeals = {
    oats: {
      name: 'High-Protein Oatmeal Bowl',
      calories: 450,
      macros: { p: 30, c: 55, f: 15 },
      ingredients: ['Oats 80g', 'Protein powder 1 scoop', 'Blueberries 50g', 'Almond milk 150ml'],
      recipe: [
        '1. Combine the oats, protein powder and almond milk.',
        '2. Microwave for 2 minutes.',
        '3. Stir until smooth, then add the blueberries.',
      ],
      amazonLink: 'https://www.amazon.com/fresh',
    },
    chickenSalad: {
      name: 'Chicken Breast and Avocado Salad',
      calories: 550,
      macros: { p: 45, c: 20, f: 30 },
      ingredients: ['Chicken breast 150g', 'Half an avocado', 'Mixed salad leaves', 'Cherry tomato', 'olive oil'],
      recipe: [
        '1. Pan-fry the chicken breast until cooked through, then cut into pieces.',
        '2. Slice the avocado.',
        '3. Combine all ingredients and drizzle with olive oil.',
      ],
      amazonLink: 'https://www.amazon.com/fresh',
    },
    salmonRice: {
      name: 'Salmon and Brown Rice',
      calories: 600,
      macros: { p: 40, c: 50, f: 25 },
      ingredients: ['Salmon 150g', 'Brown rice 100g', 'Broccoli 100g', 'Teriyaki sauce'],
      recipe: [
        '1. Preheat the oven to 200°C. Brush the salmon with the sauce and bake for 15 minutes.',
        '2. Brown rice cooked.',
        '3. Blanch the broccoli.',
      ],
      amazonLink: 'https://www.amazon.com/fresh',
    },
    proteinShake: {
      name: 'Nut Protein Shake',
      calories: 300,
      macros: { p: 25, c: 20, f: 15 },
      ingredients: ['Protein powder 1 scoop', 'Peanut butter 1 tablespoon', 'Banana Half a banana', 'Water 200ml'],
      recipe: ['1. Place all ingredients into a blender and blend until smooth.'],
      amazonLink: 'https://www.amazon.com/fresh',
    },
  };

  private unavailableMeal: Meal = {
    name: 'Not available',
    calories: 0,
    macros: { p: 0, c: 0, f: 0 },
    ingredients: [],
    recipe: ['We could not generate this meal. Please try generating your plan again.'],
  };

  constructor(private planService: PlanService) {}

  getTodaysPlan(): Observable<DailyPlan> {
    if (this.useMock) {
      const today: DailyPlan = {
        breakfast: this.mockMeals.oats,
        lunch: this.mockMeals.chickenSalad,
        dinner: this.mockMeals.salmonRice,
        snack: this.mockMeals.proteinShake,
      };
      return of(today).pipe(delay(300));
    } else {
      return this.planService.loadPlan().pipe(map(aiPlan => this.buildPlanFromAI(aiPlan, new Date().getDay())));
    }
  }

  getWeeklyPlan(): Observable<WeeklyPlan[]> {
    if (this.useMock) {
      const week: WeeklyPlan[] = [
        {
          day: 'Wed',
          dayShort: 'Wed',
          plan: {
            breakfast: this.mockMeals.oats,
            lunch: this.mockMeals.salmonRice,
            dinner: this.mockMeals.chickenSalad,
            snack: this.mockMeals.proteinShake,
          },
        },
        { day: 'Thu', dayShort: 'Thu', plan: null },
        {
          day: 'Fri',
          dayShort: 'Fri',
          plan: {
            breakfast: this.mockMeals.oats,
            lunch: this.mockMeals.chickenSalad,
            dinner: this.mockMeals.salmonRice,
            snack: this.mockMeals.proteinShake,
          },
        },
        { day: 'Sat', dayShort: 'Sat', plan: null },
        { day: 'Sun', dayShort: 'Sun', plan: null },
      ];
      return of(week).pipe(delay(500));
    } else {
      return this.planService.loadPlan().pipe(map(aiPlan => this.buildWeeklyPlanFromAI(aiPlan)));
    }
  }

  /**
   * Build a DailyPlan for a specific day of the week
   * Looks up that day's meals from the weekly meal plan
   */
  private buildPlanFromAI(aiPlan: AIPlan, dayOfWeek: number): DailyPlan {

    // get the weekly meal plan object
    let weeklyMealPlan: any = null;

    if (aiPlan.mealPlanJson) {
      try {
        weeklyMealPlan = JSON.parse(aiPlan.mealPlanJson);
      } catch (e) {
        console.error('Failed to parse mealPlanJson:', e);
      }
    }

    if (weeklyMealPlan) {
      const dayKey = String(dayOfWeek);
      const dayPlan = weeklyMealPlan[dayKey];

      if (dayPlan && dayPlan.breakfast) {
        console.log(`Found Llama meals for day ${dayOfWeek} (${this.getDayName(dayOfWeek)})`);
        return {
          breakfast: this.convertLlamaMeal(dayPlan.breakfast),
          lunch: this.convertLlamaMeal(dayPlan.lunch),
          dinner: this.convertLlamaMeal(dayPlan.dinner),
          snack: this.convertLlamaMeal(dayPlan.snack),
          aiData: aiPlan,
          aiSuggestedCalories: aiPlan.details?.days?.[dayOfWeek]?.calories ?? aiPlan.caloriesKcal
        };
      }
    }

    // No generated meals for this day. Sample meals must not stand in for them:
    // they ignore the user's allergies (peanut butter, dairy, fish...).
    console.warn('No generated meals found for day', dayOfWeek);
    return {
      breakfast: this.unavailableMeal,
      lunch: this.unavailableMeal,
      dinner: this.unavailableMeal,
      snack: this.unavailableMeal,
      aiData: aiPlan,
      aiSuggestedCalories: aiPlan.details?.days?.[dayOfWeek]?.calories ?? aiPlan.caloriesKcal,
      unavailable: true,
      unavailableReason: aiPlan.mealStatus === 'restrictions' ? 'restrictions' : 'service'
    };
  }

  /** Whether the plan on this device has been checked against the server today. */
  hasFreshPlan(): boolean {
    return this.planService.isSyncedToday();
  }

  /** Changes whenever the stored plan is replaced. */
  get planVersion(): number {
    return this.planService.version;
  }

  /** Try again to generate meals for the current plan. */
  retryMeals(): Observable<AIPlan> {
    return this.planService.regenerateMeals();
  }

  private convertLlamaMeal(llamaMeal: any): Meal {
    // Convert ingredient objects to strings if needed
    let ingredients = (llamaMeal.ingredients || []).map((ing: any) => {
      if (typeof ing === 'string') return ing;
      return `${ing.quantity || ''} ${ing.unit || ''} ${ing.name || ''}`.trim();
    });

    const dayNames = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+/i;
    const cleanName = (llamaMeal.name || 'Meal').replace(dayNames, '');

    return {
      name: cleanName,
      calories: llamaMeal.calories || 0,
      macros: llamaMeal.macros || { p: 0, c: 0, f: 0 },
      ingredients,
      recipe: Array.isArray(llamaMeal.recipe)
        ? llamaMeal.recipe.map((step: any) => typeof step === 'string' ? step : JSON.stringify(step))
        : [],
      amazonLink: 'https://www.amazon.com/fresh'
    };
  }

  private buildWeeklyPlanFromAI(aiPlan: AIPlan): WeeklyPlan[] {
    const today = new Date().getDay(); // 0=Sun, 1=Mon, ...
    const days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[] =
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const week: WeeklyPlan[] = [];

    const remaining = today === 0 ? 1 : 8 - today;
    for (let offset = 0; offset < remaining; offset++) {
      const i = (today + offset) % 7;
      const dayName = days[i];

      week.push({
        day: dayName,
        dayShort: dayName,
        plan: this.buildPlanFromAI(aiPlan, i)
      });
    }

    return week;
  }

  private getDayName(dow: number): string {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow] || '?';
  }
}