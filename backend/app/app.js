import express from "express"
import cors from "cors"
import userRoutes from "../routes/user.routes.js"
import cookieParser from "cookie-parser"
const app = express()


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true
}))
// Used to parse the json data for req.body
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// User Routes
app.use("/users", userRoutes)

export { app }