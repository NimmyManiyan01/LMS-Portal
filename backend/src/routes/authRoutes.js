const router = require("express").Router();
const {
  registerStudent,
  requestOtp,
  resendOtp,
  verifyOtp,
  logout,
  me,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const {
  validateEmail,
  validateOtp,
  validateRegistration,
  validateAdminLogin,
} = require("../middleware/validation");
const {
  login: adminLogin,
  requestOtp: adminRequestOtp,
  verifyOtp: adminVerifyOtp,
  logout: adminLogout,
} = require("../controllers/adminAuthController");
router.post("/register", validateRegistration, registerStudent);
router.post("/request-otp", validateEmail, requestOtp);
router.post("/resend-otp", validateEmail, resendOtp);
router.post("/verify-otp", validateEmail, validateOtp, verifyOtp);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.post("/admin/login", validateAdminLogin, adminLogin);
router.post("/admin/request-otp", validateEmail, adminRequestOtp);
router.post("/admin/verify-otp", validateEmail, validateOtp, adminVerifyOtp);
router.post("/admin/logout", adminLogout);
router.get("/admin/me", authenticate, (req, res) => {
  if (req.auth.role !== "ADMIN")
    return res.status(403).json({ error: "Administrator access required" });
  res.json({
    user: { id: req.admin.id, email: req.admin.email, role: "ADMIN" },
  });
});
module.exports = router;
