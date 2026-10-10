import os
import pandas as pd
import joblib

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

FEATURE_DIR = os.path.join(
    BASE_DIR,
    "features"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)

os.makedirs(MODEL_DIR, exist_ok=True)


TRAIN_FILE = os.path.join(
    FEATURE_DIR,
    "train_features.csv"
)

VALIDATION_FILE = os.path.join(
    FEATURE_DIR,
    "validation_features.csv"
)


# ==============================
# LOAD DATA
# ==============================

print("\nLoading training data...")

train_df = pd.read_csv(TRAIN_FILE)
validation_df = pd.read_csv(VALIDATION_FILE)

print(f"Training samples   : {len(train_df)}")
print(f"Validation samples : {len(validation_df)}")


# ==============================
# BASIC VALIDATION
# ==============================

if train_df.empty:
    raise ValueError(
        "Training dataset is empty."
    )

if validation_df.empty:
    raise ValueError(
        "Validation dataset is empty."
    )


train_classes = sorted(
    train_df["label"].unique().tolist()
)

validation_classes = sorted(
    validation_df["label"].unique().tolist()
)


print(
    f"Training classes   : {train_classes}"
)

print(
    f"Validation classes : {validation_classes}"
)


if len(train_classes) < 2:
    raise ValueError(
        "Training dataset must contain both "
        "real (0) and synthetic (1) samples."
    )

if len(validation_classes) < 2:
    raise ValueError(
        "Validation dataset must contain both "
        "real (0) and synthetic (1) samples."
    )


# ==============================
# FEATURES / LABEL
# ==============================

X_train = train_df.drop(
    columns=["filename", "label"]
)

y_train = train_df["label"]


X_validation = validation_df.drop(
    columns=["filename", "label"]
)

y_validation = validation_df["label"]


print(
    f"Features used: {X_train.shape[1]}"
)


# ==============================
# MODEL
# ==============================

model = Pipeline([
    (
        "scaler",
        StandardScaler()
    ),

    (
        "classifier",
        LogisticRegression(
            max_iter=2000,
            random_state=42
        )
    )
])


# ==============================
# TRAIN
# ==============================

print("\nTraining model...")

model.fit(
    X_train,
    y_train
)

print("Training completed.")


# ==============================
# VALIDATION
# ==============================

print("\nEvaluating validation data...")

predictions = model.predict(
    X_validation
)


accuracy = accuracy_score(
    y_validation,
    predictions
)

precision = precision_score(
    y_validation,
    predictions,
    zero_division=0
)

recall = recall_score(
    y_validation,
    predictions,
    zero_division=0
)

f1 = f1_score(
    y_validation,
    predictions,
    zero_division=0
)


print("\n" + "=" * 45)
print("VALIDATION RESULTS")
print("=" * 45)

print(
    f"Accuracy  : {accuracy:.4f}"
)

print(
    f"Precision : {precision:.4f}"
)

print(
    f"Recall    : {recall:.4f}"
)

print(
    f"F1 Score  : {f1:.4f}"
)


print("\nClassification Report:")

print(
    classification_report(
        y_validation,
        predictions,
        target_names=[
            "Real",
            "Synthetic"
        ],
        zero_division=0
    )
)


# ==============================
# CONFUSION MATRIX
# ==============================

matrix = confusion_matrix(
    y_validation,
    predictions
)

print("\nConfusion Matrix:")

print(matrix)


# ==============================
# SAVE MODEL
# ==============================

MODEL_FILE = os.path.join(
    MODEL_DIR,
    "voice_fraud_model.joblib"
)

joblib.dump(
    model,
    MODEL_FILE
)

print(
    "\nModel saved successfully:"
)

print(
    MODEL_FILE
)