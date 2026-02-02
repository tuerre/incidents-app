import { AppText } from "@/components/AppText";
import { ModalSheet } from "@/components/settings/ModalSheet";
import { useDateFormat } from "@/hooks/use-date-format";
import { supabase } from "@/src/services/supabase";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

interface StayInfoModalProps {
  visible: boolean;
  onClose: () => void;
  slideAnim: Animated.Value;
  guestNameChartAt: string | null;
}

interface StayInfo {
  incidentsCount: number;
  checkIn: string;
  checkOut: string;
  loading: boolean;
}

export const StayInfoModal = ({
  visible,
  onClose,
  slideAnim,
  guestNameChartAt,
}: StayInfoModalProps) => {
  const [stayInfo, setStayInfo] = useState<StayInfo>({
    incidentsCount: 0,
    checkIn: "",
    checkOut: "",
    loading: false,
  });
  const { formatDate } = useDateFormat();

  React.useEffect(() => {
    if (visible) {
      fetchStayInfo();
    }
  }, [visible]);

  const fetchStayInfo = async () => {
    setStayInfo({ ...stayInfo, loading: true });

    try {
      const session = await SecureStore.getItemAsync("guest_session");
      if (!session) throw new Error("No hay sesión");

      const sessionData = JSON.parse(session);
      const roomId = sessionData?.room_id;

      const { data: guestSessionData, error: sessionError } = await supabase
        .from("guest_sessions")
        .select("created_at, expires_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (sessionError) throw sessionError;

      const createdAt = guestSessionData.created_at;
      const expiresAt = guestSessionData.expires_at;

      const { data: incidents, error: incidentsError } = await supabase
        .from("incidents")
        .select("id")
        .eq("room_id", roomId)
        .gte("created_at", createdAt)
        .lte("created_at", expiresAt);

      if (incidentsError) throw incidentsError;

      setStayInfo({
        incidentsCount: incidents?.length || 0,
        checkIn: formatDate(createdAt),
        checkOut: formatDate(expiresAt),
        loading: false,
      });
    } catch (error: any) {
      console.error("Error fetching stay info:", error);
      setStayInfo({
        incidentsCount: 0,
        checkIn: "---",
        checkOut: "---",
        loading: false,
      });
    }
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} slideAnim={slideAnim}>
      <View style={styles.innerContent}>
        <View style={styles.modalAvatarContainer}>
          <View style={styles.modalAvatar}>
            <AppText style={styles.modalAvatarText}>
              {guestNameChartAt ?? "H"}
            </AppText>
          </View>
        </View>

        <AppText style={styles.modalTitle}>Información de Estadía</AppText>

        {stayInfo.loading ? (
          <View style={styles.modalLoadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <AppText style={styles.modalLoadingText}>
              Cargando información...
            </AppText>
          </View>
        ) : (
          <View style={styles.modalBody}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <AppText style={styles.statIcon}>📋</AppText>
              </View>
              <View style={styles.statInfo}>
                <AppText style={styles.statLabel}>
                  Incidencias Reportadas
                </AppText>
                <AppText style={styles.statValue}>
                  {stayInfo.incidentsCount}
                </AppText>
              </View>
            </View>

            <View style={styles.dateInfoContainer}>
              <View style={styles.dateItem}>
                <AppText style={styles.dateLabel}>Check-in</AppText>
                <AppText style={styles.dateValue}>{stayInfo.checkIn}</AppText>
              </View>
              <View style={styles.dateDivider} />
              <View style={styles.dateItem}>
                <AppText style={styles.dateLabel}>Check-out</AppText>
                <AppText style={styles.dateValue}>{stayInfo.checkOut}</AppText>
              </View>
            </View>

            <View style={styles.infoNote}>
              <AppText style={styles.infoNoteText}>
                💡 Las incidencias mostradas corresponden únicamente a tu
                estadía actual.
              </AppText>
            </View>
          </View>
        )}

        <View style={styles.modalButtonsContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <AppText style={styles.cancelButtonText}>Cerrar</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </ModalSheet>
  );
};

const styles = StyleSheet.create({
  innerContent: {
    flex: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  modalAvatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0099ff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  modalAvatarText: {
    color: "#FFF",
    fontSize: 40,
    fontWeight: "bold",
    fontFamily: "DtmF",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
    lineHeight: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "PoppinsBold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 20,
  },
  modalLoadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  modalLoadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "PoppinsRegular",
    color: "#6B7280",
  },
  modalBody: {
    gap: 20,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 246, 255, 0.5)",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(219, 234, 254, 0.5)",
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  statIcon: {
    fontSize: 28,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "PoppinsMedium",
    color: "#1E40AF",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 32,
    fontFamily: "PoppinsBold",
    color: "#1E3A8A",
  },
  dateInfoContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(249, 250, 251, 0.5)",
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#6B7280",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontFamily: "PoppinsSemiBold",
    color: "#1F2937",
  },
  dateDivider: {
    width: 1,
    backgroundColor: "rgba(229, 231, 235, 0.5)",
  },
  infoNote: {
    backgroundColor: "rgba(255, 251, 235, 0.6)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(253, 230, 138, 0.5)",
  },
  infoNoteText: {
    fontSize: 12,
    fontFamily: "PoppinsRegular",
    color: "#92400E",
    lineHeight: 18,
  },
  modalButtonsContainer: {
    marginTop: "auto",
    paddingTop: 10,
    gap: 12,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "PoppinsMedium",
  },
});
