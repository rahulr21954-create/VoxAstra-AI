import os
import csv
import librosa
import numpy as np


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATASET_DIR = os.path.join(
    BASE_DIR,
    "dataset"
)

FEATURE_DIR = os.path.join(
    BASE_DIR,
    "features"
)

os.makedirs(FEATURE_DIR, exist_ok=True)


def extract_features(file_path):

    audio, sample_rate = librosa.load(
        file_path,
        sr=None,
        mono=True
    )

    # MFCC
    mfcc = librosa.feature.mfcc(
        y=audio,
        sr=sample_rate,
        n_mfcc=13
    )

    mfcc_mean = np.mean(
        mfcc,
        axis=1
    )

    # Zero Crossing Rate
    zcr = librosa.feature.zero_crossing_rate(
        audio
    )

    zcr_mean = float(
        np.mean(zcr)
    )

    # RMS Energy
    rms = librosa.feature.rms(
        y=audio
    )

    rms_mean = float(
        np.mean(rms)
    )

    # Spectral Centroid
    centroid = librosa.feature.spectral_centroid(
        y=audio,
        sr=sample_rate
    )

    centroid_mean = float(
        np.mean(centroid)
    )

    duration = len(audio) / sample_rate

    return [
        int(sample_rate),
        round(float(duration), 4),
        *[
            round(float(value), 6)
            for value in mfcc_mean
        ],
        round(zcr_mean, 6),
        round(rms_mean, 6),
        round(float(centroid_mean), 4)
    ]


def process_split(split):

    split_dir = os.path.join(
        DATASET_DIR,
        split
    )

    output_file = os.path.join(
        FEATURE_DIR,
        f"{split}_features.csv"
    )

    rows = []

    for label_name, label in [
        ("real", 0),
        ("synthetic", 1)
    ]:

        folder = os.path.join(
            split_dir,
            label_name
        )

        if not os.path.exists(folder):
            print(
                f"Folder not found: {folder}"
            )
            continue

        for filename in os.listdir(folder):

            if not filename.lower().endswith(
                (".wav", ".mp3", ".flac")
            ):
                continue

            file_path = os.path.join(
                folder,
                filename
            )

            try:

                features = extract_features(
                    file_path
                )

                rows.append([
                    filename,
                    *features,
                    label
                ])

                print(
                    f"[{split}] "
                    f"{filename} -> {label_name}"
                )

            except Exception as error:

                print(
                    f"Failed: {filename}"
                )

                print(error)

    header = [
        "filename",
        "sampleRate",
        "duration"
    ]

    header += [
        f"mfcc_{i}"
        for i in range(1, 14)
    ]

    header += [
        "zeroCrossingRate",
        "rmsEnergy",
        "spectralCentroid",
        "label"
    ]

    with open(
        output_file,
        "w",
        newline=""
    ) as file:

        writer = csv.writer(file)

        writer.writerow(header)
        writer.writerows(rows)

    print(
        f"\n{split.upper()} completed."
    )

    print(
        f"Samples: {len(rows)}"
    )

    print(
        f"Saved: {output_file}"
    )


def main():

    for split in [
        "train",
        "validation",
        "test"
    ]:

        process_split(split)


if __name__ == "__main__":
    main()