const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");
const multer = require("multer");
const fs = require("fs");
const User = require("./model/user");
const Place = require("./model/place");
const Booking = require("./model/booking");
require("dotenv").config();
const app = express();

const jwtSecret = "mdjfyux6emc45ck9xmx9w4xv35";

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(
  cors({
    credentials: true,
    origin: "https://airbnb-app-clone-1.netlify.app",
  })
);

mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.URL_MONGODB)
  .then(() => console.log("Connected !"))
  .catch((e) => console.error("Failed !" + e));

app.get("/test", (req, res) => {
  res.json("test ok");
});

// register user
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const saltValue = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(password, saltValue);
    const userDoc = await User.create({
      username,
      email,
      password: hashed,
    });
    res.status(200).json(userDoc);
  } catch (e) {
    res.status(422).json("faild");
  }
});

// login user
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });

  try {
    if (userDoc) {
      const passOk = bcrypt
        .compare(password, userDoc.password)
        .then((result) => result);

      if (passOk) {
        jwt.sign(
          {
            email: userDoc.email,
            id: userDoc._id,
          },
          jwtSecret,
          {},
          (err, token) => {
            if (err) throw err;
            res.cookie("token", token).json(userDoc);
          }
        );
      } else {
        res.status(422).json("wrong password");
      }
    } else {
      res.status(422).json("not found");
    }
  } catch (error) {
    res.status(422).json("faild" + error);
  }
});

app.get("/profile", async (req, res) => {
  const { token } = req.cookies;

  try {
    if (token) {
      jwt.verify(token, jwtSecret, {}, async (err, user) => {
        if (err) throw err;
        const { username, email, _id } = await User.findById(user.id);
        res.json({ username, email, _id });
      });
    }
  } catch (err) {
    res.status(422).json("faild " + err);
  }
});

app.post("/loggout", (req, res) => {
  res.cookie("token", "").json(true);
});

app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;

  const newName = "photo" + Date.now() + ".jpg";
  await imageDownloader.image({
    url: link,
    dest: __dirname + "/uploads/" + newName,
  });
  res.json(newName);
});

const upload = multer({ dest: "uploads/" });
app.post("/upload", upload.array("photos", 100), (req, res) => {
  const uploadFiles = [];
  const files = req.files;
  for (let i = 0; i < files.length; i++) {
    const { path, originalname } = files[i];
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);

    uploadFiles.push(newPath.replace("uploads\\", ""));
  }

  res.json(uploadFiles);
});

app.post("/place", (req, res) => {
  const { token } = req.cookies;
  const {
    title,
    address,
    photos,
    description,
    perks,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;

  jwt.verify(token, jwtSecret, {}, async (err, user) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      onwer: user.id,
      title,
      address,
      photos,
      description,
      perks,
      checkIn,
      checkOut,
      maxGuests,
      price,
    });

    res.status(200).json(placeDoc);
  });
});

app.get("/user-places", async (req, res) => {
  const { token } = req.cookies;

  jwt.verify(token, jwtSecret, {}, async (err, user) => {
    if (err) throw err;
    const { id } = user;
    const places = await Place.find({ onwer: id });
    res.json(places);
  });
});

app.get("/places/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const placeDoc = await Place.findOne({ _id: id });
    res.status(200).json(placeDoc);
  } catch (err) {
    res.status(404).json("not found");
  }
});

app.put("/place", async (req, res) => {
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    photos,
    description,
    perks,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;

  jwt.verify(token, jwtSecret, {}, async (err, user) => {
    if (err) throw err;

    const placeDoc = await Place.findById(id);

    if (user.id === placeDoc.onwer.toString()) {
      placeDoc.set({
        title,
        address,
        photos,
        description,
        perks,
        checkIn,
        checkOut,
        maxGuests,
        price,
      });
      await placeDoc.save();
      res.status(200).json(placeDoc);
    }
  });
});

app.get("/places", async (req, res) => {
  res.json(await Place.find());
});

app.post("/booking", async (req, res) => {
  const { checkIn, checkOut, numberGuests, fullName, phone, place, price } =
    req.body;
  const { token } = req.cookies;

  try {
    jwt.verify(token, jwtSecret, {}, async (err, user) => {
      if (err) throw err;
      const bookingDoc = await Booking.create({
        checkIn,
        checkOut,
        numberGuests,
        fullName,
        phone,
        place,
        price,
        user: user.id,
      });
      res.status(200).json(bookingDoc);
    });
  } catch (err) {
    res.status(404).json("faild");
  }
});

app.get("/bookings", async (req, res) => {
  const { token } = req.cookies;

  try {
    jwt.verify(token, jwtSecret, {}, async (err, user) => {
      if (err) throw err;

      const bookings = await Booking.find({ user: user.id })
        .populate("place")
        .exec();
      res.status(200).json(bookings);
    });
  } catch (error) {
    res.status(404).json(error);
  }
});

app.listen(4000);
// DVZoMlggnrn1HBAi
// en7GN38ypvGmBetk

// herokue password QpT5^@^wxf.huV3
