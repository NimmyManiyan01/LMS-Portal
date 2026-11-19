const roles = {
  ADMIN: [
    "users:manage",
    "permissions:manage",
    "exams:manage",
    "questions:manage",
    "attempts:monitor",
    "marks:finalize",
    "reports:read",
  ],
};

module.exports = { roles };
