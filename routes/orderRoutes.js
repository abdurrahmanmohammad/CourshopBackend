const express = require("express");
const orderController = require("../controllers/orderController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router.get("/mine", orderController.getMine);
router.get("/mine/:id", orderController.getMyOrder);

router.get("/checkout-session/:tourId", orderController.getCheckoutSession);
router.post(
  "/checkout",
  orderController.updateProducts,
  orderController.createOrder
);

router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(orderController.getAllOrders)
  .post(orderController.updateProducts, orderController.createOrder);

router
  .route("/:id")
  .get(orderController.getOrder)
  .patch(orderController.updateOrder)
  .delete(orderController.deleteOrder);

module.exports = router;
