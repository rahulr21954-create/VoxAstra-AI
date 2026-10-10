import os
import numpy as np
from scipy.io.wavfile import write


def create_audio(path, frequency):
    sample_rate = 16000
    duration = 3

    t = np.linspace(
        0,
        duration,
        int(sample_rate * duration),
        endpoint=False
    )

    audio = 0.3 * np.sin(
        2 * np.pi * frequency * t
    )

    audio = np.int16(
        audio * 32767
    )

    os.makedirs(
        os.path.dirname(path),
        exist_ok=True
    )

    write(
        path,
        sample_rate,
        audio
    )

    print(f"Created: {path}")


create_audio(
    "ml/dataset/train/real/test_real.wav",
    220
)

create_audio(
    "ml/dataset/train/synthetic/test_synthetic.wav",
    440
)