import { ChevronRight } from "lucide-react-native";
import React from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

interface SettingItemProps {
  icon: React.ComponentType<any>;
  title: string;
  value?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
  isLast?: boolean;
  iconColor?: string;
  titleColor?: string;
  disabled?: boolean;
  hideChevron?: boolean;
  useAppText?: boolean;
}

const isLogoutItem = (title: string) =>
  title === "Logout" || title === "Cerrar sesión";

export const SettingItem = ({
  icon: Icon,
  title,
  value,
  hasSwitch,
  switchValue,
  onSwitchChange,
  onPress,
  isLast,
  iconColor = "#555",
  titleColor = "#000",
  disabled = false,
  hideChevron = false,
  useAppText = false,
}: SettingItemProps) => {
  const TextComponent = useAppText
    ? require("@/components/AppText").AppText
    : Text;

  return (
    <TouchableOpacity
      style={[styles.itemContainer, isLast && { borderBottomWidth: 0 }]}
      disabled={hasSwitch || disabled}
      onPress={hasSwitch ? undefined : onPress}
    >
      <View style={styles.itemLeft}>
        <View
          style={[
            styles.iconWrapper,
            isLogoutItem(title) && { backgroundColor: "#FFF5F5" },
          ]}
        >
          <Icon
            size={20}
            color={isLogoutItem(title) ? "#FF4D4D" : iconColor}
            strokeWidth={2}
          />
        </View>
        <TextComponent style={[styles.itemTitle, { color: titleColor }]}>
          {title}
        </TextComponent>
      </View>

      <View style={styles.itemRight}>
        {value && (
          <TextComponent style={styles.itemValueText}>{value}</TextComponent>
        )}
        {hasSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: "#D1D1D1", true: "#3B82F6" }}
            thumbColor="#FFF"
          />
        ) : !hideChevron ? (
          <ChevronRight size={20} color="#CCC" />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemValueText: {
    color: "#AAA",
    marginRight: 8,
    fontSize: 15,
  },
});
