import { AppText } from "@/components/AppText";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type Incident = {
  id: string;
  title: string;
  description: string;
  priority: "baja" | "media" | "alta";
  status: string;
  created_at: string;
  areas: {
    name: string;
  };
};

const priorityConfig = {
  baja: { label: "Baja", color: "#10B981", bgColor: "#ECFDF5" },
  media: { label: "Media", color: "#F59E0B", bgColor: "#FEF3C7" },
  alta: { label: "Alta", color: "#EF4444", bgColor: "#FEE2E2" },
  urgente: { label: "Urgente", color: "#ff0000", bgColor: "#ff9595" },
};

const statusConfig: Record<
  string,
  { label: string; color: string; textColor: string }
> = {
  pendiente: { label: "Pendiente", color: "#6b72801c", textColor: "#6b7280da" },
  recibida: { label: "Recibida", color: "#FEF3C7", textColor: "#F59E0B" },
  en_progreso: {
    label: "En Progreso",
    color: "#3b83f61a",
    textColor: "#3b83f6cd",
  },
  resuelta: { label: "Resuelta", color: "#10b98119", textColor: "#10b981c3" },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

type IncidentCardProps = {
  incident: Incident;
  onPress?: () => void;
  disabled?: boolean;
};

export const IncidentCard = ({
  incident,
  onPress,
  disabled = false,
}: IncidentCardProps) => {
  const priorityInfo = priorityConfig[incident.priority];
  const statusInfo = statusConfig[incident.status] || {
    label: incident.status,
    color: "#6b72800e",
    textColor: "#6b7280d1",
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/(guest)/incidents/${incident.id}`);
    }
  };

  const CardWrapper = disabled ? View : TouchableOpacity;
  const wrapperProps = disabled
    ? {}
    : { onPress: handlePress, activeOpacity: 0.7 };

  return (
    <CardWrapper style={styles.card} {...wrapperProps}>
      <View style={styles.cardHeader}>
        <AppText style={styles.cardTitle}>{incident.title}</AppText>
        <View style={styles.badges}>
          <View
            style={[styles.badge, { backgroundColor: priorityInfo.bgColor }]}
          >
            <AppText style={[styles.badgeText, { color: priorityInfo.color }]}>
              {priorityInfo.label}
            </AppText>
          </View>
        </View>
      </View>

      <AppText style={styles.description} numberOfLines={2}>
        {incident.description}
      </AppText>

      <View style={styles.cardFooter}>
        <View style={styles.badgesRow}>
          <View
            style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusInfo.textColor },
              ]}
            />
            <AppText
              style={[styles.statusText, { color: statusInfo.textColor }]}
            >
              {statusInfo.label}
            </AppText>
          </View>
          <View style={styles.areaBadge}>
            <AppText style={styles.areaBadgeText}>
              {incident.areas?.name
                ? incident.areas.name.charAt(0).toUpperCase() +
                  incident.areas.name.slice(1)
                : "Sin área"}
            </AppText>
          </View>
        </View>
        <AppText style={styles.date}>{formatDate(incident.created_at)}</AppText>
      </View>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "PoppinsBold",
    color: "#334155",
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "PoppinsSemiBold",
  },
  description: {
    fontSize: 15,
    fontFamily: "PoppinsRegular",
    color: "#64748B",
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  areaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
  },
  areaBadgeText: {
    fontSize: 12,
    fontFamily: "PoppinsSemiBold",
    color: "#2563EB",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.5,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "PoppinsSemiBold",
  },
  date: {
    fontSize: 12,
    fontFamily: "PoppinsRegular",
    color: "#94A3B8",
  },
});
