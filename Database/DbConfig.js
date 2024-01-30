import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const mongodb = process.env.MONGODB_CONNECTION_STRING;


const ConnectDb = async () => {
    try {

        const connection = await mongoose.connect(mongodb)
        console.log("MongooseDb connection")

        return connection;
    } catch (error) {
        console.log(error);
    }
}

export default ConnectDb;