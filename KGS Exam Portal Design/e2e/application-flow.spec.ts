import { test, expect } from "@playwright/test"

/**
 * End-to-end smoke flow for a running KGS portal.
 *
 * Run with:
 *   PLAYWRIGHT_BASE_URL=http://localhost:8443 \
 *   STUDENT_EMAIL=harshavardhandevang@gmail.com \
 *   STUDENT_OTP=123456 \
 *   npx playwright test e2e/application-flow.spec.ts
 *
 * OTP delivery is intentionally external; provide the fresh OTP through
 * STUDENT_OTP after it arrives in the test mailbox.
 */
test("student can log in, open an available exam, submit, and see results", async ({ page }) => {
  const email = process.env.STUDENT_EMAIL || "harshavardhandevang@gmail.com"
  const otp = process.env.STUDENT_OTP
  test.skip(!otp, "Set STUDENT_OTP to the fresh verification code before running.")

  await page.goto("/login")
  await page.getByRole("textbox", { name: "Email Address *" }).fill(email)
  await page.getByRole("button", { name: "Send Verification OTP" }).click()

  for (const [index, digit] of [...otp!].entries()) {
    await page.getByRole("textbox", { name: `OTP digit ${index + 1}` }).fill(digit)
  }
  await page.getByRole("button", { name: "Verify OTP & Continue" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.getByRole("button", { name: /My examinations/i }).click()
  await page.getByRole("button", { name: /AVAILABLE/ }).click()
  await expect(page.getByText("AVAILABLE", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Start Examination" }).click()

  await page.getByRole("checkbox", { name: /I have read and understood/ }).check()
  await page.getByRole("button", { name: /Continue to System Check/ }).click()
  await page.getByRole("button", { name: /Run Browser Check/ }).click()
  await page.getByRole("button", { name: /Run Network Check/ }).click()
  await page.getByRole("button", { name: /Launch Exam Environment/ }).click()

  await expect(page.getByText(/Question 1 of/)).toBeVisible()
  const radios = page.getByRole("radio")
  await radios.first().check()
  for (let question = 1; question < 5; question++) {
    await page.getByRole("button", { name: /Save & Next/ }).click()
    await page.getByRole("radio").first().check()
  }

  await page.getByRole("button", { name: "Submit Exam" }).click()
  await page.getByRole("button", { name: /Yes, Finalize & Submit/ }).click()
  await expect(page.getByText("Examination Submitted Successfully")).toBeVisible()
  await expect(page.getByText("MARKS SCORED")).toBeVisible()
})
