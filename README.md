# OnyxFit — AI-Powered Fitness & Nutrition Planner

**OnyxFit** is a cross-platform Progressive Web App (PWA) that generates personalised weekly workout and meal plans in which training and nutrition are coupled and adapt to the user. A plan engine computes each day's targets, a per-user adaptive model corrects them every week from the user's own check-ins, and a large language model (LLM) turns the targets into meals the user can realistically make.

**Web:** https://onyx-fit.app

---

## Overview

Many fitness applications either provide generic, one-size-fits-all plans or require expensive personal trainer subscriptions, and they treat diet and exercise as two separate plans. OnyxFit addresses this gap by delivering:

- **Coupled training and nutrition targets.** Training drives nutrition: days with a session get the energy that session costs, as carbohydrate, and protein rises with weekly training frequency. Nutrition drives training: in a calorie deficit volume is reduced because recovery is limited, in a surplus it is increased.
- **A plan that adapts to each user.** Users check in their body weight and completed workouts. Each week the weight trend corrects the estimate of that user's maintenance calories, and the share of sessions actually completed moves the training load up or down. Every change is explained in plain language.
- **Meal plans built to be followed.** An LLM generates a small rotation of meals to the day's targets, within the cooking effort the user chose, reusing dinners as the next day's lunch. Declared allergens and foods to avoid are excluded and every generated meal is checked against them.
- **Structured workout programmes** (Push/Pull/Legs, Upper/Lower, or Full Body) with exercises, sets, reps, warm-up, and cool-down routines.
- **Daily AI coaching insights** offering brief personalised tips referencing the user's mood, water intake, and training schedule.

The LLM is reached through an OpenAI-compatible API and is configured with the `LLM_BASE_URL`, `LLM_API_KEY` and `LLM_MODEL` environment variables of the meal service (default: Llama 3.1 on Groq, using `GROQ_API_KEY`).

An earlier version predicted the targets with a cascade neural network trained on synthetic data; its notebooks and model files are kept in `ml-service/` for reference and are no longer used at runtime.

OnyxFit provides general fitness and nutrition information and is not medical advice.