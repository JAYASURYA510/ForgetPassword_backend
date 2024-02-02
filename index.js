// index.js
import express, { response } from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from "jsonwebtoken"; 
import { authMiddleware } from './Middleware/athu.middleware.js';
import  ConnectDb  from './Database/DbConfig.js'
import  UserModel from './Models/userModel.js'

dotenv.config()

const app = express();

const PORT = process.env.PORT;

app.use(express.json());


app.use(cors({
  origin: 'https://forgetpaswords-fashion-s.netlify.app',
  methods: ["GET","POST"],
  credentials: true,

}));

app.use(cookieParser())

ConnectDb();

// Define User schema
const userSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
//   verificationToken:{
//     type:String
//  },
  

resetToken: String,
  resetTokenExpiration: Date,
  role : {
    type: String,
    default: "visitor"
   }
});

const User = mongoose.model('User', userSchema);






// Signup route
app.post('/signup', async (req, res) => {
  try {
    const {  email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error:'User already exists'});
    }
    

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(("hashpassword", hashedPassword));
// Example usage of bcrypt.hash()

    // Create a new user with hashed password
    const newUser = new User({
     
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error:"Invalid password , please enter a valid password" });
    }

    // Generate a JWT token for the user
        const token = jwt.sign({_id: user._id , role: user.role},
                       process.env.SECTERT_KEY, {expiresIn: '1d'} )
                       res.cookie('token', token)
    // Send the token in the response
    res.status(200).json({ message: "Login successful", token: token });

  } catch (error) {
    console.error({error:"Error during login:"});
    res.status(500).json({ message: "Internal server error" });
  }
})

app.get('/app/users', authMiddleware,  async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error({error: 'Error fetching users'});
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});


// Forgot password route
app.post('/forgot-password', (req, res) => {
    const {email} = req.body;
    User.findOne({email: email})
    .then(user => {
        if(!user) {
            return res.send({Status: "User not existed"})
        } 
        const token = jwt.sign({id: user._id}, process.env.SECTERT_KEY, {expiresIn: "1d"})
        var transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
              },
          });
          
          var mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Reset Password Link',
            text: `https://forgetpaswords-fashion-s.netlify.app/reset-passwod/${id}/${token}`
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              return res.send({Status: "Success"})
            }
          });
    })
})

//reset 
app.post('/reset-password/:id/:token', (req, res) => {
  const {id, token} = req.params
  const {password} = req.body

  jwt.verify(token, process.env.SECTERT_KEY, (err, decoded) => {
      if(err) {
          return res.json({Status: "Error with token"})
      } else {
          bcrypt.hash(password, 10)
          .then(hash => {
              User.findByIdAndUpdate({_id: id}, {password: hash})
              .then(u => res.send({Status: "Success"}))
              .catch(err => res.send({Status: err}))
          })
          .catch(err => res.send({Status: err}))
      }
  })
});


app.get("/", async (req, res) => {
  try {
    res
      .status(313)
      .json({
        message: "APP WORKING is Successfully",
      });
    console.log("singup login forgetpsw athu created successfully.");
  } catch (error) {
    res.status(500).json({ message: " error server starting" });
    console.log("Error");
  }
});



 //start server
 app.listen(PORT, () => console.log(`server started in localhost:${PORT}`));