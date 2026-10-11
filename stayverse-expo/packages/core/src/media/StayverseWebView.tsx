import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";

export type StayverseWebViewProps = {
  url: string;
  style?: StyleProp<ViewStyle>;
  /**
   * Flutter close host — navigation to stayverse.com closes the flow.
   * User Paystack returns `true` unless URL contains `/cancel`.
   */
  mode?: "support" | "paystack";
  onClose?: (result?: boolean) => void;
};

function isPaystackReturn(url: string): boolean {
  if (!url) return false;
  if (
    url.startsWith("https://stayverse.com") ||
    url.startsWith("https://www.stayverse.com") ||
    url.startsWith("stayverse://") ||
    url.startsWith("stayverse-agent://")
  ) {
    return true;
  }
  try {
    const host = new URL(url).hostname;
    if (host.endsWith("paystack.com") || host.endsWith("paystack.co")) {
      return false;
    }
  } catch {
    return false;
  }
  return /[?&](trxref|reference)=/i.test(url);
}

export const TAWK_SUPPORT_URL =
  "https://tawk.to/chat/68d1171589caa6192613d1f4/1j5oc4b5e";

/**
 * Flutter ChatSupportPage / PayStackPage WebView shell.
 */
export function StayverseWebView({
  url,
  style,
  mode = "support",
  onClose,
}: StayverseWebViewProps) {
  const [loading, setLoading] = useState(true);
  const closed = useRef(false);

  const handleNav = useCallback(
    (nav: WebViewNavigation) => {
      const shouldClose =
        mode === "paystack"
          ? isPaystackReturn(nav.url ?? "")
          : (nav.url ?? "").startsWith("https://stayverse.com");
      if (!shouldClose) return true;
      if (closed.current) return false;
      closed.current = true;
      if (mode === "paystack") {
        onClose?.(!nav.url.includes("/cancel"));
      } else {
        onClose?.();
      }
      return false;
    },
    [mode, onClose],
  );

  return (
    <View style={[styles.flex, style]}>
      <WebView
        source={{ uri: url }}
        style={styles.flex}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
        onShouldStartLoadWithRequest={(req) => {
          return handleNav({ url: req.url } as WebViewNavigation);
        }}
        onNavigationStateChange={handleNav}
      />
      {loading ? (
        <View style={styles.overlay}>
          <ActivityIndicator color="#FBC036" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FFFFFF" },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});
