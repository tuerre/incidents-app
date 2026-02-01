import { AppText } from "@/components/AppText";
import { ClipboardList } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

interface EmptyStateProps {
  title: string;
  message: string;
}

export const EmptyState = ({ title, message }: EmptyStateProps) => (
  <View style={styles.emptyContainer}>
    <View style={styles.iconCircle}>
      <ClipboardList size={60} color="#CBD5E0" strokeWidth={1.5} />
    </View>
    <AppText style={styles.emptyTitle}>{title}</AppText>
    <AppText style={styles.emptyMessage}>{message}</AppText>
  </View>
);

const styles = StyleSheet.create({
  emptyContainer: {
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 75,
    backgroundColor: "#f0f0f075",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "PoppinsBold",
    color: "#2D3748",
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 15,
    color: "#A0AEC0",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
