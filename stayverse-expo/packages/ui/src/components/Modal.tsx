import React, { forwardRef, useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Modal, Pressable, type ModalProps } from "react-native";
import { radius, spacing } from "../theme/tokens";
import { Text } from "../theme/Text";
import { useThemeColors } from "../theme/ThemeProvider";

export type AppBottomSheetProps = {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  index?: number;
  onChange?: (index: number) => void;
  title?: string;
};

export const AppBottomSheet = forwardRef<BottomSheet, AppBottomSheetProps>(
  function AppBottomSheet(
    { children, snapPoints: points, index = -1, onChange, title },
    ref,
  ) {
    const colors = useThemeColors();
    const snapPoints = useMemo(() => points ?? ["40%", "70%"], [points]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={ref}
        index={index}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={onChange}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.card, borderRadius: radius.sheet }}
        handleIndicatorStyle={{ backgroundColor: colors.muted }}
      >
        <BottomSheetView style={[styles.sheet, { paddingBottom: spacing.xl }]}>
          {title ? (
            <Text variant="h3" style={styles.title}>
              {title}
            </Text>
          ) : null}
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

export type AppModalProps = ModalProps & {
  title?: string;
  onClose?: () => void;
};

export function AppModal({ title, onClose, children, ...rest }: AppModalProps) {
  const colors = useThemeColors();
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose} {...rest}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          {title ? (
            <Text variant="h3" style={styles.title}>
              {title}
            </Text>
          ) : null}
          <View>{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: spacing.md,
  },
  title: {
    marginBottom: spacing.md,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.md,
  },
  modalCard: {
    borderRadius: radius.md,
    padding: spacing.lg,
  },
});
