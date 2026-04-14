# CP Portal — QA Test Cases

---

## 1. Authentication

### TC-AUTH-01 — Successful Login
**Steps:** Navigate to `/login`. Enter valid email and password. Click Sign in.
**Expected:** Progress modal appears. User is redirected to `/app/dashboard`.

### TC-AUTH-02 — Invalid Credentials
**Steps:** Enter an incorrect email or password. Click Sign in.
**Expected:** Progress modal dismisses. Error message "Invalid email or password." is displayed. User remains on login page.

### TC-AUTH-03 — Empty Fields
**Steps:** Submit the login form with email or password blank.
**Expected:** Browser validation prevents submission. No network request is made.

### TC-AUTH-04 — Change Password — Success
**Steps:** Log in. Click the user avatar (top right). Select Change Password. Enter correct current password, a new password (≥8 chars), confirm it. Submit.
**Expected:** Success message shown. User can log out and log back in using the new password.

### TC-AUTH-05 — Change Password — Wrong Current Password
**Steps:** Change Password modal. Enter an incorrect current password. Submit.
**Expected:** Error "Current password is incorrect." New password is not saved.

### TC-AUTH-06 — Change Password — Short New Password
**Steps:** Enter a new password with fewer than 8 characters. Submit.
**Expected:** Error "New password must be at least 8 characters." Password is not saved.

### TC-AUTH-07 — Change Password — Mismatch
**Steps:** Enter matching current password. Enter different values for new password and confirm. Submit.
**Expected:** Error "New passwords do not match." Password is not saved.

### TC-AUTH-08 — Sign Out
**Steps:** Click user avatar. Select Sign out.
**Expected:** Session is cleared. User is redirected to `/`.

### TC-AUTH-09 — Unauthenticated Access
**Steps:** Without logging in, navigate directly to `/app/dashboard`.
**Expected:** User is redirected to `/login?callbackUrl=/app/dashboard`.

---

## 2. Membership

### TC-MEM-01 — Create Member — Success
**Steps:** Membership → Current Members → Add Member. Fill in Name, Email, Workgroup, Join Date. Submit.
**Expected:** Member appears in the Current Members list. A welcome email is dispatched to the member's email address containing their temp password, workgroup, financial obligations, and mentor (if assigned).

### TC-MEM-02 — Create Member — Duplicate Email
**Steps:** Attempt to create a member using an email that already exists in the system.
**Expected:** Error "A user with this email already exists." Member is not created.

### TC-MEM-03 — Create Member — Missing Required Fields
**Steps:** Submit the Add Member form with Name, Email, or Workgroup blank.
**Expected:** Validation error is shown for each missing field. Form is not submitted.

### TC-MEM-04 — Create Member — Temp Password Format
**Steps:** Create a member and note the generated password in the welcome email.
**Expected:** Password matches format `CP@` followed by 8 alphanumeric characters.

### TC-MEM-05 — Edit Member Details
**Steps:** Open a member's record. Edit name, phone, or workgroup. Save.
**Expected:** Changes are reflected immediately in the member list and profile.

### TC-MEM-06 — Edit Member — Duplicate Email
**Steps:** Change a member's email to one already used by another user.
**Expected:** Error "A user with this email already exists." Changes are not saved.

### TC-MEM-07 — Assign Mentor
**Steps:** Edit a member. Select a different active member as mentor. Save.
**Expected:** Mentor is updated. The member's dashboard shows the new mentor name.

### TC-MEM-08 — Self-Mentor Not Allowed
**Steps:** Attempt to assign a member as their own mentor.
**Expected:** Error is shown. The assignment is rejected.

### TC-MEM-09 — Deactivate Member
**Steps:** Open an active member. Click Deactivate.
**Expected:** Member moves to the Deactivated Members list. They no longer appear in active membership counts on the Group Dashboard.

### TC-MEM-10 — Reactivate Member
**Steps:** Open a deactivated member. Click Reactivate.
**Expected:** Member returns to the Current Members list and is included in active membership stats.

### TC-MEM-11 — Permission Guard — No Create Access
**Steps:** Log in as a user without Membership `canCreate` permission. Navigate to membership.
**Expected:** Add Member button is not visible. Attempting the API directly returns 403.

---

## 3. Finance — Payments

### TC-PAY-01 — Record Payment Manually
**Steps:** Finance → All Payments → Add Payment. Select member, account (CP-KITTY or CP-WELFARE), enter M-Pesa code, amount, date paid. Submit.
**Expected:** Payment appears in the list with status Unverified. A payment-captured notification is sent to the member.

