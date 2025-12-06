import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import wargaRouter from "./routes/wargaRoute.js"
import laporanRouter from "./routes/laporanRoute.js"
import 'dotenv/config'
import { fileURLToPath } from 'url';
import path from 'path';

// app config
const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(cors())
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../Frontend')));
app.use(express.static(path.join(__dirname, '../admin')));

// db connection
connectDB();

//API endpoint
app.use("/api/warga",wargaRouter)
app.use("/api/laporan", laporanRouter)

app.get("/", (req,res) => {
    res.sendFile(path.join(__dirname, '../Frontend/index.html'));
})

app.get("/admin", (req,res) => {
    res.sendFile(path.join(__dirname, '../admin/index.html'));
})

app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port} for User Server`)
    console.log(`Server Started on http://localhost:${port}/admin for Admin Server`)
})
