import { AppText } from "@/components/AppText";
import { CreateUserModal } from "@/components/settings/admin/CreateUserModal";
import { EditUserModal } from "@/components/settings/admin/EditUserModal";
import { ScreenPattern } from "@/components/ui/ScreenPattern";
import { useNavigationDebounce } from "@/hooks/use-navigation-debounce";
import { supabase } from "@/src/services/supabase";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect } from "expo-router";
import { Plus, Search, Trash2, UserCog } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    RefreshControl,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    area: string | null;
}

export default function UsersManagementScreen() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const slideAnim = useRef(new Animated.Value(1000)).current;
    const createSlideAnim = useRef(new Animated.Value(1000)).current;

    const { executeWithDebounce } = useNavigationDebounce();

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .neq("role", "guest")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
            Alert.alert("Error", "No se pudieron cargar los usuarios");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Refetch whenever this screen gets focus (e.g., after creating a user)
    useFocusEffect(
        useCallback(() => {
            fetchUsers();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    const handleDeleteUser = (userId: string, userName: string) => {
        Alert.alert(
            "Eliminar Usuario",
            `¿Estás seguro de que deseas eliminar a ${userName}? Esta acción no se puede deshacer.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase
                            .from("profiles")
                            .delete()
                            .eq("id", userId);

                        if (error) {
                            Alert.alert("Error", "No se pudo eliminar el usuario.");
                        } else {
                            setUsers((prev) => prev.filter((u) => u.id !== userId));
                        }
                    },
                },
            ]
        );
    };

    const handleOpenEdit = (user: Profile) => {
        setSelectedUser(user);
        setShowEditModal(true);
        slideAnim.setValue(1000);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
        }).start();
    };

    const handleCloseEdit = () => {
        Animated.timing(slideAnim, {
            toValue: 1000,
            duration: 450,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            setShowEditModal(false);
        });
    };

    const handleOpenCreate = () => {
        setShowCreateModal(true);
        createSlideAnim.setValue(1000);
        Animated.timing(createSlideAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
        }).start();
    };

    const handleCloseCreate = () => {
        Animated.timing(createSlideAnim, {
            toValue: 1000,
            duration: 450,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            setShowCreateModal(false);
        });
    };

    const filteredUsers = users.filter(
        (u) =>
            u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.area?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: Profile }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <View style={styles.avatar}>
                    <AppText style={styles.avatarText}>
                        {item.full_name
                            ? item.full_name.charAt(0).toUpperCase()
                            : item.email
                                ? item.email.charAt(0).toUpperCase()
                                : "?"}
                    </AppText>
                </View>
                <View style={{ flex: 1 }}>
                    <AppText style={styles.userName}>{item.full_name || "Sin nombre"}</AppText>
                    <AppText style={styles.userEmail}>{item.email}</AppText>
                    <View style={styles.badges}>
                        <View
                            style={[
                                styles.badge,
                                item.role === "admin" ? styles.adminBadge : styles.staffBadge,
                            ]}
                        >
                            <AppText
                                style={[
                                    styles.badgeText,
                                    item.role === "admin"
                                        ? styles.adminBadgeText
                                        : styles.staffBadgeText,
                                ]}
                            >
                                {item.role === "empleado"
                                    ? "Empleado"
                                    : item.role === "admin"
                                        ? "Admin"
                                        : item.role}
                            </AppText>
                        </View>
                        {item.area && (
                            <View style={[styles.badge, styles.areaBadge]}>
                                <AppText style={styles.areaBadgeText}>{item.area}</AppText>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleOpenEdit(item)}
                >
                    <UserCog size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.iconButton, styles.deleteBtn]}
                    onPress={() =>
                        handleDeleteUser(item.id, item.full_name || item.email)
                    }
                >
                    <Trash2 size={20} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScreenPattern title="Usuarios" showBack={false}>
            <View style={styles.container}>
                <View style={styles.searchContainer}>
                    <Search size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por nombre, email o área..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {loading ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color="#000" />
                ) : (
                    <FlashList
                        data={filteredUsers}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <AppText style={styles.emptyText}>
                                    No se encontraron usuarios.
                                </AppText>
                            </View>
                        }
                    />
                )}
            </View>

            <TouchableOpacity style={styles.fab} onPress={handleOpenCreate}>
                <Plus color="#FFF" size={26} />
            </TouchableOpacity>

            <EditUserModal
                visible={showEditModal}
                onClose={handleCloseEdit}
                slideAnim={slideAnim}
                user={selectedUser}
                onUpdate={(updated) => {
                    setUsers((prev) =>
                        prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
                    );
                }}
            />

            <CreateUserModal
                visible={showCreateModal}
                onClose={handleCloseCreate}
                slideAnim={createSlideAnim}
                onUserCreated={(newUser) => {
                    setUsers((prev) => [newUser, ...prev]);
                    handleCloseCreate();
                }}
            />
        </ScreenPattern>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        margin: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        fontFamily: "PoppinsRegular",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    userCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#EFEFEF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#EEF2F6",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: "600",
        color: "#000",
        fontFamily: "DtmF",
    },
    userName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
    },
    userEmail: {
        fontSize: 13,
        color: "#666",
        marginBottom: 6,
    },
    badges: {
        flexDirection: "row",
        gap: 6,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    adminBadge: {
        backgroundColor: "#000",
    },
    staffBadge: {
        backgroundColor: "#E0E7FF",
    },
    areaBadge: {
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    badgeText: {
        fontSize: 10,
        fontWeight: "600",
    },
    adminBadgeText: {
        color: "#FFF",
    },
    staffBadgeText: {
        color: "#4338CA",
    },
    areaBadgeText: {
        color: "#374151",
        fontSize: 10,
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconButton: {
        padding: 8,
    },
    deleteBtn: {
        marginLeft: 4,
    },
    emptyState: {
        alignItems: "center",
        marginTop: 40,
    },
    emptyText: {
        color: "#888",
        fontSize: 16,
    },
    fab: {
        position: "absolute",
        bottom: 27,
        right: 10,
        width: 50,
        height: 50,
        borderRadius: 30,
        backgroundColor: "#1a56db",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#1a56db",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
});
