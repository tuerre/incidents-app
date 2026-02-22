import { ModalSheet } from "@/components/settings/ModalSheet";
import { supabase } from "@/src/services/supabase";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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

interface EditPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  slideAnim: Animated.Value;
  displayNameChartAt: string | null;
}

export const EditPasswordModal = ({
  visible,
  onClose,
  slideAnim,
  displayNameChartAt,
}: EditPasswordModalProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [visible]);

  const handleSave = async () => {
    if (!newPassword.trim()) {
      Alert.alert("Error", "La contraseña no puede estar vacía.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      onClose();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "¡Listo!",
        "Tu contraseña ha sido actualizada correctamente.",
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        "No se pudo actualizar la contraseña. Inténtalo de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} slideAnim={slideAnim}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.innerContent}
      >
        <View style={styles.modalAvatarContainer}>
          <View style={styles.modalAvatar}>
            <Text style={styles.modalAvatarText}>
              {displayNameChartAt ?? "F"}
            </Text>
          </View>
        </View>

        <View style={styles.modalInputsContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nueva Contraseña</Text>
            <TextInput
              style={styles.inputField}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nueva contraseña"
              placeholderTextColor="#999"
              secureTextEntry
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirmar</Text>
            <TextInput
              style={styles.inputField}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repetir contraseña"
              placeholderTextColor="#999"
              secureTextEntry
              maxLength={100}
            />
          </View>
          <Text style={styles.helperText}>
            Asegúrate de que tu nueva contraseña tenga al menos 6 caracteres.
          </Text>
        </View>

        <View style={styles.modalButtonsContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Actualizar Contraseña</Text>
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
    paddingTop: 32,
  },
  modalAvatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalAvatarText: {
    fontSize: 52,
    marginTop: 7,
    fontFamily: "DtmF",
    color: "#F1F1F1",
  },
  modalInputsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#000",
  },
  helperText: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 10,
    opacity: 0.8,
  },
  modalButtonsContainer: {
    marginTop: "auto",
    gap: 10,
    marginBottom: 10,
    display: "flex",
    justifyContent: "center",
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
