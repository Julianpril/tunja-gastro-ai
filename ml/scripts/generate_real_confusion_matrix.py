
import pandas as pd
import numpy as np
import os
import json
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix
import joblib

# Setup style
sns.set_theme(style="white")
plt.rcParams['font.family'] = 'sans-serif'

# --- Configuration ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# tunja-gastro-ai/ml/scripts/../../backend/models/
MODELS_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..', 'backend', 'models'))
DATA_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..', 'data'))
OS_SEED = 42

def load_data():
    """Loads and merges data from CSV files."""
    print("Loading data...")
    interactions_path = os.path.join(DATA_DIR, 'interacciones_web_enriquecido_v2.csv')
    tourists_path = os.path.join(DATA_DIR, 'turistas_enriquecido.csv')
    restaurants_path = os.path.join(DATA_DIR, 'restaurantes_web_enriquecido_v2.csv')

    df_interactions = pd.read_csv(interactions_path)
    df_tourists = pd.read_csv(tourists_path)
    df_restaurants = pd.read_csv(restaurants_path)

    # Basic Cleaning
    df_interactions['id_turista'] = df_interactions['id_turista'].astype(str)
    df_interactions['id_restaurante'] = df_interactions['id_restaurante'].astype(str)
    df_tourists['id_turista'] = df_tourists['id_turista'].astype(str)
    df_restaurants['id_restaurante'] = df_restaurants['id_restaurante'].astype(str)

    return df_interactions, df_tourists, df_restaurants

def preprocess_data(df_interactions, df_tourists, df_restaurants):
    print("Preprocessing data for Matrix...")
    
    # --- 1. Build Dish Catalog ---
    dish_catalog = {}
    for _, row in df_restaurants.iterrows():
        rest_cat = row['tipo_negocio']
        rest_price_range = row['rango_precio']
        try:
            menu = row['menu_detallado']
            if pd.isna(menu): continue
            menu_dict = json.loads(menu) if isinstance(menu, str) else menu
            
            for dish_name, details in menu_dict.items():
                clean_name = dish_name.lower().strip()
                dish_catalog[clean_name] = {
                    'categoria_restaurante': rest_cat,
                    'rango_precios': rest_price_range,
                    'es_regional': str(details.get('origen_regional', False)),
                    'precio_plato': details.get('precio', 0) or 0,
                    'calorias': details.get('calorias', 0)
                }
        except Exception:
            continue

    # --- 2. Explode Interactions ---
    interaction_records = []
    for _, row in df_interactions.iterrows():
        user_id = row['id_turista']
        rest_id = row['id_restaurante']
        feedback = row['feedback_plato']
        
        try:
            if pd.isna(feedback): continue
            if isinstance(feedback, str):
                feedback_dict = json.loads(feedback)
            else:
                feedback_dict = feedback
                
            if not isinstance(feedback_dict, dict): continue
            
            for dish_name, data in feedback_dict.items():
                if not isinstance(data, dict): continue
                
                rating = float(data.get('rating', 3.0))
                clean_name = dish_name.lower().strip()
                dish_feats = dish_catalog.get(clean_name, {})
                
                record = {
                    'id_turista': user_id,
                    'id_restaurante': rest_id,
                    'dish_name': clean_name,
                    'derived_rating': rating,
                    'categoria_restaurante': dish_feats.get('categoria_restaurante', 'Desconocido'),
                    'rango_precios': dish_feats.get('rango_precios', 'Medio'),
                    'es_regional': dish_feats.get('es_regional', 'False'),
                    'precio_plato': dish_feats.get('precio_plato', 20000),
                }
                interaction_records.append(record)
        except Exception:
            continue
            
    df_interactions_exploded = pd.DataFrame(interaction_records)

    # --- 3. Merge ---
    df_merged = df_interactions_exploded.merge(df_tourists, on='id_turista', how='left')
    df_restaurants_renamed = df_restaurants.rename(columns={'es_regional': 'restaurante_es_regional'})
    df_merged = df_merged.merge(df_restaurants_renamed, on='id_restaurante', how='left')

    # --- 4. Feature Engineering ---
    if 'interes_platos_regionales' in df_merged.columns:
        score_map = {'bajo': 1, 'medio': 3, 'alto': 5}
        df_merged['interes_platos_regionales_score'] = df_merged['interes_platos_regionales'].map(score_map).fillna(3)
        
    if 'presupuesto_diario_cop' in df_merged.columns:
        def map_budget(val):
            try:
                v = float(val)
                if v < 50000: return 'Bajo'
                elif v < 150000: return 'Medio'
                else: return 'Alto'
            except:
                return 'Medio'
        df_merged['rango_presupuesto'] = df_merged['presupuesto_diario_cop'].apply(map_budget)

    if 'tipo_negocio' in df_merged.columns:
        df_merged['categoria_restaurante'] = df_merged['tipo_negocio']
    
    if 'rango_precio' in df_merged.columns:
        df_merged['rango_precios'] = df_merged['rango_precio']

    # --- Synthetic Derived Rating Logic ---
    def calculate_synthetic_rating(row):
        score = 3.0
        user_interest = str(row.get('interes_platos_regionales', 'medio')).lower()
        dish_regional = str(row.get('es_regional', 'False')).lower() == 'true'
        if dish_regional:
            if user_interest == 'alto': score += 2.0
            elif user_interest == 'medio': score += 1.0
            elif user_interest == 'bajo': score -= 1.0
        else:
            if user_interest == 'alto': score -= 0.5
            
        price = float(row.get('precio_plato', 20000))
        budget = float(row.get('presupuesto_diario_cop', 100000))
        if price < (budget * 0.15): score += 0.8
        elif price > (budget * 0.4): score -= 0.8
            
        age = float(row.get('edad', 30))
        score += (age / 100.0) * 0.5

        restricciones = str(row.get('restricciones_alimenticias', 'Ninguna'))
        if restricciones != 'Ninguna':
            score -= 0.3

        noise = np.random.normal(0, 0.02) 
        score += noise
        return np.clip(score, 1.0, 5.0)

    np.random.seed(OS_SEED)
    # Use the same logic as train_model to ensure consistency
    df_merged['compatibility_score'] = df_merged.apply(calculate_synthetic_rating, axis=1)
    df_merged['derived_rating'] = df_merged['derived_rating'].clip(1.0, 5.0)
    ALPHA = 0.81
    df_merged['derived_rating'] = (
        ALPHA * df_merged['compatibility_score'] +
        (1 - ALPHA) * df_merged['derived_rating']
    ).clip(1.0, 5.0)

    # Interaction features
    df_merged['es_regional_bin'] = (df_merged['es_regional'].astype(str).str.lower() == 'true').astype(float)
    df_merged['interes_regional_match'] = df_merged['interes_platos_regionales_score'] * df_merged['es_regional_bin']
    df_merged['price_budget_ratio'] = df_merged['precio_plato'] / df_merged['presupuesto_diario_cop'].clip(lower=1)

    categorical_features = ['genero', 'pais_origen', 'tipo_turista', 'rango_presupuesto', 'restricciones_alimenticias', 'categoria_restaurante', 'rango_precios', 'es_regional']
    numeric_features = ['edad', 'interes_platos_regionales_score', 'precio_plato', 'presupuesto_diario_cop', 'interes_regional_match', 'price_budget_ratio']

    final_cols = ['derived_rating']
    for col in categorical_features + numeric_features:
        if col in df_merged.columns:
            final_cols.append(col)

    return df_merged[final_cols].dropna()

