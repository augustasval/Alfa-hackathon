import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('Missing authorization header');
    }

    // Extract JWT token from "Bearer <token>" format
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    // Verify environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log('Environment variables present:', {
      url: !!supabaseUrl,
      serviceKey: !!supabaseServiceKey,
      anonKey: !!supabaseAnonKey
    });

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('Missing required environment variables');
      throw new Error('Server configuration error');
    }

    // Client with anon key for validating the JWT token
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey);

    // Verify the parent is authenticated by passing the token directly to getUser
    console.log('Attempting to get user from JWT token');
    const { data: { user: parentUser }, error: authError } = await supabaseUser.auth.getUser(token);
    
    console.log('Auth result:', {
      hasUser: !!parentUser,
      userId: parentUser?.id,
      error: authError?.message
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    if (!parentUser) {
      console.error('No user returned from getUser');
      throw new Error('Unauthorized: No user found');
    }

    // Client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify parent role using service role client (bypasses RLS since we already validated the token)
    console.log('Checking parent role for user:', parentUser.id);
    const { data: parentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', parentUser.id)
      .single();

    console.log('Profile query result:', {
      hasProfile: !!parentProfile,
      role: parentProfile?.role,
      error: profileError?.message
    });

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error(`Failed to verify parent status: ${profileError.message}`);
    }

    if (parentProfile?.role !== 'parent') {
      console.error('User is not a parent, role:', parentProfile?.role);
      throw new Error('Only parents can create student accounts');
    }

    console.log('Parent verification successful');

    // Parse request body
    const { name, email, password, gradeLevel } = await req.json();

    if (!name || !email || !password || !gradeLevel) {
      throw new Error('Missing required fields: name, email, password, gradeLevel');
    }

    // Validate inputs
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (gradeLevel < 1 || gradeLevel > 12) {
      throw new Error('Grade level must be between 1 and 12');
    }

    // Create student auth account using service role
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Auto-confirm since parent creates the account
      user_metadata: {
        full_name: name,
        role: 'student',
      },
    });

    if (createError) {
      console.error('Error creating auth user:', createError);
      throw new Error(`Failed to create student account: ${createError.message}`);
    }

    if (!authData.user) {
      throw new Error('Failed to create student account');
    }

    console.log('Created auth user:', authData.user.id);
    console.log('Profile will be created automatically by database trigger');

    // Create student entry linked to parent
    const { error: studentInsertError } = await supabaseAdmin
      .from('students')
      .insert({
        parent_id: parentUser.id,
        name,
        grade_level: gradeLevel,
        linked_profile_id: authData.user.id,
      });

    if (studentInsertError) {
      console.error('Error creating student entry:', studentInsertError);
      // Clean up auth user (profile will be deleted via cascade)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to link student to parent: ${studentInsertError.message}`);
    }

    console.log('Created student entry for parent:', parentUser.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Student account created successfully',
        studentId: authData.user.id,
        credentials: {
          email: email.toLowerCase().trim(),
          // Note: We don't return the password for security, parent should save it separately
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-student-account:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
