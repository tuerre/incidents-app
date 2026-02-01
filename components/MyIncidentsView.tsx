import { EmptyState } from "@/components/EmptyState";
import { IncidentCard, type Incident } from "@/components/MyIncidentsCard";
import { supabase } from "@/src/services/supabase";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { Alert, Animated, FlatList, StyleSheet, View } from "react-native";

const IncidentSkeleton = () => {
  const pulseAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
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
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const cardStyle = {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  };

  const cardHeader = {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    gap: 8,
  };

  const areaContainer = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  };

  const cardFooter = {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  };

  return (
    <View style={cardStyle}>
      <View style={cardHeader}>
        <Animated.View style={[styles.skeletonTitle, { opacity }]} />
        <Animated.View style={[styles.skeletonBadge, { opacity }]} />
      </View>

      <View style={areaContainer}>
        <Animated.View style={[styles.skeletonAreaLabel, { opacity }]} />
        <Animated.View style={[styles.skeletonAreaText, { opacity }]} />
      </View>

      <Animated.View style={[styles.skeletonDescription, { opacity }]} />

      <View style={cardFooter}>
        <Animated.View style={[styles.skeletonStatus, { opacity }]} />
        <Animated.View style={[styles.skeletonDate, { opacity }]} />
      </View>
    </View>
  );
};

export const MyIncidentsView = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      setLoading(true);

      const raw = await SecureStore.getItemAsync("guest_session");
      if (!raw) throw new Error("No hay sesión de huésped");

      const guestSession = JSON.parse(raw);

      const { data, error } = await supabase
        .from("incidents")
        .select(
          "id, title, description, priority, status, created_at, areas(name)",
        )
        .eq("room_id", guestSession.room_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setIncidents((data || []) as unknown as Incident[]);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Error cargando incidencias");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderIncident = ({ item }: { item: Incident }) => {
    return <IncidentCard incident={item} />;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <FlatList
          data={[1, 2, 3, 4, 5]}
          renderItem={() => <IncidentSkeleton />}
          keyExtractor={(item) => `skeleton-${item}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  if (incidents.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          title="Todo está tranquilo"
          message="No has reportado ninguna incidencia."
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 0,
    gap: 10,
    paddingBottom: 100,
  },
  skeletonTitle: {
    height: 20,
    width: "60%",
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
  },
  skeletonBadge: {
    height: 24,
    width: 60,
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
  },
  skeletonAreaLabel: {
    height: 16,
    width: 40,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
  },
  skeletonAreaText: {
    height: 16,
    width: 80,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
  },
  skeletonDescription: {
    height: 40,
    width: "100%",
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
  },
  skeletonStatus: {
    height: 28,
    width: 90,
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
  },
  skeletonDate: {
    height: 16,
    width: 100,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
  },
});
