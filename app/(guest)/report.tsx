import { AppText } from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = [
  { id: 1, name: "Limpieza", icon: "🧹" },
  { id: 2, name: "Mantenimiento", icon: "🔧" },
  { id: 3, name: "Aire Acondicionado", icon: "❄️" },
  { id: 4, name: "TV / Internet", icon: "📺" },
  { id: 5, name: "Baño", icon: "🚿" },
  { id: 6, name: "Otro", icon: "📝" },
];

export default function ReportIncident() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert("Error", "Por favor selecciona una categoría");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Por favor describe el problema");
      return;
    }

    setLoading(true);

    // Simular envío
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Incidencia Reportada",
        "Tu solicitud ha sido enviada. Nuestro equipo la atenderá pronto.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.mainContainer} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header con gradiente */}
      <LinearGradient colors={["#b2112f", "#2b1232"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Nueva Incidencia</AppText>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Categorías */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Categoría</AppText>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id &&
                      styles.categoryCardSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <AppText style={styles.categoryIcon}>{category.icon}</AppText>
                  <AppText
                    style={[
                      styles.categoryName,
                      selectedCategory === category.id &&
                        styles.categoryNameSelected,
                    ]}
                  >
                    {category.name}
                  </AppText>
                  {selectedCategory === category.id && (
                    <View style={styles.checkmark}>
                      <Check size={16} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Descripción */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>
              Descripción del problema
            </AppText>
            <View style={styles.textareaContainer}>
              <TextInput
                style={styles.textarea}
                placeholder="Describe el problema con detalle..."
                placeholderTextColor="#ccc"
                multiline
                numberOfLines={6}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
            </View>
            <AppText style={styles.hint}>
              Cuanto más específico seas, más rápido podremos ayudarte
            </AppText>
          </View>
        </ScrollView>

        {/* Botón Submit Fijo */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#b2112f", "#2b1232"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitButton, loading && { opacity: 0.7 }]}
            >
              <AppText style={styles.submitButtonText}>
                {loading ? "Enviando..." : "Enviar Reporte"}
              </AppText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "PoppinsBold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginBottom: 15,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#eee",
    position: "relative",
  },
  categoryCardSelected: {
    borderColor: "#b2112f",
    backgroundColor: "#fff5f7",
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  categoryNameSelected: {
    color: "#b2112f",
    fontFamily: "PoppinsBold",
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#b2112f",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  textareaContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  textarea: {
    fontSize: 15,
    color: "#333",
    minHeight: 120,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    fontStyle: "italic",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#f9f9f9",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
    fontFamily: "PoppinsBold",
  },
});
