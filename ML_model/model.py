# train_model.py
import pickle
import numpy as np
from sklearn.linear_model import LinearRegression

X = np.arange(10).reshape(-1, 1)
y = 15 + 0.5 * X + np.random.randn(10)
model = LinearRegression().fit(X, y)

with open("ml_model.pkl", "wb") as f:
    # noinspection PyTypeChecker
    pickle.dump(model, f)
