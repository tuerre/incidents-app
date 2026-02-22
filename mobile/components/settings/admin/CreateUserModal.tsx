import { ModalSheet } from "@/components/settings/ModalSheet";
import { supabase } from "@/src/services/supabase";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface NewUserProfile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    area: string | null;
}

interface CreateUserModalProps {
    visible: boolean;
    onClose: () => void;
    slideAnim: Animated.Value;
    onUserCreated: (user: NewUserProfile) => void;
}

export const CreateUserModal = ({
    visible,
    onClose,
    slideAnim,
    onUserCreated,
}: CreateUserModalProps) => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (visible) {
            setFullName("");
            setEmail("");
            setPassword("");
            setRole("");
        }
    }, [visible]);

    const handleCreate = async () => {
        if (!fullName.trim() || !email.trim() || !password.trim()) {
            Alert.alert("Error", "Completa todos los campos obligatorios.");
            return;
        }
        const normalizedRole = role.trim().toLowerCase();
        if (normalizedRole !== "empleado" && normalizedRole !== "admin") {
            Alert.alert(
                "Rol inválido",
                "El rol debe ser exactamente 'empleado' o 'admin'."
            );
            return;
        }

        setIsSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Create the auth user via admin API
            const { data, error: createError } =
                await supabase.auth.admin.createUser({
                    email: email.trim(),
                    password: password.trim(),
                    email_confirm: true,
                    user_metadata: { display_name: fullName.trim() },
                });

            if (createError || !data?.user) throw createError;

            const newUserId = data.user.id;

            // Upsert profile row
            const { error: profileError } = await supabase.from("profiles").upsert({
                id: newUserId,
                email: email.trim(),
                full_name: fullName.trim(),
                role: normalizedRole,
                area: null,
            });

            if (profileError) throw profileError;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onUserCreated({
                id: newUserId,
                email: email.trim(),
                full_name: fullName.trim(),
                role: normalizedRole,
                area: null,
            });
            onClose();
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                "Error",
                error?.message || "No se pudo crear el usuario. Intenta de nuevo."
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ModalSheet visible={visible} onClose={onClose} slideAnim={slideAnim} height="82%">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.innerContent}
            >
                <View style={styles.modalHeaderContainer}>
                    <View style={styles.modalAvatar}>
                        <Text style={styles.modalAvatarText}>+</Text>
                    </View>
                    <Text style={styles.modalTitle}>Nuevo Usuario</Text>
                </View>

                <View style={styles.modalInputsContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nombre completo *</Text>
                        <TextInput
                            style={styles.inputField}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Nombre completo"
                            placeholderTextColor="#999"
                            maxLength={80}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Correo electrónico *</Text>
                        <TextInput
                            style={styles.inputField}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="correo@ejemplo.com"
                            placeholderTextColor="#999"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Contraseña *</Text>
                        <TextInput
                            style={styles.inputField}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Contraseña inicial"
                            placeholderTextColor="#999"
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Rol *</Text>
                        <TextInput
                            style={styles.inputField}
                            value={role}
                            onChangeText={setRole}
                            placeholder="empleado o admin"
                            placeholderTextColor="#999"
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                <View style={styles.modalButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                        onPress={handleCreate}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Crear Usuario</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                        disabled={isSaving}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ModalSheet>
    );
};

const styles = StyleSheet.create({
    innerContent: {
        flex: 1,
        padding: 24,
        paddingTop: 28,
    },
    modalHeaderContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    modalAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#3B82F6",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    modalAvatarText: {
        fontSize: 40,
        color: "#F1F1F1",
        fontWeight: "300",
        lineHeight: 48,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#1A1A1A",
        fontFamily: "PoppinsBold",
    },
    modalInputsContainer: {
        gap: 12,
        marginBottom: 16,
    },
    inputGroup: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: "500",
        color: "#3A3A3C",
        marginLeft: 4,
        opacity: 0.8,
    },
    inputField: {
        backgroundColor: "rgba(255, 255, 255, 0.23)",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        borderRadius: 50,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        color: "#000",
    },
    modalButtonsContainer: {
        marginTop: "auto",
        gap: 10,
        marginBottom: 10,
        alignItems: "center",
    },
    saveButton: {
        backgroundColor: "#000",
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: "center",
        width: "60%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
    cancelButton: {
        alignItems: "center",
        paddingVertical: 12,
    },
    cancelButtonText: {
        color: "#333",
        fontSize: 16,
        fontWeight: "500",
    },
});
