module.exports = function(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Token manquant ou invalide" });
    }

    const userRole = req.user.role.toLowerCase();
    const roles = allowedRoles.map(r => r.toLowerCase());

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "⛔ Accès interdit : permission manquante" });
    }

    next();
  };
};
