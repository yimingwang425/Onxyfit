from flask import Flask, request, jsonify
import hmac
import json
import os
import re

import requests

app = Flask(__name__)

# Only the backend may call this service: it must send the shared secret in X-Internal-Token.
# No CORS headers are set, so browsers can't call it directly either.
ML_SERVICE_TOKEN = os.environ.get('ML_SERVICE_TOKEN', '')


@app.before_request
def require_internal_token():
    if request.path == '/health':
        return None
    if not ML_SERVICE_TOKEN:
        print("ML_SERVICE_TOKEN is not set; rejecting request")
        return jsonify({"error": "service not configured"}), 503
    supplied = request.headers.get('X-Internal-Token', '')
    if not hmac.compare_digest(supplied.encode('utf-8'), ML_SERVICE_TOKEN.encode('utf-8')):
        return jsonify({"error": "unauthorized"}), 401
    return None


# Any OpenAI-compatible chat completions API works (Groq, Qwen via DashScope, OpenAI, ...):
# switching provider is a matter of setting these three variables.
LLM_BASE_URL = os.environ.get('LLM_BASE_URL', 'https://api.groq.com/openai/v1').rstrip('/')
LLM_API_KEY = os.environ.get('LLM_API_KEY') or os.environ.get('GROQ_API_KEY', '')
LLM_MODEL = os.environ.get('LLM_MODEL', 'llama-3.1-8b-instant')
# Set to 0 for providers or models that reject response_format={"type": "json_object"}.
LLM_JSON_MODE = os.environ.get('LLM_JSON_MODE', '1') != '0'


def chat_completion(messages, max_tokens, temperature, timeout, json_mode=False):
    """Call the configured LLM and return the reply text, or None if the call failed."""
    payload = {
        'model': LLM_MODEL,
        'messages': messages,
        'temperature': temperature,
        'max_tokens': max_tokens,
    }
    if json_mode and LLM_JSON_MODE:
        payload['response_format'] = {'type': 'json_object'}

    try:
        response = requests.post(
            f'{LLM_BASE_URL}/chat/completions',
            headers={'Authorization': f'Bearer {LLM_API_KEY}', 'Content-Type': 'application/json'},
            json=payload,
            timeout=timeout
        )
    except requests.exceptions.Timeout:
        print(f"LLM call timed out ({timeout}s)")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Cannot reach LLM API: {e}")
        return None

    if response.status_code != 200:
        print(f"LLM API error: {response.status_code} {response.text[:500]}")
        return None
    try:
        return response.json()['choices'][0]['message']['content']
    except (ValueError, KeyError, IndexError, TypeError) as e:
        print(f"Unexpected LLM response shape: {e}")
        return None


# Ingredient words that reveal each allergen. A plan mentioning any of them for a declared
# allergen is rejected, so the lists lean towards false alarms rather than misses.
ALLERGEN_KEYWORDS = {
    'PEANUT': ['peanut', 'groundnut', 'satay'],
    'TREE_NUT': ['almond', 'walnut', 'cashew', 'pecan', 'pistachio', 'hazelnut', 'macadamia',
                 'brazil nut', 'pine nut', 'chestnut', 'praline', 'marzipan', 'nutella', 'mixed nuts', 'nuts'],
    'DAIRY': ['milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'whey', 'casein', 'ghee',
              'parmesan', 'mozzarella', 'feta', 'cheddar', 'ricotta', 'paneer', 'kefir', 'custard',
              'halloumi', 'mascarpone', 'gouda', 'brie', 'skyr', 'quark', 'latte'],
    'EGG': ['egg', 'mayonnaise', 'mayo', 'omelet', 'omelette', 'frittata', 'meringue', 'aioli', 'quiche'],
    'FISH': ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'trout', 'sardine', 'anchovy', 'anchovies',
             'mackerel', 'halibut', 'haddock', 'sea bass', 'snapper', 'herring', 'worcestershire'],
    'SHELLFISH': ['shellfish', 'shrimp', 'prawn', 'crab', 'lobster', 'clam', 'mussel', 'oyster',
                  'scallop', 'squid', 'calamari', 'octopus', 'crayfish', 'langoustine'],
    'SOY': ['soy', 'soya', 'tofu', 'tempeh', 'edamame', 'miso', 'tamari'],
    'GLUTEN': ['wheat', 'flour', 'bread', 'toast', 'pasta', 'spaghetti', 'noodle', 'couscous', 'barley',
               'rye', 'tortilla', 'wrap', 'cracker', 'soy sauce', 'seitan', 'bulgur', 'farro', 'semolina',
               'bagel', 'pita', 'croissant', 'pancake', 'waffle', 'granola', 'oat', 'cereal', 'breadcrumb',
               'bun', 'pizza', 'muffin', 'biscuit'],
    'SESAME': ['sesame', 'tahini', 'hummus'],
}

