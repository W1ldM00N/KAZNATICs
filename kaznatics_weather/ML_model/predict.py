import numpy as np
import pickle
from datetime import datetime, timedelta
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from lightgbm import LGBMRegressor
from xgboost import XGBRegressor
from sklearn.multioutput import MultiOutputRegressor

# === Функция прогноза для Django ===
def get_forecast(days_before: int = 10):
    """
    Возвращает прогноз температуры и влажности на N дней вперёд.
    Работает с уже обученной моделью (ml_model.pkl).
    """

    X = pd.read_csv("ML_model/datasets/predict_dataset.csv")

    X["date"] = pd.to_datetime(X["date"])

    last_date = X["date"].max()

    start_date = min(datetime.today(), last_date) - timedelta(days=days_before)
    days = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days_before)]

    with open("ML_model/base_models.pkl", "rb") as f:
        base_models = pickle.load(f)

    with open("ML_model/final_model.pkl", "rb") as f:
        final_model = pickle.load(f)

    with open("ML_model/preprocessors.pkl", "rb") as f:
        preprocessors = pickle.load(f)
        imp_X = preprocessors["imp_X"]
        scaler = preprocessors["scaler"]

    # === 2. Загружаем входные данные ===
    X = pd.read_csv("ML_model/datasets/X_train.csv")
    X["date"] = pd.to_datetime(X["date"])
    X = X.loc[X["date"] == pd.Timestamp(start_date)].drop(columns=["date"]).astype("float32")

    # Преобразуем так же, как при обучении
    X_prep = imp_X.transform(X)
    X_prep = scaler.transform(X_prep)

    # Берём последнюю строку (можно заменить на новую точку)
    X_last = X_prep[-1].reshape(1, -1)

    # === 3. Получаем мета-признаки (из базовых моделей) ===
    base_features = []
    for name, model in base_models:
        preds = model.predict(X_last)
        base_features.append(preds)

    # Конкатенируем (LightGBM + XGBoost → 100 фичей)
    X_meta = np.concatenate(base_features, axis=1)

    # === 4. Прогноз через финальную модель ===
    y_pred = final_model.predict(X_meta)

    print(y_pred)

    predictions = pd.DataFrame(y_pred)
    print(predictions)

    temp = []
    for i in range(1, 50, 5):
        temp.append(predictions.iloc[0, i].astype(float))

    humidity = []
    for i in range(2, 50, 5):
        humidity.append(predictions.iloc[0, i].astype(float))

    rain = []
    for i in range(0, 50, 5):
        rain.append(predictions.iloc[0, i].astype(float))

    clouds = []
    for i in range(3, 50, 5):
        clouds.append(predictions.iloc[0, i].astype(float))

    return {
        "dates": days,
        "temp": temp,
        "humidity": humidity,
        "rain": rain,
        "clouds": clouds
    }
