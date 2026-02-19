import { AppText } from "@/components/AppText";
import { ScreenPattern } from "@/components/ui/ScreenPattern";
import { useDateFormat } from "@/hooks/use-date-format";
import { supabase } from "@/src/services/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

function generateAccessCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code.match(/.{1,4}/g)?.join("-") ?? code;
}

export default function CreateGuestSession() {
    const [roomCode, setRoomCode] = useState("");
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [qrValue, setQrValue] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { formatDateTime } = useDateFormat();

    async function handleCreateSession() {
        if (!roomCode || !expiresAt) {
            Alert.alert("Faltan datos", "Completa la habitación y la expiración");
            return;
        }

        setLoading(true);

        const { data: existingRoom } = await supabase
            .from("rooms")
            .select("id")
            .eq("room_code", roomCode)
            .single();

        let roomId = existingRoom?.id;

        if (!roomId) {
            const { data: newRoom, error } = await supabase
                .from("rooms")
                .insert({ room_code: roomCode })
                .select("id")
                .single();

            if (error) {
                setLoading(false);
                Alert.alert("Error", "No se pudo crear la habitación");
                return;
            }

            roomId = newRoom.id;
        }

        const accessCode = generateAccessCode();

        const { error } = await supabase.from("guest_sessions").insert({
            room_id: roomId,
            access_code: accessCode,
            expires_at: expiresAt.toISOString(),
            active: true,
        });

        setLoading(false);

        if (error) {
            Alert.alert("Error", "No se pudo crear la sesión");
            return;
        }

        setGeneratedCode(accessCode);
        setQrValue(
            JSON.stringify({
                room_code: roomCode,
                access_code: accessCode,
            }),
        );
    }

    return (
        <ScreenPattern title="Crear Sesión" showBack={false}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <AppText style={styles.sectionTitle}>Detalles de la estadía</AppText>

                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <AppText style={styles.label}>Habitación</AppText>
                        <TextInput
                            placeholder="Ej: A-203"
                            placeholderTextColor="#A0A0A0"
                            value={roomCode}
                            onChangeText={setRoomCode}
                            autoCapitalize="characters"
                            style={styles.input}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <AppText style={styles.label}>Expiración</AppText>
                        <TouchableOpacity
                            style={styles.dateSelector}
                            onPress={() => setShowPicker(true)}
                        >
                            <AppText style={expiresAt ? styles.dateText : styles.placeholderText}>
                                {expiresAt
                                    ? formatDateTime(expiresAt.toISOString())
                                    : "Seleccionar fecha y hora"}
                            </AppText>
                        </TouchableOpacity>
                    </View>

                    {showPicker && (
                        <DateTimePicker
                            value={expiresAt ?? new Date()}
                            mode="datetime"
                            display="default"
                            onChange={(_, date) => {
                                setShowPicker(false);
                                if (date) setExpiresAt(date);
                            }}
                        />
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleCreateSession}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <AppText style={styles.buttonText}>Generar Código de Acceso</AppText>
                    )}
                </TouchableOpacity>

                {generatedCode && qrValue && (
                    <View style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <AppText style={styles.resultLabel}>Código de Acceso</AppText>
                        </View>

                        <AppText style={styles.resultCode}>{generatedCode}</AppText>

                        <View style={styles.qrContainer}>
                            <QRCode value={qrValue} size={180} />
                        </View>

                        <AppText style={styles.qrHint}>
                            El huésped puede escanear este código para acceder a la app.
                        </AppText>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </ScreenPattern>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666",
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#EFEEF6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: "#000",
        fontFamily: "PoppinsRegular",
    },
    dateSelector: {
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 16,
        justifyContent: "center",
    },
    dateText: {
        fontSize: 16,
        color: "#000",
    },
    placeholderText: {
        fontSize: 16,
        color: "#A0A0A0",
    },
    button: {
        backgroundColor: "#000",
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 30,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
    resultCard: {
        backgroundColor: "#FFF",
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EFEEF6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    resultLabel: {
        fontSize: 14,
        color: "#888",
        fontWeight: "500",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    copyText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    resultCode: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#000",
        letterSpacing: 2,
        marginBottom: 24,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    qrContainer: {
        padding: 16,
        backgroundColor: "#FFF",
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 20,
    },
    qrHint: {
        fontSize: 13,
        color: "#888",
        textAlign: "center",
        maxWidth: "80%",
        lineHeight: 20,
    },
});
