import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Alert, Linking, Platform } from "react-native";

export const useNotifications = (storageKey: string) => {
  const [notifications, setNotifications] = useState(false);

  const initializeNotifications = async () => {
    const storedValue = await SecureStore.getItemAsync(storageKey);
    if (storedValue === "true") {
      setNotifications(true);
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") {
      setNotifications(true);
      await SecureStore.setItemAsync(storageKey, "true");
    } else {
      setNotifications(false);
      await SecureStore.setItemAsync(storageKey, "false");
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      if (existingStatus !== "granted") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const { status } = await Notifications.requestPermissionsAsync();

        if (status !== "granted") {
          setNotifications(false);
          await SecureStore.setItemAsync(storageKey, "false");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
      }

      setNotifications(true);
      await SecureStore.setItemAsync(storageKey, "true");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        "Desactivar Notificaciones",
        "Para desactivar completamente las notificaciones, ve a Configuración > Aplicaciones > Amanera > Notificaciones y desactívalas.",
        [
          {
            text: "Entendido",
            style: "cancel",
          },
          {
            text: "Ir a Configuración",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            },
          },
        ],
      );
    }
  };

  return {
    notifications,
    setNotifications,
    initializeNotifications,
    handleNotificationToggle,
  };
};
