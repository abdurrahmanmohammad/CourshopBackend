const multer = require("multer");
const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}.jpg`);
  },
});

const upload = multer({ storage });

router.post(
  "/",
  authController.protect,
  authController.restrictTo("admin"),
  upload.single("image"),
  (req, res) => {
    res.send(`/${req.file.path}`);
  }
);

module.exports = router;
