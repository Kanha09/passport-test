const express = require("express")
const mongoose = require("mongoose")
const app = express()
const dotenv = require("dotenv")
const session = require("express-session")
const passport = require("passport")
const cors = require("cors")
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require("../models/User")
dotenv.config()

mongoose.connect(process.env.MONGO_URI,{useUnifiedTopology: true,  useNewUrlParser: true },()=>{
    console.log("connection successful")
})



app.set("view engine", "ejs")
//middleware
app.use(express.json())
app.use(cors({origin: "http://localhost:3000/", credentials: true}))
app.use(
    session({
        secret: "secretcode",
        resave: true,
        saveUninitialized: true
    })
)
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => {
    return done(null, user)
})

passport.deserializeUser((user, done) => {
    return done(null, user)
})

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
      User.findOne({googleId: profile.id}, async (err, doc) => {
        if (err){
            return cb(err, null)
        }  
    
        if (!doc){
             const newUser = new User({
               googleId: profile.id,
               firstName: profile.name.givenName,
               lastName: profile.name.familyName,
               createdAt : new Date()
            
             })
             await newUser.save()
             cb(null, newUser)
          }
          cb(null, doc)
      } )
 
 }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/login')
})

app.get("/", (req, res)=> { 
    res.send("Hello")
})
app.get("/login", (req, res)=> { 
    res.render("login")
})

app.listen(process.env.PORT || 3000 ,() => {console.log("Server started") } )