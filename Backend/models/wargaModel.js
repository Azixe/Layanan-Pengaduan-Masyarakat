import mongoose from "mongoose";

const wargaSchema = new mongoose.Schema({
    user_warga: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    alamat: { type: String },
    no_hp: { type: String }
}, { minimize: false })

const wargaModel = mongoose.models.warga || mongoose.model("warga", wargaSchema, "warga");

export default wargaModel;