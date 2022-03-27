const mongoose = require('mongoose');
const { string } = require('nunjucks/src/filters');
const Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    facebook: {
        type: String

    },
    google: {
        type: String
    },
    firstname: {
        type: String
    },
    lastname: {
        type : String
    },
    image: {
        data: Buffer,
        type: String,
        default: './image/userlogo.png'
    },
    email: {
        type : String,
    },
    password: {
        type : String,
     },
    date: {
        type : Date,
        default: Date.now
    },
    online:{
        type: Boolean,
        default: false
    }
});
// const User=mongoose.model('User',userSchema);
userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User',userSchema);
// module.exports = User;