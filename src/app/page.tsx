import { EquityConsolePageShell } from "@/components/equity-console-page";
import { MathFooter } from "@/components/math-footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <EquityConsolePageShell />
      <div className="container mx-auto px-4 pb-12">
        <MathFooter />
      </div>
    </div>
  );
}
