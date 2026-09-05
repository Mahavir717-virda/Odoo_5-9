import { configDotenv } from "dotenv";
import mongoose from "mongoose";

const connectDB = async () => {
    try {
       const instance =  await mongoose.connect(`${process.env.MONGO_URI}`)
       console.log(`MONGODB connected !! connection host`)
       try {
           await mongoose.connection.db.collection('users').dropIndex('username_1');
           console.log("Dropped index username_1 successfully");
       } catch (err) {
           console.log("Index username_1 did not exist or was already dropped.");
       }
    } catch (error) {
        console.log("MONGODB connection error", error);
        process.exit(1)
    }
}

export default connectDB;