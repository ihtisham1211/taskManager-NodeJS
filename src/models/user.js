const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        age: {
            type: Number,
            default: 0,
            validate(value) {
                if (value < 0) {
                    throw new Error('Age must be +ve number')
                }
            }
        },
        email: {
            type: String,
            required: true,
            unique:true,
            trim: true,
            lowercase: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new Error('Email not Valid')
                }
            }
        },
        password: {
            type: String,
            required: true,
            trim: true,
            minlength: 7,
            validate(value) {
                if (value.includes('password')) {
                    throw new Error('Password not Valid')
                }
            }
        },
        tokens:[{
            token:{
                type: String,
                required: true
            }
        }],
        avatar: {
            type: Buffer
        }
    },{
        timestamps: true
    }
)

userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})

userSchema.statics.findByCredentials = async (email,password)=>{
    
    const user = await User.findOne({email})
    if(!user){
        throw new Error('Unable to find email ')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch){
        throw new Error('Wrong password')
    }
    return user
}

userSchema.methods.genrateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({token})
    await user.save()

    return token
}


// Hash the plain text password
userSchema.pre('save', async function(next){ //this fun will run before saving anything in the database
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8) 
    }
    next()//to end functionS
})

userSchema.methods.getPublicProfile = function (){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject

}
 //auto delte password and tokens
userSchema.methods.toJSON = function (){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject

}
//delete user tasks where user is removed 'remove' is built in midware
userSchema.pre('remove',async function(next){
    const user = this 
    await Task.deleteMany({owner: user._id})
   next()
})


const User = mongoose.model('User', userSchema)

module.exports = User