
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve("uploads", "voice");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${Math.round(
            Math.random() * 1e9
        )}${extension}`;

        cb(null, uniqueName);
    },
});

const allowedMimeTypes = [
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/x-m4a",
    "audio/m4a",
    "audio/aac",
    "audio/ogg",
    "audio/webm",
    "audio/flac",
];

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const allowedExtensions = [
        ".wav",
        ".mp3",
        ".m4a",
        ".aac",
        ".ogg",
        ".webm",
        ".flac",
    ];

    const validExtension = allowedExtensions.includes(extension);
    const validMimeType = allowedMimeTypes.includes(file.mimetype);

    if (validExtension && validMimeType) {
        return cb(null, true);
    }

    const error = new Error(
        "Unsupported audio file. Upload WAV, MP3, M4A, AAC, OGG, WebM, or FLAC."
    );

    error.statusCode = 400;
    return cb(error);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024,
        files: 1,
    },
});