### TC-PAY-02 — Duplicate M-Pesa Code
**Steps:** Attempt to record a payment using an M-Pesa code already in the system.
**Expected:** Error indicating the code already exists. Payment is not saved.

### TC-PAY-03 — Invalid Amount
**Steps:** Enter 0 or a negative amount.
**Expected:** Validation error. Payment is not saved.

### TC-PAY-04 — Verify Payment
**Steps:** On an unverified payment, click Verify.
**Expected:** Payment status changes to Verified. Verified-by name and timestamp are recorded. A payment-verified notification is sent to the member. The pending verification count on the Group Dashboard decreases.

### TC-PAY-05 — Import Payments
**Steps:** Finance → Payments → Import. Upload a valid CSV/report file with M-Pesa codes, amounts, dates, and account codes.
**Expected:** Valid rows are imported and appear in the payments list. Rows with missing codes, invalid amounts, unrecognised accounts, or unknown members are skipped. A summary of created vs skipped rows is returned.

### TC-PAY-06 — Import — Duplicate Code Skipped
**Steps:** Include an M-Pesa code in the import file that already exists in the system.
**Expected:** That row is skipped with a reason. All other valid rows are still imported.

### TC-PAY-07 — My Payments View
**Steps:** Log in as a regular member. Navigate to Finance → My Payments.
**Expected:** Only payments belonging to the logged-in member are shown. No other member's payments are visible.

### TC-PAY-08 — My Statement View
**Steps:** Finance → My Statement.
**Expected:** Shows expected vs paid amounts for CP Kitty and Welfare. Balance (positive = compliant, negative = in arrears) is correctly calculated.

---

## 4. Finance — Expenses

### TC-EXP-01 — Record Expense
**Steps:** Finance → Expenses → Add Expense. Enter title, description, amount, date, and select account (CP-KITTY or CP-WELFARE). Submit.
**Expected:** Expense appears in the list. The Expenses figure on the Group Dashboard updates accordingly.

### TC-EXP-02 — Missing Required Fields
**Steps:** Submit the expense form without title, description, or amount.
**Expected:** Validation error for each missing field. Expense is not saved.

### TC-EXP-03 — Invalid Amount
**Steps:** Enter 0 or a negative expense amount.
**Expected:** Validation error. Expense is not saved.

---

## 5. Finance — Budget

### TC-BUD-01 — Add Budget Item
**Steps:** Finance → Budget → Add Budget Item. Enter title, date, and amount. Submit.
**Expected:** Item appears in the budget list. The Budget figure on the Group Dashboard reflects the new total.

### TC-BUD-02 — Edit Budget Item
**Steps:** Click Edit on an existing budget item. Change the amount. Save.
**Expected:** Updated amount is shown in the list and reflected in the Group Dashboard total.

### TC-BUD-03 — Delete Budget Item
**Steps:** Click Delete on a budget item. Confirm.
**Expected:** Item is removed from the list. Group Dashboard total updates.

### TC-BUD-04 — Missing Fields
**Steps:** Submit the budget form without title or amount.
**Expected:** Validation error. Item is not saved.

---

## 6. Events

### TC-EVT-01 — Create Event
**Steps:** Events → New Event. Enter title, date, category (CP Event / MGM / Kachai). Submit.
**Expected:** Event appears in the relevant category list.

### TC-EVT-02 — Create Event — Missing Required Fields
**Steps:** Submit the event form without title or date.
**Expected:** Validation error. Event is not created.

### TC-EVT-03 — Edit Event
**Steps:** Open an event. Edit title, venue, or description. Save.
**Expected:** Changes appear immediately on the event detail page.

### TC-EVT-04 — Delete Event
**Steps:** Delete an event.
**Expected:** Event is removed from all listings. Associated attendance records are also removed.

### TC-EVT-05 — Record Attendance
**Steps:** Open an event. Add a member to the attendance list.
**Expected:** Member appears in the attendance list with a timestamp. The member's attendance stats on their personal dashboard update.

### TC-EVT-06 — Duplicate Attendance
**Steps:** Attempt to add the same member to an event's attendance twice.
**Expected:** Error indicating the member is already recorded. No duplicate is created.

### TC-EVT-07 — Kachai Attendance — Wrong Workgroup
**Steps:** For a Kachai event assigned to Workgroup A, attempt to record attendance for a member of Workgroup B.
**Expected:** Error indicating the member does not belong to the event's workgroup. Attendance is not recorded.

