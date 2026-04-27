import { ModalSheet } from "@/components/settings/ModalSheet";
import {
  Alert,
  Animated,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { AppText } from "@/components/AppText";
import { supabase } from "@/src/services/supabase";
import * as SecureStore from "expo-secure-store";
import { Check, ChevronDown } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";

type Area = {
  id: string;
  name: string;
};

export const CreateIncidentForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userMarkedUrgent, setUserMarkedUrgent] = useState(false);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [openArea, setOpenArea] = useState(false);

  // Animacion para selector de area
  const areaSlide = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (openArea) {
      Animated.spring(areaSlide, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start();
    } else {
      Animated.timing(areaSlide, {
        toValue: 600,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [openArea]);

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      const { data, error } = await supabase
        .from("areas")
        .select("id, name")
        .order("name");

      if (error) throw error;
      if (data) setAreas(data);
    } catch (e: any) {
      Alert.alert("Error", "No se pudieron cargar las áreas");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !areaId) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    try {
      setLoading(true);

      const raw = await SecureStore.getItemAsync("guest_session");
      if (!raw) throw new Error("No hay sesión de huésped");

      const guestSession = JSON.parse(raw);

      const { error } = await supabase.from("incidents").insert({
        title,
        description,
        user_marked_urgent: userMarkedUrgent,
        area_id: areaId,
        room_id: guestSession.room_id,
      });

      if (error) throw error;

      Alert.alert("Listo", "Incidencia enviada");

      setTitle("");
      setDescription("");
      setUserMarkedUrgent(false);
      setAreaId(null);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Error creando incidencia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.inputGroup}>
          <AppText style={styles.label}>Título</AppText>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={"#94A3B8"}
            placeholder="Ej: Aire no enfría"
          />
        </View>

        <View style={styles.inputGroup}>
          <AppText style={styles.label}>Urgencia</AppText>
          <Pressable
            style={styles.urgentToggle}
            onPress={() => setUserMarkedUrgent((current) => !current)}
          >
            <View
              style={[
                styles.checkbox,
                userMarkedUrgent && styles.checkboxChecked,
              ]}
            >
              {userMarkedUrgent && <Check size={14} color="#FFFFFF" />}
            </View>
            <AppText style={styles.urgentLabel}>
              ¿Considera esta incidencia urgente?
            </AppText>
          </Pressable>
        </View>

        <View style={styles.inputGroup}>
          <AppText style={styles.label}>Tipo de Incidencia</AppText>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setOpenArea(true)}
            activeOpacity={0.7}
          >
            {areaId ? (
              <View style={styles.selectedOption}>
                <AppText style={styles.selectedText}>
                  {(() => {
                    const area = areas.find((a) => a.id === areaId);
                    return area
                      ? area.name.charAt(0).toUpperCase() + area.name.slice(1)
                      : "";
                  })()}
                </AppText>
              </View>
            ) : (
              <AppText style={styles.placeholder}>Selecciona el área</AppText>
            )}
            <ChevronDown
              size={20}
              color="#94A3B8"
              style={[styles.chevron, openArea && styles.chevronOpen]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <AppText style={styles.label}>Descripción</AppText>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={Keyboard.dismiss}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <AppText style={styles.buttonText}>
            {loading ? "Enviando..." : "Reportar Incidencia"}
          </AppText>
        </TouchableOpacity>

        <ModalSheet
          visible={openArea}
          onClose={() => setOpenArea(false)}
          slideAnim={areaSlide}
          height="60%"
        >
          <View style={styles.dropdownContent}>
            <View style={styles.dropdownHeader}>
              <AppText style={styles.dropdownTitle}>
                Selecciona el área
              </AppText>
            </View>
            <View style={styles.optionsList}>
              {areas.map((area) => (
                <TouchableOpacity
                  key={area.id}
                  style={[
                    styles.optionItem,
                    areaId === area.id && styles.optionItemSelected,
                  ]}
                  onPress={() => {
                    setAreaId(area.id);
                    setOpenArea(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <AppText style={styles.areaText}>
                      {area.name.charAt(0).toUpperCase() + area.name.slice(1)}
                    </AppText>
                  </View>
                  {areaId === area.id && (
                    <View style={styles.checkContainer}>
                      <Check size={20} color="#0099ff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setOpenArea(false)}
            >
              <AppText style={styles.closeModalText}>Cerrar</AppText>
            </TouchableOpacity>
          </View>
        </ModalSheet>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: "#2D3748",
    fontFamily: "PoppinsSemiBold",
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  selectButton: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedOption: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  placeholder: {
    color: "#94A3B8",
    fontSize: 15,
  },
  urgentToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#FFF",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  checkboxChecked: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  urgentLabel: {
    fontSize: 14,
    color: "#1E293B",
    fontFamily: "PoppinsMedium",
    flexShrink: 1,
  },
  chevron: {
    marginLeft: 8,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  button: {
    backgroundColor: "#0099ff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#0099ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "PoppinsBold",
  },
  dropdownContent: {
    padding: 24,
    paddingTop: 32,
  },
  dropdownHeader: {
    marginBottom: 20,
    alignItems: "center",
  },
  dropdownTitle: {
    fontSize: 20,
    fontFamily: "PoppinsBold",
    color: "#1E293B",
    marginBottom: 4,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  optionItemSelected: {
    backgroundColor: "rgba(0, 153, 255, 0.1)",
    borderColor: "#0099ff",
  },
  optionContent: {
    flex: 1,
  },
  checkContainer: {
    marginLeft: 12,
  },
  areaText: {
    fontSize: 16,
    color: "#1E293B",
    fontFamily: "PoppinsMedium",
  },
  closeModalButton: {
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 12,
  },
  closeModalText: {
    color: "#64748B",
    fontSize: 15,
    fontFamily: "PoppinsMedium",
  },
  selectedText: {
    textTransform: "capitalize",
    fontSize: 15,
    color: "#1E293B",
    fontFamily: "PoppinsMedium",
  },
});
