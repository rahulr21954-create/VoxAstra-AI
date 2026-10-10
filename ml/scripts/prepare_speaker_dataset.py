import os
import shutil


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATASET_DIR = os.path.join(
    BASE_DIR,
    "dataset"
)

SOURCE_DIR = os.path.join(
    DATASET_DIR,
    "source"
)


# Speaker-level split
# Same speaker must belong to only one split.

SPEAKER_SPLIT = {
    "train": [
        "speaker01",
        "speaker02",
        "speaker03",
        "speaker04",
        "speaker05",
        "speaker06"
    ],

    "validation": [
        "speaker07"
    ],

    "test": [
        "speaker08"
    ]
}


SYNTHETIC_SPLIT = {
    "train": [
        "synthetic01",
        "synthetic02",
        "synthetic03",
        "synthetic04",
        "synthetic05",
        "synthetic06"
    ],

    "validation": [
        "synthetic07"
    ],

    "test": [
        "synthetic08"
    ]
}


def find_source_file(folder, prefix):

    if not os.path.exists(folder):
        return None

    for filename in os.listdir(folder):

        name, extension = os.path.splitext(
            filename
        )

        if name == prefix:

            return os.path.join(
                folder,
                filename
            )

    return None


def copy_file(source_file, label, split):

    destination_folder = os.path.join(
        DATASET_DIR,
        split,
        label
    )

    os.makedirs(
        destination_folder,
        exist_ok=True
    )

    filename = os.path.basename(
        source_file
    )

    destination = os.path.join(
        destination_folder,
        filename
    )

    shutil.copy2(
        source_file,
        destination
    )

    print(
        f"{label:10} | "
        f"{split:10} | "
        f"{filename}"
    )


def process_label(label, split_map):

    source_folder = os.path.join(
        SOURCE_DIR,
        label
    )

    print(
        f"\n========== {label.upper()} =========="
    )

    for split, speakers in split_map.items():

        for speaker in speakers:

            source_file = find_source_file(
                source_folder,
                speaker
            )

            if source_file is None:

                print(
                    f"Missing: "
                    f"{label}/{speaker}"
                )

                continue

            copy_file(
                source_file,
                label,
                split
            )


def main():

    print("=" * 60)
    print("VOXASTRA SPEAKER-LEVEL DATASET SPLIT")
    print("=" * 60)

    process_label(
        "real",
        SPEAKER_SPLIT
    )

    process_label(
        "synthetic",
        SYNTHETIC_SPLIT
    )

    print("\nDataset split completed.")


if __name__ == "__main__":
    main()