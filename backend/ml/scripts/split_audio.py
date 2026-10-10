import os
import librosa
import soundfile as sf


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATASET_DIR = os.path.join(
    BASE_DIR,
    "dataset"
)

SEGMENT_DURATION = 8


def split_audio(input_file, output_folder, prefix):

    os.makedirs(output_folder, exist_ok=True)

    audio, sample_rate = librosa.load(
        input_file,
        sr=None,
        mono=True
    )

    samples_per_segment = int(
        SEGMENT_DURATION * sample_rate
    )

    total_segments = len(audio) // samples_per_segment

    print(f"\nProcessing: {input_file}")
    print(f"Sample rate: {sample_rate}")
    print(f"Duration: {len(audio) / sample_rate:.2f}s")
    print(f"Segments: {total_segments}")

    for i in range(total_segments):

        start = i * samples_per_segment
        end = start + samples_per_segment

        segment = audio[start:end]

        output_file = os.path.join(
            output_folder,
            f"{prefix}_{i + 1:02d}.wav"
        )

        sf.write(
            output_file,
            segment,
            sample_rate
        )

        print(f"Created: {output_file}")


def main():

    real_input = os.path.join(
        DATASET_DIR,
        "train",
        "real",
        "speaker01_real_01.wav"
    )

    synthetic_input = os.path.join(
        DATASET_DIR,
        "train",
        "synthetic",
        "synthetic01_01.wav"
    )

    real_output = os.path.join(
        DATASET_DIR,
        "train",
        "real"
    )

    synthetic_output = os.path.join(
        DATASET_DIR,
        "train",
        "synthetic"
    )

    # Create real segments
    split_audio(
        real_input,
        real_output,
        "speaker01_real"
    )

    # Create synthetic segments
    split_audio(
        synthetic_input,
        synthetic_output,
        "synthetic01"
    )


if __name__ == "__main__":
    main()da