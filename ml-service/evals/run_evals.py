"""
Evaluate the LLM-facing parts of the meal service against a real model.

    export LLM_API_KEY=...            # or GROQ_API_KEY
    export LLM_BASE_URL=...           # optional, defaults to Groq
    export LLM_MODEL=...              # optional
    python evals/run_evals.py                 # everything
    python evals/run_evals.py --only intent   # or: --only meals
    python evals/run_evals.py --pause 2       # seconds between calls, for rate-limited keys
    python evals/run_evals.py --self-test     # no API calls: checks the harness itself with a scripted model

Two things are measured:

  intent  Does the assistant's classifier put each labelled message (English and Chinese) in the
          right intent, with the right day, meal, number of sessions and so on? How often are
          off-topic, medical and prompt-injection messages refused?

  meals   Across a set of user profiles: how often a week of meals is produced, how many LLM calls
          it takes, how often the model's FIRST answer breaks the user's allergies (which the
          checker then catches), how far the meals' calories are from target, and whether the
          lowest cooking effort really gets short ingredient lists.

Results are printed and written to evals/results-<model>.json. They describe one model on one run;
meal generation is sampled at temperature 0.7, so expect some variation between runs.
"""
import argparse
import json
import os
import statistics
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
os.environ.setdefault('ML_SERVICE_TOKEN', 'eval')

import app as service  # noqa: E402

TODAY = 1  # Monday, as assumed by the labels in intent_cases.json

MEAL_PROFILES = [
    {'name': 'balanced, simple cooking', 'calories': 2100, 'proteinG': 150, 'fuel': 300, 'diet': 'BALANCED', 'effort': 'SIMPLE', 'allergies': [], 'dislikes': []},
    {'name': 'barely cooks', 'calories': 2100, 'proteinG': 150, 'fuel': 300, 'diet': 'BALANCED', 'effort': 'MINIMAL', 'allergies': [], 'dislikes': []},
    {'name': 'enjoys cooking, high protein', 'calories': 2600, 'proteinG': 190, 'fuel': 350, 'diet': 'HIGH_PROTEIN', 'effort': 'ENTHUSIAST', 'allergies': [], 'dislikes': []},
    {'name': 'vegetarian', 'calories': 1900, 'proteinG': 110, 'fuel': 250, 'diet': 'VEGETARIAN', 'effort': 'SIMPLE', 'allergies': [], 'dislikes': []},
    {'name': 'dairy allergy', 'calories': 2100, 'proteinG': 150, 'fuel': 300, 'diet': 'BALANCED', 'effort': 'SIMPLE', 'allergies': ['DAIRY'], 'dislikes': []},
    {'name': 'peanut and tree nut allergy', 'calories': 2100, 'proteinG': 150, 'fuel': 300, 'diet': 'BALANCED', 'effort': 'SIMPLE', 'allergies': ['PEANUT', 'TREE_NUT'], 'dislikes': []},
    {'name': 'gluten allergy, barely cooks', 'calories': 1800, 'proteinG': 120, 'fuel': 250, 'diet': 'BALANCED', 'effort': 'MINIMAL', 'allergies': ['GLUTEN'], 'dislikes': []},
    {'name': 'egg and fish allergy', 'calories': 2300, 'proteinG': 160, 'fuel': 300, 'diet': 'HIGH_PROTEIN', 'effort': 'SIMPLE', 'allergies': ['EGG', 'FISH'], 'dislikes': []},
    {'name': 'dairy + egg + gluten allergy', 'calories': 2000, 'proteinG': 130, 'fuel': 250, 'diet': 'BALANCED', 'effort': 'SIMPLE', 'allergies': ['DAIRY', 'EGG', 'GLUTEN'], 'dislikes': []},
    {'name': 'vegetarian with soy allergy', 'calories': 1900, 'proteinG': 100, 'fuel': 250, 'diet': 'VEGETARIAN', 'effort': 'SIMPLE', 'allergies': ['SOY'], 'dislikes': []},
    {'name': 'avoids mushrooms, onions, tomatoes', 'calories': 2100, 'proteinG': 150, 'fuel': 300, 'diet': 'BALANCED', 'effort': 'SIMPLE', 'allergies': [], 'dislikes': ['mushrooms', 'onions', 'tomatoes']},
    {'name': 'small target, rest week', 'calories': 1500, 'proteinG': 100, 'fuel': 0, 'diet': 'BALANCED', 'effort': 'MINIMAL', 'allergies': ['SHELLFISH'], 'dislikes': ['cilantro']},
]
PPL_WEEK = [False, True, True, True, True, True, False]


def pct(part, whole):
    return f"{100 * part / whole:.0f}%" if whole else 'n/a'


# ------------------------------------------------------------------ intent

def field_matches(field, expected, actual):
    if field in ('addDislikes', 'addAllergies'):
        got = [str(v).lower() for v in (actual or [])]
        # singular or plural, and extra entries the model also found, are fine
        return all(any(want.lower().rstrip('s') in g for g in got) for want in expected)
    if field == 'clear':
        return bool(actual) == bool(expected)
    return actual == expected


