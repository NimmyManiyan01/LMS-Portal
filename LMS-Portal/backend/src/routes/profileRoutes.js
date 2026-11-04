const router = require("express").Router();
const Student = require("../models/Student");
const { authenticate } = require("../middleware/auth");

function publicProfile(student) {
  if (!student) return null;
  return {
    studentId: student.studentId,
    fullName: student.fullName,
    email: student.email,
    phone: student.phone,
    college: student.college,
    branch: student.branch,
    passOutYear: student.passOutYear,
    emailVerified: student.emailVerified,
    registrationDate: student.createdAt,
  };
}

router.get("/", authenticate, async (req, res) => {
  if (!req.student) {
    return res.status(403).json({ error: "Student account required" });
  }
  res.json({ profile: publicProfile(req.student) });
});

router.patch("/", authenticate, async (req, res) => {
  if (!req.student) {
    return res.status(403).json({ error: "Student account required" });
  }
  const allowed = ["fullName", "phone", "college", "branch", "passOutYear"];
  if (Object.keys(req.body).some((key) => !allowed.includes(key)))
    return res
      .status(400)
      .json({ error: "Only editable profile fields may be changed" });
  const updates = { ...req.body };
  if (
    updates.fullName !== undefined &&
    (String(updates.fullName).trim().length < 2 ||
      String(updates.fullName).trim().length > 100)
  )
    return res
      .status(400)
      .json({ error: "Full name must be 2 to 100 characters" });
  if (
    updates.phone !== undefined &&
    !/^[6-9]\d{9}$/.test(String(updates.phone))
  )
    return res
      .status(400)
      .json({ error: "Phone number must be a valid Indian mobile number" });
  if (
    updates.college !== undefined &&
    (String(updates.college).trim().length < 2 ||
      String(updates.college).trim().length > 150)
  )
    return res
      .status(400)
      .json({ error: "College name must be 2 to 150 characters" });
  if (updates.branch !== undefined && !String(updates.branch).trim())
    return res.status(400).json({ error: "Branch is required" });
  if (
    updates.passOutYear !== undefined &&
    (!Number.isInteger(Number(updates.passOutYear)) ||
      Number(updates.passOutYear) < new Date().getFullYear() - 10 ||
      Number(updates.passOutYear) > new Date().getFullYear() + 10)
  )
    return res.status(400).json({ error: "Invalid pass-out year" });

  const studentId = req.student._id || req.student.id;
  const student = await Student.findByIdAndUpdate(studentId, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ profile: publicProfile(student) });
});

module.exports = router;
