import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ProfileSectionProps {
  displayNameChartAt: string | null;
  displayName: string | null;
  email?: string | null;
  roomNumber?: string | null;
  useAppText?: boolean;
  avatarBackgroundColor?: string;
}

export const ProfileSection = ({
  displayNameChartAt,
  displayName,
  email,
  roomNumber,
  useAppText = false,
  avatarBackgroundColor = "#3B82F6",
}: ProfileSectionProps) => {
  const TextComponent = useAppText
    ? require("@/components/AppText").AppText
    : Text;

  return (
    <View style={styles.profileSection}>
      <View
        style={[
          styles.avatarContainer,
          { backgroundColor: avatarBackgroundColor },
        ]}
      >
        <Text style={styles.avatarText}>{displayNameChartAt ?? "F"}</Text>
      </View>
      <View style={styles.profileInfo}>
        <TextComponent style={styles.profileName}>
          {displayName ?? "Nombre desconocido"}
        </TextComponent>
        {email && (
          <TextComponent style={styles.profileEmail}>{email}</TextComponent>
        )}
        {roomNumber && (
          <TextComponent style={styles.profileRoom}>
            Habitación {roomNumber}
          </TextComponent>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 20,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "bold",
    fontFamily: "DtmF",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
    lineHeight: 36,
  },
  profileInfo: {
    marginLeft: 15,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  profileEmail: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  profileRoom: {
    fontSize: 15,
    fontFamily: "PoppinsMedium",
    color: "#718096",
    marginTop: 2,
  },
});
