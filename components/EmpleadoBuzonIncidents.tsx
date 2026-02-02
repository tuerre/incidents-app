import { AppText } from "@/components/AppText";
import { EmptyState } from "@/components/EmptyState";
import { useDateFormat } from "@/hooks/use-date-format";
import { supabase } from "@/src/services/supabase";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  RefreshControl,
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
  areas: {
    name: string;
  };
  rooms: {
    room_code: string;
  };
};

const priorityConfig = {
  baja: { label: "Baja", color: "#10B981", bgColor: "#ECFDF5" },
  media: { label: "Media", color: "#F59E0B", bgColor: "#FEF3C7" },
  alta: { label: "Alta", color: "#EF4444", bgColor: "#FEE2E2" },
};

const IncidentSkeleton = () => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonCardStyle = [styles.card, { gap: 10 }];

  return (
    <View style={skeletonCardStyle}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Animated.View
          style={[
            {
              height: 20,
              width: "60%",
              backgroundColor: "#E2E8F0",
              borderRadius: 4,
            },
            { opacity },
          ]}
        />
        <Animated.View
          style={[
            {
              height: 24,
              width: 60,
              backgroundColor: "#E2E8F0",
              borderRadius: 8,
            },
            { opacity },
          ]}
        />
      </View>

      <Animated.View
        style={[
          {
            height: 40,
            width: "100%",
            backgroundColor: "#E2E8F0",
            borderRadius: 4,
          },
          { opacity },
        ]}
      />

      <View
        style={{
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: "#F1F5F9",
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Animated.View
            style={[
              {
                height: 16,
                width: 100,
                backgroundColor: "#E2E8F0",
                borderRadius: 4,
              },
              { opacity },
            ]}
          />
          <Animated.View
            style={[
              {
                height: 16,
                width: 80,
                backgroundColor: "#E2E8F0",
                borderRadius: 4,
              },
              { opacity },
            ]}
          />
        </View>
        <Animated.View
          style={[
            {
              height: 44,
              width: "100%",
              backgroundColor: "#E2E8F0",
              borderRadius: 10,
            },
            { opacity },
          ]}
        />
      </View>
    </View>
  );
};

export const EmpleadoBuzonIncidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pendientes" | "en-proceso">(
    "pendientes",
  );
  const { formatDateShort } = useDateFormat();

  useEffect(() => {
    loadIncidents();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadIncidents();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncidents();
    setRefreshing(false);
  };

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay usuario autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("area")
        .eq("id", user.id)
        .single();

      if (!profile?.area) throw new Error("El perfil no tiene área asignada");

      const { data: areaData } = await supabase
        .from("areas")
        .select("id")
        .eq("name", profile.area)
        .single();

      if (!areaData) throw new Error(`No se encontró el área: ${profile.area}`);

      const { data, error } = await supabase
        .from("incidents")
        .select(
          "id, title, description, priority, status, created_at, areas(name), rooms(room_code)",
        )
        .eq("status", "pendiente")
        .eq("area_id", areaData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIncidents((data || []) as unknown as Incident[]);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Error cargando incidencias");
    } finally {
      setLoading(false);
    }
  };

  const renderIncident = ({ item }: { item: Incident }) => {
    const priorityInfo = priorityConfig[item.priority];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(empleado)/incidents/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <AppText style={styles.cardTitle}>{item.title}</AppText>
            <View
              style={[styles.badge, { backgroundColor: priorityInfo.bgColor }]}
            >
              <AppText
                style={[styles.badgeText, { color: priorityInfo.color }]}
              >
                {priorityInfo.label}
              </AppText>
            </View>
          </View>
        </View>

        <AppText style={styles.description} numberOfLines={2}>
          {item.description}
        </AppText>

        <View style={styles.cardFooter}>
          <View style={styles.infoRow}>
            <AppText style={styles.roomText}>
              Habitación {item.rooms?.room_code || "---"}
            </AppText>
            <AppText style={styles.date}>
              {formatDateShort(item.created_at)}
            </AppText>
          </View>
          <View style={styles.acceptButton}>
            <AppText style={styles.acceptButtonText}>Aceptar Tarea</AppText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <FlatList
          data={[1, 2, 3, 4]}
          renderItem={() => <IncidentSkeleton />}
          keyExtractor={(item) => `skeleton-${item}`}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    );
  }

  if (incidents.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          title="Todo está tranquilo"
          message="No hay nuevas incidencias reportadas en el buzón."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={incidents}
        renderItem={renderIncident}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
            colors={["#2563EB"]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 0,
    gap: 12,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    gap: 8,
    marginBottom: 8,
  },
  titleRow: {
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
    fontSize: 14,
    fontFamily: "PoppinsRegular",
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomText: {
    fontSize: 13,
    fontFamily: "PoppinsSemiBold",
    color: "#475569",
  },
  date: {
    fontSize: 12,
    fontFamily: "PoppinsRegular",
    color: "#94A3B8",
  },
  acceptButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  acceptButtonText: {
    fontSize: 15,
    fontFamily: "PoppinsSemiBold",
    color: "#FFF",
  },
});
