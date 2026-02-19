import { CreateUserModal } from "@/components/settings/admin/CreateUserModal";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";

/**
 * Screen for the '+' NativeTabs trigger.
 * Renders the CreateUserModal directly - no redirect or context needed.
 */
export default function AddUserScreen() {
    const [visible, setVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(1000)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
            }).start();
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: 1000,
            duration: 450,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
            router.replace("/(admin)/users");
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
            <CreateUserModal
                visible={visible}
                onClose={handleClose}
                slideAnim={slideAnim}
                onUserCreated={(_newUser) => {
                    handleClose();
                }}
            />
        </View>
    );
}
