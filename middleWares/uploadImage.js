const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = function (req, file, cb) {
  if (!file.mimetype.match(/image\/(jpeg|jpg|png|gif|webp)$/)) {
    return cb(
      new Error("Only .jpeg, .jpg, .png, or .gif formats allowed!"),
      false
    );
  }

  cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
