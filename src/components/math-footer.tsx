import fs from "fs";
import path from "path";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const readMathMarkdown = () => {
  const filePath = path.join(process.cwd(), "src/docs/math.md");
  return fs.readFileSync(filePath, "utf8");
};

const renderMarkdown = (content: string) => {
  const lines = content.split("\n");
  const nodes: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let code: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      nodes.push(<p className="text-muted-foreground mb-2" key={`p-${nodes.length}`}>{paragraph.join(" ")}</p>);
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list.length > 0) {
      nodes.push(
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2" key={`ul-${nodes.length}`}>
          {list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  const flushCode = () => {
    if (code.length > 0) {
      nodes.push(
        <pre className="block bg-muted p-2 rounded text-xs mb-4" key={`code-${nodes.length}`}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
      code = [];
    }
  };

  lines.forEach((line) => {
    if (line.startsWith("```")) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      return;
    }

    if (inCode) {
      code.push(line);
      return;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      nodes.push(
        <h2 className="text-xl font-semibold mb-4" key={`h2-${nodes.length}`}>
          {line.replace("# ", "")}
        </h2>,
      );
      return;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      nodes.push(
        <h3 className="text-base font-semibold mb-2" key={`h3-${nodes.length}`}>
          {line.replace("## ", "")}
        </h3>,
      );
      return;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.replace("- ", ""));
      return;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      return;
    }

    paragraph.push(line.trim());
  });

  flushParagraph();
  flushList();
  flushCode();

  return nodes;
};

export function MathFooter() {
  const markdown = readMathMarkdown();
  const content = renderMarkdown(markdown);

  return (
    <Card className="mt-12">
      <CardHeader>
        <CardTitle>Regras e Calculos Matematicos (MVP+)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">{content}</CardContent>
    </Card>
  );
}