# Phrases that contain an allergen keyword but aren't that allergen.
ALLERGEN_SAFE_PHRASES = {
    'TREE_NUT': ['nutmeg', 'butternut', 'coconut', 'doughnut', 'donut', 'water chestnut'],
    'DAIRY': ['coconut milk', 'almond milk', 'oat milk', 'soy milk', 'rice milk', 'cashew milk',
              'peanut butter', 'almond butter', 'cashew butter', 'nut butter', 'seed butter', 'cocoa butter',
              'butternut', 'butter bean', 'butter lettuce', 'coconut cream', 'cream of tartar',
              'coconut yogurt', 'soy yogurt'],
    'EGG': ['eggplant'],
    'GLUTEN': ['buckwheat', 'rice noodle', 'rice flour', 'almond flour', 'coconut flour', 'chickpea flour',
               'corn tortilla', 'lettuce wrap', 'rice cracker'],
    'SOY': [],
}

# "dairy-free cheese", "gluten-free bread", "vegan mayo" and the like are fine for that allergen.
ALLERGEN_FREE_MARKERS = {
    'DAIRY': ['dairy-free', 'dairy free', 'vegan', 'plant-based', 'non-dairy'],
    'EGG': ['egg-free', 'egg free', 'vegan'],
    'GLUTEN': ['gluten-free', 'gluten free'],
    'TREE_NUT': ['nut-free', 'nut free'],
    'PEANUT': ['nut-free', 'nut free', 'peanut-free'],
    'SOY': ['soy-free', 'soy free'],
}

ALLERGEN_LABELS = {
    'PEANUT': 'peanuts', 'TREE_NUT': 'tree nuts', 'DAIRY': 'dairy (milk, cheese, yogurt, butter, cream, whey)',
    'EGG': 'eggs', 'FISH': 'fish', 'SHELLFISH': 'shellfish', 'SOY': 'soy',
    'GLUTEN': 'gluten (wheat, barley, rye, regular oats, bread, pasta)', 'SESAME': 'sesame',
}

MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack']


def clean_allergies(values):
    if not isinstance(values, list):
        return []
    return [a for a in ALLERGEN_KEYWORDS if a in values]


def clean_dislikes(values):
    """Foods to avoid end up in the prompt: keep at most 10 short, letters-only entries."""
    if not isinstance(values, list):
        return []
    cleaned = []
    for value in values:
        if not isinstance(value, str):
            continue
        text = re.sub(r'[^a-zA-Z\u00C0-\u024F -]', ' ', value)
        text = re.sub(r'\s+', ' ', text).strip().lower()[:30].strip()
        if text and text not in cleaned:
            cleaned.append(text)
    return cleaned[:10]


def _contains_term(text, term):
    """Whole-word match that treats singular and plural alike ("mushrooms" finds "mushroom")."""
    if term.endswith('ies') and len(term) > 4:
        pattern = re.escape(term[:-3]) + r'(?:y|ies)'
    else:
        if term.endswith('oes') and len(term) > 4:
            term = term[:-2]
        elif term.endswith('s') and not term.endswith('ss') and len(term) > 3:
            term = term[:-1]
        pattern = re.escape(term) + r'(?:e?s)?'
    return re.search(r'\b' + pattern + r'\b', text) is not None


def _meal_texts(meal):
    """Every piece of text in a meal that names food: the dish name and each ingredient."""
    texts = [str(meal.get('name', ''))]
    ingredients = meal.get('ingredients', [])
    if isinstance(ingredients, list):
        for ingredient in ingredients:
            if isinstance(ingredient, dict):
                texts.append(' '.join(str(v) for v in ingredient.values()))
            else:
                texts.append(str(ingredient))
    return [t.lower() for t in texts if t]


