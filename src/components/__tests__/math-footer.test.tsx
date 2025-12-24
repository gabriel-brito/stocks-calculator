import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { MathFooter } from "../math-footer";

describe("MathFooter", () => {
  it("renders the canonical math doc headings", () => {
    const html = renderToStaticMarkup(<MathFooter />);
    expect(html).toContain("Regras e Calculos Matematicos (MVP+)");
    expect(html).toContain("Cap Table");
    expect(html).toContain("Vesting configuravel");
  });
});
