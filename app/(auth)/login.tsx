import { AppText } from "@/components/AppText";
import { useNavigationDebounce } from "@/hooks/use-navigation-debounce";
import { supabase } from "@/src/services/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type UserRole = "admin" | "empleado" | "huesped";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { isDebouncing, executeWithDebounce } = useNavigationDebounce(3000);

  async function handleWorkerLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    executeWithDebounce(async () => {
      setLoading(true);

      // Login directo con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        setLoading(false);
        Alert.alert("Error", error?.message || "Credenciales inválidas");
        return;
      }

      // Obtener el perfil y rol del usuario
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = profile?.role as UserRole;
      setLoading(false);

      if (role === "admin") {
        router.replace("/(admin)");
      } else if (role === "empleado") {
        router.replace("/(empleado)");
      } else {
        Alert.alert("Acceso denegado");
        await supabase.auth.signOut();
      }
    });
  }

  function handleGuestAccess() {
    executeWithDebounce(() => {
      router.push("/(guestScan)/scan");
    });
  }

  const showForgetPasswordAlert = () => {
    Alert.alert(
      "Olvidaste tu contraseña?",
      "Contacta a un admin para reestablecer tu contraseña.",
      [{ text: "OK" }],
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#b2112f", "#2b1232"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerTextContainer}>
          <AppText style={styles.helloText}>Amanera</AppText>
          <AppText style={styles.signInText}>Sign In!</AppText>
        </View>
      </LinearGradient>

      <View style={styles.formContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View>
            <View style={styles.inputGroup}>
              <AppText style={styles.label}>Correo Electrónico</AppText>
              <TextInput
                placeholder="madissonBear@gmail.com"
                placeholderTextColor="#ccc"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <AppText style={styles.label}>Contraseña</AppText>
              <TextInput
                placeholder="*******"
                placeholderTextColor="#ccc"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <AppText
                onPress={showForgetPasswordAlert}
                style={styles.forgotPassword}
              >
                Olvidaste tu contraseña?
              </AppText>
            </View>

            <TouchableOpacity
              onPress={handleWorkerLogin}
              disabled={loading || isDebouncing}
            >
              <LinearGradient
                colors={["#b2112f", "#2b1232"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mainButton}
              >
                <AppText style={styles.buttonText}>
                  {loading ? "CARGANDO..." : "INICIAR SESIÓN"}
                </AppText>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <AppText style={styles.noAccountText}>
                No tienes una cuenta?{" "}
              </AppText>
              <TouchableOpacity
                onPress={handleGuestAccess}
                disabled={isDebouncing}
              >
                <AppText
                  style={[styles.signUpText, isDebouncing && { opacity: 0.5 }]}
                >
                  Soy huésped
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#2b1232",
  },
  headerGradient: {
    height: "40%",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  headerTextContainer: {
    marginTop: 40,
  },
  helloText: {
    fontSize: 34,
    color: "#fff",
    fontWeight: "300",
  },
  signInText: {
    fontSize: 38,
    color: "#fff",
    fontFamily: "PoppinsBold",
    marginTop: -5,
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    marginTop: -50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 35,
    paddingTop: 50,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    color: "#b2112f",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
    fontSize: 16,
    color: "#333",
  },
  forgotPassword: {
    textAlign: "right",
    color: "#333",
    marginTop: 10,
    fontSize: 13,
    fontWeight: "500",
  },
  mainButton: {
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
    marginBottom: 30,
  },
  noAccountText: {
    color: "#999",
    fontSize: 14,
  },
  signUpText: {
    color: "#2b1232",
    fontWeight: "bold",
    fontSize: 16,
  },
});
