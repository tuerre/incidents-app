import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    DtmF: require("../assets/fonts/DebiUsarEsteFontRegular.ttf"),
    PoppinsRegular: Poppins_400Regular,
    PoppinsMedium: Poppins_500Medium,
    PoppinsSemiBold: Poppins_600SemiBold,
    PoppinsBold: Poppins_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
