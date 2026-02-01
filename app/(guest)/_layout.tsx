import { router, Stack } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useEffect } from 'react'

export default function GuestLayout() {
    useEffect(() => {
        const checkGuest = async () => {
            const guestSession = await SecureStore.getItemAsync('guest_session')

            if (!guestSession) {
                router.replace('/login')
            }
        }
        checkGuest()
    }, [])
    return (
        <Stack screenOptions={{ headerShown: false }} />
    )
}
