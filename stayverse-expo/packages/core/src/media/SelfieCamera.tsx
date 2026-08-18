import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { PickedImage } from "./imagePicker";
import { prepareImageForUpload } from "./imagePicker";

type Props = {
  onCapture: (image: PickedImage) => void;
  onCancel?: () => void;
  /** Flutter FaceDetectorProcessor fake delay */
  processingMs?: number;
  compressForUpload?: boolean;
};

/**
 * Flutter KYC selfie camera — front lens, portrait, ellipse preview, ~2s process.
 * Zoom approximates Flutter `setZoomLevel(2)` (expo-camera zoom is 0–1).
 */
export function SelfieCamera({
  onCapture,
  onCancel,
  processingMs = 2000,
  compressForUpload = true,
}: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const take = useCallback(async () => {
    if (!camRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await camRef.current.takePictureAsync({
        quality: 0.85,
        shutterSound: false,
      });
      if (!photo?.uri) {
        setBusy(false);
        return;
      }
      await new Promise((r) => setTimeout(r, processingMs));
      const prepared = compressForUpload
        ? await prepareImageForUpload(photo.uri)
        : {
            uri: photo.uri,
            width: photo.width,
            height: photo.height,
            mimeType: "image/jpeg",
            fileName: `selfie_${Date.now()}.jpg`,
          };
      onCapture(prepared);
    } finally {
      setBusy(false);
    }
  }, [busy, compressForUpload, onCapture, processingMs]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FBC036" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Camera permission is required for KYC selfie.</Text>
        <Pressable onPress={() => void requestPermission()} style={styles.btn}>
          <Text style={styles.btnText}>Grant camera access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.previewWrap}>
        <CameraView
          ref={camRef}
          style={styles.camera}
          facing="front"
          mode="picture"
          zoom={0.25}
        />
        <View pointerEvents="none" style={styles.ellipseOverlay}>
          <View style={styles.ellipse} />
        </View>
      </View>
      <View style={styles.bar}>
        {onCancel ? (
          <Pressable onPress={onCancel}>
            <Text style={styles.link}>Cancel</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable onPress={take} style={styles.shutter} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#232C33" />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>
        <View style={{ width: 48 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: "#FFF",
  },
  muted: { color: "#7D7873", textAlign: "center" },
  btn: {
    backgroundColor: "#FBC036",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { fontWeight: "700", color: "#232C33" },
  previewWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  camera: { width: "100%", height: "100%" },
  ellipseOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  ellipse: {
    width: 240,
    height: 300,
    borderRadius: 120,
    borderWidth: 3,
    borderColor: "#FBC036",
    backgroundColor: "transparent",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#111",
  },
  link: { color: "#FBC036", fontWeight: "600" },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FBC036",
  },
});
