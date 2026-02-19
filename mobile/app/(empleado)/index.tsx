import { AppText } from "@/components/AppText";
import { EmpleadoBuzonIncidents } from "@/components/EmpleadoBuzonIncidents";
import { EmpleadoMyTasks } from "@/components/EmpleadoMyTasks";
import { useNavigationDebounce } from "@/hooks/use-navigation-debounce";
import { router } from "expo-router";
import { UserCircle2 } from "lucide-react-native";
import React, { useState } from "react";
import { StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IncidenciasScreen() {
  const [activeTab, setActiveTab] = useState<"tareas" | "buzon">("tareas");
  const { isDebouncing, executeWithDebounce } = useNavigationDebounce(3000);

  const handleSettingsPress = () => {
    executeWithDebounce(() => {
      router.push("/settings");
    });
  };

  return (
    <SafeAreaView style={styles.mainContainer} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <View style={styles.headerTitleContainer}>
          <AppText style={styles.headerTitle}>Panel Principal</AppText>
        </View>
        <TouchableOpacity
          onPress={handleSettingsPress}
          style={styles.profileButton}
          disabled={isDebouncing}
        >
          <UserCircle2 size={28} color="#09f" strokeWidth={1.9} />
        </TouchableOpacity>
      </View>

      <View style={styles.scrollContent}>
        <View style={styles.titleSection}>
          <AppText style={styles.mainTitle}>Mis Incidencias</AppText>
          <AppText style={styles.currentViewLabel}>
            {activeTab === "tareas" ? "Tareas asignadas" : "Buzón general"}
          </AppText>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "tareas" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("tareas")}
          >
            <AppText
              style={[
                styles.tabText,
                activeTab === "tareas" && styles.activeTabText,
              ]}
            >
              Mis Tareas
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "buzon" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("buzon")}
          >
            <AppText
              style={[
                styles.tabText,
                activeTab === "buzon" && styles.activeTabText,
              ]}
            >
              Buzón General
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.cardWrapper}>
          {activeTab === "tareas" ? (
            <EmpleadoMyTasks />
          ) : (
            <EmpleadoBuzonIncidents />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: "center",
  },
  headerTitleContainer: {
    width: "80%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#000000",
    fontFamily: "PoppinsMedium",
    fontSize: 16,
  },
  profileButton: {
    padding: 5,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 25,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 34,
    fontFamily: "PoppinsBold",
    color: "#010426",
  },
  currentViewLabel: {
    fontSize: 18,
    fontFamily: "PoppinsMedium",
    color: "#718096",
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "transparent",
    borderRadius: 16,
    gap: 10,
    padding: 6,
    marginBottom: 30,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d4d4d4b4",
  },
  activeTab: {
    backgroundColor: "#DBEAFE",
    borderColor: "#2563EB",
  },
  tabText: {
    fontSize: 15,
    fontFamily: "PoppinsSemiBold",
    color: "#718096",
  },
  activeTabText: {
    color: "#2563EB",
  },
  cardWrapper: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 30,
  },
});
