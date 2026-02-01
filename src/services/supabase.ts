import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string

const ExpoSecureStoreAdapter = {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    removeItem: SecureStore.deleteItemAsync
}

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            storage: ExpoSecureStoreAdapter,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
        }
    }
)
