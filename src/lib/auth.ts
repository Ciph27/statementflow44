import { supabase } from './supabase'

export interface AuthError {
  message: string
}

export interface AuthUser {
  id: string
  email: string
  email_confirmed_at?: string
  full_name?: string
  avatar_url?: string
}

export interface AuthResponse {
  data: {
    user: AuthUser | null
    session: any
  }
  error: AuthError | null
}

// Sign up with email and password
export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    return { data: null, error: { message: error.message } }
  }

  return { 
    data: { 
      user: data.user ? {
        id: data.user.id,
        email: data.user.email || '',
        email_confirmed_at: data.user.email_confirmed_at,
        full_name: data.user.user_metadata?.full_name,
        avatar_url: data.user.user_metadata?.avatar_url,
      } : null,
      session: data.session 
    }, 
    error: null 
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { data: null, error: { message: error.message } }
  }

  return { 
    data: { 
      user: data.user ? {
        id: data.user.id,
        email: data.user.email || '',
        email_confirmed_at: data.user.email_confirmed_at,
        full_name: data.user.user_metadata?.full_name,
        avatar_url: data.user.user_metadata?.avatar_url,
      } : null,
      session: data.session 
    }, 
    error: null 
  }
}

// Sign in with Google OAuth
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    return { data: null, error: { message: error.message } }
  }

  return { data, error: null }
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return { error: { message: error.message } }
  }

  return { error: null }
}

// Reset password
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    return { error: { message: error.message } }
  }

  return { error: null }
}

// Update password
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: { message: error.message } }
  }

  return { error: null }
}

// Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    return { user: null, error: { message: error.message } }
  }

  if (!user) {
    return { user: null, error: null }
  }

  return { 
    user: {
      id: user.id,
      email: user.email || '',
      email_confirmed_at: user.email_confirmed_at,
      full_name: user.user_metadata?.full_name,
      avatar_url: user.user_metadata?.avatar_url,
    }, 
    error: null 
  }
}

// Get current session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    return { session: null, error: { message: error.message } }
  }

  return { session, error: null }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}