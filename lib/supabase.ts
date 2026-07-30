import { createClient } from '@supabase/supabase-js'
import Cookies from 'js-cookie'

const cookieStorage = {
  getItem: (key: string) => Cookies.get(key) ?? null,
  setItem: (key: string, value: string): void => {
    Cookies.set(key, value, {
      domain: '.the-tiniest-library.com',
      sameSite: 'lax',
      secure: true,
      expires: 7,
    });
  },
  removeItem: (key: string) => Cookies.remove(key, {
    domain: '.the-tiniest-library.com',
  }),
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: cookieStorage,
      storageKey: 'ttl-auth-token',
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)