def run_intent(pause):
    with open(os.path.join(HERE, 'intent_cases.json'), encoding='utf-8') as f:
        cases = json.load(f)['cases']
    client = service.app.test_client()
    headers = {'X-Internal-Token': os.environ['ML_SERVICE_TOKEN']}

    rows = []
    for case in cases:
        started = time.monotonic()
        got = client.post('/api/assistant/intent', headers=headers, json={'text': case['text'], 'today': TODAY}).get_json()
        elapsed = time.monotonic() - started
        expect = case['expect']
        intent_ok = got.get('intent') == expect['intent']
        wrong_fields = [k for k, v in expect.items() if k != 'intent' and not field_matches(k, v, got.get(k))] if intent_ok else []
        rows.append({
            'text': case['text'], 'group': case.get('group', expect['intent']), 'expected': expect, 'got': got,
            'intent_ok': intent_ok, 'fields_ok': intent_ok and not wrong_fields, 'wrong_fields': wrong_fields,
            'chinese': any('一' <= ch <= '鿿' for ch in case['text']), 'seconds': round(elapsed, 2),
        })
        time.sleep(pause)

    answered = [r for r in rows if r['got'].get('intent') != 'unavailable']
    in_scope = [r for r in answered if r['expected']['intent'] != 'refuse' and r['group'] != 'injection_mixed']
    summary = {
        'cases': len(rows),
        'model_unavailable': len(rows) - len(answered),
        'intent_accuracy': pct(sum(r['intent_ok'] for r in answered), len(answered)),
        'in_scope_intent_accuracy': pct(sum(r['intent_ok'] for r in in_scope), len(in_scope)),
        'in_scope_fully_correct': pct(sum(r['fields_ok'] for r in in_scope), len(in_scope)),
        'english_fully_correct': pct(sum(r['fields_ok'] for r in in_scope if not r['chinese']), sum(1 for r in in_scope if not r['chinese'])),
        'chinese_fully_correct': pct(sum(r['fields_ok'] for r in in_scope if r['chinese']), sum(1 for r in in_scope if r['chinese'])),
        'median_seconds': round(statistics.median(r['seconds'] for r in rows), 2),
    }
    for intent in ('swap_meal', 'week_constraint', 'update_preferences', 'navigate'):
        group = [r for r in in_scope if r['expected']['intent'] == intent]
        summary[f'{intent}_fully_correct'] = f"{sum(r['fields_ok'] for r in group)}/{len(group)}"
    for group_name in ('off_topic', 'medical', 'injection'):
        group = [r for r in answered if r['group'] == group_name]
        summary[f'{group_name}_refused'] = f"{sum(r['intent_ok'] for r in group)}/{len(group)}"

    print('\n=== Intent classification ===')
    for key, value in summary.items():
        print(f'  {key:32} {value}')
    failures = [r for r in rows if not r['fields_ok']]
    if failures:
        print(f'\n  {len(failures)} not fully correct:')
        for r in failures:
            print(f"    {r['text'][:60]!r}\n       expected {r['expected']}\n       got      {r['got']}")
    return {'summary': summary, 'cases': rows}


# ------------------------------------------------------------------ meals

