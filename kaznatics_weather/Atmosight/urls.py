from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="home"),
    path("api/forecast/", views.forecast_api, name="forecast_api"),
]
