import { supabase } from '@/src/services/supabase'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

function generateAccessCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code.match(/.{1,4}/g)?.join('-') ?? code
}

export default function CreateGuestSession() {
    const [roomCode, setRoomCode] = useState('')
    const [expiresAt, setExpiresAt] = useState<Date | null>(null)
    const [showPicker, setShowPicker] = useState(false)
    const [generatedCode, setGeneratedCode] = useState<string | null>(null)
    const [qrValue, setQrValue] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleCreateSession() {
        if (!roomCode || !expiresAt) {
            Alert.alert('Faltan datos', 'Completa la habitación y la expiración')
            return
        }

        setLoading(true)

        const { data: existingRoom } = await supabase
            .from('rooms')
            .select('id')
            .eq('room_code', roomCode)
            .single()

        let roomId = existingRoom?.id

        if (!roomId) {
            const { data: newRoom, error } = await supabase
                .from('rooms')
                .insert({ room_code: roomCode })
                .select('id')
                .single()

            if (error) {
                setLoading(false)
                Alert.alert('Error', 'No se pudo crear la habitación')
                return
            }

            roomId = newRoom.id
        }

        const accessCode = generateAccessCode()

        const { error } = await supabase
            .from('guest_sessions')
            .insert({
                room_id: roomId,
                access_code: accessCode,
                expires_at: expiresAt.toISOString(),
                active: true
            })

        setLoading(false)

        if (error) {
            Alert.alert('Error', 'No se pudo crear la sesión')
            return
        }

        setGeneratedCode(accessCode)
        setQrValue(JSON.stringify({
            room_code: roomCode,
            access_code: accessCode
        }))
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Crear sesión de huésped</Text>

            <TextInput
                placeholder="Código de habitación (ej: A-203)"
                value={roomCode}
                onChangeText={setRoomCode}
                autoCapitalize="characters"
                style={styles.input}
            />

            <TouchableOpacity
                style={styles.input}
                onPress={() => setShowPicker(true)}
            >
                <Text>
                    {expiresAt
                        ? expiresAt.toLocaleString()
                        : 'Seleccionar fecha y hora de expiración'}
                </Text>
            </TouchableOpacity>

            {showPicker && (
                <DateTimePicker
                    value={expiresAt ?? new Date()}
                    mode="datetime"
                    display="default"
                    onChange={(_, date) => {
                        setShowPicker(false)
                        if (date) setExpiresAt(date)
                    }}
                />
            )}

            <TouchableOpacity
                style={styles.button}
                onPress={handleCreateSession}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Creando...' : 'Generar código'}
                </Text>
            </TouchableOpacity>

            {generatedCode && qrValue && (
                <View style={styles.result}>
                    <Text style={styles.resultLabel}>Código de acceso</Text>
                    <Text style={styles.resultCode}>{generatedCode}</Text>

                    <View style={{ marginTop: 20 }}>
                        <QRCode
                            value={qrValue}
                            size={200}
                        />
                    </View>

                    <Text style={styles.qrHint}>
                        Escanea este código desde la app para iniciar sesión como huésped
                    </Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center'
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 24,
        textAlign: 'center'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 14,
        borderRadius: 10,
        marginBottom: 14
    },
    button: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center'
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600'
    },
    result: {
        marginTop: 30,
        alignItems: 'center'
    },
    resultLabel: {
        fontSize: 14,
        color: '#666'
    },
    resultCode: {
        fontSize: 26,
        fontWeight: '700',
        marginTop: 6
    },
    qrHint: {
        marginTop: 10,
        fontSize: 12,
        color: '#666',
        textAlign: 'center'
    }
})
