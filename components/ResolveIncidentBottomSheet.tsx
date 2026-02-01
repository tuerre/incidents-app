import { AppText } from "@/components/AppText";
import { supabase } from "@/src/services/supabase";
import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon, X } from "lucide-react-native";
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
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newY = SCREEN_HEIGHT - sheetHeight.current + gestureState.dy;
        if (
          newY >= SCREEN_HEIGHT - MAX_SHEET_HEIGHT &&
          newY <= SCREEN_HEIGHT - MIN_SHEET_HEIGHT
        ) {
          translateY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // @ts-ignore - accessing internal value
        const currentHeight = SCREEN_HEIGHT - translateY._value;
        const velocity = gestureState.vy;

        if (velocity > 0.5 || gestureState.dy > 100) {
          // Swipe down - close or minimize
          if (currentHeight > MIN_SHEET_HEIGHT * 1.5) {
            expandToHeight(MIN_SHEET_HEIGHT);
          } else {
            handleClose();
          }
        } else if (velocity < -0.5 || gestureState.dy < -100) {
          // Swipe up - expand
          expandToHeight(MAX_SHEET_HEIGHT);
        } else {
          // Snap to nearest position
          if (currentHeight < (MIN_SHEET_HEIGHT + MAX_SHEET_HEIGHT) / 2) {
            expandToHeight(MIN_SHEET_HEIGHT);
          } else {
            expandToHeight(MAX_SHEET_HEIGHT);
          }
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

  const handleInputFocus = () => {
    if (sheetHeight.current < MAX_SHEET_HEIGHT * 0.8) {
      expandToHeight(MAX_SHEET_HEIGHT);
    }
  };

  const handleAddImage = async (source: "camera" | "gallery") => {
    try {
      let result;

      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setGeneralError("Se requiere permiso para usar la cámara");
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        });
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setGeneralError("Se requiere permiso para acceder a la galería");
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          allowsMultipleSelection: false,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setImages([...images, result.assets[0].uri]);
        setGeneralError("");
      }
    } catch (error: any) {
      setGeneralError("Error al seleccionar imagen: " + error.message);
    }
  };

  const showImageOptions = () => {
    // Simple inline options
    // In production, you might want a proper action sheet
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const fileName = `incident_${incidentId}_${Date.now()}.jpg`;
      const formData = new FormData();

      // @ts-ignore
      formData.append("file", {
        uri,
        type: "image/jpeg",
        name: fileName,
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay usuario autenticado");

      // Upload to Supabase Storage
      const fileExt = uri.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from("incident-evidence")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("incident-evidence").getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    // Reset errors
    setDescriptionError("");
    setGeneralError("");

    // Validate
    if (!description.trim()) {
      setDescriptionError("Por favor describe la solución aplicada");
      return;
    }

    if (description.trim().length < 10) {
      setDescriptionError("La descripción debe tener al menos 10 caracteres");
      return;
    }

    try {
      setUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay usuario autenticado");

      // 1. Create resolution record
      const { data: resolution, error: resolutionError } = await supabase
        .from("incident_resolutions")
        .insert({
          incident_id: incidentId,
          resolved_by: user.id,
          description: description.trim(),
        })
        .select()
        .single();

      if (resolutionError) throw resolutionError;

      // 2. Upload images if any
      if (images.length > 0) {
        const uploadPromises = images.map((uri) => uploadImage(uri));
        const uploadedUrls = await Promise.all(uploadPromises);

        // Filter out failed uploads
        const validUrls = uploadedUrls.filter((url) => url !== null);

        // Insert evidence records
        if (validUrls.length > 0) {
          const evidenceRecords = validUrls.map((url) => ({
            incident_id: incidentId,
            image_url: url!,
          }));

          const { error: evidenceError } = await supabase
            .from("incident_evidence")
            .insert(evidenceRecords);

          if (evidenceError) {
            console.error("Error saving evidence:", evidenceError);
            // Don't fail the whole operation if evidence fails
          }
        }
      }

      // 3. Update incident status
      const { error: updateError } = await supabase
        .from("incidents")
        .update({
          status: "resuelta",
          updated_at: new Date().toISOString(),
        })
        .eq("id", incidentId);

      if (updateError) throw updateError;

      // Success
      handleClose();
      onSuccess();
    } catch (error: any) {
      setGeneralError(
        error.message || "Error al resolver la incidencia. Intenta nuevamente.",
      );
    } finally {
      setUploading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            style={styles.sheetContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <AppText style={styles.title}>Resolver Incidencia</AppText>
                <AppText style={styles.subtitle}>
                  Completa los detalles de la solución
                </AppText>
              </View>
            </View>

            {/* General Error */}
            {generalError ? (
              <View style={styles.errorContainer}>
                <AppText style={styles.errorText}>{generalError}</AppText>
              </View>
            ) : null}

            {/* Description Input */}
            <View style={styles.inputSection}>
              <AppText style={styles.label}>
                Comentario <AppText style={styles.required}>*</AppText>
              </AppText>
              <TextInput
                ref={descriptionInputRef}
                style={[
                  styles.textArea,
                  descriptionError ? styles.inputError : null,
                ]}
                placeholder="Describe la reparación..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (descriptionError) setDescriptionError("");
                }}
                onFocus={handleInputFocus}
                editable={!uploading}
              />
              {descriptionError ? (
                <AppText style={styles.fieldError}>{descriptionError}</AppText>
              ) : null}
            </View>

            {/* Evidence Section */}
            <View style={styles.evidenceSection}>
              <AppText style={styles.label}>Evidencia (opcional)</AppText>

              {/* Image Grid */}
              {images.length > 0 && (
                <View style={styles.imageGrid}>
                  {images.map((uri, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image source={{ uri }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                        disabled={uploading}
                      >
                        <X size={16} color="#FFF" strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Add Image Buttons */}
              <View style={styles.addImageButtons}>
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => handleAddImage("camera")}
                  disabled={uploading}
                >
                  <Camera size={20} color="#2563EB" strokeWidth={2} />
                  <AppText style={styles.addImageButtonText}>
                    Abrir cámara
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => handleAddImage("gallery")}
                  disabled={uploading}
                >
                  <ImageIcon size={20} color="#2563EB" strokeWidth={2} />
                  <AppText style={styles.addImageButtonText}>Galería</AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                uploading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <AppText style={styles.submitButtonText}>
                  Marcar como resuelta
                </AppText>
              )}
            </TouchableOpacity>

            {/* Bottom Padding */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#CBD5E1",
    borderRadius: 2,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: "PoppinsBold",
    color: "#1F2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "PoppinsRegular",
    color: "#6B7280",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "PoppinsMedium",
    color: "#DC2626",
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: "PoppinsSemiBold",
    color: "#334155",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontFamily: "PoppinsRegular",
    color: "#1F2937",
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  fieldError: {
    fontSize: 12,
    fontFamily: "PoppinsMedium",
    color: "#EF4444",
    marginTop: 6,
  },
  evidenceSection: {
    marginBottom: 24,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButtons: {
    flexDirection: "row",
    gap: 12,
  },
  addImageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#DBEAFE",
  },
  addImageButtonText: {
    fontSize: 14,
    fontFamily: "PoppinsSemiBold",
    color: "#2563EB",
  },
  submitButton: {
    backgroundColor: "#226ceb",
    paddingVertical: 16,
    borderRadius: 115,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#005eff",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: "PoppinsSemiBold",
    color: "#FFF",
  },
});
