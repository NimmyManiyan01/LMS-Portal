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
  login: adminLogin,
  logout: adminLogout,
} = require("../controllers/adminAuthController");
router.post("/register", registerStudent);
router.post("/request-otp", requestOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.post("/admin/login", adminLogin);
router.post("/admin/logout", adminLogout);
router.get("/admin/me", authenticate, (req, res) => {
  if (req.auth.role !== "ADMIN")
    return res.status(403).json({ error: "Administrator access required" });
  res.json({
    user: { id: req.admin.id, email: req.admin.email, role: "ADMIN" },
  });
});
module.exports = router;
