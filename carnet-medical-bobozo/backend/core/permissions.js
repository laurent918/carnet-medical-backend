module.exports = {
  manage_users: ["admin"],
  create_patient: ["receptionniste"],
  create_consultation: ["receptionniste", "medecin"],
  create_examen: ["medecin"],
  create_prescription: ["medecin"],
};
