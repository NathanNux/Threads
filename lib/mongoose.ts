import mongoose from 'mongoose';

let isConnected = false // this is variable to track the connection status

export const connectToDB = async () => {
    // set strict querry for Mongoose to prevent unknown fields
    mongoose.set('strictQuery', false);

    if(!process.env.MONGODB_URI) {
        return console.error('MONGODB_URI is not set');
    }

    if( isConnected ) {
        console.log('using existing connection to MongoDB');
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI)

        isConnected = true; // Set the connection status to true
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
}