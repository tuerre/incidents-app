import { EditPasswordModal } from "@/components/settings/empleado/EditPasswordModal";
import { EditUsernameModal } from "@/components/settings/empleado/EditUsernameModal";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SettingItem } from "@/components/settings/SettingItem";
import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton";
import { ThemeModal } from "@/components/settings/ThemeModal";
import { ScreenPattern } from "@/components/ui/ScreenPattern";
import { useNotifications } from "@/hooks/settings/use-notifications";
import { useNavigationDebounce } from "@/hooks/use-navigation-debounce";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/src/services/supabase";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
    Bell,
    LandPlot,
    Languages,
    LockKeyhole,
    LogOut,
    Palette,
    UserRoundPen,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function AdminSettingsScreen() {
    const { notifications, initializeNotifications, handleNotificationToggle } =
        useNotifications("admin_notifications");
    const { themeMode } = useTheme();

    const [email, setEmail] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [displayNameChartAt, setDisplayNameChartAt] = useState<string | null>(
        null,
    );
    const [area, setArea] = useState<string | null>(null);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { isDebouncing, executeWithDebounce } = useNavigationDebounce(3000);

    const slideAnim = useRef(new Animated.Value(1000)).current;

    const closeModalsWithAnim = () => {
        Animated.timing(slideAnim, {
            toValue: 1000,
            duration: 450,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            setShowUsernameModal(false);
            setShowPasswordModal(false);
            setShowThemeModal(false);
        });
    };

    useEffect(() => {
        if (showUsernameModal || showPasswordModal || showThemeModal) {
            slideAnim.setValue(1000);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
            }).start();
        }
    }, [showUsernameModal, showPasswordModal, showThemeModal]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;

            if (!user) {
                router.replace("/(auth)/login");
                return;
            }

            setEmail(user.email ?? null);
            setDisplayName(user.user_metadata?.display_name || null);
            const displayChar = user.user_metadata?.display_name
                ? user.user_metadata.display_name.charAt(0)
                : null;
            setDisplayNameChartAt(displayChar);

            const { data: profile } = await supabase
                .from("profiles")
                .select("area")
                .eq("id", user.id)
                .single();

            const areaValue = (profile as any)?.area ?? null;
            const capitalizedArea = areaValue
                ? areaValue.charAt(0).toUpperCase() + areaValue.slice(1)
                : null;
            setArea(capitalizedArea);

            await initializeNotifications();
            setIsLoading(false);
        };

        fetchUserProfile();
    }, []);

    const handleLogout = () => {
        executeWithDebounce(async () => {
            await supabase.auth.signOut();
            await SecureStore.deleteItemAsync("admin_notifications");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            router.replace("/(auth)/login");
        });
    };

    const handleOpenUsernameModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowUsernameModal(true);
    };

    const handleUpdateUsername = (newName: string) => {
        setDisplayName(newName);
        setDisplayNameChartAt(newName.charAt(0));
    };

    const handleOpenPasswordModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowPasswordModal(true);
    };

    const handleOpenThemeModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowThemeModal(true);
    };

    const getThemeLabel = () => {
        switch (themeMode) {
            case "light":
                return "Claro";
            case "dark":
                return "Oscuro";
            case "system":
                return "Sistema";
            default:
                return "Claro";
        }
    };

    return (
        <ScreenPattern title="Configuración" showBack={false}>
            <StatusBar barStyle="dark-content" />

            {isLoading ? (
                <SettingsSkeleton />
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    <ProfileSection
                        displayNameChartAt={displayNameChartAt}
                        displayName={displayName}
                        email={email}
                    />

                    <Text style={styles.sectionLabel}>Perfil</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon={UserRoundPen}
                            title="Nombre de usuario"
                            value={displayName || "Configurar"}
                            onPress={handleOpenUsernameModal}
                        />
                        <SettingItem
                            icon={LandPlot}
                            title="Área de trabajo"
                            value={area || "Sin asignar"}
                            disabled
                            hideChevron
                            isLast
                        />
                    </View>

                    <Text style={styles.sectionLabel}>Preferencias</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon={Bell}
                            title="Notificaciones y sonidos"
                            hasSwitch
                            switchValue={notifications}
                            onSwitchChange={handleNotificationToggle}
                        />
                        <SettingItem
                            icon={Languages}
                            title="Idioma"
                            value="Español"
                            onPress={() => {
                                setTimeout(() => {
                                    if (Platform.OS === "ios") {
                                        Linking.openURL("app-settings:");
                                    } else {
                                        Linking.openSettings();
                                    }
                                }, 0);
                            }}
                        />
                        <SettingItem
                            icon={Palette}
                            title="Tema"
                            value={getThemeLabel()}
                            onPress={handleOpenThemeModal}
                            isLast
                        />
                    </View>

                    <Text style={styles.sectionLabel}>Seguridad</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon={LockKeyhole}
                            title="Contraseña"
                            value="Cambiar"
                            onPress={handleOpenPasswordModal}
                        />
                        <SettingItem
                            icon={LogOut}
                            title="Cerrar sesión"
                            titleColor="#FF4D4D"
                            isLast
                            onPress={handleLogout}
                            disabled={isDebouncing}
                        />
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}

            <EditUsernameModal
                visible={showUsernameModal}
                onClose={closeModalsWithAnim}
                slideAnim={slideAnim}
                displayNameChartAt={displayNameChartAt}
                email={email}
                displayName={displayName}
                onUpdate={handleUpdateUsername}
            />

            <EditPasswordModal
                visible={showPasswordModal}
                onClose={closeModalsWithAnim}
                slideAnim={slideAnim}
                displayNameChartAt={displayNameChartAt}
            />

            <ThemeModal
                visible={showThemeModal}
                onClose={closeModalsWithAnim}
                slideAnim={slideAnim}
            />
        </ScreenPattern>
    );
}

const styles = StyleSheet.create({
    sectionLabel: {
        fontSize: 15,
        color: "#888",
        marginLeft: 24,
        marginBottom: 10,
        marginTop: 10,
        fontWeight: "500",
    },
    card: {
        backgroundColor: "#FFF",
        marginHorizontal: 16,
        borderRadius: 20,
        paddingHorizontal: 16,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
});
