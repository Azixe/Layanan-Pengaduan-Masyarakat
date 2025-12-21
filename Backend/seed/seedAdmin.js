import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Admin from "../models/adminModel.js";

dotenv.config();

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const hashedPassword = await bcrypt.hash("password123", 10);

  await Admin.create({
    name: "Admin Desa",
    email: "admin@lapordesa.id",
    password: hashedPassword,
    role: "administrator",
  });

  console.log("Admin berhasil dibuat");
  process.exit();
};

createAdmin();
