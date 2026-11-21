# Company Vault — User Guide & Team Offboarding SOP

Welcome to **Company Vault**, the internal secrets and credentials manager for client projects. Company Vault is designed with strict zero-leakage security, AES-256-GCM encryption, and immutable audit logging.

---

## 1. Role & Access Matrix

Access is strictly governed by user roles and project assignments:

| Feature / Action | Admin | Manager | Developer |
| :--- | :---: | :---: | :---: |
| **Manage Clients (Create, Edit)** | ✅ | ✅ | ❌ (View only) |
| **Delete Clients** | ✅ | ❌ | ❌ |
| **Manage Projects (Create, Edit)** | ✅ | ✅ | ❌ (Assigned only) |
| **Assign Members to Projects** | ✅ | ✅ | ❌ |
| **Read / Reveal Credentials** | ✅ All | ✅ All | ✅ Assigned projects only |
| **Create / Update Credentials** | ✅ All | ✅ All | ✅ Assigned projects only |
| **Delete Credentials & Env Vars** | ✅ | ✅ | ❌ |
| **Export `.env` Configs** | ✅ | ✅ | ✅ Assigned projects only |
| **Manage Team (Invite, Deactivate)** | ✅ | ❌ | ❌ |
| **View Audit Trail Logs** | ✅ | ❌ | ❌ |

---

## 2. Everyday Guide for Developers & Managers

### Quick Search (Command Palette)
- Press `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux) anywhere to open the Global Search palette.
- Instantly search across all clients, projects, and credential service logins.
- Use arrow keys to navigate and `Enter` to open.

### Managing Project Credentials
1. Navigate to **Projects** → Select your target project → Click the **Credentials** tab.
2. **Add Credential:** Click **"Add Credential"**, specify the service name, login URL, username, and password. You can also generate high-entropy passwords with the **"Generate"** button.
3. **Reveal Password:** Click the **Eye icon**. The decrypted password will remain visible for **15 seconds** before automatically masking itself.
4. **Copy Password:** Click the **Copy icon**. The password is copied to your clipboard and will automatically be cleared from memory after **30 seconds**.
5. **Favorites:** Click the **Star icon** next to any credential to pin it to your favorites.

### Managing Environment Variables
1. Navigate to **Projects** → Select your target project → Click the **Environment Variables** tab.
2. Select the target environment: **Development**, **Staging**, or **Production**.
3. **Add Individual Variable:** Click **"Add Variable"**, enter the key name and secret value.
4. **Bulk Import (.env):** Click **"Paste .env"**, paste your configuration text (e.g., `KEY=VALUE`), inspect the live parsed preview, and confirm.
5. **Export (.env):** Click **"Export .env"** to download the formatted environment file for your project.

---

## 3. Administrator Operations

### Inviting New Team Members
1. Go to the **Team** tab (`/team`) from the sidebar.
2. Click **"Invite Member"**.
3. Enter the employee's **Email Address**, **Full Name**, and select their initial **Role** (`Developer`, `Manager`, or `Admin`).
4. Once invited, send them the login URL or have them complete account setup at `/accept-invite`.

### Audit Log Monitoring
1. Go to the **Audit Logs** tab (`/audit-logs`).
2. Review the immutable activity ledger. Every sensitive action (`login`, `reveal`, `copy`, `export`, `create`, `update`, `delete`, `invite`, `deactivate`) is logged with the actor's user ID, IP address, and timestamp.
3. Use the filter bar to isolate activities by action type, user, project, or date range.

---

## 4. Employee Offboarding Procedure (SOP)

When an employee, contractor, or team member leaves the company, follow this 3-step offboarding procedure immediately:

### Step 1: Immediate Account Deactivation (Within 5 minutes of departure)
1. Sign in as an **Admin** and navigate to the **Team** page (`/team`).
2. Locate the departing user in the team table.
3. Click the three-dots action menu (`...`) on their row and select **"Deactivate User"**.
4. Confirm deactivation in the modal.
5. **What happens under the hood:**
   - The user's status is immediately updated to `deactivated` in the database.
   - All active Supabase auth sessions and refresh tokens are instantly revoked.
   - Next.js server actions immediately reject any subsequent requests with an `Unauthorized` error.

### Step 2: Review Audit Activity
1. Open the **Audit Logs** (`/audit-logs`).
2. Filter by the departed user's email address and select date range for the past 7 to 14 days.
3. Check for unusual spikes in `reveal`, `copy`, or `export` actions prior to departure.

### Step 3: Credential Rotation Checklist
If the departed employee had access to sensitive production infrastructure:
- [ ] Rotate third-party root API keys and service passwords for projects they were assigned to.
- [ ] Update and re-encrypt the new credentials in Company Vault.
- [ ] Update the corresponding Production environment variables and re-deploy client services.
