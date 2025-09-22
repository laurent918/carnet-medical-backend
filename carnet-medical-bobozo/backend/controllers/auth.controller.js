const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Utilisateur } = require("../models"); // ✅ on importe depuis index.js

// Connexion
const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    // 🔍 Validation des champs
    if (!email || !mot_de_passe) {
      return res.status(400).json({ error: "⛔ Email et mot de passe requis" });
    }

    // 🔐 Vérifier l'utilisateur
    const user = await Utilisateur.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "⛔ Utilisateur non trouvé" });
    }

    // 🔑 Vérifier mot de passe (champ uniforme : mot_de_passe)
    const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ error: "⛔ Mot de passe incorrect" });
    }

    // 🧾 Générer JWT avec id et rôle
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "✅ Connexion réussie",
      token,
      utilisateur: {
        id: user.id,
        noms: user.noms,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Erreur login :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = { login };