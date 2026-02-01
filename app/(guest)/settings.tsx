import { AppText } from "@/components/AppText";
import { StayInfoModal } from "@/components/settings/guest/StayInfoModal";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SettingItem } from "@/components/settings/SettingItem";
import { useNotifications } from "@/hooks/settings/use-notifications";
import { useNavigationDebounce } from "@/hooks/use-navigation-debounce";
import { supabase } from "@/src/services/supabase";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  ArrowLeft,
  Bell,
  Info,
  Languages,
  LogOut,
  Palette,
  UserRoundPen,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GuestSettingsScreen() {
  const { notifications, initializeNotifications, handleNotificationToggle } =
    useNotifications("guest_notifications");

  const [guestName, setGuestName] = useState<string | null>(null);
  const [guestNameChartAt, setGuestNameChartAt] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [showStayInfoModal, setShowStayInfoModal] = useState(false);
  const { isDebouncing, executeWithDebounce } = useNavigationDebounce(3000);

  const slideAnim = useRef(new Animated.Value(1000)).current;

  const closeStayModalWithAnim = () => {
    Animated.timing(slideAnim, {
      toValue: 1000,
      duration: 450,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowStayInfoModal(false);
    });
  };

  useEffect(() => {
    if (showStayInfoModal) {
      slideAnim.setValue(1000);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    }
  }, [showStayInfoModal]);

  const handleBack = () => {
    executeWithDebounce(() => {
      router.back();
    });
  };

  useEffect(() => {
    const fetchGuestInfo = async () => {
      const session = await SecureStore.getItemAsync("guest_session");
      if (session) {
        try {
          const sessionData = JSON.parse(session);
          const name = sessionData?.guest_name ?? "Huésped";
          const roomId = sessionData?.room_id;
          const charAt = typeof name === "string" ? name.charAt(0) : "H";

          setGuestName(name);
          setGuestNameChartAt(charAt);

          if (roomId) {
            const { data, error } = await supabase
              .from("rooms")
              .select("room_code, floor, active")
              .eq("id", roomId)
              .single();

            if (data && !error) {
              setRoomNumber(data.room_code || "---");
            } else {
              setRoomNumber("---");
            }
          } else {
            setRoomNumber("---");
          }
        } catch (error) {
          console.error("Error fetching guest info:", error);
          setGuestName("Huésped");
          setGuestNameChartAt("H");
          setRoomNumber("---");
        }
      }

      await initializeNotifications();
    };

    fetchGuestInfo();
  }, []);
  const handleShowStayInfo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowStayInfoModal(true);
  };

  const handleLogout = () => {
    executeWithDebounce(async () => {
      await SecureStore.deleteItemAsync("guest_session");
      await SecureStore.deleteItemAsync("guest_notifications");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      router.replace("/(auth)/login");
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          disabled={isDebouncing}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Configuración</AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileSection
          displayNameChartAt={guestNameChartAt}
          displayName={guestName}
          roomNumber={roomNumber}
          useAppText={true}
          avatarBackgroundColor="#0099ff"
        />

        <AppText style={styles.sectionLabel}>Perfil</AppText>
        <View style={styles.card}>
          <SettingItem
            icon={UserRoundPen}
            title="Nombre"
            value="No disponible"
            disabled
            hideChevron
            useAppText={true}
          />
          <SettingItem
            icon={Info}
            title="Info. de Estadía"
            value="Ver detalles"
            onPress={handleShowStayInfo}
            isLast
            useAppText={true}
          />
        </View>

        <AppText style={styles.sectionLabel}>Preferencias</AppText>
        <View style={styles.card}>
          <SettingItem
            icon={Bell}
            title="Notificaciones"
            hasSwitch
            switchValue={notifications}
            onSwitchChange={handleNotificationToggle}
            useAppText={true}
          />
          <SettingItem
            icon={Languages}
            title="Idioma"
            value="Español"
            onPress={() => {
              setTimeout(() => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              }, 0);
            }}
            useAppText={true}
          />
          <SettingItem
            icon={Palette}
            title="Tema"
            value="Claro"
            disabled
            hideChevron
            isLast
            useAppText={true}
          />
        </View>

        <AppText style={styles.sectionLabel}>Sesión</AppText>
        <View style={styles.card}>
          <SettingItem
            icon={LogOut}
            title="Cerrar sesión"
            titleColor="#FF4D4D"
            isLast
            onPress={handleLogout}
            disabled={isDebouncing}
            useAppText={true}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <StayInfoModal
        visible={showStayInfoModal}
        onClose={closeStayModalWithAnim}
        slideAnim={slideAnim}
        guestNameChartAt={guestNameChartAt}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "DtmF",
    color: "#000",
  },
  backButton: {
    padding: 4,
  },
  sectionLabel: {
    fontSize: 15,
    color: "#888",
    marginLeft: 24,
    marginBottom: 10,
    marginTop: 25,
    fontWeight: "500",
    fontFamily: "PoppinsMedium",
  },
  card: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
});