def find_restriction_violations(weekly_plan, allergies, dislikes):
    """List the meals that mention a declared allergen or a food the user asked to avoid."""
    violations = []
    if not isinstance(weekly_plan, dict):
        return violations

    for day, meals in weekly_plan.items():
        if not isinstance(meals, dict):
            continue
        for slot in MEAL_SLOTS:
            meal = meals.get(slot)
            if not isinstance(meal, dict):
                continue
            for text in _meal_texts(meal):
                for allergen in allergies:
                    if any(marker in text for marker in ALLERGEN_FREE_MARKERS.get(allergen, [])):
                        continue
                    checked = text
                    for phrase in ALLERGEN_SAFE_PHRASES.get(allergen, []):
                        checked = checked.replace(phrase, ' ')
                    hit = next((k for k in ALLERGEN_KEYWORDS[allergen] if _contains_term(checked, k)), None)
                    if hit:
                        violations.append(f'Day {day} {slot} "{meal.get("name", "?")}" contains {hit} ({allergen})')
                for dislike in dislikes:
                    if _contains_term(text, dislike):
                        violations.append(f'Day {day} {slot} "{meal.get("name", "?")}" contains {dislike} (avoid)')
    return list(dict.fromkeys(violations))


def restrictions_prompt(allergies, dislikes):
    lines = []
    if allergies:
        names = '; '.join(ALLERGEN_LABELS[a] for a in allergies)
        lines.append(
            f"FOOD ALLERGIES (medical, absolute): the user is allergic to: {names}. "
            "No meal may contain these or anything made from them, in any amount, including sauces, "
            "toppings and garnishes. Do not suggest them as optional. Choose naturally safe dishes."
        )
    if dislikes:
        lines.append(f"FOODS TO AVOID: do not use any of these: {', '.join(dislikes)}.")
    return '\n'.join(lines)


# How much cooking the user is willing to do. The plan has to be something they will really make.
COOKING_EFFORTS = {
    'MINIMAL': {
        'mains': 3,
        'breakfasts': 2,
        'rules': (
            "The user barely cooks. Every item must need no real cooking: assemble, boil, toast or microwave only. "
            "At most 5 ingredients and 10 minutes per item, at most 2 steps. "
            "Think 'microwave rice with canned beans and frozen vegetables' or 'a banana and a handful of raisins', "
            "never 'vegetables sauteed in olive oil with fresh herbs'."
        ),
    },
    'SIMPLE': {
        'mains': 4,
        'breakfasts': 2,
        'rules': (
            "The user wants quick, simple food. At most 7 ingredients and 20 minutes per item, one pan or one pot, "
            "at most 4 short steps. Breakfasts and snacks should need little or no cooking."
        ),
    },
    'ENTHUSIAST': {
        'mains': 5,
        'breakfasts': 3,
        'rules': "The user enjoys cooking. At most 10 ingredients and 40 minutes per item, at most 6 steps.",
    },
}

# Share of a rest day's calories and protein given to each meal.
MEAL_SHARES = {'breakfast': 0.25, 'lunch': 0.30, 'dinner': 0.30, 'snack': 0.15}

DIET_RULES = {
    'VEGETARIAN': "The user is vegetarian: no meat, poultry, fish or seafood in anything.",
    'HIGH_PROTEIN': "The user prefers high-protein food: build every item around a clear protein source.",
}


def build_meal_library_prompt(rest_day, fuel_kcal, has_training, diet_pref, effort, allergies, dislikes, feedback=''):
    """
    Ask for a small library of meals instead of 28 separate dishes. Real people rotate a few
    breakfasts and eat last night's dinner for lunch; a short list is also far more likely to
    come back complete and valid.
    """
    cfg = COOKING_EFFORTS.get(effort, COOKING_EFFORTS['SIMPLE'])
    calories = rest_day['calories']
    protein = rest_day['proteinG']

    def target(slot):
        return f"about {round(calories * MEAL_SHARES[slot] / 10) * 10} kcal and {round(protein * MEAL_SHARES[slot])}g protein"

    groups = [
        f'"breakfasts": exactly {cfg["breakfasts"]} items, each {target("breakfast")}',
        f'"mains": exactly {cfg["mains"]} items, each {target("dinner")}. Each main is cooked for dinner and its '
        'leftovers are eaten for lunch the next day, so it must keep and reheat well (or be good cold)',
        f'"snacks": exactly 2 items, each {target("snack")}',
    ]
    if has_training and fuel_kcal >= 50:
        groups.append(
            f'"training_fuel": exactly 2 items, each about {round(fuel_kcal / 10) * 10} kcal, mostly carbohydrate, '
            'no cooking, easy to eat around a workout (for example a banana and rice cakes)'
        )

    rules = [
        cfg['rules'],
        "Use only common, inexpensive supermarket ingredients. No specialty or hard-to-find products.",
        "Give every ingredient with a quantity, in grams, millilitres or pieces.",
        'Every "name" is a plain description of the food, like "Rice and Bean Bowl" or "Baked Potato with Beans".',
        '"calories" and "macros" must be realistic for the listed ingredients and quantities.',
    ]
    if diet_pref in DIET_RULES:
        rules.append(DIET_RULES[diet_pref])
    restrictions = restrictions_prompt(allergies, dislikes)
    if restrictions:
        rules.append(restrictions)

    # The examples avoid every allergen in ALLERGEN_KEYWORDS, so they never pull the model towards one.
    example = (
        '{"name": "Rice and Bean Bowl", "calories": 480, "macros": {"p": 18, "c": 88, "f": 5}, '
        '"ingredients": ["250g microwave rice", "120g canned black beans", "80g canned corn"], '
        '"recipe": ["Microwave the rice for 2 minutes", "Stir in the drained beans and corn"]}'
    )

    prompt = (
        "Create a small set of meals that one person will rotate through a week.\n\n"
        "Return ONLY a JSON object with these keys:\n- "
        + "\n- ".join(groups)
        + f"\n\nEvery item has this exact shape:\n{example}\n\nRULES:\n"
        + "\n".join(f"{i + 1}. {rule}" for i, rule in enumerate(rules))
    )
    if feedback:
        prompt += f"\n\n{feedback}"
    return prompt


