import { AppText } from "@/components/AppText";
import { useNavigationDebounce } from "@/hooks/use-navigation-debounce";
import { Href, router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { ReactNode } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  title: string;
  backRoute?: Href;
  children: ReactNode;
  showBack?: boolean;
};

export function ScreenPattern({
  title,
  children,
  backRoute = "/",
  showBack = true,
}: Props) {
  const { isDebouncing, executeWithDebounce } = useNavigationDebounce(3000);

  const handleBack = () => {
    executeWithDebounce(() => {
      if (router.canGoBack()) {
        router.back();
      } else if (backRoute) {
        router.replace(backRoute);
      } else {
        router.replace("/");
      }
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.pattern}>
        <View style={styles.header}>
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              disabled={isDebouncing}
            >
              <ChevronLeft size={26} color="#000" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 26 }} />
          )}

          <AppText style={styles.headerTitle}>{title}</AppText>

          <View style={{ width: 26 }} />
        </View>

        <View style={styles.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  pattern: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "DtmF",
    color: "#000",
  },
  backButton: {
    padding: 6,
  },
  content: {
    flex: 1,
  },
});
