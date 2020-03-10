/*
 * All routes for restaurants are defined here
 * Since this file is loaded in server.js into habitual/restaurants,
 *   these routes are mounted onto /reataurants
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require("express");
const router = express.Router();
const sendMessage = require("../lib/twilio");
const organize = require("../lib/helper");

module.exports = (db, io) => {
  // show all the orders
  router.get("/", (req, res) => {
    req.session["user_id"] = 2;
    req.session["user_type"] = "restaurant";
    db.getAllOrders()
      .then(response => res.render("orders", organize(response)))
      .catch(e => {
        console.error(e);
        res.send(e);
      });
  });

  // get single order by id
  router.get("/:orderid", (req, res) => {
    const id = req.params.orderid;
    db.getOrderById(id).then(response => res.json(organize(response)));
  });

  // place the order
  router.put("/:orderid", (req, res) => {
    const orderId = req.params.orderid;
    const { status, waitTime } = req.body;

    // send sms and emit io event
    db.changeOrderStatus(orderId, status, waitTime)
      .then(() => {
        sendMessage(orderId, status, waitTime);
        io.emit("orderStatusChanged", { status, waitTime });
        res.end();
      })
      .catch(e => {
        console.error(e);
        res.send(e);
      });
  });

  return router;
};
