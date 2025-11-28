import wargaModel from "../models/wargaModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const loginUser = async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await wargaModel.findOne({email});

        if(!user){
            return res.json({success:false, message: "Pengguna tidak ditemukan"})
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch){
            return res.json({success:false, message: "Password salah"})
        }

        const token = createToken(user._id);
        res.json({
            success:true,
            token,
            warga: {
                _id: user._id,
                user_warga: user.user_warga,
                email: user.email,
            }})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const createToken = (id) => {
    return jwt.sign({id},process.env.JWT_SECRET)
}

//Register user
const registerUser = async (req, res) => {
    const { user_warga, email, password} = req.body;
    try {
        //cek jika user sudah ada
        const exist = await wargaModel.findOne({email})
        if(exist) {
        return res.json({success:false, message:"Pengguna sudah terdaftar"})
        }

        //validasi email format dan password kuat
        if(!validator.isEmail(email)){
            return res.json({success:false, message:"Format email salah"})
        }
        if(password.length < 8){
            return res.json({success:false, message:"Password minimal 8 huruf"})
        }

        //hashing password user
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newWarga = new wargaModel({
            user_warga:user_warga,
            email:email,
            password:hashedPassword
        })

        const warga = await newWarga.save()
        const token = createToken(warga._id)
        res.json({success:true,message:"Pengguna sukses dibuat", token})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:"Error"})
    }
}

const getProfile = async (req, res) => {
    try {
        res.json({
            success: true,
            message: "Data profil berhasil diambil",
            data: req.user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
};

export{loginUser,registerUser,getProfile};