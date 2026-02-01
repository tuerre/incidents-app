import { EmptyState } from "@/components/EmptyState";
import { IncidentCard, type Incident } from "@/components/IncidentCard";
import { supabase } from "@/src/services/supabase";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

  return (
    <View style={cardStyle}>
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
        style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: "#F1F5F9" }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 6,
          }}
        >
          <Animated.View
            style={[
              {
                height: 28,
                width: 90,
                backgroundColor: "#E2E8F0",
                borderRadius: 8,
              },
              { opacity },
            ]}
          />
          <Animated.View
            style={[
              {
                height: 28,
                width: 80,
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
              height: 16,
              width: 100,
              backgroundColor: "#E2E8F0",
              borderRadius: 4,
              marginTop: 6,
            },
            { opacity },
          ]}
        />
      </View>
    </View>
  );
};

export const EmpleadoMyTasks = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncidents();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadIncidents();
    }, []),
  );

  const loadIncidents = async () => {
    try {
      setLoading(true);

      // Obtener usuario autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay usuario autenticado");

      // Obtener incidencias asignadas al empleado
      const { data, error } = await supabase
        .from("incidents")
        .select(
          "id, title, description, priority, status, created_at, areas(name)",
        )
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setIncidents((data || []) as unknown as Incident[]);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Error cargando tareas");
    } finally {
      setLoading(false);
    }
  };

  const renderIncident = ({ item }: { item: Incident }) => {
    return <IncidentCard incident={item} />;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <FlatList
          data={[1, 2, 3, 4]}
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
          title="Todo está bajo control"
          message="No tienes tareas pendientes por ahora, mantente alerta."
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
});
