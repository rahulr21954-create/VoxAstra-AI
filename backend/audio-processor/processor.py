import sys
import json
import wave
import os


def analyze_audio(file_path):

    if not os.path.exists(file_path):
        raise FileNotFoundError("Audio file not found")

    with wave.open(file_path, "rb") as audio:

        channels = audio.getnchannels()
        sample_width = audio.getsampwidth()
        sample_rate = audio.getframerate()
        frames = audio.getnframes()

        duration = frames / float(sample_rate)

    return {
        "channels": channels,
        "sampleWidth": sample_width,
        "sampleRate": sample_rate,
        "frames": frames,
        "duration": round(duration, 3)
    }


if __name__ == "__main__":

    file_path = sys.argv[1]

    try:
        result = analyze_audio(file_path)

        print(json.dumps({
            "success": True,
            "audio": result
        }))

    except Exception as error:

        print(json.dumps({
            "success": False,
            "message": str(error)
        }))