const multer = require("multer");
const sharp = require("sharp");
const Product = require("./../models/productModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const AppError = require("../utils/appError");

// #################### Image Upload ####################
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("Not an image! Please upload only images.", 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

module.exports.uploadProductImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

// upload.single('image') req.file
// upload.array('images', 5) req.files

module.exports.resizeProductImages = catchAsync(async (req, res, next) => {
  //if (!req.files.imageCover || !req.files.images) return next();

  if (!req?.files?.imageCover) return next();

  // 1) Cover image
  req.body.imageCover = `uploads/product-${
    req.params.id
  }-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`${req.body.imageCover}`);

  console.log(req.body.imageCover);
  /*
  // 2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `product-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`uploads/${filename}`);
      req.body.images.push(filename);
    })
  );
  */
  next();
});

// #################### CRUD ####################
module.exports.getAllProducts = factory.getAll(Product);
module.exports.getProduct = factory.getOne(Product);
module.exports.createProduct = factory.createOne(Product);
module.exports.updateProduct = factory.updateOne(Product);
module.exports.deleteProduct = factory.deleteOne(Product);
