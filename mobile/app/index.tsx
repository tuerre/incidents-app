import { AppText } from "@/components/AppText";
import { supabase } from "@/src/services/supabase";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export default function SplashScreen() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.08, { duration: 900 }), -1, true);

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single();

        if (profile?.role === "admin") {
          router.replace("/(admin)");
          return;
        }

        if (profile?.role === "empleado") {
          router.replace("/(empleado)");
          return;
        }

        await supabase.auth.signOut();
        router.replace("/(auth)/login");
        return;
      }

      const guestSession = await SecureStore.getItemAsync("guest_session");

      if (guestSession) {
        router.replace("/(guest)/home");
        return;
      }

      router.replace("/(auth)/login");
    };

    const timeout = setTimeout(bootstrap, 1600);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Image
          source={require("../assets/images/frog.png")}
          style={styles.logo}
        />
      </Animated.View>

      <View style={styles.textContainer}>
        <AppText style={styles.text}>Amanera</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF385C",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  textContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 18,
  },
  text: {
    color: "#F1F1F1",
    fontSize: 18,
    letterSpacing: 1,
    fontFamily: "DtmF",
  },
});
