// SERVER.JS - PARTE 1: CONFIGURACIÓN INICIAL
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/'))); // Esto sirve tu index.html

// Conexión a la Base de Datos
mongoose.connect('mongodb+srv://tu_usuario:tu_password@cluster0.mongodb.net/yap_express', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.log("❌ Error DB:", err));

// Ruta principal (Carga tu página)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// ------------------------------
// MODELO DE USUARIO (Estructura)
// ------------------------------
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    level: { type: Number, default: 0 }, // 0=Gratis, 1=Pro, 2=ProMax
    type: String // empleado o empleador
});

const User = mongoose.model('User', userSchema);

// ------------------------------
// RUTAS DE AUTENTICACIÓN
// ------------------------------

// REGISTRO DE NUEVO USUARIO
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, type } = req.body;
        
        // Verificar si ya existe
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.json({ success: false, message: "Usuario ya existe" });
        }

        // Crear nuevo usuario
        const newUser = new User({
            username,
            email,
            password,
            type,
            level: 0 // Empieza en Gratis
        });

        await newUser.save();
        res.json({ success: true, user: newUser });

    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});

// LOGIN
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
            res.json({ success: false, message: "Datos incorrectos" });
        }

    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});

// ACTUALIZAR NIVEL (Cuando pagan)
app.post('/upgrade', async (req, res) => {
    try {
        const { userId, newLevel } = req.body;
        await User.findByIdAndUpdate(userId, { level: newLevel });
        res.json({ success: true, message: "Nivel actualizado" });
    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});
// ------------------------------
// MODELO DE TRABAJOS
// ------------------------------
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

// ------------------------------
// RUTAS DE TRABAJOS
// ------------------------------

// PUBLICAR NUEVO TRABAJO
app.post('/publish', async (req, res) => {
    try {
        const { title, description, price, category, authorId, authorName } = req.body;
        const newJob = new Job({ title, description, price, category, authorId, authorName });
        await newJob.save();
        res.json({ success: true, job: newJob });
    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});

// OBTENER TODOS LOS TRABAJOS
app.get('/jobs', async (req, res) => {
    try {
        const jobs = await Job.find().sort({ date: -1 });
        res.json({ success: true, jobs: jobs });
    } catch(err) {
        res.status(500).json({ success: false, error: err });
    }
});

// ------------------------------
// INICIAR SERVIDOR
// ------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor YAP EXPRESS corriendo en puerto ${PORT}`);
});
