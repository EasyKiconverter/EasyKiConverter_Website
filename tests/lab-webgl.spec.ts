import { expect, test } from "@playwright/test";

test("mobile Lab controls keep the model open and reveal slice controls on demand", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/lab/", "/en/lab/"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const stage = page.locator("[data-model-stage]");
    await stage.scrollIntoViewIfNeeded();
    const controls = await page
      .locator(".artifact-switcher")
      .evaluate((switcher) => {
        const stage = switcher.closest("[data-model-stage]");
        const panel = stage?.querySelector(".model-explode");
        return {
          flexWrap: getComputedStyle(switcher).flexWrap,
          overflowX: getComputedStyle(switcher).overflowX,
          clientWidth: switcher.clientWidth,
          scrollWidth: switcher.scrollWidth,
          switcherHeight: switcher.getBoundingClientRect().height,
          sliceAxesDisplay: getComputedStyle(
            panel?.querySelector(".model-slice-axes") as Element,
          ).display,
          sliceRangeDisplay: getComputedStyle(
            panel?.querySelector(".model-slice-range") as Element,
          ).display,
        };
      });

    expect(controls.flexWrap).toBe("nowrap");
    expect(controls.overflowX).toBe("auto");
    expect(controls.scrollWidth).toBeLessThanOrEqual(controls.clientWidth);
    expect(controls.switcherHeight).toBeLessThan(48);
    expect(controls.sliceAxesDisplay).toBe("none");
    expect(controls.sliceRangeDisplay).toBe("none");

    const sliceToggle = page.locator(".model-slice-toggle");
    await expect(stage).toHaveAttribute("data-controls-ready", "true");
    await expect(stage).toHaveClass(/model-loaded/, { timeout: 120_000 });
    await expect(sliceToggle).toBeEnabled();
    await sliceToggle.click();
    await expect(sliceToggle).toHaveAttribute("aria-pressed", "true");
    const expandedControls = await sliceToggle.evaluate((toggle) => {
      const panel = toggle.closest(".model-explode");
      return {
        sliceAxesDisplay: getComputedStyle(
          panel?.querySelector(".model-slice-axes") as Element,
        ).display,
        sliceRangeDisplay: getComputedStyle(
          panel?.querySelector(".model-slice-range") as Element,
        ).display,
      };
    });
    expect(expandedControls.sliceAxesDisplay).not.toBe("none");
    expect(expandedControls.sliceRangeDisplay).not.toBe("none");
  }
});
