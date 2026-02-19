import { supabase } from '@/src/services/supabase'
import { router, Stack } from 'expo-router'
import { useEffect } from 'react'

export default function EmpleadoLayout() {
    useEffect(() => {
        const checkEmpleado = async () => {
            const { data } = await supabase.auth.getSession()
            if (!data.session) {
                router.replace('/(auth)/login')
                return
            }
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).single()
            if (profile?.role !== 'empleado') {
                router.replace('/(auth)/login')
                return
            }
        }
        checkEmpleado()
    }, [])
    return <Stack screenOptions={{ headerShown: false }} />
}
