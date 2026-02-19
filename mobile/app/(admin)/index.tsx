import { AppText } from "@/components/AppText";
import { useNavigationDebounce } from "@/hooks/use-navigation-debounce";
import { supabase } from "@/src/services/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function GuestHome() {
  const [loading, setLoading] = useState(false);
  const { isDebouncing, executeWithDebounce } = useNavigationDebounce(3000);

  const handleLogout = () => {
    executeWithDebounce(async () => {
      await supabase.auth.signOut();
      router.replace("/(auth)/login");
    });
  };

  const handleGuestAccess = () => {
    executeWithDebounce(() => {
      setLoading(true);
      router.replace("/(admin)/guest-sessions/create");
    });
  };
  return (
    <View style={styles.container}>
      <AppText style={styles.title}>Modo Admin</AppText>
      <AppText style={styles.text}>
        Aquí puede crear sesions de huespedes
      </AppText>

      <TouchableOpacity onPress={handleGuestAccess} disabled={isDebouncing}>
        <AppText style={[styles.signUpText, isDebouncing && { opacity: 0.5 }]}>
          Crear sesion
        </AppText>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout} disabled={isDebouncing}>
        <AppText style={[styles.signUpText, isDebouncing && { opacity: 0.5 }]}>
          Cerrar sesion
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  text: {
    color: "#9CA3AF",
    marginTop: 8,
  },
  signUpText: {
    color: "#F1F1F1",
    paddingTop: 20,
    fontWeight: "bold",
    fontSize: 16,
  },
});
