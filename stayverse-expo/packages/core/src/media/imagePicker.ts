import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { MediaConstraints } from "./mediaConstraints";

export type PickedImage = {
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
};

const PROFILE_QUALITY = MediaConstraints.profileImageQuality / 100;
const UPLOAD_JPEG_QUALITY = MediaConstraints.uploadJpegQuality / 100;
const UPLOAD_MIN_EDGE = MediaConstraints.uploadMinEdge;

/**
 * Flutter profile camera: front + imageQuality 85.
 */
export async function pickProfileFromCamera(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    cameraType: ImagePicker.CameraType.front,
    quality: PROFILE_QUALITY,
    exif: false,
  });
  if (result.canceled || !result.assets[0]) return null;
  return mapAsset(result.assets[0]);
}

/**
 * Flutter profile gallery: imageQuality 85.
 */
export async function pickProfileFromGallery(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: PROFILE_QUALITY,
    exif: false,
  });
  if (result.canceled || !result.assets[0]) return null;
  return mapAsset(result.assets[0]);
}

/**
 * Agent listing gallery multi-pick — min 2 / max 12, ≤5MB, jpg/png/jpeg/gif.
 * Compression not applied (Flutter agent uploads raw).
 */
export async function pickListingImages(options?: {
  selectionLimit?: number;
}): Promise<PickedImage[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: options?.selectionLimit ?? 12,
    quality: 1,
    exif: false,
  });
  if (result.canceled) return [];

  const maxBytes = MediaConstraints.listingMaxBytes;
  const allowed = new Set<string>(MediaConstraints.listingExtensions);

  return result.assets
    .map(mapAsset)
    .filter((img) => {
      const ext = (img.fileName?.split(".").pop() ?? img.uri.split(".").pop() ?? "")
        .toLowerCase();
      if (ext && !allowed.has(ext) && !img.mimeType?.includes("image")) {
        return false;
      }
      if (img.fileSize != null && img.fileSize > maxBytes) return false;
      return true;
    })
    .slice(0, MediaConstraints.listingMaxImages);
}

/**
 * Flutter user `ImageService._prepareImageForUpload`:
 * JPEG quality 80, minWidth/minHeight 1440.
 */
export async function prepareImageForUpload(uri: string): Promise<PickedImage> {
  const probe = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 1,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  const maxEdge = Math.max(probe.width, probe.height);
  const scale = maxEdge > 0 && maxEdge < UPLOAD_MIN_EDGE ? UPLOAD_MIN_EDGE / maxEdge : 1;
  const width = Math.round(probe.width * scale);
  const height = Math.round(probe.height * scale);

  const actions: ImageManipulator.Action[] =
    scale !== 1 ? [{ resize: { width, height } }] : [];

  const out = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: UPLOAD_JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return {
    uri: out.uri,
    width: out.width,
    height: out.height,
    mimeType: "image/jpeg",
    fileName: `photo_optimized_${Date.now()}.jpg`,
  };
}

function mapAsset(asset: ImagePicker.ImagePickerAsset): PickedImage {
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType,
    fileName: asset.fileName,
    fileSize: asset.fileSize,
  };
}

export { MediaConstraints } from "./mediaConstraints";
