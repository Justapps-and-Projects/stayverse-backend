import React from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { AppModal } from "./Modal";
import { EmptyState } from "./EmptyState";
import { LottieEmptyState } from "./LottieEmptyState";
import { showToast } from "./Toast";
import Toast from "react-native-toast-message";

describe("AppModal", () => {
  it("renders title and children when visible", async () => {
    await render(
      <AppModal visible title="Confirm">
        <Text>Body</Text>
      </AppModal>,
    );
    expect(screen.getByText("Confirm")).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
  });
});

describe("EmptyState", () => {
  it("renders title description and action", async () => {
    const onAction = jest.fn();
    await render(
      <EmptyState
        title="Nothing here"
        description="Try again later"
        actionLabel="Retry"
        onAction={onAction}
      />,
    );
    expect(screen.getByText("Nothing here")).toBeTruthy();
    await fireEvent.press(screen.getByText("Retry"));
    expect(onAction).toHaveBeenCalled();
  });
});

describe("LottieEmptyState", () => {
  it("smoke renders with title", async () => {
    await render(<LottieEmptyState title="Empty" description="No items" />);
    expect(screen.getByText("Empty")).toBeTruthy();
    expect(screen.getByTestId("mock-lottie")).toBeTruthy();
  });
});

describe("showToast", () => {
  it("delegates to toast message", () => {
    showToast({ type: "success", title: "Saved", message: "Done" });
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        text1: "Saved",
        text2: "Done",
      }),
    );
  });
});
