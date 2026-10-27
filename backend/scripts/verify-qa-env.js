require("dotenv").config({ path: process.env.QA_ENV_FILE || ".env.qa" });

const REQUIRED_DATABASE = "exam-portal-qa";
const confirmation = process.env.QA_CONFIRMATION;
const uri = String(process.env.MONGODB_URI || "");
const environment = String(process.env.NODE_ENV || "");

const fail = (message) => {
  console.error(`QA environment rejected: ${message}`);
  process.exitCode = 1;
};

if (environment !== "qa") fail("NODE_ENV must be exactly qa.");
if (confirmation !== "I_UNDERSTAND_QA_ONLY") fail("QA_CONFIRMATION must be I_UNDERSTAND_QA_ONLY.");
if (!uri) fail("MONGODB_URI is missing.");

try {
  const parsed = new URL(uri);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const approvedHost = String(process.env.QA_MONGODB_HOST || "").trim();
  if (database !== REQUIRED_DATABASE) fail(`database must be ${REQUIRED_DATABASE}.`);
  if (!approvedHost) fail("QA_MONGODB_HOST must explicitly identify the approved QA host.");
  if (parsed.hostname !== approvedHost) fail("MongoDB host does not match QA_MONGODB_HOST.");
  if (database === "exam-portal") fail("development database is not permitted.");
  if (/^127\.0\.0\.1$|^localhost$/i.test(parsed.hostname)) fail("localhost is not accepted as an implicitly isolated QA target.");
  console.log(`QA environment verified: NODE_ENV=qa, database=${database}, host=${parsed.hostname}`);
} catch {
  fail("MONGODB_URI is invalid or could not be parsed.");
}
