import os
import soundfile as sf


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATASET_DIR = os.path.join(
    BASE_DIR,
    "dataset"
)

SPLITS = [
    "train",
    "validation",
    "test"
]

LABELS = [
    "real",
    "synthetic"
]


def get_audio_files(folder):

    if not os.path.exists(folder):
        return []

    return sorted([
        file
        for file in os.listdir(folder)
        if file.lower().endswith(
            (".wav", ".flac", ".mp3")
        )
    ])


def check_audio(file_path):

    try:

        info = sf.info(file_path)

        duration = info.duration

        if duration < 3:
            return False, f"Too short: {duration:.2f}s"

        if duration > 15:
            return False, f"Too long: {duration:.2f}s"

        if info.channels > 2:
            return False, (
                f"Too many channels: "
                f"{info.channels}"
            )

        return True, (
            f"{info.samplerate} Hz | "
            f"{info.channels} ch | "
            f"{duration:.2f}s | "
            f"{info.format}"
        )

    except Exception as error:

        return False, str(error)


def main():

    grand_total = 0
    grand_valid = 0
    grand_invalid = 0

    for split in SPLITS:

        print("\n" + "=" * 50)
        print(f"{split.upper()} DATASET")
        print("=" * 50)

        split_counts = {}

        for label in LABELS:

            folder = os.path.join(
                DATASET_DIR,
                split,
                label
            )

            files = get_audio_files(folder)

            valid_count = 0
            invalid_count = 0

            print(f"\n[{label.upper()}]")

            if not files:
                print("No audio files")
                split_counts[label] = 0
                continue

            for filename in files:

                file_path = os.path.join(
                    folder,
                    filename
                )

                valid, message = check_audio(
                    file_path
                )

                if valid:

                    print(
                        f"OK   {filename} -> {message}"
                    )

                    valid_count += 1
                    grand_valid += 1

                else:

                    print(
                        f"FAIL {filename} -> {message}"
                    )

                    invalid_count += 1
                    grand_invalid += 1

            split_counts[label] = valid_count

            grand_total += len(files)

            print(
                f"Valid: {valid_count} | "
                f"Invalid: {invalid_count}"
            )

        real_count = split_counts.get(
            "real",
            0
        )

        synthetic_count = split_counts.get(
            "synthetic",
            0
        )

        print(
            f"\n{split.capitalize()} balance:"
        )

        print(
            f"Real      : {real_count}"
        )

        print(
            f"Synthetic : {synthetic_count}"
        )

        if real_count == synthetic_count:

            print("Balance   : GOOD")

        else:

            print("Balance   : IMBALANCED")

    print("\n" + "=" * 50)
    print("FINAL DATASET SUMMARY")
    print("=" * 50)

    print(
        f"Total files checked : {grand_total}"
    )

    print(
        f"Valid files         : {grand_valid}"
    )

    print(
        f"Invalid files       : {grand_invalid}"
    )


if __name__ == "__main__":
    main()