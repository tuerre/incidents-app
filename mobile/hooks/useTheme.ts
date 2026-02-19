import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

export type ThemeMode = "light" | "dark" | "system";
export type ActiveTheme = "light" | "dark";

const THEME_KEY = "app_theme_preference";

export const useTheme = () => {
    const systemColorScheme = useSystemColorScheme();
    const [themeMode, setThemeMode] = useState<ThemeMode>("light");
    const [isLoading, setIsLoading] = useState(true);

    // Determinar el tema activo basado en la preferencia del usuario
    const activeTheme: ActiveTheme =
        themeMode === "system"
            ? (systemColorScheme ?? "light")
            : themeMode;

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await SecureStore.getItemAsync(THEME_KEY);
            if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
                setThemeMode(savedTheme as ThemeMode);
            }
        } catch (error) {
            console.error("Error loading theme:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const setTheme = async (mode: ThemeMode) => {
        try {
            await SecureStore.setItemAsync(THEME_KEY, mode);
            setThemeMode(mode);
        } catch (error) {
            console.error("Error saving theme:", error);
        }
    };

    return {
        themeMode,
        activeTheme,
        setTheme,
        isLoading,
    };
};
