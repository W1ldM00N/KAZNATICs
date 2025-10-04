from django.http import JsonResponse
from django.shortcuts import render
import numpy as np
import pickle
from datetime import datetime, timedelta
import os

# Загружаем модель один раз при старте
MODEL_PATH = "../ML_model/ml_model.pkl"
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

def index(request):
    return render(request, "Atmosight/index.html")

def forecast_api(request):
    today = datetime.today()
    days = [(today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(10)]

    # Пример входных данных
    X = np.arange(10).reshape(-1, 1)
    y_pred = model.predict(X)

    data = {
        "dates": days,
        "temp": y_pred.astype(float).reshape(-1).tolist(),
        "humidity": [str(np.random.randint(30, 80)) + "%" for _ in range(10)]
    }
    return JsonResponse(data)
