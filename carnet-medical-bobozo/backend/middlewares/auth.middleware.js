const jwt = require("jsonwebtoken");
const { Utilisateur } = require("../models");

/**
 * 🔒 Middleware d'authentification + autorisation
 * @param {string[]} roles - Rôles autorisés (ex: ["medecin", "laborantin"])
 * ✅ L'admin passe toujours (a accès à tout).
 */
module.exports = (roles = []) => {
  return async (req, res, next) => {
    console.log("➡️ [AuthMiddleware] Vérification des rôles :", roles);

    try {
      const authHeader = req.headers["authorization"];
      if (!authHeader) {
        console.warn("⚠️ Aucun header Authorization trouvé");
        return res.status(401).json({ error: "⛔ Token manquant" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        console.warn("⚠️ Token vide ou mal formé :", authHeader);
        return res.status(401).json({ error: "⛔ Token invalide" });
      }

      console.log("🔑 Token reçu :", token);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token décodé :", decoded);

      const user = await Utilisateur.findByPk(decoded.id);
      if (!user) {
        console.warn("❌ Utilisateur introuvable :", decoded.id);
        return res.status(401).json({ error: "⛔ Utilisateur non trouvé" });
      }

      console.log("👤 Utilisateur authentifié :", {
        id: user.id,
        noms: user.noms,
        role: user.role,
      });

      // ✅ Rôle admin => passe partout sans restriction
      if (user.role === "admin") {
        req.user = user;
        console.log("🛡 Accès accordé automatiquement (ADMIN)");
        return next();
      }

      // 🔐 Vérification des rôles requis (si fournis)
      if (roles.length > 0 && !roles.includes(user.role)) {
        console.warn(`⛔ Accès interdit. Rôle requis: ${roles}, rôle actuel: ${user.role}`);
        return res.status(403).json({ error: "⛔ Accès interdit pour ce rôle" });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("💥 Erreur middleware auth :", err.message);
      return res.status(401).json({ error: "⛔ Authentification échouée", details: err.message });
    }
  };
};
