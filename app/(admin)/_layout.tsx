import { supabase } from '@/src/services/supabase'
import { router, Stack } from 'expo-router'
import { useEffect } from 'react'

export default function AdminLayout() {
    useEffect(() => {
        const checkAdmin = async () => {
            const { data } = await supabase.auth.getSession()
            if (!data.session) {
                router.replace('/(auth)/login')
                return
            }
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).single()
            if (profile?.role !== 'admin') {
                router.replace('/(auth)/login')
                return
            }
        }
        checkAdmin()
    }, [])
    return <Stack screenOptions={{ headerShown: false }} />
}
