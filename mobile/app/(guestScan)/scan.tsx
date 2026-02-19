import { AppText } from '@/components/AppText'
import { ScreenPattern } from '@/components/ui/ScreenPattern'
import { supabase } from '@/src/services/supabase'
import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useRef, useState } from 'react'
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native'

export default function GuestScanScreen() {
    const [permission, requestPermission] = useCameraPermissions()
    const [scanning, setScanning] = useState(false)
    const scanLock = useRef(false)

    async function startScan() {
        if (!permission || permission.status !== 'granted') {
            const res = await requestPermission()
            if (!res.granted) {
                Alert.alert(
                    'Permiso requerido',
                    'Necesitamos acceso a la cámara para escanear el código QR'
                )
                return
            }
        }

        scanLock.current = false
        setScanning(true)
    }

    async function handleScan({ data }: { data: string }) {
        if (scanLock.current) return
        scanLock.current = true

        setScanning(false)

        let parsed
        try {
            parsed = JSON.parse(data)
        } catch {
            Alert.alert('Código inválido', 'El QR no es válido', [
                {
                    text: 'Intentar de nuevo',
                    onPress: () => {
                        scanLock.current = false
                    },
                },
            ])
            return
        }

        const accessCode = parsed.access_code

        if (!accessCode) {
            Alert.alert('Código inválido', 'El QR no contiene un código válido', [
                {
                    text: 'Intentar de nuevo',
                    onPress: () => {
                        scanLock.current = false
                    },
                },
            ])
            return
        }

        const { data: session, error } = await supabase
            .from('guest_sessions')
            .select('*')
            .eq('access_code', accessCode)
            .eq('active', true)
            .single()

        if (error || !session) {
            Alert.alert(
                'Código inválido',
                'El código no es válido o ya expiró',
                [
                    {
                        text: 'Intentar de nuevo',
                        onPress: () => {
                            scanLock.current = false
                        },
                    },
                ]
            )
            return
        }

        const now = new Date()
        if (new Date(session.expires_at) < now) {
            Alert.alert(
                'Código expirado',
                'Este código ya no es válido',
                [
                    {
                        text: 'Aceptar',
                        onPress: () => {
                            scanLock.current = false
                        },
                    },
                ]
            )
            return
        }

        await SecureStore.setItemAsync('guest_session', JSON.stringify(session))
        router.replace('/(guest)/home')
    }

    if (scanning && permission?.granted) {
        return (
            <View style={styles.cameraContainer}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={handleScan}
                />

                <View style={styles.overlay}>
                    <View style={styles.scanFrame} />
                    <AppText style={styles.helperText}>
                        Alinea el código QR dentro del marco
                    </AppText>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                            scanLock.current = false
                            setScanning(false)
                        }}
                    >
                        <AppText style={styles.cancelText}>Cancelar</AppText>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <ScreenPattern title="Iniciar sesión - Huésped" backRoute={'/(auth)/login'}>
            <View style={styles.container}>
                <Ionicons name="qr-code-outline" size={120} color="#FF385C" />

                <AppText style={styles.title}>
                    Escanea tu código
                </AppText>

                <AppText style={styles.subtitle}>
                    Usa el código QR dado en el check-out
                </AppText>

                <TouchableOpacity style={styles.button} onPress={startScan}>
                    <AppText style={styles.buttonText}>
                        Escanear código QR
                    </AppText>
                </TouchableOpacity>
            </View>
        </ScreenPattern>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 22,
        marginTop: 24,
        fontFamily: 'DtmF',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 8,
        color: '#777',
        textAlign: 'center',
    },
    button: {
        marginTop: 32,
        backgroundColor: '#FF385C',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 240,
        height: 240,
        borderWidth: 2,
        borderColor: '#FF385C',
        borderRadius: 16,
    },
    helperText: {
        marginTop: 24,
        color: '#FFF',
    },
    cancelButton: {
        marginTop: 32,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    cancelText: {
        color: '#FFF',
        fontSize: 14,
    },
})
