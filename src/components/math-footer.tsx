import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MathFooter() {
  return (
    <Card className="mt-12">
      <CardHeader>
        <CardTitle>Regras e Calculos Matematicos (MVP)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <section>
          <h4 className="font-semibold mb-2">1. Cap Table & Fully Diluted (FD)</h4>
          <p className="text-muted-foreground mb-2">
            O Cap Table representa a estrutura de capital da empresa. FD (Fully Diluted) e o total de acoes assumindo
            que todas as opcoes e outros instrumentos dilutivos foram exercidos.
          </p>
          <code className="block bg-muted p-2 rounded text-xs">
            FD = commonOutstanding + optionPoolReserved + otherDilutiveShares
          </code>
        </section>

        <section>
          <h4 className="font-semibold mb-2">2. Share Price</h4>
          <p className="text-muted-foreground mb-2">
            O preco por share e calculado dividindo o Equity Value pelo FD.
          </p>
          <code className="block bg-muted p-2 rounded text-xs">sharePrice = equityValue / FD</code>
        </section>

        <section>
          <h4 className="font-semibold mb-2">3. Stock Options - Vesting Schedule</h4>
          <p className="text-muted-foreground mb-2">
            As opcoes vestem seguindo o esquema 25%/25%/50% ao longo de 36 meses.
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
            <li>
              <strong>0-12 meses:</strong> 0% vested (cliff de 12 meses)
            </li>
            <li>
              <strong>12 meses:</strong> 25% vested imediatamente
            </li>
            <li>
              <strong>12-24 meses:</strong> 25% adicional aos 24 meses
            </li>
            <li>
              <strong>24-36 meses:</strong> 50% adicional aos 36 meses
            </li>
            <li>
              <strong>36+ meses:</strong> 100% vested
            </li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold mb-2">4. Stock Options - Intrinsic Value</h4>
          <p className="text-muted-foreground mb-2">
            O valor intrinseco representa o ganho potencial se voce exercer suas opcoes vested hoje.
          </p>
          <code className="block bg-muted p-2 rounded text-xs">
            intrinsicValue = max(0, (currentSharePrice - strikePrice) * vestedShares)
          </code>
        </section>

        <section>
          <h4 className="font-semibold mb-2">5. Stock Options - Payout Value (Exit)</h4>
          <p className="text-muted-foreground mb-2">
            O payout no exit e o valor que voce receberia se vendesse suas opcoes vested no exit.
          </p>
          <code className="block bg-muted p-2 rounded text-xs">
            payoutValue = max(0, (exitSharePrice - strikePrice) * vestedShares)
          </code>
        </section>

        <section>
          <h4 className="font-semibold mb-2">6. Compras Recorrentes (DCA) - Purchase Price</h4>
          <p className="text-muted-foreground mb-2">
            O preco de compra pode ser fixo ou ancorado no Entry Valuation.
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
            <li>
              <strong>FIXED_SHARE_PRICE:</strong> preco fixo por share
            </li>
            <li>
              <strong>ENTRY_VALUATION_ANCHORED:</strong> purchasePrice = entryEquityValue / FD(entry)
            </li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold mb-2">7. Compras Recorrentes - Monthly Amount Effective</h4>
          <p className="text-muted-foreground mb-2">
            O valor mensal efetivo e determinado pela ultima mudanca aplicavel.
          </p>
          <code className="block bg-muted p-2 rounded text-xs">
            monthlyAmountEffective = ultima contributionChange.monthlyAmount onde effectiveDate &lt;= data da compra
          </code>
          <p className="text-muted-foreground mt-2">
            Se nao houver mudancas, usa o baseline. monthlyAmount = 0 pausa a compra.
          </p>
        </section>

        <section>
          <h4 className="font-semibold mb-2">8. Compras Recorrentes - Shares Bought</h4>
          <code className="block bg-muted p-2 rounded text-xs">
            sharesBought = monthlyAmountEffective / purchasePrice
          </code>
        </section>

        <section>
          <h4 className="font-semibold mb-2">9. Compras Recorrentes - Acumulados</h4>
          <code className="block bg-muted p-2 rounded text-xs space-y-1">
            <div>investedCumulative = soma dos monthlyAmountEffective ate a data</div>
            <div>sharesCumulative = soma dos sharesBought ate a data</div>
          </code>
        </section>

        <section>
          <h4 className="font-semibold mb-2">10. Compras Recorrentes - Current Value & Gain</h4>
          <code className="block bg-muted p-2 rounded text-xs space-y-1">
            <div>currentValue = sharesCumulative * currentSharePrice</div>
            <div>totalGain = currentValue - investedCumulative</div>
            <div>multiple = currentValue / investedCumulative</div>
          </code>
        </section>

        <section>
          <h4 className="font-semibold mb-2 text-destructive">Disclaimers Importantes</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
            <li>Este MVP nao considera impostos (ganho de capital, etc.)</li>
            <li>Não inclui liquidation preferences ou waterfall</li>
            <li>Nao calcula fair value (409A) para opcoes</li>
            <li>Nao considera lockup ou restricoes de venda</li>
            <li>Valores sao estimativas simplificadas</li>
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}
