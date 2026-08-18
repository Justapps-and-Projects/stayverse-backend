import { useMemo } from "react";
import { Chat, OverlayProvider } from "stream-chat-expo";
import { stayverseStreamTheme, useStreamChatConnect } from "@stayverse/core";

type Props = {
  children: React.ReactNode;
};

export function StreamChatProvider({ children }: Props) {
  const { client } = useStreamChatConnect();
  const theme = useMemo(() => stayverseStreamTheme, []);

  return (
    <OverlayProvider>
      <Chat client={client} style={theme}>
        {children}
      </Chat>
    </OverlayProvider>
  );
}
