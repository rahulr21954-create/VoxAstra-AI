import os
import soundfile as sf


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

SOURCE_DIR = os.path.join(
    BASE_DIR,
    "dataset",
    "source"
)

LABELS = [
    "real",
    "synthetic"
]


MIN_DURATION = 5
MAX_DURATION = 60


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


def validate_audio(file_path):

    try:

        info = sf.info(file_path)

        duration = info.duration

        if duration < MIN_DURATION:

            return False, (
                f"Too short: "
                f"{duration:.2f}s"
            )

        if duration > MAX_DURATION:

            return False, (
                f"Too long: "
                f"{duration:.2f}s"
            )

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

    total_valid = 0
    total_invalid = 0

    print("=" * 60)
    print("VOXASTRA SOURCE DATASET CHECK")
    print("=" * 60)

    for label in LABELS:

        folder = os.path.join(
            SOURCE_DIR,
            label
        )

        print(
            f"\n[{label.upper()}]"
        )

        if not os.path.exists(folder):

            print(
                f"Folder missing: {folder}"
            )

            continue

        files = get_audio_files(folder)

        if not files:

            print("No audio files")
            continue

        valid_count = 0
        invalid_count = 0

        for filename in files:

            file_path = os.path.join(
                folder,
                filename
            )

            valid, message = validate_audio(
                file_path
            )

            if valid:

                print(
                    f"OK   {filename} -> {message}"
                )

                valid_count += 1
                total_valid += 1

            else:

                print(
                    f"FAIL {filename} -> {message}"
                )

                invalid_count += 1
                total_invalid += 1

        print(
            f"\n{label.capitalize()} summary:"
        )

        print(
            f"Valid   : {valid_count}"
        )

        print(
            f"Invalid : {invalid_count}"
        )

    print("\n" + "=" * 60)
    print("FINAL SUMMARY")
    print("=" * 60)

    print(
        f"Valid source files   : {total_valid}"
    )

    print(
        f"Invalid source files : {total_invalid}"
    )

    if total_invalid == 0 and total_valid > 0:

        print(
            "\nSource dataset is valid."
        )

    elif total_valid == 0:

        print(
            "\nNo valid source audio found."
        )

    else:

        print(
            "\nRemove/fix invalid files "
            "before continuing."
        )


if __name__ == "__main__":
    main()