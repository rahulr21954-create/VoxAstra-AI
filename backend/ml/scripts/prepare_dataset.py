import os
import shutil
import random


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATASET_DIR = os.path.join(
    BASE_DIR,
    "dataset"
)

random.seed(42)


SPLITS = {
    "train": 0.70,
    "validation": 0.15,
    "test": 0.15
}


def get_files(folder):

    if not os.path.exists(folder):
        return []

    return [
        file
        for file in os.listdir(folder)
        if file.lower().endswith(".wav")
    ]


def split_files(files):

    random.shuffle(files)

    total = len(files)

    train_end = int(
        total * SPLITS["train"]
    )

    validation_end = train_end + int(
        total * SPLITS["validation"]
    )

    return {
        "train": files[:train_end],
        "validation": files[
            train_end:validation_end
        ],
        "test": files[
            validation_end:
        ]
    }


def prepare_label(label):

    source_folder = os.path.join(
        DATASET_DIR,
        "source",
        label
    )

    if not os.path.exists(source_folder):

        print(
            f"Source folder missing: "
            f"{source_folder}"
        )

        return

    files = get_files(source_folder)

    if not files:

        print(
            f"No files found for {label}"
        )

        return

    print(
        f"\n{label.upper()} files: {len(files)}"
    )

    split_data = split_files(files)

    for split, split_files_list in split_data.items():

        destination_folder = os.path.join(
            DATASET_DIR,
            split,
            label
        )

        os.makedirs(
            destination_folder,
            exist_ok=True
        )

        for filename in split_files_list:

            source = os.path.join(
                source_folder,
                filename
            )

            destination = os.path.join(
                destination_folder,
                filename
            )

            shutil.copy2(
                source,
                destination
            )

        print(
            f"{split}: "
            f"{len(split_files_list)} files"
        )


def main():

    print("=" * 50)
    print("VOXASTRA DATASET PREPARATION")
    print("=" * 50)

    prepare_label("real")
    prepare_label("synthetic")

    print("\nDataset preparation completed.")


if __name__ == "__main__":
    main()