
import sys
import json
import os

import joblib
import librosa
import numpy as np
import pandas as pd


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

MODEL_FILE = os.path.join(
    BASE_DIR,
    "models",
    "voice_fraud_model.joblib"
)


def extract_features(file_path):
    """Extract the same 18 features used during training."""

    audio, sample_rate = librosa.load(
        file_path,
        sr=None,
        mono=True
    )

    if len(audio) == 0:
        raise ValueError("Audio file is empty.")

    mfcc = librosa.feature.mfcc(
        y=audio,
        sr=sample_rate,
        n_mfcc=13
    )

    mfcc_mean = np.mean(mfcc, axis=1)

    zcr_mean = float(
        np.mean(
            librosa.feature.zero_crossing_rate(audio)
        )
    )

    rms_mean = float(
        np.mean(
            librosa.feature.rms(y=audio)
        )
    )

    centroid_mean = float(
        np.mean(
            librosa.feature.spectral_centroid(
                y=audio,
                sr=sample_rate
            )
        )
    )

    duration = len(audio) / sample_rate

    # Keep these names and values consistent with
    # ml/scripts/extract_features.py.
    features = {
        "sampleRate": int(sample_rate),
        "duration": round(float(duration), 4),
    }

    for index, value in enumerate(mfcc_mean, start=1):
        features[f"mfcc_{index}"] = round(
            float(value), 6
        )

    features["zeroCrossingRate"] = round(
        zcr_mean, 6
    )
    features["rmsEnergy"] = round(
        rms_mean, 6
    )
    features["spectralCentroid"] = round(
        centroid_mean, 4
    )

    return features


def predict(file_path):
    if not os.path.isfile(file_path):
        raise FileNotFoundError("Audio file not found.")

    if not os.path.isfile(MODEL_FILE):
        raise FileNotFoundError(
            f"Trained model not found: {MODEL_FILE}"
        )

    artifact = joblib.load(MODEL_FILE)

    # Current training script saves a dictionary
    # containing both the model and feature columns.
    if isinstance(artifact, dict) and "model" in artifact:
        model = artifact["model"]
        feature_columns = artifact.get("feature_columns")
    else:
        # Support a model saved without the dictionary wrapper.
        model = artifact
        feature_columns = None

    features = extract_features(file_path)

    if not feature_columns:
        if hasattr(model, "feature_names_in_"):
            feature_columns = list(model.feature_names_in_)
        else:
            feature_columns = list(features.keys())

    missing_features = [
        name for name in feature_columns
        if name not in features
    ]

    if missing_features:
        raise ValueError(
            "Missing model features: "
            + ", ".join(missing_features)
        )

    # Use a DataFrame with the training feature names.
    X = pd.DataFrame(
        [[features[name] for name in feature_columns]],
        columns=feature_columns
    )

    prediction = int(model.predict(X)[0])

    probabilities = model.predict_proba(X)[0]
    classes = list(model.classes_)

    if 0 not in classes or 1 not in classes:
        raise ValueError(
            "Model must contain class 0 (real) "
            "and class 1 (synthetic)."
        )

    real_probability = float(
        probabilities[classes.index(0)]
    )

    synthetic_probability = float(
        probabilities[classes.index(1)]
    )

    risk_score = round(
        synthetic_probability * 100, 2
    )

    if risk_score >= 75:
        verdict = "fraud"
    elif risk_score >= 45:
        verdict = "suspicious"
    else:
        verdict = "legitimate"

    return {
        "prediction": prediction,
        "realProbability": round(real_probability, 4),
        "syntheticProbability": round(synthetic_probability, 4),
        "riskScore": risk_score,
        "verdict": verdict
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "message": "Audio file path is required."
        }))
        sys.exit(1)

    try:
        result = predict(sys.argv[1])

        print(json.dumps({
            "success": True,
            "result": result
        }))

    except Exception as error:
        print(json.dumps({
            "success": False,
            "message": str(error)
        }))
        sys.exit(1)
