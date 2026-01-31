import { test, expect } from "@playwright/test";

test("disables tool button when balance insufficient", async ({ page }) => {
  await page.route("**/apps/fab-os/proxy/entitlements", (route) => route.fulfill({ json: { balance: 0 } }));
  await page.setContent('<button data-credit-tool="image_compressor" data-credit-cost="1">Run</button><script src="/assets/fab-os-credits.js"></script>');
  const button = page.locator("[data-credit-tool]");
  await expect(button).toBeDisabled();
});
