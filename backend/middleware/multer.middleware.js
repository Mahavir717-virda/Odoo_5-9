import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // temporary storage folder
  },
  filename: function (req, file, cb) {
    // Unique file name to avoid collisions
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