def _valid_item(item):
    return (
        isinstance(item, dict)
        and isinstance(item.get('name'), str) and item['name'].strip()
        and isinstance(item.get('ingredients'), list) and len(item['ingredients']) > 0
    )


def parse_meal_library(content, need_fuel):
    """Parse the LLM reply into {'breakfasts': [...], 'mains': [...], 'snacks': [...], 'training_fuel': [...]}."""
    text = content.strip()
    if text.startswith('```'):
        text = '\n'.join(text.split('\n')[1:-1])
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        print(f"Meal library is not valid JSON: {e}")
        return None
    if not isinstance(data, dict):
        return None

    library = {}
    for group in ['breakfasts', 'mains', 'snacks', 'training_fuel']:
        items = data.get(group, [])
        library[group] = [i for i in items if _valid_item(i)] if isinstance(items, list) else []

    if not library['breakfasts'] or len(library['mains']) < 2 or not library['snacks']:
        print("Meal library is missing required groups")
        return None
    if need_fuel and not library['training_fuel']:
        print("Meal library is missing training fuel")
        return None
    return library


def _combine(snack, fuel):
    """A training day's snack slot: the usual snack plus the workout fuel."""
    def macro(key):
        return (snack.get('macros') or {}).get(key, 0) + (fuel.get('macros') or {}).get(key, 0)

    return {
        'name': f"{snack['name']} + {fuel['name']}",
        'calories': (snack.get('calories') or 0) + (fuel.get('calories') or 0),
        'macros': {'p': macro('p'), 'c': macro('c'), 'f': macro('f')},
        'ingredients': list(snack.get('ingredients', [])) + list(fuel.get('ingredients', [])),
        'recipe': list(snack.get('recipe', []))
        + [f"Around your workout: {fuel['name']}"]
        + list(fuel.get('recipe', [])),
    }


def build_week(library, training_days):
    """
    Lay the meal library out over the week. Keys "0".."6" are Sunday..Saturday.
    Breakfasts and snacks alternate, each dinner is the next day's lunch, and training
    days add workout fuel to the snack.
    """
    breakfasts, mains, snacks, fuel = (library[k] for k in ['breakfasts', 'mains', 'snacks', 'training_fuel'])
    week = {}
    sessions = 0
    for day in range(7):
        snack = snacks[day % len(snacks)]
        if training_days[day] and fuel:
            snack = _combine(snack, fuel[sessions % len(fuel)])
            sessions += 1
        week[str(day)] = {
            'breakfast': breakfasts[day % len(breakfasts)],
            'lunch': mains[(day - 1) % len(mains)],
            'dinner': mains[day % len(mains)],
            'snack': snack,
        }
    return week


