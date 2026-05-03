import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Needs service role for bypassing restrictions

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  console.log("Please ensure you have SUPABASE_SERVICE_ROLE_KEY (from Supabase Project Settings -> API) added to your .env.local file to run this script.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedAdmin() {
  const email = 'adminheritage@gmail.com';
  const password = 'admin123';

  console.log(`Creating admin user: ${email}...`);

  // 1. Create the user in auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { full_name: 'Admin Heritage' }
  });

  if (authError) {
    if (authError.message.includes('already exists')) {
      console.log('User already exists in auth.users.');
      // Find the user ID by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('Error listing users:', listError);
        return;
      }
      const existingUser = users.users.find(u => u.email === email);
      if (existingUser) {
        await makeAdmin(existingUser.id);
      }
    } else {
      console.error('Error creating user:', authError);
    }
    return;
  }

  console.log('User created successfully in auth.users:', authData.user.id);
  
  // The trigger in the DB will automatically create the profile with role='user'.
  // We need to wait a tiny bit for the trigger to finish.
  await new Promise(resolve => setTimeout(resolve, 1000));

  await makeAdmin(authData.user.id);
}

async function makeAdmin(userId: string) {
  console.log(`Setting role to 'admin' in profiles table for user ID: ${userId}...`);
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating profile role:', updateError);
  } else {
    console.log('Successfully set admin role! You can now log in with adminheritage@gmail.com / admin123');
  }
}

seedAdmin();