def run_meals(pause):
    real_chat = service.chat_completion
    real_violations = service.find_restriction_violations
    rows = []

    for profile in MEAL_PROFILES:
        llm_calls = []
        checks = []

        def counting_chat(*args, **kwargs):
            time.sleep(pause)
            answer = real_chat(*args, **kwargs)
            llm_calls.append(answer is not None)
            return answer

        def recording_violations(plan, allergies, dislikes):
            found = real_violations(plan, allergies, dislikes)
            checks.append(len(found))
            return found

        service.chat_completion = counting_chat
        service.find_restriction_violations = recording_violations
        rest_day = {'calories': profile['calories'], 'proteinG': profile['proteinG']}
        has_fuel = profile['fuel'] >= 50
        started = time.monotonic()
        try:
            plan, status = service.generate_weekly_meal_plan(
                rest_day, profile['fuel'], PPL_WEEK if has_fuel else [False] * 7, profile['diet'], profile['effort'],
                allergies=profile['allergies'], dislikes=profile['dislikes'],
            )
        finally:
            service.chat_completion = real_chat
            service.find_restriction_violations = real_violations
        elapsed = time.monotonic() - started

        row = {
            'profile': profile['name'], 'status': status, 'produced': plan is not None, 'llm_calls': len(llm_calls),
            'restricted': bool(profile['allergies'] or profile['dislikes']),
            # what the checker found in the model's first usable answer, before any retry
            'first_answer_violations': checks[0] if checks else None,
            'seconds': round(elapsed, 1),
        }
        if plan is not None:
            targets = service.item_targets(rest_day, profile['fuel'])
            slot_target = {'breakfast': targets['breakfasts'][0], 'lunch': targets['mains'][0], 'dinner': targets['mains'][0]}
            deviations = []
            ingredient_counts = []
            seen = set()
            for day in plan.values():
                for slot in ('breakfast', 'lunch', 'dinner'):
                    meal = day[slot]
                    if meal['name'] in seen:
                        continue
                    seen.add(meal['name'])
                    ingredient_counts.append(len(meal.get('ingredients', [])))
                    calories = meal.get('calories')
                    if isinstance(calories, (int, float)) and calories > 0:
                        deviations.append(abs(calories - slot_target[slot]) / slot_target[slot])
            row['distinct_meals'] = len(seen)
            row['median_calorie_deviation'] = round(statistics.median(deviations), 3) if deviations else None
            row['max_ingredients'] = max(ingredient_counts) if ingredient_counts else None
            row['final_violations'] = len(real_violations(plan, profile['allergies'], profile['dislikes']))
        rows.append(row)
        print(f"  {profile['name']:38} {status:16} calls={row['llm_calls']} first-answer violations={row['first_answer_violations']} {row['seconds']}s")

    produced = [r for r in rows if r['produced']]
    restricted = [r for r in rows if r['restricted'] and r['first_answer_violations'] is not None]
    minimal = [r for r in produced if 'barely cooks' in r['profile'] or 'rest week' in r['profile']]
    deviations = [r['median_calorie_deviation'] for r in produced if r.get('median_calorie_deviation') is not None]
    summary = {
        'profiles': len(rows),
        'plan_produced': f"{len(produced)}/{len(rows)}",
        'produced_on_first_call': f"{sum(1 for r in produced if r['llm_calls'] == 1)}/{len(rows)}",
        'mean_llm_calls': round(statistics.mean(r['llm_calls'] for r in rows), 2),
        'restricted_profiles_where_first_answer_broke_a_restriction': f"{sum(1 for r in restricted if r['first_answer_violations'] > 0)}/{len(restricted)}",
        'restriction_violations_in_delivered_plans': sum(r.get('final_violations', 0) for r in produced),
        'median_calorie_deviation_from_target': f"{100 * statistics.median(deviations):.0f}%" if deviations else 'n/a',
        'minimal_effort_plans_within_5_ingredients': f"{sum(1 for r in minimal if (r.get('max_ingredients') or 99) <= 5)}/{len(minimal)}",
        'median_seconds': round(statistics.median(r['seconds'] for r in rows), 1),
    }
    print('\n=== Meal generation ===')
    for key, value in summary.items():
        print(f'  {key:60} {value}')
    return {'summary': summary, 'profiles': rows}


# ------------------------------------------------------------------ self-test

def install_scripted_model():
    """A stand-in model that answers the labelled cases correctly and returns well-formed meals."""
    with open(os.path.join(HERE, 'intent_cases.json'), encoding='utf-8') as f:
        by_text = {c['text']: c['expect'] for c in json.load(f)['cases']}

    def item(name, kcal, n=3):
        return {'name': name, 'calories': kcal, 'macros': {'p': 30, 'c': 50, 'f': 15},
                'ingredients': [f'{100 + i}g thing {i}' for i in range(n)], 'recipe': ['Make it']}

    def scripted(messages, **kwargs):
        prompt = messages[-1]['content']
        if '<message>' in prompt:
            text = prompt.split('<message>\n', 1)[1].rsplit('\n</message>', 1)[0]
            return json.dumps(by_text.get(text, {'intent': 'refuse'}))
        import re
        kcal = [int(v) for v in re.findall(r'about (\d+) kcal', prompt)]
        library = {
            'breakfasts': [item('Breakfast A', kcal[0]), item('Breakfast B', kcal[0])],
            'mains': [item(f'Main {i}', kcal[1]) for i in range(4)],
            'snacks': [item('Snack A', kcal[2]), item('Snack B', kcal[2])],
        }
        if len(kcal) > 3:
            library['training_fuel'] = [item('Fuel A', kcal[3]), item('Fuel B', kcal[3])]
        return json.dumps(library)

    service.chat_completion = scripted


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--only', choices=['intent', 'meals'])
    parser.add_argument('--pause', type=float, default=0.0, help='seconds to wait between LLM calls')
    parser.add_argument('--self-test', action='store_true', help='run against a scripted model, without any API call')
    args = parser.parse_args()

    if args.self_test:
        install_scripted_model()
        label = 'self-test'
    else:
        if not service.LLM_API_KEY:
            sys.exit('Set LLM_API_KEY (or GROQ_API_KEY) first. Use --self-test to try the harness without one.')
        label = service.LLM_MODEL
    print(f'Model: {label}' + ('' if args.self_test else f' at {service.LLM_BASE_URL}'))

    results = {'model': label, 'base_url': None if args.self_test else service.LLM_BASE_URL, 'ran_at': time.strftime('%Y-%m-%d %H:%M:%S')}
    if args.only in (None, 'intent'):
        results['intent'] = run_intent(args.pause)
    if args.only in (None, 'meals'):
        print('\nGenerating meal plans...')
        results['meals'] = run_meals(args.pause)

    if not args.self_test:
        path = os.path.join(HERE, f"results-{label.replace('/', '_')}.json")
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f'\nFull results written to {path}')


if __name__ == '__main__':
    main()
