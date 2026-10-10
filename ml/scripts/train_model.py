
import os
import pandas as pd
import joblib

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

FEATURE_DIR = os.path.join(BASE_DIR, "features")
MODEL_DIR = os.path.join(BASE_DIR, "models")
TRAIN_FILE = os.path.join(FEATURE_DIR, "train_features.csv")
MODEL_FILE = os.path.join(MODEL_DIR, "voice_fraud_model.joblib")

os.makedirs(MODEL_DIR, exist_ok=True)

if not os.path.exists(TRAIN_FILE):
    raise FileNotFoundError(
        f"Training features not found: {TRAIN_FILE}. "
        "Run extract_features.py first."
    )

df = pd.read_csv(TRAIN_FILE)

if df.empty:
    raise ValueError("Training dataset is empty.")

if "label" not in df.columns or "filename" not in df.columns:
    raise ValueError("CSV must contain filename and label columns.")

feature_columns = [
    column for column in df.columns
    if column not in ("filename", "label")
]

X = df[feature_columns].apply(pd.to_numeric, errors="coerce")
y = pd.to_numeric(df["label"], errors="coerce")

valid_rows = X.notna().all(axis=1) & y.notna()
X = X.loc[valid_rows]
y = y.loc[valid_rows].astype(int)

if len(X) == 0:
    raise ValueError("No valid training rows found.")

if set(y.unique()) != {0, 1}:
    raise ValueError(
        "Training data must contain both labels: "
        "0 = real, 1 = synthetic."
    )

model = Pipeline([
    ("scaler", StandardScaler()),
    ("classifier", LogisticRegression(
        max_iter=2000,
        random_state=42
    ))
])

model.fit(X, y)

# Keep the feature order for consistent prediction.
artifact = {
    "model": model,
    "feature_columns": feature_columns
}

joblib.dump(artifact, MODEL_FILE)

print(f"Training samples: {len(X)}")
print(f"Feature count: {len(feature_columns)}")
print(f"Model saved: {MODEL_FILE}")
print(
    "WARNING: This is a development prototype. "
    "Two training samples are not sufficient for reliable fraud detection."
)
