require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const routes = require("./routes/index");
const resultatExamenRoutes = require("./routes/resultatExamen.routes"); // ✅ ajout

// 🔧 Middlewares globaux
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// 🌐 Routes principales
app.use("/api", routes);

// 🔬 Résultats examens
app.use("/api/resultats-examens", resultatExamenRoutes); // ✅ nouvelle route

// ✅ Test route racine
app.get("/", (req, res) => res.send("Carnet Médical API fonctionne ✅"));

// ⚠️ Gestion erreurs non gérées (middleware global)
app.use((err, req, res, next) => {
  console.error("Erreur globale :", err);
  res.status(500).json({ message: "Erreur serveur", error: err.message });
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Serveur démarré sur le port ${PORT}`));