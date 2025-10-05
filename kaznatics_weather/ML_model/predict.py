import numpy as np
import pickle
from datetime import datetime, timedelta
import pandas as pd

def get_forecast(days_after: int = 10):
    X = pd.read_csv("ML_model/datasets/X_train.csv")

    X["date"] = pd.to_datetime(X["date"])

    last_date = X["date"].max()

    start_date = min(datetime.today() - timedelta(days=days_after), last_date)
    days = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days_after)]

    with open("ML_model/base_models.pkl", "rb") as f:
        base_models = pickle.load(f)

    with open("ML_model/final_model.pkl", "rb") as f:
        final_model = pickle.load(f)

    with open("ML_model/preprocessors.pkl", "rb") as f:
        preprocessors = pickle.load(f)
        imp_X = preprocessors["imp_X"]
        scaler = preprocessors["scaler"]

    X = pd.read_csv("ML_model/datasets/X_train.csv")
    X["date"] = pd.to_datetime(X["date"])
    X = X.loc[X["date"] == pd.Timestamp(start_date)].drop(columns=["date"]).astype("float32")

    X_prep = imp_X.transform(X)
    X_prep = scaler.transform(X_prep)

    X_last = X_prep[-1].reshape(1, -1)

    base_features = []
    for name, model in base_models:
        preds = model.predict(X_last)
        base_features.append(preds)

    X_meta = np.concatenate(base_features, axis=1)

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
