import { ModalSheet } from "@/components/settings/ModalSheet";
import { ThemeMode, useTheme } from "@/hooks/useTheme";
import { Check, Moon, Smartphone, Sun } from "lucide-react-native";
import React from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type ThemeModalProps = {
    visible: boolean;
    onClose: () => void;
    slideAnim: Animated.Value;
};

export const ThemeModal = ({ visible, onClose, slideAnim }: ThemeModalProps) => {
    const { themeMode, setTheme } = useTheme();

    const themeOptions: { mode: ThemeMode; label: string; icon: any }[] = [
        { mode: "light", label: "Claro", icon: Sun },
        { mode: "dark", label: "Oscuro", icon: Moon },
        { mode: "system", label: "Sistema", icon: Smartphone },
    ];

    const handleSelectTheme = async (mode: ThemeMode) => {
        await setTheme(mode);
        setTimeout(onClose, 200);
    };

    return (
        <ModalSheet visible={visible} onClose={onClose} slideAnim={slideAnim}>
            <View style={styles.innerContent}>
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>Seleccionar Tema</Text>
                    <Text style={styles.headerSubtitle}>
                        Elige cómo quieres ver la aplicación
                    </Text>
                </View>

                <View style={styles.optionsContainer}>
                    {themeOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = themeMode === option.mode;

                        return (
                            <TouchableOpacity
                                key={option.mode}
                                style={[
                                    styles.optionItem,
                                    isSelected && styles.optionItemSelected,
                                ]}
                                onPress={() => handleSelectTheme(option.mode)}
                            >
                                <View style={styles.optionLeft}>
                                    <View
                                        style={[
                                            styles.iconContainer,
                                            isSelected && styles.iconContainerSelected,
                                        ]}
                                    >
                                        <Icon
                                            size={22}
                                            color={isSelected ? "#2563EB" : "#6B7280"}
                                            strokeWidth={2}
                                        />
                                    </View>
                                    <Text
                                        style={[
                                            styles.optionLabel,
                                            isSelected && styles.optionLabelSelected,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </View>
                                {isSelected && (
                                    <Check size={22} color="#2563EB" strokeWidth={2.5} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>
            </View>
        </ModalSheet>
    );
};

const styles = StyleSheet.create({
    innerContent: {
        flex: 1,
        padding: 24,
        paddingTop: 32,
    },
    headerContainer: {
        marginBottom: 28,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1F2937",
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: "400",
        color: "#6B7280",
        opacity: 0.8,
    },
    optionsContainer: {
        gap: 12,
        marginBottom: 20,
    },
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 16,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        borderWidth: 1.5,
        borderColor: "rgba(0, 0, 0, 0.06)",
    },
    optionItemSelected: {
        backgroundColor: "rgba(37, 99, 235, 0.12)",
        borderColor: "#2563EB",
    },
    optionLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(243, 244, 246, 0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    iconContainerSelected: {
        backgroundColor: "rgba(219, 234, 254, 0.8)",
    },
    optionLabel: {
        fontSize: 17,
        fontWeight: "600",
        color: "#4B5563",
    },
    optionLabelSelected: {
        color: "#2563EB",
        fontWeight: "700",
    },
    closeButton: {
        marginTop: "auto",
        alignItems: "center",
        paddingVertical: 14,
        marginBottom: 10,
    },
    closeButtonText: {
        color: "#333",
        fontSize: 16,
        fontWeight: "500",
    },
});
