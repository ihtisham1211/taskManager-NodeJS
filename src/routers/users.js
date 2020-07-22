const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')

//*** USER ***
router.post('/users', async (req, res) => {
    const user = new User(req.body)
    const token = await user.genrateAuthToken()

    try{
        await user.save()
        res.status(201).send({user,token})
    }catch(e){
        res.status(400).send(e)
    }
 
})


router.post('/users/login', async(req,res)=>{
   
    try {
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.genrateAuthToken()

        //res.send({user: user.getPublicProfile,token})
        res.send({user,token})
        
    } catch (e) {
        res.status(400).send(e)
    }
    
})



router.post('/users/logout',auth,async(req,res)=>{

    try {
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token != req.token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send(e)
    }
})

router.post('/users/logoutAll',auth,async(req,res)=>{

    try {
        req.user.tokens = []
        await req.user.save()
        res.status(200).send()
    } catch (e) {
        res.status(500).send(e)
    }
})


//*** USER ***
router.get('/users/me',auth ,async (req,res)=>{
    res.send(req.user)
})

//*** USER ***
router.get('/users/:_id',async (req,res)=>{
    const _id = req.params
 
    try{
        const data =  await User.findById(_id)
        if(!data){
            return res.status(404).send()
        }
        res.status(200).send(data)
    }catch(e){
        res.status(500).send(e)
    }

})


//*** USER ***
router.patch('/users/me',auth, async (req,res)=>{

    const updates = Object.keys(req.body)
    const allowedUpdate = ['name','email','password', 'age']
    const isVaildOperation = updates.every((update)=>{
        return allowedUpdate.includes(update)
    })

    if(!isVaildOperation){
        return res.status(400).send({error: 'Invalid Update'})
    }
    try{
        //const user = await User.findByIdAndUpdate(req.params, req.body, {new: true, runValidators: true})
        const user = req.user
        
        updates.forEach((update)=>{
            user[update] = req.body[update]
        })
        await user.save()
        res.send(user).status(200)
    }
    catch(e){
        res.status(400).send(e)
    }
})

//*** USER ***
router.delete('/users/me',auth ,async (req,res)=>{

    try {
        // const user = await User.findByIdAndDelete(req.user._id)
        // if(!user){
        //     return res.status(404).send()}
        await req.user.remove()
    res.status(200).send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})



const upload = multer({
    limits:{
        fileSize: 1000000  //1mb
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/ \.(jpg|jpeg|png)$/)){
            return cb(new Error('file must be a jpg|jpeg|png'))
        }
        cb(undefined,true)
    }
})

const errorMiddleware = (req,res,next)=>{
    throw new Error('From my middleware')

}


//upload
router.post('/user/me/avatar',auth,upload.single('avatars'),async(req,res)=>{
    
    const buffer = await sharp(req.file.buffer).png().resize({width:250, height:250}).toBuffer()

    
    //req.user.avatar = req.file.buffer
    await req.user.save()
    res.send()
},(error,req,res,next)=>{
    res.status(400).send({error: error.message})
})

//upload delete
router.delete('/user/me/avatar',auth,async(req,res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

//get upload
router.get('/user/:id/avatar',async(req,res)=>{
try {
    const user = await User.findById(req.params.id)

    if(!user || !user.avatar){
        throw new Error()
    }
    res.set('Content-Type','image/jpg')
    res.send(user.avatar)
} catch (error) {
    res.status(404).send()
}

})



module.exports = router