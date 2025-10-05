from django.http import JsonResponse
from django.shortcuts import render

from ML_model.predict import get_forecast

def index(request):
    return render(request, "Atmosight/index.html")

def forecast_api(request):
    data = get_forecast()
    print(data)
    return JsonResponse(data)
