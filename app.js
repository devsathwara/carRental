//load modules
const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const formidable = require('formidable');
const socketIO = require('socket.io');
const http = require('http');
// const router = express.Router(); 
// init app
const app = express();
//setup body parser diddleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//configuration for authentication
app.use(cookieParser());
app.use(session({
    secret: 'mysecret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
//load helpers
const {requireLogin,ensureGuest} = require('./helpers/authHelper');
const {upload} = require('./helpers/aws');
//load passport
require('./passport/local');
//make user as a global object
app.use((req,res,next) =>{
    res.locals.user = req.user || null;
    next();
});
//load files
const keys = require('./config/keys');
//load stripe
const stripe = require('stripe')(keys.StripeSecretKey);
//load user collection
const User = require('./models/user');
const Contact = require('./models/contact');
const Car = require('./models/car');
const Budjet = require('./models/budjet');
// const passport = require('passport');
//connect to mongodb
mongoose.connect('mongodb://localhost:27017/[test]', keys.MongoDB, (err) => {
    if (err) {
        console.log(err);
    }
    console.log('connected to mongodb');
});
//setup engin
app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
        },
    }));
app.set('view engine', 'handlebars');
//connect client side to serve css and js files
app.use(express.static('public'));
// create port
var port = process.env.PORT || 3000;
//handle home modules
app.get('/',ensureGuest,(req, res) => {
    res.render('home');
});
app.get('/about',ensureGuest,(req, res) => {
    res.render('about', {
        title: 'About'
    });
});
app.get('/contact',requireLogin,(req, res) => {
    res.render('contact', {
        title: 'Contact us'
    });
});
//save contact form data
app.post('/contact',(req, res) => {
    console.log(req.body);
    const newContact = {
        name: req.user._id,
        message: req.body.message
    }
    new Contact(newContact).save((err, user) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("We recieved message from user", user);
        }
    })
});

app.get('/signup',ensureGuest,(req, res) => {
    res.render('signupForm', {
        title: 'Register'
    })
});

