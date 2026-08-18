import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button } from "./Button";

describe("Button", () => {
  it("renders label and handles press", async () => {
    const onPress = jest.fn();
    await render(<Button label="Continue" onPress={onPress} />);
    await fireEvent.press(screen.getByText("Continue"));
    expect(onPress).toHaveBeenCalled();
  });

  it("disables when loading", async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" loading onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders outline variant", async () => {
    await render(<Button label="Outline" variant="outline" />);
    expect(screen.getByText("Outline")).toBeTruthy();
  });
});
