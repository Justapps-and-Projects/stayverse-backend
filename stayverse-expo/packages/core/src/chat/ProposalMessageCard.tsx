import { StyleSheet, Text, View } from "react-native";

export type ProposalExtra = {
  extraDataType?: string;
  id?: string;
  price?: number;
  currency?: string;
  status?: string;
  description?: string;
  proposalEndDate?: string;
};

/** Read-only proposal card — Flutter ChefProposalCard display subset. */
export function ProposalMessageCard({ extra }: { extra: ProposalExtra }) {
  const price =
    extra.price != null
      ? `${extra.currency ?? ""} ${extra.price}`.trim()
      : null;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Chef proposal</Text>
      {extra.description ? (
        <Text style={styles.body}>{extra.description}</Text>
      ) : null}
      {price ? <Text style={styles.price}>{price}</Text> : null}
      {extra.status ? (
        <Text style={styles.status}>Status: {extra.status}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2D7",
    borderWidth: 1,
    borderColor: "#FDE8B7",
    gap: 4,
    maxWidth: 280,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "600",
    color: "#011369",
    textTransform: "uppercase",
  },
  body: {
    fontSize: 14,
    color: "#2C2C2C",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#232C33",
  },
  status: {
    fontSize: 12,
    color: "#7D7873",
  },
});