app.post('/signup',ensureGuest,(req, res) => {
    console.log(req.body);
    let errors = [];
    if (req.body.password !== req.body.password2) {
        errors.push({
            text: 'Password does not match!'
        });
    }
    if (req.body.password.length < 5) {
        errors.push({ text: 'Password must be atleast 5 characrters!' });

    }
    if (errors.length > 0) {
        res.render('signupForm', {
            errors: errors,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            password: req.body.password,
            password2: req.body.password2,
            email: req.body.email
        })
    }
    else {
        User.findOne({ email: req.body.email })
            .then((user) => {
                if (user) {
                    let errors = [];
                    errors.push({ text: 'Email already exist' });
                    res.render('signupForm', {
                        errors: errors,
                        firstname: req.body.firstname,
                        lastname: req.body.lastname,
                        password: req.body.password,
                        password2: req.body.password2,
                        email: req.body.email
                    });
                } else {
                    //encrypt password
                    let salt = bcrypt.genSaltSync(10);
                    let hash = bcrypt.hashSync(req.body.password, salt);

                    const newUser = {
                        firstname: req.body.firstname,
                        lastname: req.body.lastname,
                        email: req.body.email,
                        password: hash
                    };
                    new User(newUser).save((err, user) => {
                        if (err) {
                            console.log(err);
                        }
                        if (user) {
                            let success = [];
                            success.push({
                                text:'You successfully created account! YOu can login now'
                            });
                            res.render('loginForm',{
                                success:success
                            });
                        }
                    })
                }
            })
        }
});
app.get('/displayLoginForm',ensureGuest,(req,res) =>{
    res.render('loginForm');
    title :'Login'
});
app.get('/login', passport.authenticate('local',{
    successRedirect: '/profile',
    failureRedirect : '/loginErrors'
}));
//display profile
app.get('/profile',requireLogin,(req,res,user)=>{
    User.findById({_id:req.user._id}).then((user)=>{
        res.render('profile',{
            user:user,
            title: 'Profile'
        });
    });
});
app.get('/loginErrors',(req,res)=>{
    let errors =[];
    errors.push({text :'User not found or Password incorrect'});
    res.render('loginForm',{
        errors:errors,
        title: 'Error'
      });
});
//list a car
app.get('/listacar',requireLogin,(req,res)=>{
    res.render('listCar',{
        title: 'Listing'
    });
});
app.post('/listacar',requireLogin,(req,res,car1)=>{
    var listedCar;
    function car1(listedCar,car){
        listedCar = car;
        return listedCar;
     }
     
    const newCar ={
        owner: req.user._id,
        make: req.body.make,
        model: req.body.model,
        year: req.body.year,
        type: req.body.type,

    }
    new Car(newCar).save((err,car)=>{
        if(err){
            console.log(err);
        }
        if(car){
            car1(car);
            console.log(listedCar);
            res.render('listCar2',{
                title: 'Finish',
                car:car
            });
        }
    })
    
});
app.post('/listCar2',requireLogin,(req,res)=>{
    Car.findById({_id:req.body.carID,owner:req.body._id}).then((car)=>{  
        let imageUrl ={
            imageUrl:  `https://carrentalapp08.s3.amazonaws.com/${req.body.image}`
        };
        car.pricePerhour = req.body.pricePerhour;
        car.pricePerWeek = req.body.pricePerWeek;
        car.location = req.body.location;
        car.picture=`https://carrentalapp08.s3.amazonaws.com/${req.body.image}`;
        if(Array.isArray(car.image)){
            car.image.push(imageUrl);
        } else{
            car.image=[req.body.image];
        }
       
    car.save((err,car)=>{
            if(err){
                console.log(err);
            }
            if(car){
                res.redirect('/showCars');
            }
        });
    });
});
app.get('/showCars',requireLogin,(req,res)=>{
    Car.find({})
    .populate('owner')
    .sort({date:'desc'})
    .then((cars)=>{
        res.render('showCars',{
            cars:cars
        })
    })
});
//recieve image
app.post('/uploadImage',requireLogin,upload.any(),(req,res)=>{
    const form = new formidable.IncomingForm();
    form.on('file',(field,file)=>{
        console.log(file);
    });
     form.on('error',(err)=>{
         console.log(err);
     });
     form.on('end',()=>{
         console.log('Image Recieved successfuly');
     });
    form.parse(req);
});
//logout function
app.get('/logout',(req,res,user) =>{
    User.findById({_id:req.user._id})
    .then((user)=>{
        user.online=false;
        user.save((err,user)=>{
            if(err){
                console.log(err);
            }
            if(user){
                req.logout();
               res.redirect('/');
            }
        });
    });
});
//renting a car
app.get('/RentCar/:id',(req,res)=>{
    Car.findById({_id:req.params.id}).then((car)=>{
            res.render('calculate',{
                car:car
            })
    }).catch((err)=>{console.log(err)});
});
// calculate total POST req
app.post('/calculateTotal/:id',(req,res)=>{
    Car.findById({_id:req.params.id}).then((car)=>{
        // console.log(req.body);
        // console.log('Type is ',typeof(req.body.days));
        var days = parseInt(req.body.days);
        var totalDays = days * car.pricePerWeek;
        console.log('Total is ',totalDays);
        //create a budjet
        const budjet = {
            carID: req.params.id,
            total: totalDays,
            renter: req.user._id,
            date : new Date()
        }
        new Budjet(budjet).save((err,budjet)=>{
            if(err){console.log(err);}
            if(budjet){
               Car.findById({_id:req.params.id})
               .then((car)=>{
                   //calculate total for stripe
                   var stripeTotal = budjet.total * 100;
                res.render('checkout',{
                    budjet : budjet,
                    car: car,
                    StripePublishableKey: keys.StripePublishableKey,
                    stripeTotal : stripeTotal
               })
               }).catch((err)=>{console.log(err)});
            }
        })
    })
})
//Charge client
app.post('/chargeRenter/:id',(req,res)=>{
    Budjet.findById({_id:req.params.id})
    .then((budjet) =>{
          const amount = budjet.total * 100;
          stripe.customers.create({
              email: req.body.stripeEmail,
              source: req.body.stripeToken
          })
          .then((customer)=>{
              stripe.charges.create({
                  amount: amount,
                  description : `RS${budjet.total} for renting a car`,
                  currency: 'INR',
                  customer: customer.id,
                  receipt_email: customer.email
              },(err,charge)=>{
                  if(err){
                      console.log(err);
                  }
                  if(charge){
                      console.log(charge);
                      res.render('success',{
                          charge:charge,
                          budjet: budjet
                      })
                  }
              })
          }).catch((err)=>{console.log(err);})
    }).catch((err)=>{console.log(err);})
})
//socket connection
const server= http.createServer(app);
const io = socketIO(server);
io.on('connection',(socket)=>{
    console.log('Connected to client');
    //listen to disconnection
    socket.on('disconnect',(socket)=>{
        console.log('Disconnected to client');
    });
});
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});