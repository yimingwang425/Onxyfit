import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';

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

  constructor() {}

  getTodaysPlan(): Observable<DailyPlan> {
    const today: DailyPlan = {
      breakfast: this.mockMeals.oats,
      lunch: this.mockMeals.chickenSalad,
      dinner: this.mockMeals.salmonRice,
      snack: this.mockMeals.proteinShake,
    };
    return of(today).pipe(delay(300));
  }

  // Obtain this week's schedule (mock)
  // Simulating a user who registered on Wednesday, it only returns data from today (Wednesday) through to Sunday
  getWeeklyPlan(): Observable<WeeklyPlan[]> {
    const week: WeeklyPlan[] = [
      // { day: 'Mon', dayShort: '1', plan: null },
      // { day: 'Tue', dayShort: '2', plan: null },
      {
        day: 'Wed',
        dayShort: '3',
        plan: {
          breakfast: this.mockMeals.oats,
          lunch: this.mockMeals.salmonRice,
          dinner: this.mockMeals.chickenSalad,
          snack: this.mockMeals.proteinShake,
        },
      },
      { day: 'Thu', dayShort: '4', plan: null },
      {
        day: 'Fri',
        dayShort: '5',
        plan: {
          breakfast: this.mockMeals.oats,
          lunch: this.mockMeals.chickenSalad,
          dinner: this.mockMeals.salmonRice,
          snack: this.mockMeals.proteinShake,
        },
      },
      { day: 'Sat', dayShort: '6', plan: null },
      { day: 'Sun', dayShort: '7', plan: null },
    ];

    return of(week).pipe(delay(500));
  }
}