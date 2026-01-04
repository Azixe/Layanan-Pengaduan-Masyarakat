import mongoose from "mongoose";

const petugasSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: [true, "Nama petugas wajib diisi"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    telepon: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["aktif", "nonaktif"],
      default: "aktif",
    },
    jumlah_tugas: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Petugas = mongoose.model("Petugas", petugasSchema);

export { Petugas };
export default Petugas;
