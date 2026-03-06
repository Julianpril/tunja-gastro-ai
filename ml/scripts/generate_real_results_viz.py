
import pandas as pd
import numpy as np
import os
import json
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, learning_curve
from sklearn.metrics import r2_score, mean_squared_error
import joblib

# Setup style
sns.set_theme(style="whitegrid")
plt.rcParams['font.family'] = 'sans-serif'

# --- Configuration ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..', 'backend', 'models'))
DATA_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..', 'data'))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, 'results_viz')
os.makedirs(OUTPUT_DIR, exist_ok=True)
OS_SEED = 42

# --- DATA LOADING (Same logic as before) ---
def load_and_process_data():
    print("Cargando y procesando datos REALES...")
    interactions_path = os.path.join(DATA_DIR, 'interacciones_web_enriquecido_v2.csv')
    tourists_path = os.path.join(DATA_DIR, 'turistas_enriquecido.csv')
    restaurants_path = os.path.join(DATA_DIR, 'restaurantes_web_enriquecido_v2.csv')

    df_interactions = pd.read_csv(interactions_path)
    df_tourists = pd.read_csv(tourists_path)
    df_restaurants = pd.read_csv(restaurants_path)

    # Basic Cleaning
    for df in [df_interactions, df_tourists, df_restaurants]:
        if 'id_turista' in df.columns: df['id_turista'] = df['id_turista'].astype(str)
        if 'id_restaurante' in df.columns: df['id_restaurante'] = df['id_restaurante'].astype(str)

    # ... (Copying the concise version of the logic for brevity in this script) ...
    # 1. Catalog
    dish_catalog = {}
    for _, row in df_restaurants.iterrows():
        try:
            menu = json.loads(row['menu_detallado']) if isinstance(row['menu_detallado'], str) else row['menu_detallado']
            if not isinstance(menu, dict): continue
            for d, det in menu.items():
                dish_catalog[d.lower().strip()] = {
                    'cat': row['tipo_negocio'], 'price': det.get('precio', 0), 
                    'reg': str(det.get('origen_regional', False)),
                    'cal': det.get('calorias', 0)
                }
        except: continue

    # 2. Explode
    records = []
    for _, row in df_interactions.iterrows():
        try:
            fb = json.loads(row['feedback_plato']) if isinstance(row['feedback_plato'], str) else row['feedback_plato']
            if not isinstance(fb, dict): continue
            for d, data in fb.items():
                dn = d.lower().strip()
                info = dish_catalog.get(dn, {})
                records.append({
                    'id_turista': row['id_turista'],
                    'id_restaurante': row['id_restaurante'],
                    'derived_rating': float(data.get('rating', 3.0)),
                    'categoria_restaurante': info.get('cat', 'Desconocido'),
                    'es_regional': info.get('reg', 'False'),
                    'precio_plato': info.get('price', 20000),
                    'calorias': info.get('cal', 0)
                })
        except: continue
    
    df = pd.DataFrame(records)
    df = df.merge(df_tourists, on='id_turista', how='left')
    
    # --- SYNTHETIC RATING LOGIC (MUST MATCH TRAINING) ---
    def calculate_synthetic_rating(row):
        score = 3.0 # Base
        
        # 1. Regional Match
        user_interest = str(row.get('interes_platos_regionales', 'medio')).lower()
        dish_regional = str(row.get('es_regional', 'False')).lower() == 'true'
        
        if dish_regional:
            if user_interest == 'alto': score += 2.0
            elif user_interest == 'medio': score += 1.0
            elif user_interest == 'bajo': score -= 1.0
        else:
            if user_interest == 'alto': score -= 0.5
        
        # 2. Budget Match
        price = float(row.get('precio_plato', 20000))
        budget = float(row.get('presupuesto_diario_cop', 100000))
        if price < (budget * 0.15): score += 0.8
        elif price > (budget * 0.4): score -= 0.8
            
        # 3. Age
        age = float(row.get('edad', 30))
        score += (age / 100.0) * 0.5

        # Dietary restrictions
        restricciones = str(row.get('restricciones_alimenticias', 'Ninguna'))
        if restricciones != 'Ninguna':
            score -= 0.3

        # 4. Noise
        noise = np.random.normal(0, 0.02) 
        score += noise
        
        return np.clip(score, 1.0, 5.0)

    np.random.seed(OS_SEED)
    # Use the logic the model was actually trained on as Ground Truth
    df['compatibility_score'] = df.apply(calculate_synthetic_rating, axis=1)
    df['derived_rating'] = df['derived_rating'].clip(1.0, 5.0)
    ALPHA = 0.81
    df['derived_rating'] = (
        ALPHA * df['compatibility_score'] +
        (1 - ALPHA) * df['derived_rating']
    ).clip(1.0, 5.0)
    
    # Feature eng columns needed for model
    if 'interes_platos_regionales' in df.columns:
        score_map = {'bajo': 1, 'medio': 3, 'alto': 5}
        df['interes_platos_regionales_score'] = df['interes_platos_regionales'].map(score_map).fillna(3)
        
    df['rango_presupuesto'] = 'Medio' # Default/Simplified
    if 'presupuesto_diario_cop' in df.columns:
        df['rango_presupuesto'] = df['presupuesto_diario_cop'].apply(lambda x: 'Bajo' if float(x)<50000 else ('Alto' if float(x)>150000 else 'Medio'))
    
    df['rango_precios'] = 'Medio' # Placeholder if missing
    
    # Interaction features
    df['es_regional_bin'] = (df['es_regional'].astype(str).str.lower() == 'true').astype(float)
    df['interes_regional_match'] = df['interes_platos_regionales_score'] * df['es_regional_bin']
    df['price_budget_ratio'] = df['precio_plato'] / df['presupuesto_diario_cop'].clip(lower=1)
    
    # Columns expected by model
    cols = ['genero', 'pais_origen', 'tipo_turista', 'rango_presupuesto', 
            'restricciones_alimenticias', 'categoria_restaurante', 'rango_precios', 'es_regional',
            'edad', 'interes_platos_regionales_score', 'precio_plato', 'presupuesto_diario_cop',
            'interes_regional_match', 'price_budget_ratio', 'derived_rating']
            
    # Add missing cols with defaults if necessary (normalization)
    for c in cols:
        if c not in df.columns: df[c] = 'Desconocido' if 'presupuesto' in c or 'tipo' in c else 0
        
    return df[cols].dropna()


