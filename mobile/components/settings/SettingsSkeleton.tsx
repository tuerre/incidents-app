import React from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

export const SettingsSkeleton = () => {
    const shimmerAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1200,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <View style={styles.container}>
            {/* Profile Section Skeleton */}
            <View style={styles.profileSection}>
                <Animated.View style={[styles.avatar, { opacity }]} />
                <View style={styles.profileInfo}>
                    <Animated.View style={[styles.nameSkeleton, { opacity }]} />
                    <Animated.View style={[styles.emailSkeleton, { opacity }]} />
                </View>
            </View>

            {/* Settings Items Skeleton */}
            <View style={styles.settingsSection}>
                <Animated.View style={[styles.sectionTitle, { opacity }]} />
                {[1, 2, 3].map((i) => (
                    <Animated.View key={i} style={[styles.settingItem, { opacity }]} />
                ))}
            </View>

            <View style={styles.settingsSection}>
                <Animated.View style={[styles.sectionTitle, { opacity }]} />
                {[1, 2].map((i) => (
                    <Animated.View key={i} style={[styles.settingItem, { opacity }]} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    profileSection: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: "#FFF",
        borderRadius: 16,
        marginBottom: 24,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#E5E7EB",
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
        gap: 8,
    },
    nameSkeleton: {
        width: "60%",
        height: 20,
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
    },
    emailSkeleton: {
        width: "80%",
        height: 16,
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
    },
    settingsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        width: "30%",
        height: 16,
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
        marginBottom: 12,
        marginLeft: 4,
    },
    settingItem: {
        height: 56,
        backgroundColor: "#FFF",
        borderRadius: 12,
        marginBottom: 8,
    },
});
