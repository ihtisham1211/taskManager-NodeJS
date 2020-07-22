const express = require('express')
const router = new express.Router()
const Task = require('../models/task')
const auth = require('../middleware/auth')

//*** TASK ***
router.post('/tasks',auth, async (req, res) => {
    // const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    }catch(e){
        res.status(400).send(e)
    }
})

// GET /task?completed=true
// GET /task?limit=10&skip=20
// GET /task?sortBy=createdAt:desc
//*** TASK ***
router.get('/tasks',auth,async (req,res)=>{
    const match = {}
    const sort = {}


    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parrts[1] === 'desc' ? -1 : 10
    }
    
    try{
        // const data =  await Task.find({owner: req.user._id}) // this works as well
        await req.user.populate({
            path: 'tasks',
            match,
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort

            }
        }).execPopulate()
        // res.status(200).send(data)
        res.status(200).send(req.user.tasks)
    }catch(e){
        res.status(500).send(e)
    }
})

//*** TASK ***
router.get('/tasks/:_id',auth,async(req,res)=>{
    
    try{
        // const data =  await Task.findById(_id)
        const data =  await Task.findOne({_id, owner: req.user._id})

        if(!data){
            return res.status(404).send()
        }
        res.status(200).send(data)
    }catch(e){
        res.status(500).send(e)
    }

})
 
//*** TASK ***
router.patch('/tasks/:_id',auth,async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdate = ['description','completed']

    const isVaildOperation = updates.every((update)=>{
        return allowedUpdate.includes(update)
    })

    if(!isVaildOperation){
        return res.status(400).send({error: 'Invalid Update'})
    }

    try{
        //const task = await Task.findByIdAndUpdate(req.params, req.body, {new: true, runValidators: true})
        
        // const task = await Task.findById(req.params.id)
        const task = await Task.findOne({_id: req.params._id, owner: req.user._id})
        
        if(!task){
            return res.status(404).send()}

    updates.forEach((update)=>{
        task[update] = req.body[update]})

    await task.save()
    res.status(200).send(task)
    }
    catch(e){
        res.status(400).send(e)
    }
})
//*** TASK ***
router.delete('/tasks/:_id',auth,async (req,res)=>{

    try {
        // const task = await Task.findByIdAndDelete(req.params.id)
        const task = await Task.findByIdAndDelete({_id: req.params._id, owner: req.user._id})
        if(!task){
            return res.status(404).send()}

    res.send(task).status(200)
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router