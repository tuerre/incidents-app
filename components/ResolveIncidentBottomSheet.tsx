import { AppText } from "@/components/AppText";
import { supabase } from "@/src/services/supabase";
import * as ImagePicker from "expo-image-picker";
import { Camera, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const MIN_SHEET_HEIGHT = SCREEN_HEIGHT * 0.5;
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.95;

type ResolveIncidentBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  incidentId: string;
  onSuccess: () => void;
};

export const ResolveIncidentBottomSheet = ({
  visible,
  onClose,
  incidentId,
  onSuccess,
}: ResolveIncidentBottomSheetProps) => {
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [descriptionError, setDescriptionError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const translateY = useRef(
    new Animated.Value(SCREEN_HEIGHT - MIN_SHEET_HEIGHT),
  ).current;

  const sheetHeight = useRef(MIN_SHEET_HEIGHT);
  const descriptionInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT - MIN_SHEET_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        const newY = SCREEN_HEIGHT - sheetHeight.current + g.dy;
        if (
          newY >= SCREEN_HEIGHT - MAX_SHEET_HEIGHT &&
          newY <= SCREEN_HEIGHT - MIN_SHEET_HEIGHT
        ) {
          translateY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, g) => {
        const currentHeight = SCREEN_HEIGHT - (translateY as any)._value;
        if (g.vy > 0.5 || g.dy > 100) {
          currentHeight > MIN_SHEET_HEIGHT * 1.5
            ? expandToHeight(MIN_SHEET_HEIGHT)
            : handleClose();
        } else if (g.vy < -0.5 || g.dy < -100) {
          expandToHeight(MAX_SHEET_HEIGHT);
        } else {
          currentHeight < (MIN_SHEET_HEIGHT + MAX_SHEET_HEIGHT) / 2
            ? expandToHeight(MIN_SHEET_HEIGHT)
            : expandToHeight(MAX_SHEET_HEIGHT);
        }
      },
    }),
  ).current;

  const expandToHeight = (height: number) => {
    sheetHeight.current = height;
    Animated.spring(translateY, {
      toValue: SCREEN_HEIGHT - height,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      resetForm();
    });
  };

  const resetForm = () => {
    setDescription("");
    setImages([]);
    setDescriptionError("");
    setGeneralError("");
    sheetHeight.current = MIN_SHEET_HEIGHT;
  };

  const handleAddImage = async (source: "camera" | "gallery") => {
    let result;
    if (source === "camera") {
      const p = await ImagePicker.requestCameraPermissionsAsync();
      if (!p.granted) return;
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
    } else {
      const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!p.granted) return;
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
    }
    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const uploadImage = async (uri: string) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("No auth");

    const ext = uri.split(".").pop() ?? "jpg";
    const filePath = `${data.user.id}/${Date.now()}.${ext}`;

    const res = await fetch(uri);
    const arrayBuffer = await res.arrayBuffer();

    const { error } = await supabase.storage
      .from("incident-evidence")
      .upload(filePath, arrayBuffer, {
        contentType: `image/${ext}`,
        upsert: false,
      });

    if (error) throw error;

    return filePath;
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setDescriptionError("Escribe algo real");
      return;
    }

    try {
      setUploading(true);

      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("No auth");

      const { data: resolution } = await supabase
        .from("incident_resolutions")
        .insert({
          incident_id: incidentId,
          resolved_by: data.user.id,
          description: description.trim(),
        })
        .select()
        .single();

      if (images.length) {
        const paths = await Promise.all(images.map(uploadImage));
        await supabase.from("incident_evidence").insert(
          paths.map((p) => ({
            incident_id: incidentId,
            image_url: p,
          })),
        );
      }

      await supabase
        .from("incidents")
        .update({ status: "resuelta" })
        .eq("id", incidentId);

      handleClose();
      onSuccess();
    } catch (e: any) {
      setGeneralError(e.message);
    } finally {
      setUploading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none">
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY }] }]}
        >
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <ScrollView style={styles.sheetContent}>
            <TextInput
              ref={descriptionInputRef}
              style={styles.textArea}
              multiline
              value={description}
              onChangeText={setDescription}
              placeholder="Describe la solución"
            />

            <View style={styles.imageGrid}>
              {images.map((uri, i) => (
                <View key={i} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setImages(images.filter((_, x) => x !== i))}
                  >
                    <X size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={() => handleAddImage("camera")}>
              <Camera size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <AppText style={styles.submitButtonText}>Resolver</AppText>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,.5)" },
  backdrop: { flex: 1 },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleContainer: { alignItems: "center", padding: 12 },
  handle: { width: 40, height: 4, backgroundColor: "#ccc" },
  sheetContent: { padding: 20 },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
  },
  imageGrid: { flexDirection: "row", gap: 12, marginVertical: 12 },
  imageContainer: { width: 100, height: 100 },
  image: { width: "100%", height: "100%" },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "red",
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontSize: 16 },
});
