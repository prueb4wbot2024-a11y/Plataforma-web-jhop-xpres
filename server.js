// ==================================
// SERVIDOR PRINCIPAL - JHOP EXPRESS
// ==================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('');

const app = express();

// ------------------------------
// 🎭 CONFIGURACIÓN
// ------------------------------
const BRAND_NAME = "JHOP EXPRESS";
const VIRTUAL_URL = "www.jhopexpress.com";

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Servir archivos estáticos (CSS, JS, Img)

// Cabeceras personalizadas
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', BRAND_NAME);
    res.setHeader('Server', 'JHOP System');
    console.log(`🔗 Acceso: ${req.method} | ${req.url}`);
    next();
});

// ------------------------------
// 🗄️ CONEXIÓN A MONGODB
// ------------------------------
const mongoURI = 'mongodb+srv://estigia920_db_user:bonito12.3@cluster0.mx949hv.mongodb.net/?appName=Cluster0';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Base de Datos JHOP conectada"))
  .catch(err => console.log("❌ Error DB:", err));

// ------------------------------
// 📄 RUTA PRINCIPAL (TU HTML)
// ------------------------------
app.get('/', (req, res) => {
    // Manda el archivo que ya hiciste
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================================
// 🧠 MODELOS
// ==================================

// Usuarios
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    level: { type: Number, default: 0 },
    type: String
});
const User = mongoose.model('User', userSchema);

// Trabajos
const jobSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    category: String,
    authorId: String,
    authorName: String,
    date: { type: Date, default: Date.now }
});
const Job = mongoose.model('Job', jobSchema);

// ==================================
// ⚙️ FUNCIONES
// ==================================

// Registro
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, type } = req.body;
        const existe = await User.findOne({ email });
        
        if(existe) return res.json({ success: false, msg: "Usuario ya registrado" });

        const user = new User({ username, email, password, type });
        await user.save();
        res.json({ success: true, user });
    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});

// Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });

        if(user) {
            res.json({ 
                success: true, 
                user: { id: user._id, name: user.username, level: user.level, type: user.type }
            });
        } else {
            res.json({ success: false, msg: "Datos incorrectos" });
        }
    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});

// Upgrade cuenta
app.post('/upgrade', async (req, res) => {
    try {
        const { userId, newLevel } = req.body;
        await User.findByIdAndUpdate(userId, { level: newLevel });
        res.json({ success: true, msg: "Cuenta actualizada" });
    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});

// Publicar y Cargar Trabajos
app.post('/publish', async (req, res) => {
    try {
        const job = new Job(req.body);
        await job.save();
        res.json({ success: true, job });
    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});

app.get('/jobs', async (req, res) => {
    try {
        const trabajos = await Job.find().sort({ date: -1 });
        res.json({ success: true, jobs: trabajos });
    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});

// ==================================
// 🚀 INICIAR SERVIDOR
// ==================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("==================================");
    console.log(`🎩 PLATAFORMA: ${VIRTUAL_URL}`);
    console.log(`🏢 SISTEMA: ${BRAND_NAME}`);
    console.log(`🔌 PUERTO: ${PORT}`);
    console.log("✅ SISTEMA ACTIVO");
    console.log("📢 ADSENSE ACTIVO");
    console.log("==================================");
});
