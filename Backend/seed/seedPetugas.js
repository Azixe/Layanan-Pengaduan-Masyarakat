import mongoose from "mongoose";
import dotenv from "dotenv";
import Petugas from "../models/petugasModel.js";

dotenv.config();

const seedPetugas = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Opsional: hapus data petugas lama dulu
    await Petugas.deleteMany({});

    const petugasData = [
      {
        nama: "Mas Rusdi",
        email: "rusdi@lapordesa.id",
        telepon: "081234567001",
        status: "aktif",
      },
      {
        nama: "Mas Faiz",
        email: "faiz@lapordesa.id",
        telepon: "081234567002",
        status: "aktif",
      },
      {
        nama: "Mas Fuad",
        email: "fuad@lapordesa.id",
        telepon: "081234567003",
        status: "aktif",
      },
    ];

    await Petugas.insertMany(petugasData);

    console.log("Seed data petugas berhasil dibuat");
    process.exit(0);
  } catch (error) {
    console.error("Gagal membuat seed petugas:", error.message);
    process.exit(1);
  }
};

seedPetugas();