def generate_weekly_meal_plan(rest_day, fuel_kcal, training_days, diet_pref, effort, allergies=None, dislikes=None):
    """
    Generate the weekly meal plan and make sure it respects the user's allergies and foods to
    avoid. A plan that breaks them is regenerated once; if it still does, no plan is returned,
    because showing an unsafe meal is worse than showing none.
    """
    allergies = allergies or []
    dislikes = dislikes or []
    has_training = any(training_days)
    need_fuel = has_training and fuel_kcal >= 50

    feedback = ''
    for attempt in range(2):
        content = chat_completion(
            messages=[
                {
                    'role': 'system',
                    'content': (
                        'You are a practical sports nutritionist who plans food for busy people. Return only valid JSON. '
                        'Use plain strings for ingredients and recipe arrays. If the user has food allergies, never '
                        'include those foods or anything made from them.'
                    ),
                },
                {
                    'role': 'user',
                    'content': build_meal_library_prompt(
                        rest_day, fuel_kcal, has_training, diet_pref, effort, allergies, dislikes, feedback
                    ),
                },
            ],
            max_tokens=4096,
            temperature=0.7,
            timeout=45,
            json_mode=True,
        )
        if content is None:
            return None

        library = parse_meal_library(content, need_fuel)
        if library is None:
            return None

        plan = build_week(library, training_days)
        violations = find_restriction_violations(plan, allergies, dislikes)
        if not violations:
            print(f"Meal plan generated: {len(library['breakfasts'])} breakfasts, {len(library['mains'])} mains, "
                  f"{len(library['snacks'])} snacks, {len(library['training_fuel'])} fuel")
            return plan

        print(f"Meal plan attempt {attempt + 1} broke dietary restrictions: {violations[:5]}")
        feedback = (
            "Your previous answer was rejected because it broke the user's restrictions:\n- "
            + '\n- '.join(violations[:10])
            + "\nGenerate a completely new set with none of the forbidden foods."
        )

    print("Meal plan still breaks dietary restrictions after retry; returning no meal plan")
    return None


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200


def _positive_number(value, default):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0 else default


@app.route('/api/meal-plan', methods=['POST'])
def meal_plan():
    """
    Meals for a week whose calorie and macro targets were computed by the backend.
    Responds with {"weeklyMealPlan": {...}} or {"weeklyMealPlan": null} when none could be made.
    """
    data = request.get_json(silent=True) or {}

    rest = data.get('restDay') if isinstance(data.get('restDay'), dict) else {}
    rest_day = {
        'calories': _positive_number(rest.get('calories'), 2000),
        'proteinG': _positive_number(rest.get('proteinG'), 100),
    }
    fuel_kcal = _positive_number(data.get('trainingFuelKcal'), 0)
    training_days = data.get('trainingDays')
    if not (isinstance(training_days, list) and len(training_days) == 7):
        training_days = [False] * 7
    training_days = [bool(d) for d in training_days]

    diet_pref = data.get('dietPref') if data.get('dietPref') in ('BALANCED', 'HIGH_PROTEIN', 'VEGETARIAN', 'NO_PREFERENCE') else 'BALANCED'
    effort = data.get('cookingEffort') if data.get('cookingEffort') in COOKING_EFFORTS else 'SIMPLE'

    weekly_meal_plan = generate_weekly_meal_plan(
        rest_day, fuel_kcal, training_days, diet_pref, effort,
        allergies=clean_allergies(data.get('allergies')),
        dislikes=clean_dislikes(data.get('dislikes'))
    )
    return jsonify({'weeklyMealPlan': weekly_meal_plan}), 200


@app.route('/api/insight', methods=['POST'])
def generate_insight():
    data = request.get_json(silent=True) or {}

    prompt = f"""You are a concise fitness coach. Based on this user's data, give ONE short personalized insight (1-2 sentences max).

User context:
- Today's workout: {data.get('workout', 'Unknown')}
- Daily calorie target: {data.get('calories', 'Unknown')} kcal
- Workout program: {data.get('workoutType', 'Unknown')}
- Current mood: {data.get('mood', 'Not logged')}
- Water intake: {data.get('water', 0)} cups today
- Fitness goal: {data.get('goal', 'Unknown')}

Rules:
- Be specific and actionable, not generic
- Reference their actual data (mood, workout type, water, etc.)
- Keep it under 30 words
- Do NOT use quotes or markdown
- Do NOT give medical advice, diagnose anything, or recommend supplements or medication
- Just return the plain text insight, nothing else"""

    insight = chat_completion(
        messages=[{'role': 'user', 'content': prompt}],
        max_tokens=100,
        temperature=0.8,
        timeout=10,
    )
    if insight and insight.strip():
        return jsonify({'insight': insight.strip()}), 200
    return jsonify({'insight': 'Stay consistent with your plan today. Every session counts.'}), 200


if __name__ == '__main__':
    print(f"\nMeal service starting (model: {LLM_MODEL} at {LLM_BASE_URL})")
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