### TC-EVT-08 — Remove Attendance
**Steps:** On an event's attendance list, remove a member.
**Expected:** Member is removed from the list. Their attendance count on the personal dashboard decreases.

### TC-EVT-09 — Contact Person Phone Displayed
**Steps:** Open any event that has a contact person assigned.
**Expected:** The contact person's name and phone number are shown. Email is not shown.

---

## 7. Personal Dashboard

### TC-DASH-01 — Contribution Compliance
**Steps:** Log in as a member who has made all required payments.
**Expected:** CP Kitty and Welfare cards show green "Compliant" status with a positive balance.

### TC-DASH-02 — In Arrears
**Steps:** Log in as a member with outstanding payments.
**Expected:** The relevant card shows red "In arrears" status with the overdue amount.

### TC-DASH-03 — Attendance Stats
**Steps:** Log in as a member. View Activity Attendance card.
**Expected:** Shows attended vs total events for each category (CP Events, MGM, Kachai) for the current year with percentage bars.

### TC-DASH-04 — CP Score Calculation
**Steps:** View the CP Score card.
**Expected:** Score is between 0–100. Attendance contributes up to 50 pts, finance compliance up to 40 pts, mentorship up to 10 pts.

### TC-DASH-05 — Years in CP Card
**Steps:** View the Years in CP card.
**Expected:** Correctly shows years since the member's join date and the exact join date.

### TC-DASH-06 — Attended Events List
**Steps:** Click the attended events link on the Activity Attendance card.
**Expected:** Modal opens showing all events the member has attended (all time), sorted newest first, with title, date, category, and venue.

---

## 8. Group Dashboard (Reports)

### TC-RPT-01 — Active Member Count
**Steps:** Navigate to Group Dashboard.
**Expected:** Total active member count excludes deactivated members. Workgroup donut chart reflects correct distribution.

### TC-RPT-02 — CP Kitty Paid-Up
**Steps:** View CP Kitty paid-up chart.
**Expected:** Shows count and percentage of active members who are fully paid up for CP Kitty contributions.

### TC-RPT-03 — CP Welfare Paid-Up
**Steps:** View CP Welfare paid-up chart.
**Expected:** Shows count and percentage of active members paid up for Welfare contributions.

### TC-RPT-04 — Cash at Hand Calculation
**Steps:** View CP Kitty Cash at Hand card.
**Expected:** Value equals: previous year collections + current year collections − current year expenses.

### TC-RPT-05 — Pending Verification Count
**Steps:** Have at least one unverified payment. View Group Dashboard.
**Expected:** Pending Verification card shows the correct count of unverified payments across both accounts.

### TC-RPT-06 — Pending Count Decreases on Verify
**Steps:** Verify a payment. Return to Group Dashboard.
**Expected:** Pending Verification count decreases by 1.

---

## 9. Payment Accounts

### TC-ACC-01 — Create Payment Account
**Steps:** Payment Accounts → New. Enter code (e.g., CP-KITTY), name, optional description. Submit.
**Expected:** Account appears in the list and is available when recording payments.

### TC-ACC-02 — Duplicate Code
**Steps:** Create an account with a code already in the system.
**Expected:** Error indicating the code already exists. Account is not created.

### TC-ACC-03 — Edit Account
**Steps:** Edit an existing account's name or description. Save.
**Expected:** Changes reflected in the list and in any payment forms that reference the account.

### TC-ACC-04 — Delete Account
**Steps:** Delete a payment account that has no payments linked.
**Expected:** Account is removed from the list.

---

## 10. Downloads

### TC-DOC-01 — Add Document
**Steps:** Downloads → Add Document. Enter title, Google Drive link, and optional category/description. Submit.
**Expected:** Document appears in the list under the correct category.

### TC-DOC-02 — Open Document
**Steps:** Click a document link.
**Expected:** Google Drive file opens in a new tab.

### TC-DOC-03 — Edit Document
**Steps:** Edit a document's title or URL. Save.
**Expected:** Updated details shown in the list.

### TC-DOC-04 — Delete Document
**Steps:** Delete a document. Confirm.
**Expected:** Document is removed from the list and is no longer accessible.

### TC-DOC-05 — Missing Required Fields
**Steps:** Submit the document form without title or URL.
**Expected:** Validation error. Document is not saved.

---

