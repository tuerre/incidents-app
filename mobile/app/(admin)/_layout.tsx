import { supabase } from '@/src/services/supabase';
import { router } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';

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

    return (
        <>
            <StatusBar barStyle="dark-content" />
            <NativeTabs>
                <NativeTabs.Trigger name="createSessions">
                    <Label>Sessions</Label>
                    <Icon sf="clock.fill" drawable='custom_android_drawable' />
                </NativeTabs.Trigger>
                <NativeTabs.Trigger name="users">
                    <Label>Users</Label>
                    <Icon sf="person.2.fill" drawable='custom_android_drawable' />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="settings">
                    <Label>Settings</Label>
                    <Icon sf="gearshape.fill" drawable='custom_android_drawable' />
                </NativeTabs.Trigger>
            </NativeTabs>
        </>
    );
}
