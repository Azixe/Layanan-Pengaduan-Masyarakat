import mongoose from "mongoose";

const wargaSchema = new mongoose.Schema(
  {
    user_warga: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    alamat: { type: String },
    no_hp: { type: String },
    role: { type: String, default: "warga" },
    // field untuk fitur lupa password
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { minimize: false }
);

const wargaModel =
  mongoose.models.warga || mongoose.model("warga", wargaSchema, "warga");

export default wargaModel;
