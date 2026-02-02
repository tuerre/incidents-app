import { AppText } from "@/components/AppText";
import { ScreenPattern } from "@/components/ui/ScreenPattern";
import { useDateFormat } from "@/hooks/use-date-format";
import { supabase } from "@/src/services/supabase";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

type Incident = {
  id: string;
  title: string;
  description: string;
  priority: "baja" | "media" | "alta";
  status: string;
  created_at: string;
  areas: {
    name: string;
  };
  rooms: {
    room_code: string;
  };
  incident_resolutions?: {
    description: string;
    created_at: string;
  }[];
  incident_evidence?: {
    image_url: string;
  }[];
};

const priorityConfig = {
  baja: { label: "Baja", color: "#10B981", bgColor: "#ECFDF5" },
  media: { label: "Media", color: "#F59E0B", bgColor: "#FEF3C7" },
  alta: { label: "Alta", color: "#EF4444", bgColor: "#FEE2E2" },
};

const statusConfig: Record<string, { label: string }> = {
  pendiente: { label: "Pendiente" },
  recibida: { label: "Recibida" },
  en_progreso: { label: "En Progreso" },
  resuelta: { label: "Resuelta" },
};

export default function GuestIncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const { formatDateTime } = useDateFormat();

  const getPublicImageUrl = (url: string) => {
    // Si la URL ya es completa (comienza con http), devolverla tal cual
    if (url.startsWith("http")) {
      return url;
    }
    // Si es una ruta relativa, construir la URL pública
    const { data } = supabase.storage
      .from("incident-evidence")
      .getPublicUrl(url);
    return data.publicUrl;
  };

  useEffect(() => {
    loadIncident();
  }, [id]);

  const loadIncident = async () => {
    try {
      setLoading(true);

      // Para huéspedes, solo necesitamos obtener la incidencia sin autenticación
      const { data, error } = await supabase
        .from("incidents")
        .select(
          `
          *, 
          areas(name), 
          rooms(room_code),
          incident_resolutions(description, created_at),
          incident_evidence(image_url)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setIncident(data);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Error cargando incidencia");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenPattern title="Detalle de Incidencia">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </ScreenPattern>
    );
  }

  if (!incident) {
    return (
      <ScreenPattern title="Detalle de Incidencia">
        <View style={styles.centerContainer}>
          <AppText style={styles.errorText}>Incidencia no encontrada</AppText>
        </View>
      </ScreenPattern>
    );
  }

  const priorityInfo = priorityConfig[incident.priority];
  const statusInfo = statusConfig[incident.status] || {
    label: incident.status,
  };

  return (
    <ScreenPattern
      title={`Folio #INC-2026-${incident.id.slice(0, 6).toUpperCase()}`}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Título y Badge de Estado */}
          <View style={styles.headerSection}>
            <AppText style={styles.title}>{incident.title}</AppText>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    incident.status === "pendiente"
                      ? "#FEF3C7"
                      : incident.status === "recibida"
                        ? "#DBEAFE"
                        : incident.status === "en_progreso"
                          ? "#E0E7FF"
                          : "#ECFDF5",
                },
              ]}
            >
              <AppText
                style={[
                  styles.statusText,
                  {
                    color:
                      incident.status === "pendiente"
                        ? "#F59E0B"
                        : incident.status === "recibida"
                          ? "#2563EB"
                          : incident.status === "en_progreso"
                            ? "#6366F1"
                            : "#10B981",
                  },
                ]}
              >
                {statusInfo.label.toUpperCase()}
              </AppText>
            </View>
          </View>

          {/* Descripción del Problema */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>
              DESCRIPCIÓN DEL PROBLEMA
            </AppText>
            <AppText style={styles.descriptionText}>
              {incident.description}
            </AppText>
          </View>

          {/* Información de ubicación */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <AppText style={styles.iconText}>📍</AppText>
              </View>
              <View style={styles.infoContent}>
                <AppText style={styles.infoLabel}>
                  Ubicación / Habitación
                </AppText>
                <AppText style={styles.infoValue}>
                  {incident.rooms?.room_code || "---"}
                </AppText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <AppText style={styles.iconText}>⚡</AppText>
              </View>
              <View style={styles.infoContent}>
                <AppText style={styles.infoLabel}>Nivel de Prioridad</AppText>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: priorityInfo.bgColor },
                  ]}
                >
                  <AppText
                    style={[styles.priorityText, { color: priorityInfo.color }]}
                  >
                    {priorityInfo.label}
                  </AppText>
                </View>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <AppText style={styles.iconText}>🏢</AppText>
              </View>
              <View style={styles.infoContent}>
                <AppText style={styles.infoLabel}>Área Responsable</AppText>
                <AppText style={styles.infoValue}>
                  {incident.areas?.name
                    ? incident.areas.name.charAt(0).toUpperCase() +
                      incident.areas.name.slice(1)
                    : "Sin área"}
                </AppText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <AppText style={styles.iconText}>🕐</AppText>
              </View>
              <View style={styles.infoContent}>
                <AppText style={styles.infoLabel}>Fecha de Reporte</AppText>
                <AppText style={styles.infoValue}>
                  {formatDateTime(incident.created_at)}
                </AppText>
              </View>
            </View>
          </View>

          {/* Resolution Details Section - Only for resolved incidents */}
          {incident.status === "resuelta" &&
            incident.incident_resolutions &&
            incident.incident_resolutions.length > 0 && (
              <View style={styles.resolutionSection}>
                <AppText style={styles.resolutionTitle}>
                  DETALLES DE INCIDENCIA RESUELTA
                </AppText>

                <View style={styles.resolutionCard}>
                  {/* Resolution Description */}
                  <View style={styles.resolutionItem}>
                    <AppText style={styles.resolutionLabel}>
                      Descripción de la Solución
                    </AppText>
                    <AppText style={styles.resolutionValue}>
                      {incident.incident_resolutions[0].description}
                    </AppText>
                  </View>

                  {/* Resolution Date */}
                  <View style={styles.resolutionItem}>
                    <AppText style={styles.resolutionLabel}>
                      Fecha de Resolución
                    </AppText>
                    <AppText style={styles.resolutionValue}>
                      {formatDateTime(
                        incident.incident_resolutions[0].created_at,
                      )}
                    </AppText>
                  </View>

                  {/* Evidence Images */}
                  {incident.incident_evidence &&
                    incident.incident_evidence.length > 0 && (
                      <View style={styles.resolutionItem}>
                        <AppText style={styles.resolutionLabel}>
                          Evidencia
                        </AppText>
                        <View style={styles.evidenceGrid}>
                          {incident.incident_evidence.map((evidence, index) => (
                            <Image
                              key={index}
                              source={{
                                uri: getPublicImageUrl(evidence.image_url),
                              }}
                              style={styles.evidenceImage}
                              resizeMode="cover"
                            />
                          ))}
                        </View>
                      </View>
                    )}
                </View>
              </View>
            )}

          {/* Info message for guest */}
          {incident.status !== "resuelta" && (
            <View style={styles.infoMessageCard}>
              <AppText style={styles.infoMessageTitle}>
                📬 Tu reporte está siendo atendido
              </AppText>
              <AppText style={styles.infoMessageText}>
                El equipo responsable ha sido notificado y está trabajando en tu
                solicitud. Te mantendremos informado sobre el progreso.
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenPattern>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: "PoppinsBold",
    color: "#1F2937",
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "PoppinsSemiBold",
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "PoppinsSemiBold",
    color: "#6B7280",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: "PoppinsRegular",
    color: "#4B5563",
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: "PoppinsSemiBold",
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 15,
    fontFamily: "PoppinsMedium",
    color: "#1F2937",
  },
  priorityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 13,
    fontFamily: "PoppinsSemiBold",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "PoppinsMedium",
    color: "#6B7280",
  },
  resolutionSection: {
    marginTop: 24,
  },
  resolutionTitle: {
    fontSize: 12,
    fontFamily: "PoppinsSemiBold",
    color: "#6B7280",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  resolutionCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  resolutionItem: {
    gap: 6,
  },
  resolutionLabel: {
    fontSize: 13,
    fontFamily: "PoppinsSemiBold",
    color: "#15803D",
  },
  resolutionValue: {
    fontSize: 15,
    fontFamily: "PoppinsRegular",
    color: "#166534",
    lineHeight: 22,
  },
  evidenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  evidenceImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  infoMessageCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  infoMessageTitle: {
    fontSize: 15,
    fontFamily: "PoppinsSemiBold",
    color: "#1E40AF",
    marginBottom: 8,
  },
  infoMessageText: {
    fontSize: 14,
    fontFamily: "PoppinsRegular",
    color: "#1E40AF",
    lineHeight: 20,
  },
});
