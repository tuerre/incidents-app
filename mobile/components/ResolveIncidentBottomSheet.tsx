import { AppText } from "@/components/AppText";
import { supabase } from "@/src/services/supabase";
import * as ImagePicker from "expo-image-picker";
import { Camera, CheckCircle, ImagePlus, X } from "lucide-react-native";
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
        // Only allow downward movement when fully expanded
        if (sheetHeight.current === MAX_SHEET_HEIGHT && g.dy > 0) {
          const newY = SCREEN_HEIGHT - MAX_SHEET_HEIGHT + g.dy;
          if (newY <= SCREEN_HEIGHT) {
            translateY.setValue(newY);
          }
        }
      },
      onPanResponderRelease: (_, g) => {
        // If dragged down significantly, close. Otherwise, stay expanded
        if (g.dy > 150 || g.vy > 0.5) {
          handleClose();
        } else {
          expandToHeight(MAX_SHEET_HEIGHT);
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
      // Don't reset form - data persists
    });
  };

  const resetForm = () => {
    setDescription("");
    setImages([]);
    setDescriptionError("");
    setGeneralError("");
    sheetHeight.current = MIN_SHEET_HEIGHT;
  };

  // Auto-expand when description input is focused
  const handleDescriptionFocus = () => {
    expandToHeight(MAX_SHEET_HEIGHT);
  };

  // Auto-expand when adding an image
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
      // Expand to full height when image is added
      expandToHeight(MAX_SHEET_HEIGHT);
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

      // Reset form only on successful submit
      resetForm();
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

          <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <AppText style={styles.headerTitle}>Resolver Incidencia</AppText>
              <AppText style={styles.headerSubtitle}>
                Completa los detalles de la solución
              </AppText>
            </View>

            {/* Description Input */}
            <View style={styles.section}>
              <AppText style={styles.sectionLabel}>COMENTARIO</AppText>
              <TextInput
                ref={descriptionInputRef}
                style={styles.textArea}
                multiline
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setDescriptionError("");
                }}
                placeholder="Describe la reparación..."
                placeholderTextColor="#9CA3AF"
                onFocus={handleDescriptionFocus}
                textAlignVertical="top"
              />
              {descriptionError ? (
                <AppText style={styles.errorText}>{descriptionError}</AppText>
              ) : null}
            </View>

            {/* Evidence Section */}
            <View style={styles.section}>
              <AppText style={styles.sectionLabel}>EVIDENCIA (OPCIONAL)</AppText>

              {/* Image Grid */}
              {images.length > 0 && (
                <View style={styles.imageGrid}>
                  {images.map((uri, i) => (
                    <View key={i} style={styles.imageContainer}>
                      <Image source={{ uri }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setImages(images.filter((_, x) => x !== i))}
                      >
                        <X size={16} color="#fff" strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleAddImage("camera")}
                >
                  <View>
                    <Camera size={20} color="#6B7280" strokeWidth={2} />
                  </View>
                  <AppText style={styles.actionButtonText}>Cámara</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleAddImage("gallery")}
                >
                  <View>
                    <ImagePlus size={20} color="#6B7280" strokeWidth={2} />
                  </View>
                  <AppText style={styles.actionButtonText}>Galería</AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.submitButtonContent}>
                  <CheckCircle size={20} color="#fff" strokeWidth={2.5} />
                  <AppText style={styles.submitButtonText}>Finalizar Tarea</AppText>
                </View>
              )}
            </TouchableOpacity>

            {generalError ? (
              <AppText style={styles.generalError}>{generalError}</AppText>
            ) : null}

            <View style={{ height: 20 }} />
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
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "PoppinsBold",
    color: "#1F2937",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "PoppinsRegular",
    color: "#6B7280",
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "PoppinsSemiBold",
    color: "#6B7280",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    fontSize: 15,
    fontFamily: "PoppinsRegular",
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "PoppinsMedium",
    color: "#EF4444",
    marginTop: 6,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  imageContainer: {
    width: "100%",
    height: 125,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    color: "#4B5563",
  },
  submitButton: {
    backgroundColor: "#226ceb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#226ceb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "PoppinsSemiBold",
  },
  generalError: {
    fontSize: 13,
    fontFamily: "PoppinsMedium",
    color: "#EF4444",
    textAlign: "center",
    marginTop: 12,
  },
});
