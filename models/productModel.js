const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A product must have a name"],
      unique: true,
      trim: true,
      maxlength: [
        20,
        "A product name must have less or equal then 20 characters",
      ],
    },
    slug: String,
    brand: {
      type: String,
      required: [true, "A product must have a brand"],
    },
    category: {
      type: String,
      required: [true, "A product must have a category"],
    },
    countInStock: {
      type: Number,
      required: [true, "A product must have a count in stock"],
    },
    price: {
      type: Number,
      required: [true, "A product must have a price"],
    },
    description: {
      type: String,
      trim: true,
      required: [true, "A product must have a description"],
    },
    imageCover: {
      type: String,
      required: [true, "A product must have a cover image"],
    },
    images: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index({ price: 1 });
productSchema.index({ slug: 1 });

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
productSchema.pre("save", function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
