const emailPattern = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/;

const text = (value) => (typeof value === "string" ? value.trim() : "");

function validateEmail(req, res, next) {
  const email = text(req.body?.email).toLowerCase();
  if (!emailPattern.test(email) || email.length > 254)
    return res.status(400).json({ error: "A valid email address is required" });
  req.body.email = email;
  next();
}

function validateOtp(req, res, next) {
  const otp = text(req.body?.otp);
  if (!/^\d{6}$/.test(otp))
    return res.status(400).json({ error: "A valid 6-digit OTP is required" });
  req.body.otp = otp;
  next();
}

function validateRegistration(req, res, next) {
  const body = req.body || {};
  const fullName = text(body.fullName);
  const phone = text(body.phone);
  const college = text(body.college);
  const branch = text(body.branch);
  const year = body.passOutYear === undefined || body.passOutYear === ""
    ? null
    : Number(body.passOutYear);

  if (
    fullName.length < 2 ||
    fullName.length > 100 ||
    !emailPattern.test(text(body.email).toLowerCase()) ||
    text(body.email).length > 254 ||
    (phone && !/^[6-9]\d{9}$/.test(phone)) ||
    college.length > 150 ||
    branch.length > 100 ||
    (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2200)) ||
    body.privacyAccepted !== true ||
    body.monitoringAccepted !== true
  )
    return res.status(400).json({ error: "Please provide valid registration details" });

  req.body.fullName = fullName;
  req.body.email = text(body.email).toLowerCase();
  req.body.phone = phone;
  req.body.college = college;
  req.body.branch = branch;
  if (year !== null) req.body.passOutYear = year;
  next();
}

function validateAdminLogin(req, res, next) {
  const email = text(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!emailPattern.test(email) || email.length > 254 || password.length < 1 || password.length > 256)
    return res.status(400).json({ error: "Valid administrator credentials are required" });
  req.body.email = email;
  next();
}

module.exports = {
  validateEmail,
  validateOtp,
  validateRegistration,
  validateAdminLogin,
};