## 11. Membership Inquiry (Public Form)

### TC-INQ-01 — Submit Inquiry
**Steps:** Navigate to the public inquiry page. Fill in name, phone, email, and message. Submit.
**Expected:** Inquiry is saved. Confirmation shown to the user. Admin can see it in the Inquiries module.

### TC-INQ-02 — Missing Fields
**Steps:** Submit the inquiry form with any required field blank.
**Expected:** Validation error for the missing field. Inquiry is not submitted.

### TC-INQ-03 — Invalid Email
**Steps:** Enter a malformed email (e.g., `not-an-email`).
**Expected:** Validation error. Inquiry is not submitted.

---

## 12. Role-Based Access Control

### TC-RBAC-01 — SuperAdmin Full Access
**Steps:** Log in as a super-admin user.
**Expected:** All modules and menu items are visible. No permission-denied errors occur on any page.

### TC-RBAC-02 — Module Not Assigned
**Steps:** Log in as a user without a specific module (e.g., Finance not assigned).
**Expected:** Finance menu items do not appear in the sidebar. Navigating directly to `/app/finance` redirects or shows access denied.

### TC-RBAC-03 — View-Only Access
**Steps:** Log in as a user with only `canView` on a module (e.g., Membership).
**Expected:** Data is visible. Add / Edit / Delete buttons are not shown. API calls for create/edit/delete return 403.

### TC-RBAC-04 — Expired Module Access
**Steps:** A user has a module assignment with `validUntil` set to a past date. Log in as that user.
**Expected:** The module is not accessible. The menu item does not appear.

---

## 13. Notifications

### TC-NOTIF-01 — Welcome Email on Member Creation
**Steps:** Create a new member with a valid email address.
**Expected:** Member receives a welcome email containing: CP community name, workgroup, activities (Kachai, MGM, CP Events), financial obligations (KES 1,000/yr, KES 300/month Kitty, KES 300/month Welfare), mentor details (if assigned), portal login credentials (email + temp password).

### TC-NOTIF-02 — Payment Captured Notification
**Steps:** Record a payment for a member who has an email on file.
**Expected:** Member receives an email confirming the payment with amount, account, date, and M-Pesa code.

### TC-NOTIF-03 — Payment Verified Notification
**Steps:** Verify a payment.
**Expected:** Member receives an email confirming verification, including the verifier's name.

### TC-NOTIF-04 — No Email When Env Var Missing
**Steps:** (Server-side check) Remove `GMAIL_APP_PASSWORD` from environment.
**Expected:** Server logs `[notify] GMAIL_APP_PASSWORD env var is not set — email skipped`. No crash occurs. Member creation still succeeds.

---

## 14. Progressive Web App (PWA)

### TC-PWA-01 — Install Prompt (Android/Chrome)
**Steps:** Open the app in Chrome on Android. Wait for the browser to show an install prompt.
**Expected:** "Add to Home Screen" banner or install icon appears.

### TC-PWA-02 — Standalone Mode
**Steps:** After installing, open the app from the home screen.
**Expected:** App opens without browser chrome (no address bar). Theme colour (#367C00) is applied to the status bar.

### TC-PWA-03 — Offline Fallback
**Steps:** Load the app, then disable network. Navigate to a new page.
**Expected:** Offline fallback page is shown with a "Try again" button. No blank screen or browser error.

### TC-PWA-04 — Favicon in Browser Tab
**Steps:** Open the app in any browser.
**Expected:** Correct favicon appears in the browser tab.

---

## 15. Mobile Responsiveness

### TC-MOB-01 — Sidebar Navigation
**Steps:** Open the app on a mobile device (or browser at <768px width).
**Expected:** Sidebar is hidden. Hamburger menu icon is visible in the top bar. Tapping it opens the sidebar drawer.

### TC-MOB-02 — Table → Card Layout
**Steps:** View any data table (Members, Payments, Expenses, Events) on mobile.
**Expected:** Table is hidden. Card-based list is shown instead with all key data fields visible.

### TC-MOB-03 — Modals on Mobile
**Steps:** Open any modal (Add Member, Verify Payment, etc.) on mobile.
**Expected:** Modal fits within the screen height with scrolling if content overflows. Buttons are full-width and easily tappable.

### TC-MOB-04 — Form Inputs on Mobile
**Steps:** Fill in any form on mobile.
**Expected:** All inputs are accessible, labels are visible, and the keyboard does not obscure the active field.

---

*Last updated: April 2026*
