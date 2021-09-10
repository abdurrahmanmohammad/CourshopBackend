const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const { v4: uuidv4 } = require("uuid");

module.exports.checkout = catchAsync(async (req, res) => {
  //console.log("Request:", req.body);
  let error;
  let status;
  try {
    const { order, token } = req.body;
    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id,
    });

    const idempotencyKey = uuidv4();
    //console.log(order);
    const charge = await stripe.charges.create(
      {
        amount: order.totalPrice * 100,
        description: `Courshop Order: ${order._id}`,
        currency: "usd",
        customer: customer.id,
        receipt_email: token.email,
        shipping: {
          name: token.card.name,
          address: {
            line1: token.card.address_line1,
            line2: token.card.address_line2,
            city: token.card.address_city,
            country: token.card.address_country,
            postal_code: token.card.address_zip,
          },
        },
      },
      {
        idempotencyKey,
      }
    );
    console.log("Charge:", { charge });
    status = "success";
  } catch (error) {
    console.error("Error:", error);
    status = "failure";
  }

  res.json({ error, status });
});

module.exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently ordered product
  const product = await Product.findById(req.params.productId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    // success_url: `${req.protocol}://${req.get('host')}/my-products/?product=${
    //   req.params.productId
    // }&user=${req.user.id}&price=${product.price}`,
    success_url: `${req.protocol}://${req.get("host")}/my-products?alert=order`,
    cancel_url: `${req.protocol}://${req.get("host")}/product/${product.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.productId,
    line_items: [
      {
        name: `${product.name} Product`,
        description: product.summary,
        images: [
          `${req.protocol}://${req.get("host")}/img/products/${
            product.imageCover
          }`,
        ],
        amount: product.price * 100,
        currency: "usd",
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: "success",
    session,
  });
});

const createOrderCheckout = async (session) => {
  const product = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.display_items[0].amount / 100;
  await Order.create({ product, user, price });
};

module.exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed")
    createOrderCheckout(event.data.object);

  res.status(200).json({ received: true });
  f;
};

module.exports.getMine = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.send(orders);
});

module.exports.getMyOrder = catchAsync(async (req, res) => {
  const orders = await Order.findById(req.params.id).find({
    user: req.user._id,
  });
  res.send(orders[0]);
});

module.exports.updateProducts = catchAsync(async (req, res, next) => {
  const orderItems = req.body.orderItems;
  for (const orderItem of orderItems) {
    await Product.findByIdAndUpdate(orderItem.product, {
      $inc: { countInStock: -orderItem.quantity },
    });
  }
  next();
});

module.exports.createOrder = factory.createOne(Order);
module.exports.getOrder = factory.getOne(Order);
module.exports.getAllOrders = factory.getAll(Order);
module.exports.updateOrder = factory.updateOne(Order);
module.exports.deleteOrder = factory.deleteOne(Order);
