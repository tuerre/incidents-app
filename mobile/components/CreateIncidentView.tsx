import { AppText } from "@/components/AppText";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export const CreateIncidentView = () => (
  <View style={styles.contentContainer}>
    <View style={styles.createIncidentContainer}>
      <View style={styles.iconCirclePrimary}>
        <Plus size={60} color="#0099ff" strokeWidth={2} />
      </View>
      <AppText style={styles.createTitle}>Reportar una incidencia</AppText>
      <AppText style={styles.createMessage}>
        ¿Necesitas que atendamos algo en tu habitación?
      </AppText>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push("/(guest)/report")}
      >
        <Plus
          size={20}
          color="#fff"
          strokeWidth={2.5}
          style={{ marginRight: 8 }}
        />
        <AppText style={styles.createButtonText}>Nueva Incidencia</AppText>
      </TouchableOpacity>
      <AppText style={styles.helpText}>
        Nuestro equipo atenderá tu solicitud lo antes posible
      </AppText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  createIncidentContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  iconCirclePrimary: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E6F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  createTitle: {
    fontSize: 22,
    fontFamily: "PoppinsBold",
    color: "#2D3748",
    marginBottom: 12,
    textAlign: "center",
  },
  createMessage: {
    fontSize: 15,
    color: "#718096",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  createButton: {
    backgroundColor: "#0099ff",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0099ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "PoppinsBold",
  },
  helpText: {
    fontSize: 13,
    color: "#A0AEC0",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
