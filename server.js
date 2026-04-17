// ==================================
// SERVIDOR PRINCIPAL - JHOP EXPRESS
// ==================================
require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const helmet   = require('helmet');
const bcrypt   = require('bcryptjs');
const path     = require('path');

const app = express();

// ------------------------------
// 🎭 CONFIGURACIÓN
// ------------------------------
const BRAND_NAME  = process.env.BRAND_NAME  || "JHOP EXPRESS";
const VIRTUAL_URL = process.env.VIRTUAL_URL || "www.jhopexpress.com";
const PORT        = process.env.PORT        || 3000;
const MONGO_URI   = process.env.MONGO_URI   || 'mongodb+srv://estigia920_db_user:bonito12.3@cluster0.mx949hv.mongodb.net/?appName=Cluster0';

// ------------------------------
// 🛡️ MIDDLEWARES
// ------------------------------
app.use(helmet({
    contentSecurityPolicy: false  // Desactivado para permitir AdSense en el HTML
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));  // Carpeta pública para assets

// Cabeceras + logger
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', BRAND_NAME);
    res.setHeader('Server', 'JHOP System');
    console.log(`🔗 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ------------------------------
// 🗄️ CONEXIÓN A MONGODB
// ------------------------------
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Base de Datos JHOP conectada"))
    .catch(err => {
        console.error("❌ Error DB:", err.message);
        process.exit(1);  // Si no hay DB no arranca
    });

// ==================================
// 🧠 MODELOS
// ==================================

// --- Usuario ---
const userSchema = new mongoose.Schema({
    username:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true },
    level:     { type: Number, default: 0 },
    type:      { type: String, enum: ['freelancer', 'cliente', 'admin'], default: 'cliente' },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// --- Trabajo ---
const jobSchema = new mongoose.Schema({
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price:       { type: Number, required: true, min: 0 },
    category:    { type: String, required: true },
    authorId:    { type: String, required: true },
    authorName:  { type: String, required: true },
    status:      { type: String, enum: ['activo', 'cerrado'], default: 'activo' },
    date:        { type: Date, default: Date.now }
});
const Job = mongoose.model('Job', jobSchema);

// ==================================
// 📄 RUTA PRINCIPAL
// ==================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================================
// ⚙️ RUTAS - USUARIOS
// ==================================

// REGISTRO
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, type } = req.body;

        if (!username || !email || !password)
            return res.status(400).json({ success: false, msg: "Campos requeridos: username, email, password" });

        const existe = await User.findOne({ email });
        if (existe)
            return res.status(409).json({ success: false, msg: "Email ya registrado" });

        const hash = await bcrypt.hash(password, 12);
        const user = new User({ username, email, password: hash, type });
        await user.save();

        res.status(201).json({
            success: true,
            user: { id: user._id, name: user.username, level: user.level, type: user.type }
        });

    } catch (err) {
        console.error("❌ /register:", err.message);
        res.status(500).json({ success: false, msg: "Error interno del servidor" });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ success: false, msg: "Email y password requeridos" });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(401).json({ success: false, msg: "Credenciales incorrectas" });

        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(401).json({ success: false, msg: "Credenciales incorrectas" });

        res.json({
            success: true,
            user: { id: user._id, name: user.username, level: user.level, type: user.type }
        });

    } catch (err) {
        console.error("❌ /login:", err.message);
        res.status(500).json({ success: false, msg: "Error interno del servidor" });
    }
});

// UPGRADE DE NIVEL
app.post('/upgrade', async (req, res) => {
    try {
        const { userId, newLevel } = req.body;

        if (!userId || newLevel === undefined)
            return res.status(400).json({ success: false, msg: "userId y newLevel requeridos" });

        const user = await User.findByIdAndUpdate(userId, { level: newLevel }, { new: true });
        if (!user)
            return res.status(404).json({ success: false, msg: "Usuario no encontrado" });

        res.json({ success: true, msg: "Cuenta actualizada", level: user.level });

    } catch (err) {
        console.error("❌ /upgrade:", err.message);
        res.status(500).json({ success: false, msg: "Error interno del servidor" });
    }
});

// ==================================
// ⚙️ RUTAS - TRABAJOS
// ==================================

// PUBLICAR TRABAJO
app.post('/publish', async (req, res) => {
    try {
        const { title, description, price, category, authorId, authorName } = req.body;

        if (!title || !description || !price || !category || !authorId || !authorName)
            return res.status(400).json({ success: false, msg: "Todos los campos del trabajo son requeridos" });

        const job = new Job({ title, description, price, category, authorId, authorName });
        await job.save();

        res.status(201).json({ success: true, job });

    } catch (err) {
        console.error("❌ /publish:", err.message);
        res.status(500).json({ success: false, msg: "Error interno del servidor" });
    }
});

// LISTAR TRABAJOS (con filtro opcional por categoría)
app.get('/jobs', async (req, res) => {
    try {
        const filter = { status: 'activo' };
        if (req.query.category) filter.category = req.query.category;

        const trabajos = await Job.find(filter).sort({ date: -1 }).limit(50);
        res.json({ success: true, jobs: trabajos });

    } catch (err) {
        console.error("❌ /jobs:", err.message);
        res.status(500).json({ success: false, msg: "Error interno del servidor" });
    }
});

// CERRAR/ELIMINAR TRABAJO
app.delete('/jobs/:id', async (req, res) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, { status: 'cerrado' }, { new: true });
        if (!job)
            return res.status(404).json({ success: false, msg: "Trabajo no encontrado" });

        res.json({ success: true, msg: "Trabajo cerrado" });

    } catch (err) {
        console.error("❌ DELETE /jobs/:id:", err.message);
        res.status(500).json({ success: false, msg: "Error interno del servidor" });
    }
});

// ==================================
// 🚀 INICIAR SERVIDOR
// ==================================
app.listen(PORT, () => {
    console.log("==================================");
    console.log(`🎩 PLATAFORMA : ${VIRTUAL_URL}`);
    console.log(`🏢 SISTEMA    : ${BRAND_NAME}`);
    console.log(`🔌 PUERTO     : ${PORT}`);
    console.log(`🌍 ENV        : ${process.env.NODE_ENV || 'development'}`);
    console.log("✅ SISTEMA ACTIVO");
    console.log("==================================");
});
