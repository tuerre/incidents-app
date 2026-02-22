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

interface EditUsernameModalProps {
  visible: boolean;
  onClose: () => void;
  slideAnim: Animated.Value;
  displayNameChartAt: string | null;
  email: string | null;
  displayName: string | null;
  onUpdate: (newName: string) => void;
}

export const EditUsernameModal = ({
  visible,
  onClose,
  slideAnim,
  displayNameChartAt,
  email,
  displayName,
  onUpdate,
}: EditUsernameModalProps) => {
  const [newUsername, setNewUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setNewUsername(displayName || "");
    }
  }, [visible, displayName]);

  const handleSave = async () => {
    if (!newUsername.trim()) {
      Alert.alert("Error", "El nombre de usuario no puede estar vacío.");
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const { error } = await supabase.auth.updateUser({
        data: { display_name: newUsername.trim() },
      });

      if (error) throw error;

      onUpdate(newUsername.trim());
      onClose();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "¡Listo!",
        "Tu nombre de usuario ha sido actualizado correctamente.",
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        "No se pudo actualizar el nombre de usuario. Inténtalo de nuevo.",
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
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.inputField}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Ingresa tu nombre"
              placeholderTextColor="#999"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <TextInput
              style={[styles.inputField, styles.inputDisabled]}
              value={email || ""}
              editable={false}
            />
          </View>
          <Text style={styles.helperText}>
            El nombre y el correo serán visibles para tu área de trabajo
            actividades en la plataforma.
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
              <Text style={styles.saveButtonText}>Guardar Perfil</Text>
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
  inputDisabled: {
    color: "#8E8E93",
    backgroundColor: "rgba(0,0,0, 0.03)",
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
