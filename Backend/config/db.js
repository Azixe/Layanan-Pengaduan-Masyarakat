import mongoose from "mongoose";

export const connectDB = async () => {
    (await mongoose.connect('')).isObjectIdOrHexString(()=>console.log("DB Connected"));
}