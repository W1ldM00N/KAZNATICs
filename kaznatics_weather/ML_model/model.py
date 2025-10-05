import pickle

import numpy as np
import pandas as pd
from tqdm import tqdm

from lightgbm import LGBMRegressor
from xgboost import XGBRegressor

from sklearn.model_selection import train_test_split, KFold
from sklearn.metrics import r2_score, mean_squared_error
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.multioutput import MultiOutputRegressor

# === 1. Данные ===
X = pd.read_csv("datasets/X_train.csv").drop(columns=["date"]).astype("float32")
y = pd.read_csv("datasets/y_train.csv").drop(columns=["date"]).astype("float32")

print(f"X shape: {X.shape}, y shape: {y.shape}")  # (285, ?) и (285, 50)

# === 2. Разделение на train/test ===
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# === 2.1. Заполнение NaN и стандартизация ===
imp_X = SimpleImputer(strategy="median")
X_train = imp_X.fit_transform(X_train)
X_test = imp_X.transform(X_test)

imp_y = SimpleImputer(strategy="median")
y_train = imp_y.fit_transform(y_train)
y_test = imp_y.transform(y_test)

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# === 3. Базовые модели (multi-output) с "старыми" гиперпараметрами ===
base_models = [
    ("LightGBM", MultiOutputRegressor(
        LGBMRegressor(
            n_estimators=634,
            learning_rate=0.03785354106419771,
            max_depth=12,
            num_leaves=33,
            subsample=0.6215969195531089,
            colsample_bytree=0.8320003955295595,
            random_state=42,
            device="gpu",
            verbosity=-1
        )
    )),
    ("XGBoost", MultiOutputRegressor(
        XGBRegressor(
            n_estimators=502,
            learning_rate=0.11155676966879179,
            max_depth=9,
            subsample=0.6886121948086301,
            colsample_bytree=0.6745989387151688,
            gamma=2.1095560682692827,
            min_child_weight=2,
            random_state=42,
            tree_method="hist",
            device="cuda",
            n_jobs=-1,
            verbosity=0
        )
    ))
]


# === 4. Генерация out-of-fold предсказаний ===
n_splits = 5
num_targets = y_train.shape[1]
num_base_models = len(base_models)

oof_train = np.zeros((X_train.shape[0], num_targets * num_base_models))
oof_test = np.zeros((X_test.shape[0], num_targets * num_base_models))

for m_idx, (name, model) in enumerate(base_models):
    print(f"\nProcessing base model: {name}")
    test_preds = np.zeros((X_test.shape[0], num_targets, n_splits))

    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)

    for fold, (tr_idx, val_idx) in enumerate(
            tqdm(kf.split(X_train), total=n_splits, desc=f"{name} folds")
    ):
        X_tr, X_val = X_train[tr_idx], X_train[val_idx]
        y_tr, y_val = y_train[tr_idx], y_train[val_idx]

        model.fit(X_tr, y_tr)
        val_pred = model.predict(X_val)
        test_pred = model.predict(X_test)

        oof_train[val_idx, m_idx * num_targets:(m_idx + 1) * num_targets] = val_pred
        test_preds[:, :, fold] = test_pred

    oof_test[:, m_idx * num_targets:(m_idx + 1) * num_targets] = test_preds.mean(axis=2)

# === 5. Мета-модель (multi-output) со старыми гиперпараметрами ===
final_model = MultiOutputRegressor(
    LGBMRegressor(
        n_estimators=400,
        learning_rate=0.05,
        max_depth=6,
        num_leaves=31,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        device="gpu",
        verbosity=-1
    )
)

print("\nTraining meta-model...")
final_model.fit(oof_train, y_train)
stack_train_preds = final_model.predict(oof_train)
stack_test_preds = final_model.predict(oof_test)


# === 6. Метрики ===
def r2_multi(y_true, y_pred):
    return np.mean([r2_score(y_true[:, i], y_pred[:, i]) for i in range(y_true.shape[1])])


for t in range(num_targets):
    rmse = mean_squared_error(y_test[:, t], stack_test_preds[:, t])
    r2 = r2_score(y_test[:, t], stack_test_preds[:, t])
    print(f"Target {t + 1} RMSE: {rmse:.4f}, R2: {r2:.4f}")

r2_avg = r2_multi(y_test, stack_test_preds)
print(f"\nAverage R2 across all {num_targets} targets: {r2_avg:.4f}")

# === 7. Сохраняем все части модели ===
with open("base_models.pkl", "wb") as f:
    pickle.dump(base_models, f)

with open("final_model.pkl", "wb") as f:
    pickle.dump(final_model, f)

with open("preprocessors.pkl", "wb") as f:
    pickle.dump({
        "imp_X": imp_X,
        "scaler": scaler
    }, f)

print("✅ Модели и препроцессоры сохранены!")

