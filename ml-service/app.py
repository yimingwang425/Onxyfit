from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import os
import tensorflow as tf
keras = tf.keras

app = Flask(__name__)
CORS(app)

model_path = os.path.dirname(os.path.abspath(__file__))

print(f"Loading models from: {model_path}")

# Load two models
workout_model = keras.models.load_model(os.path.join(model_path, 'workout_model.keras'))
meal_model = keras.models.load_model(os.path.join(model_path, 'meal_model.keras'))

# Loading preprocessing items
scaler_X = joblib.load(os.path.join(model_path, 'scaler_X.pkl'))
scaler_y_workout = joblib.load(os.path.join(model_path, 'scaler_y_workout.pkl'))
scaler_y_meal = joblib.load(os.path.join(model_path, 'scaler_y_meal.pkl'))

# Encode string
le_activity = joblib.load(os.path.join(model_path, 'le_activity.pkl'))
le_goal = joblib.load(os.path.join(model_path, 'le_goal.pkl'))
le_diet = joblib.load(os.path.join(model_path, 'le_diet.pkl'))
le_metabolic = joblib.load(os.path.join(model_path, 'le_metabolic.pkl'))

print("Models loaded successfully!")


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200


@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    
    # input
    age = data['age']
    height = data['heightCm']
    weight = data['weightKg']
    activity = data['activityLevel']
    goal = data['goal']
    diet = data['dietPref']
    metabolic = data['metabolicProfile']
    
    # string to a number
    activity_code = le_activity.transform([activity])[0]
    goal_code = le_goal.transform([goal])[0]
    diet_code = le_diet.transform([diet])[0]
    metabolic_code = le_metabolic.transform([metabolic])[0]
    
    # Assembly input
    user_input = np.array([[age, height, weight, activity_code, goal_code, diet_code, metabolic_code]])
    
    # Standardisation
    user_input_scaled = scaler_X.transform(user_input)
    
    # Predictive workout
    workout_pred = workout_model.predict(user_input_scaled, verbose=0)
    
    # Use workout results to predict meal
    meal_pred = meal_model.predict([user_input_scaled, workout_pred], verbose=0)
    
    # anti-standardisation
    workout_result = scaler_y_workout.inverse_transform(workout_pred)
    meal_result = scaler_y_meal.inverse_transform(meal_pred)
    
    # workout type
    workout_type_num = int(round(workout_result[0][1]))
    if workout_type_num > 2:
        workout_type_num = 2
    if workout_type_num < 0:
        workout_type_num = 0
        
    type_mapping = {0: 'FBW', 1: 'UPPER_LOWER', 2: 'PPL'}
    workout_type = type_mapping[workout_type_num]
    
    # Return results
    response = {
        'caloriesKcal': int(meal_result[0][0]),
        'proteinG': round(float(meal_result[0][1]), 1),
        'carbsG': round(float(meal_result[0][2]), 1),
        'fatG': round(float(meal_result[0][3]), 1),
        'workoutIntensity': round(float(workout_result[0][0]), 2),
        'workoutType': workout_type
    }
    
    return jsonify(response), 200


if __name__ == '__main__':
    print("Starting Flask server on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)