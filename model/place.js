const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  onwer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  address: String,
  photos: [String],
  description: String,
  perks: [String],
  checkIn: String,
  checkOut: String,
  maxGuests: String,
  price: Number,
});

const Place = mongoose.model("Place", placeSchema);

module.exports = Place;
