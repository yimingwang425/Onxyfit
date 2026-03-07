import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
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
      const aiPlan = this.planService.getCurrentPlan();
      const todayDow = new Date().getDay(); // 0=Sun ... 6=Sat
      if (aiPlan) {
        return of(this.buildPlanFromAI(aiPlan, todayDow)).pipe(delay(100));
      } else {
        return this.planService.generatePlan().pipe(
          map(aiPlan => this.buildPlanFromAI(aiPlan, todayDow))
        );
      }
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
      const aiPlan = this.planService.getCurrentPlan();
      if (aiPlan) {
        return of(this.buildWeeklyPlanFromAI(aiPlan)).pipe(delay(100));
      } else {
        return this.planService.generatePlan().pipe(
          map(aiPlan => this.buildWeeklyPlanFromAI(aiPlan))
        );
      }
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
          aiSuggestedCalories: aiPlan.caloriesKcal
        };
      }
    }

    console.log('No Llama meals found, using MOCK data');
    return {
      breakfast: this.mockMeals.oats,
      lunch: this.mockMeals.chickenSalad,
      dinner: this.mockMeals.salmonRice,
      snack: this.mockMeals.proteinShake,
      aiData: aiPlan,
      aiSuggestedCalories: aiPlan.caloriesKcal
    };
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

    for (let i = today; i <= 6; i++) {
      const dayName = days[i];
      const isRestDay = (i === 0 || i === 6);

      week.push({
        day: dayName,
        dayShort: dayName,
        plan: isRestDay ? null : this.buildPlanFromAI(aiPlan, i)
      });
    }

    return week;
  }

  private getDayName(dow: number): string {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow] || '?';
  }
}