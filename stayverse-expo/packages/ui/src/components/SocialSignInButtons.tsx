import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { fontFamily, palette } from "../theme/tokens";
import { Text } from "../theme/Text";

type SocialSignInButtonsProps = {
  onGooglePress: () => void;
  onApplePress: () => void;
  disabled?: boolean;
};

/** Figma sign-in frame social rows (1940:3404, 1940:3413). */
export function SocialSignInButtons({
  onGooglePress,
  onApplePress,
  disabled,
}: SocialSignInButtonsProps) {
  return (
    <View style={styles.stack}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign in with Google"
        disabled={disabled}
        onPress={onGooglePress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <GoogleMark />
        <Text style={styles.label}>Sign in with Google</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign in with Apple"
        disabled={disabled}
        onPress={onApplePress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <AppleMark />
        <Text style={styles.label}>Sign in with Apple</Text>
      </Pressable>
    </View>
  );
}

function GoogleMark() {
  return (
    <Svg width={23} height={23} viewBox="0 0 23 23">
      <Path
        d="M20.8968 9.62306H20.1248V9.58329H11.4998V13.4166H16.9159C16.1257 15.6481 14.0025 17.25 11.4998 17.25C8.3244 17.25 5.74984 14.6754 5.74984 11.5C5.74984 8.32452 8.3244 5.74996 11.4998 5.74996C12.9656 5.74996 14.2991 6.30292 15.3145 7.20615L18.0251 4.4955C16.3135 2.90036 14.0241 1.91663 11.4998 1.91663C6.20744 1.91663 1.9165 6.20756 1.9165 11.5C1.9165 16.7924 6.20744 21.0833 11.4998 21.0833C16.7922 21.0833 21.0832 16.7924 21.0832 11.5C21.0832 10.8574 21.017 10.2302 20.8968 9.62306Z"
        fill="#FFC107"
      />
      <Path
        d="M3.02148 7.0394L6.17009 9.3485C7.02205 7.23921 9.08534 5.74996 11.4999 5.74996C12.9656 5.74996 14.2992 6.30292 15.3145 7.20615L18.0252 4.4955C16.3136 2.90036 14.0241 1.91663 11.4999 1.91663C7.8189 1.91663 4.62669 3.99477 3.02148 7.0394Z"
        fill="#FF3D00"
      />
      <Path
        d="M11.4998 21.0834C13.9752 21.0834 16.2244 20.1361 17.925 18.5956L14.9589 16.0857C13.9644 16.842 12.7492 17.2511 11.4998 17.2501C9.0072 17.2501 6.89072 15.6607 6.09339 13.4426L2.96826 15.8504C4.5543 18.954 7.77526 21.0834 11.4998 21.0834Z"
        fill="#4CAF50"
      />
      <Path
        d="M20.8969 9.62314H20.125V9.58337H11.5V13.4167H16.916C16.5381 14.4787 15.8572 15.4068 14.9577 16.0861L14.9591 16.0852L17.9251 18.5951C17.7153 18.7858 21.0833 16.2917 21.0833 11.5C21.0833 10.8575 21.0172 10.2302 20.8969 9.62314Z"
        fill="#1976D2"
      />
    </Svg>
  );
}

function AppleMark() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M17.0502 20.28C16.0702 21.23 15.0002 21.08 13.9702 20.63C12.8802 20.17 11.8802 20.15 10.7302 20.63C9.29016 21.25 8.53016 21.07 7.67016 20.28C2.79016 15.25 3.51016 7.59 9.05016 7.31C10.4002 7.38 11.3402 8.05 12.1302 8.11C13.3102 7.87 14.4402 7.18 15.7002 7.27C17.2102 7.39 18.3502 7.99 19.1002 9.07C15.9802 10.94 16.7202 15.05 19.5802 16.2C19.0102 17.7 18.2702 19.19 17.0402 20.29L17.0502 20.28ZM12.0302 7.25C11.8802 5.02 13.6902 3.18 15.7702 3C16.0602 5.58 13.4302 7.5 12.0302 7.25Z"
        fill={palette.black}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
    width: "100%",
  },
  button: {
    height: 55,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: palette.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: "#1E1E1E",
  },
});
