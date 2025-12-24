import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { scenarios } from "@/fixtures/scenarios";
import { Dashboard } from "../dashboard";

const getScenario = (id: string) =>
  scenarios.find((scenario) => scenario.id === id);

describe("Dashboard integration", () => {
  it("renders KPIs for DCA scenario", () => {
    const scenario = getScenario("starter-dca");
    expect(scenario).toBeTruthy();
    if (!scenario) return;

    const html = renderToStaticMarkup(<Dashboard state={scenario.state} />);
    expect(html).toContain("FD Atual");
    expect(html).toContain("Share Price");
  });

  it("renders options summary for options scenario", () => {
    const scenario = getScenario("options-monthly-36");
    expect(scenario).toBeTruthy();
    if (!scenario) return;

    const html = renderToStaticMarkup(<Dashboard state={scenario.state} />);
    expect(html).toContain("Resumo de Stock Options");
  });

  it("renders waterfall for exit scenario", () => {
    const scenario = getScenario("waterfall-low-exit");
    expect(scenario).toBeTruthy();
    if (!scenario) return;

    const html = renderToStaticMarkup(<Dashboard state={scenario.state} />);
    expect(html).toContain("Waterfall Distribution");
  });
});
