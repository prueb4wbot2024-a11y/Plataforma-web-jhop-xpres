// ==================================
// SERVIDOR PRINCIPAL - JHOP EXPRESS
// ==================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// ------------------------------
// 🎭 CONFIGURACIÓN DEL DISFRAZ
// ------------------------------
// Aquí le ponemos la identidad que TÚ quieras que se vea
const BRAND_NAME = "JHOP EXPRESS";
const VIRTUAL_URL = "www.jhopexpress.com";

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// Cabeceras para que se vea profesional y seguro
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', BRAND_NAME);
    res.setHeader('Server', 'JHOP System');
    console.log(`🔗 Acceso detectado | Mostrando como: ${VIRTUAL_URL}`);
    next();
});

// ------------------------------
// 🗄️ CONEXIÓN A MONGODB
// ------------------------------
// ⚠️ Recuerda poner aquí tu link real que te den en Atlas
mongoose.connect('mongodb+srv://tu_usuario:tu_password@cluster0.mongodb.net/jhop_express', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Base de Datos JHOP conectada"))
  .catch(err => console.log("❌ Error DB:", err));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// ==================================
// 🧠 MODELOS DE LA BASE DE DATOS
// ==================================

// 📋 ESTRUCTURA DE USUARIOS
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    level: { type: Number, default: 0 }, // 0=Gratis, 1=Pro, 2=ProMax
    type: String // empleado o empleador
});

const User = mongoose.model('User', userSchema);

// 📋 ESTRUCTURA DE TRABAJOS
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
// ⚙️ FUNCIONES DEL SISTEMA
// ==================================

// 📥 REGISTRO DE NUEVOS USUARIOS
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, type } = req.body;
        
        // Verificar si ya existe
        const existe = await User.findOne({ email });
        if(existe) {
            return res.json({ success: false, msg: "Usuario ya registrado" });
        }

        // Crear nuevo usuario
        const user = new User({
            username,
            email,
            password,
            type,
            level: 0 // Empieza en Gratis
        });

        await user.save();
        res.json({ success: true, user: user });

    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});

// 🔑 INICIO DE SESIÓN
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });

        if(user) {
            res.json({ 
                success: true, 
                user: {
                    id: user._id,
                    name: user.username,
                    level: user.level,
                    type: user.type
                }
            });
        } else {
            res.json({ success: false, msg: "Datos incorrectos" });
        }

    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});
// ==================================
// ⬆️ SISTEMA DE NIVELES Y PAGOS
// ==================================

// ACTUALIZAR CUENTA (Gratis -> Pro -> ProMax)
app.post('/upgrade', async (req, res) => {
    try {
        const { userId, newLevel } = req.body;
        
        // 0 = Gratis | 1 = Pro | 2 = ProMax
        await User.findByIdAndUpdate(userId, { level: newLevel });
        
        console.log(`💎 Usuario actualizado a Nivel: ${newLevel}`);
        res.json({ success: true, msg: "¡Cuenta actualizada exitosamente!" });

    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});

// ==================================
// 💼 SISTEMA DE TRABAJOS
// ==================================

// PUBLICAR NUEVO TRABAJO
app.post('/publish', async (req, res) => {
    try {
        const job = new Job(req.body);
        await job.save();
        res.json({ success: true, job: job });
    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});

// CARGAR TODOS LOS TRABAJOS
app.get('/jobs', async (req, res) => {
    try {
        // Busca todos y los ordena del más nuevo al más viejo
        const trabajos = await Job.find().sort({ date: -1 });
        res.json({ success: true, jobs: trabajos });
    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});

// ==================================
// 🚀 INICIAR EL MOTOR
// ==================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("==================================");
    console.log(`🎩 PLATAFORMA: ${VIRTUAL_URL}`);
    console.log(`🏢 SISTEMA: ${BRAND_NAME}`);
    console.log(`🔌 PUERTO: ${PORT}`);
    console.log("✅ SISTEMA ACTIVO Y FUNCIONANDO");
    console.log("==================================");
});