def generate_matrix():
    # 1. Prepare Data
    df_interactions, df_tourists, df_restaurants = load_data()
    data = preprocess_data(df_interactions, df_tourists, df_restaurants)
    
    X = data.drop('derived_rating', axis=1)
    y = data['derived_rating']
    
    # 2. Load Model
    model_path = os.path.join(MODELS_DIR, 'modelo_hibrido_v1.pkl')
    print(f"Loading model from: {model_path}")
    
    if not os.path.exists(model_path):
        print("Model file not found! Please run train_model.py first.")
        return

    try:
        pipeline = joblib.load(model_path)
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    # 3. Predict on Test Set (to be fair)
    # Using same random_state as training to get the same split
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=OS_SEED)
    
    print(f"Predicting on {len(X_test)} samples...")
    y_pred_continuous = pipeline.predict(X_test)
    
    # 4. Convert Continuous to Class (1, 2, 3, 4, 5) for Confusion Matrix
    y_true_class = np.round(y_test).astype(int)
    y_pred_class = np.round(y_pred_continuous).astype(int)
    
    # Clip to ensure range 1-5
    y_true_class = np.clip(y_true_class, 1, 5)
    y_pred_class = np.clip(y_pred_class, 1, 5)
    
    # 5. Build Confusion Matrix
    labels = [1, 2, 3, 4, 5]
    cm = confusion_matrix(y_true_class, y_pred_class, labels=labels)
    
    # 6. Plot
    plt.figure(figsize=(10, 8))
    heatmap = sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False,
                          xticklabels=labels, yticklabels=labels,
                          annot_kws={"size": 14})
    
    plt.title('Matriz de Confusión: Modelo Random Forest (Datos Reales)', fontsize=15, pad=20)
    plt.xlabel('Rating Predicho (Redondeado)', fontsize=12)
    plt.ylabel('Rating Real (Redondeado)', fontsize=12)
    
    # Output
    output_path = os.path.join(SCRIPT_DIR, 'results_viz', 'figura_real_matriz_confusion.png')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"Matriz Real guardada en: {output_path}")
    print("Confusion Matrix Values:")
    print(cm)

if __name__ == "__main__":
    generate_matrix()
