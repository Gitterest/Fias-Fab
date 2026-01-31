export const TOOL_COSTS: Record<string, number> = {
  image_compressor: 1,
  svg_batch_tool: 3
};

export type LineItem = {
  sku?: string | null;
  name?: string | null;
  quantity?: number | null;
  properties?: { name: string; value: string }[] | null;
};

export const parseCreditsFromItem = (item: LineItem): number => {
  const qty = item.quantity ?? 0;
  const sku = item.sku ?? "";
  if (sku.startsWith("CREDITS_")) {
    const amount = Number(sku.replace("CREDITS_", ""));
    return Number.isFinite(amount) ? amount * qty : 0;
  }
  const name = (item.name ?? "").toLowerCase();
  const nameMatch = name.match(/(\d+)\s*credits?/i);
  if (nameMatch) return Number(nameMatch[1]) * qty;
  const props = item.properties ?? [];
  const prop = props.find((p) => p.name.toLowerCase() === "credits");
  if (prop) {
    const amount = Number(prop.value);
    return Number.isFinite(amount) ? amount * qty : 0;
  }
  return 0;
};

export const parseCreditsFromOrder = (lineItems: LineItem[]): number =>
  lineItems.reduce((sum, item) => sum + parseCreditsFromItem(item), 0);
