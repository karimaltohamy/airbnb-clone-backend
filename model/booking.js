const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  place: { type: mongoose.Schema.Types.ObjectId, ref: "Place", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  numberGuests: { type: Number, required: true },
  fullName: { type: String, required: true },
  phone: { type: Number, required: true },
  price: { type: Number, required: true },
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
