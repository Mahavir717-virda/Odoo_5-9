import dotenv from "dotenv"
dotenv.config({ path: "./.env" })

import connectDB from "./DB/Db.js";
import express from "express"
import { app } from "./app/app.js"


connectDB().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log("Server is listening on ", process.env.PORT)
    })
})