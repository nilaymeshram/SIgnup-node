import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose
  .connect("mongodb://127.0.0.1:27017", { dbName: "backend" })
  .then(() => {
    console.log("connected to Database Successfully");
  })
  .catch((e) => {
    console.log(e);
  });

const userSchema = mongoose.Schema({
  Name: String,
  Email: String,
  Password: String,
});

const User = new mongoose.model("User", userSchema);

const app = express();
const users = [];
//using middlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "afavafvaf");
    //console.log(decoded);/* for geting decoded data in console */
    req.user = await User.findById(decoded._id);
    /*re.user-- for saving user details forever */
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  //console.log(req.user);/*check if same user getting database and terminal */
  res.render("logout", { Name: req.user.Name });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    res.render("logout");
  } else {
    res.render("login");
  }
});

app.post("/login", async (req, res) => {
  const { Email, Password } = req.body;
  let user = await User.findOne({ Email });
  if (!user) return res.redirect("/register");
  const isMatch = await bcrypt.compare(Password, user.Password);
  if (!isMatch)
    return res.render("login", { Email, message: "Incorrect Password" });
  const token = jwt.sign({ _id: user._id }, "afavafvaf");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});
app.post("/register", async (req, res) => {
  const { Name, Email, Password } = req.body;
  let user = await User.findOne({ Email });
  if (user) {
    //;/ if (!user) {return console.log("register first")}*for checking if user exist in database */

    return res.redirect("/login");
    /*make register.ejs page */
  }
  const hashedPassword = await bcrypt.hash(Password, 10);
  user = await User.create({ Name, Email, Password: hashedPassword });
  const token = jwt.sign({ _id: user._id }, "afavafvaf");
  //console.log(token);
  /*you can console.log the below line and comment out 
  //res.cookie("token", user._id, {
  //httpOnly: true,
  //expires: new Date(Date.now() + 60 * 1000),
  //});
  and 
  1.in browser login with data you will get token in vs code terminal 
  2. copy token from terminal and go to jwt.io website and paste, will get same userid as mongo database*/

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.listen(5000, () => console.log("server is working"));
