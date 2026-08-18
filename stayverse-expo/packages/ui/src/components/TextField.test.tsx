import React from "react";
import { render, screen } from "@testing-library/react-native";
import { TextField } from "./TextField";

describe("TextField", () => {
  it("shows label and helper text", async () => {
    await render(
      <TextField label="Email" helperText="We'll never share this" value="" />,
    );
    expect(screen.getByText("Email")).toBeTruthy();
    expect(screen.getByText("We'll never share this")).toBeTruthy();
  });

  it("shows error instead of helper", async () => {
    await render(
      <TextField
        label="Amount"
        error="Amount must not be empty"
        helperText="Min ₦100"
        value=""
      />,
    );
    expect(screen.getByText("Amount must not be empty")).toBeTruthy();
    expect(screen.queryByText("Min ₦100")).toBeNull();
  });
});