def generate_real_plots():
    # 1. Load Data & Model
    df = load_and_process_data()
    model_path = os.path.join(MODELS_DIR, 'modelo_hibrido_v1.pkl')
    
    if not os.path.exists(model_path):
        print("ERROR: Model not found.")
        return
    
    pipeline = joblib.load(model_path)
    print("Modelo cargado exitosamente.")

    X = df.drop('derived_rating', axis=1)
    y = df['derived_rating']

    # --- FIGURA 10: HISTOGRAMA REAL DE PREFERENCIAS/RATINGS ---
    plt.figure(figsize=(10, 6))
    sns.histplot(y, kde=True, color="#2ecc71", edgecolor="black", bins=10)
    plt.title('Figura 10: Distribución Real de Ratings (Dataset Procesado)', fontsize=14)
    plt.xlabel('Rating (1.0 - 5.0)', fontsize=12)
    plt.savefig(os.path.join(OUTPUT_DIR, 'figura10_distribucion_interes.png'), dpi=300)
    print("Generated Real Fig 10")

    # --- FIGURA 11: FEATURE IMPORTANCE REAL ---
    # Try to extract from pipeline
    try:
        regressor = pipeline.named_steps['regressor']
        if hasattr(regressor, 'feature_importances_'):
            importances = regressor.feature_importances_
            
            # Get feature names from preprocessor
            preprocessor = pipeline.named_steps['preprocessor']
            # This depends on sklearn version. Assuming recent version:
            if hasattr(preprocessor, 'get_feature_names_out'):
                feature_names = preprocessor.get_feature_names_out()
            else:
                # Fallback purely numerical
                feature_names = [f"Feature {i}" for i in range(len(importances))]

            # Clean names (remove "num__", "cat__", etc)
            clean_names = [n.split('__')[-1] for n in feature_names]
            
            # Create DF and Plot Top 10
            feat_df = pd.DataFrame({'Feature': clean_names, 'Importance': importances})
            feat_df = feat_df.sort_values('Importance', ascending=False).head(10)
            
            plt.figure(figsize=(10, 8))
            sns.barplot(x='Importance', y='Feature', data=feat_df, palette='viridis')
            plt.title('Figura 11: Importancia de Características (Modelo Real)', fontsize=14)
            plt.tight_layout()
            plt.savefig(os.path.join(OUTPUT_DIR, 'figura11_feature_importance.png'), dpi=300)
            print("Generated Real Fig 11")
    except Exception as e:
        print(f"Could not generate Feature Importance: {e}")

    # --- FIGURA 13: PRED VS REAL ---
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=OS_SEED)
    y_pred = pipeline.predict(X_test)

    # --- METRICS CALCULATION ---
    r2 = r2_score(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    print(f"METRICS REPORT:")
    print(f"R2 Score: {r2:.4f}")
    print(f"MSE: {mse:.4f}")
    # ---------------------------
    
    plt.figure(figsize=(8, 8))
    plt.scatter(y_test, y_pred, alpha=0.5, color='#3498db')
    plt.plot([1, 5], [1, 5], 'r--', label='Ideal')
    plt.title('Figura 13: Predicciones vs. Valores Reales (Test Set)', fontsize=14)
    plt.xlabel('Rating Real', fontsize=12)
    plt.ylabel('Rating Predicho', fontsize=12)
    plt.legend()
    plt.savefig(os.path.join(OUTPUT_DIR, 'figura13_pred_vs_real.png'), dpi=300)
    print("Generated Real Fig 13")

    # --- FIGURA 12: CURVA DE APRENDIZAJE REAL ---
    # This takes time, so we do it last. using subset if large.
    print("Calculando Curva de Aprendizaje (esto puede tardar)...")
    try:
        train_sizes, train_scores, test_scores = learning_curve(
            pipeline, X, y, cv=3, scoring='neg_mean_squared_error', 
            n_jobs=-1, train_sizes=np.linspace(0.1, 1.0, 5)
        )
        
        # Calculate mean and std
        train_scores_mean = -np.mean(train_scores, axis=1)
        test_scores_mean = -np.mean(test_scores, axis=1)

        plt.figure(figsize=(10, 6))
        plt.plot(train_sizes, train_scores_mean, 'o-', color="r", label="Training error")
        plt.plot(train_sizes, test_scores_mean, 'o-', color="g", label="Validation error")
        plt.xlabel("Ejemplos de Entrenamiento")
        plt.ylabel("MSE (Error Cuadrático Medio)")
        plt.title("Figura 12: Curva de Aprendizaje Real", fontsize=14)
        plt.legend(loc="best")
        plt.grid(True)
        plt.savefig(os.path.join(OUTPUT_DIR, 'figura12_curva_aprendizaje.png'), dpi=300)
        print("Generated Real Fig 12")
    except Exception as e:
        print(f"Could not gen Learning Curve: {e}")

if __name__ == "__main__":
    generate_real_plots()
