import { StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import { appIconAssetName, svgIcons } from "./svgRegistry";

export type AppIconName =
  | "back"
  | "home"
  | "bookings"
  | "favourite"
  | "profile"
  | "inbox"
  | "shortlet"
  | "chef"
  | "car"
  | "filter"
  | "send_message"
  | "smile"
  | "gallery"
  | "hori_more"
  | "add"
  | "send"
  | "debit"
  | "credit"
  | "bank_recieve"
  | "bank_send"
  | "add_solid"
  | "bank_send_sqaure"
  | "verify_biometrics"
  | "bright_light"
  | "clear_photo"
  | "face_cover"
  | "message"
  | "call"
  | "person"
  | "work"
  | "discover"
  | "wallet"
  | "edit_outline"
  | "location"
  | "delete"
  | "cancel"
  | "arrow_down"
  | "calender"
  | "money"
  | "heart"
  | "img_upload"
  | (string & {});

type Props = {
  name: AppIconName;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
};

/**
 * Flutter `AppIcon` — resolves `AppIcons.<name>` → `icon-<kebab>.svg`.
 */
export function AppIcon({ name, size = 24, color, style }: Props) {
  const asset = appIconAssetName(String(name));
  const xml = svgIcons[asset] ?? svgIcons[String(name)] ?? null;

  if (!xml) {
    return <View style={[{ width: size, height: size }, style]} />;
  }

  const colorStr = color != null ? String(color) : undefined;
  const tinted = colorStr
    ? xml
        .replace(/fill="(?!none)[^"]*"/g, `fill="${colorStr}"`)
        .replace(/stroke="(?!none)[^"]*"/g, `stroke="${colorStr}"`)
    : xml;

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <SvgXml xml={tinted} width={size} height={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
});

export { svgIcons, appIconAssetName };
