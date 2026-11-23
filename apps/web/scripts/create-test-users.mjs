import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("Connecting to Supabase at:", supabaseUrl);

  const usersToCreate = [
    {
      email: "admin@vault.local",
      password: "AdminPassword123!",
      fullName: "Admin User",
      role: "admin",
    },
    {
      email: "manager@vault.local",
      password: "ManagerPassword123!",
      fullName: "Manager User",
      role: "manager",
    },
    {
      email: "developer@vault.local",
      password: "DevPassword123!",
      fullName: "Developer User",
      role: "developer",
    },
  ];

  for (const u of usersToCreate) {
    console.log(`\nProcessing ${u.email} (${u.role})...`);

    // Check if user exists in auth.users
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error("Error listing users:", listError.message);
      process.exit(1);
    }

    let existingUser = listData.users.find((user) => user.email === u.email);

    if (!existingUser) {
      console.log(`Creating auth user: ${u.email}`);
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName },
      });

      if (createError) {
        console.error(`Failed to create auth user ${u.email}:`, createError.message);
        continue;
      }
      existingUser = createData.user;
      console.log(`Auth user created: ID ${existingUser.id}`);
    } else {
      console.log(`Auth user already exists: ID ${existingUser.id}`);
      // Update password just in case
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password: u.password,
        email_confirm: true,
      });
    }

    // Upsert into public.profiles
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: existingUser.id,
        email: u.email,
        full_name: u.fullName,
        role: u.role,
        status: "active",
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error(`Failed to upsert profile for ${u.email}:`, profileError.message);
    } else {
      console.log(`Profile successfully set for ${u.email} [role: ${u.role}, status: active]`);
    }
  }

  console.log("\n--- All done! ---");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
