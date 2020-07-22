const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/users')
const taskRouter = require('./routers/tasks')


// Setup Server
const app = express()
const port = process.env.PORT


// Get JASON Data
app.use(express.json())
// All router of users
app.use(userRouter)
// All router of tasks 
app.use(taskRouter)

app.listen(port,()=>{
    console.log('Server is up on port ' + port)
})