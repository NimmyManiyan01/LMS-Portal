const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const Session = require("../src/models/Session");
const { sessionSecret } = require("../src/config/env");
const { authenticate } = require("../src/middleware/auth");

test("cookie-only requests use the session cookie for their portal", async (t) => {
  const hash = token => crypto.createHmac("sha256", sessionSecret).update(token).digest("hex");
  const sessions = new Map([
    [hash("student-fixture"), { studentId: { id: "student" } }],
    [hash("admin-fixture"), { adminId: { id: "admin", active: true } }],
  ]);
  t.mock.method(Session, "findOne", ({ tokenHash }) => ({
    populate() { return this; },
    then(resolve) { resolve(sessions.get(tokenHash)); },
  }));
  const cookie = "kgs_session=student-fixture; kgs_admin_session=admin-fixture";
  for (const [originalUrl, role] of [
    ["/api/auth/admin/me", "ADMIN"],
    ["/api/admin/questions?page=2", "ADMIN"],
    ["/api/student/dashboard", "STUDENT"],
    ["/api/auth/me", "STUDENT"],
  ]) {
    const request = { originalUrl, headers: { cookie } };
    let authorized = false;
    await authenticate(request, {}, () => { authorized = true; });
    assert.equal(authorized, true);
    assert.equal(request.auth.role, role);
  }
});
