import { AppText } from "@/components/AppText";
import { ResolveIncidentBottomSheet } from "@/components/ResolveIncidentBottomSheet";
import { ScreenPattern } from "@/components/ui/ScreenPattern";
import { useDateFormat } from "@/hooks/use-date-format";
import { supabase } from "@/src/services/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { Trash2, Wrench } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type Incident = {
  id: string;
  title: string;
  description: string;
  priority: "baja" | "media" | "alta";
  status: string;
  created_at: string;
  assigned_to: string | null;
  areas: {
    name: string;
  };
  rooms: {
    room_code: string;
  };
  incident_resolutions?: {
    description: string;
    created_at: string;
    resolved_by: string;
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

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const { formatDateTime } = useDateFormat();
  const [signedImages, setSignedImages] = useState<Record<string, string>>({});
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const year = new Date().getFullYear();

  const getSignedImageUrl = async (path: string) => {
    console.log("[IMG] Solicitando signed URL para path:", path);
    const { data, error } = await supabase.storage
      .from("incident-evidence") // nombre correcto del bucket con guión
      .createSignedUrl(path, 60 * 60);

    if (error) {
      console.error("[IMG] Error al crear signed URL:", error.message, "| path:", path);
      return null;
    }
    console.log("[IMG] Signed URL obtenida correctamente:", data.signedUrl);
    return data.signedUrl;
  };

  useEffect(() => {
    loadIncident();
  }, [id]);

  const loadIncident = async () => {
    try {
      setLoading(true);
      console.log("[INCIDENT] Cargando incidencia id:", id);

      const { data, error } = await supabase
        .from("incidents")
        .select(
          `
          *, 
          areas(name), 
          rooms(room_code),
          incident_resolutions(description, created_at, resolved_by),
          incident_evidence(image_url)
        `,
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("[INCIDENT] Error en query:", error.message);
        throw error;
      }

      console.log("[INCIDENT] Status:", data.status);
      console.log("[INCIDENT] incident_resolutions:", JSON.stringify(data.incident_resolutions));
      console.log("[INCIDENT] incident_evidence:", JSON.stringify(data.incident_evidence));

      // Mostrar datos de inmediato
      setIncident(data);
      setLoading(false);

      // Cargar imágenes en segundo plano con URLs firmadas
      if (data.incident_evidence?.length) {
        console.log("[IMG] Encontradas", data.incident_evidence.length, "imágenes de evidencia");
        const signedUrlEntries = await Promise.all(
          data.incident_evidence.map(async (e: any) => {
            console.log("[IMG] Procesando evidencia con image_url:", e.image_url);
            const url = await getSignedImageUrl(e.image_url);
            return [e.image_url, url] as [string, string | null];
          }),
        );
        const imageUrls: Record<string, string> = {};
        for (const [path, url] of signedUrlEntries) {
          if (url) {
            imageUrls[path] = url;
            console.log("[IMG] URL lista para path:", path);
          } else {
            console.warn("[IMG] URL nula para path:", path, "- posiblemente sin permiso de lectura en Storage");
          }
        }
        console.log("[IMG] Total URLs resueltas:", Object.keys(imageUrls).length);
        setSignedImages(imageUrls);
        setImagesPreloaded(true);
      } else {
        console.log("[IMG] No hay evidencia de imágenes para esta incidencia");
        setImagesPreloaded(true);
      }
    } catch (e: any) {
      console.error("[INCIDENT] Error general:", e.message);
      Alert.alert("Error", e.message ?? "Error cargando incidencia");
      router.back();
    }
  };

  const handleResolveSuccess = () => {
    Alert.alert("Éxito", "Has marcado la incidencia como resuelta", [
      {
        text: "OK",
        onPress: () => {
          loadIncident();
        },
      },
    ]);
  };

  const handleStatusClick = async () => {
    if (incident?.status !== "recibida" || !isAssignedToMe) return;

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from("incidents")
        .update({
          status: "en_progreso",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      await loadIncident();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Error al actualizar estado");
    } finally {
      setActionLoading(false);
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
  const isAssignedToMe = incident.assigned_to === currentUserId;
  const isPending = incident.status === "pendiente";

  return (
    <ScreenPattern
      title={`Folio #INC-${year}-${incident.id.slice(0, 6).toUpperCase()}`}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <AppText style={styles.title}>{incident.title}</AppText>
            <TouchableOpacity
              onPress={handleStatusClick}
              disabled={
                incident.status !== "recibida" ||
                !isAssignedToMe ||
                actionLoading
              }
              activeOpacity={
                incident.status === "recibida" && isAssignedToMe ? 0.7 : 1
              }
            >
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      incident.status === "pendiente"
                        ? "#FEF3C7"
                        : incident.status === "recibida"
                          ? "#FEF3C7"
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
                            ? "#F59E0B"
                            : incident.status === "en_progreso"
                              ? "#6366F1"
                              : "#10B981",
                    },
                  ]}
                >
                  {statusInfo.label.toUpperCase()}
                </AppText>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>
              DESCRIPCIÓN DEL PROBLEMA
            </AppText>
            <AppText style={styles.descriptionText}>
              {incident.description}
            </AppText>
          </View>

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

          {incident.status === "resuelta" &&
            incident.incident_resolutions &&
            incident.incident_resolutions.length > 0 && (
              <View style={styles.resolutionSection}>
                <AppText style={styles.resolutionTitle}>
                  DETALLES DE INCIDENCIA RESUELTA
                </AppText>

                <View style={styles.resolutionCard}>
                  <View style={styles.resolutionItem}>
                    <AppText style={styles.resolutionLabel}>
                      Descripción de la Solución
                    </AppText>
                    <AppText style={styles.resolutionValue}>
                      {incident.incident_resolutions[0].description}
                    </AppText>
                  </View>

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

                  {incident.incident_evidence &&
                    incident.incident_evidence.length > 0 && (
                      <View style={styles.resolutionItem}>
                        <AppText style={styles.resolutionLabel}>
                          Evidencia
                        </AppText>
                        {!imagesPreloaded ? (
                          <View style={styles.evidenceGrid}>
                            {incident.incident_evidence.map((_, index) => (
                              <View
                                key={index}
                                style={[
                                  styles.evidenceImage,
                                  styles.imageLoadingPlaceholder,
                                ]}
                              >
                                <ActivityIndicator size="small" color="#10B981" />
                              </View>
                            ))}
                          </View>
                        ) : (
                          <View style={styles.evidenceGrid}>
                            {incident.incident_evidence.map((evidence, index) => (
                              <Image
                                key={index}
                                source={{
                                  uri: signedImages[evidence.image_url],
                                }}
                                style={styles.evidenceImage}
                                resizeMode="cover"
                              />
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                </View>
              </View>
            )}
        </View>
      </ScrollView>

      <ResolveIncidentBottomSheet
        visible={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        incidentId={id}
        onSuccess={handleResolveSuccess}
      />
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
    paddingBottom: 120,
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
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    shadowColor: "#005eff",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  actionButton: {
    backgroundColor: "#226ceb",
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center",
    flex: 1,
  },
  resolveButton: {
    backgroundColor: "#226ceb",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assignedButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  trashButton: {
    backgroundColor: "#EF4444",
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: "PoppinsSemiBold",
    color: "#FFF",
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
    width: "100%",
    height: 150,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
  },
  imageLoadingPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
  },
});