# Regras e Calculos Matematicos (MVP+)

Notas: valores monetarios sao numeros em BRL (nao usamos centavos integer neste MVP+).

## 1. Cap Table & Fully Diluted (FD)
O Cap Table representa a estrutura de capital da empresa. FD (Fully Diluted) e o total de acoes assumindo
que todas as opcoes e outros instrumentos dilutivos foram exercidos.

```
FD = commonOutstanding + optionPoolReserved + otherDilutiveShares
```

## 2. Share Price
O preco por share e calculado dividindo o Equity Value pelo FD.

```
sharePrice = equityValue / FD
```

## 3. Vesting configuravel
Cada grant possui um schedule configuravel (inicio, cliff, duracao total e frequencia).

```
monthsElapsed = meses completos entre startDate e asOfDate
se monthsElapsed < cliffMonths => vestedPercent = 0
periodSize = 1 (monthly) ou 3 (quarterly)
periodsTotal = ceil(totalMonths / periodSize)
periodsElapsed = floor((monthsElapsed - cliffMonths) / periodSize) + 1
vestedPercent = min(1, periodsElapsed / periodsTotal)
vestedQty = floor(quantityGranted * vestedPercent)
```

Migracao v1->v2: grants antigos 25/25/50 viram schedule com cliff 12, total 36, frequency MONTHLY.

## 4. Stock Options - Intrinsic Value
O valor intrinseco representa o ganho potencial se voce exercer suas opcoes vested hoje.

```
intrinsicValue = max(0, (currentSharePrice - strikePrice) * vestedShares)
```

## 5. Stock Options - Payout Value (Exit)
O payout no exit e o valor que voce receberia se vendesse suas opcoes vested no exit.

```
payoutValue = max(0, (exitSharePrice - strikePrice) * vestedShares)
```

## 6. Compras Recorrentes (DCA) - Purchase Price
O preco de compra pode ser fixo ou ancorado no Entry Valuation.

- FIXED_SHARE_PRICE: preco fixo por share
- ENTRY_VALUATION_ANCHORED: purchasePrice = entryEquityValue / FD(entry)

## 7. Compras Recorrentes - Monthly Amount Effective
O valor mensal efetivo e determinado pela ultima mudanca aplicavel.

```
monthlyAmountEffective = ultima contributionChange.monthlyAmount onde effectiveDate <= data da compra
```

Se nao houver mudancas aplicaveis, usa o baseline. monthlyAmount = 0 pausa a compra.

## 8. Compras Recorrentes - Shares Bought
```
sharesBought = monthlyAmountEffective / purchasePrice
```

## 9. Compras Recorrentes - Acumulados
```
investedCumulative = soma dos monthlyAmountEffective ate a data
sharesCumulative = soma dos sharesBought ate a data
```

## 10. Compras Recorrentes - Current Value & Gain
```
currentValue = sharesCumulative * currentSharePrice
totalGain = currentValue - investedCumulative
multiple = currentValue / investedCumulative
```

## 11. Waterfall 1x non-participating (Common vs Preferred)
Share classes definem Common e Preferred. Neste MVP+, o waterfall considera somente shares em holdings.

```
preferenceAmount = investedAmount * preferenceMultiple
conversionValue = (classShares / totalConvertedShares) * exitEquityValue
```

Decisao non-participating:
- Se conversionValue > preferenceAmount: class converte (participa do residual).
- Caso contrario: class recebe preferencia 1x (pode ser truncada se o equity acabar).

Distribuicao:
1) Pagar preferencia por seniority (menor numero = mais senior).
2) O residual vai para Common + Preferred que converteram, pro-rata pelas shares.

Simplificacao: options nao entram no cap table do waterfall nesta etapa.

## 12. Waterfall participating (FULL) + cap
Para classes Preferred com participation FULL:
- Recebem a preferencia 1x primeiro.
- Depois participam pro-rata do residual como se convertessem.
- Se houver cap (participationCapMultiple), o total recebido fica limitado a:

```
capTotal = investedAmount * participationCapMultiple
```

Caso o cap seja atingido, o excesso do residual e redistribuido entre as demais classes do pool.

## 13. Financing rounds (pre-money + investimento + pool top-up)
Para cada rodada:

```
pricePerShare = preMoney / preRoundFD
newShares = investmentAmount / pricePerShare
```

Se houver targetOptionPoolPostPercent:

```
poolIncrease = (targetPercent * (preRoundFD + newShares) - optionPoolReserved) / (1 - targetPercent)
postRoundFD = preRoundFD + newShares + poolIncrease
```

No MVP+, o botao "Gerar automaticamente shares" cria holdings para investidores e dilution events para novas shares/pool.

## 14. Convertibles (SAFE / NOTE)
Para converter em uma rodada:

```
priceByDiscount = roundPrice * (1 - discount)
priceByCap = cap / preRoundFD
conversionPrice = min(priceByDiscount, priceByCap, roundPrice)
sharesIssued = amount / conversionPrice
```

NOTE: aplica juros simples (interestRate anual) desde dateIssued ate a data da rodada.

No exit sem rodada, usamos o share price do exit como base de conversao e os convertibles entram como Common.

## 15. Options: exercicio, expiracao e aceleracao
- Se expirationDate < data de referencia: exercisable = 0.
- Se terminationDate existir, o vesting para na data de termino.
- A janela de exercicio (postTerminationExerciseWindowDays) limita ate quando as options podem ser exercidas.

Aceleracao no exit:
- Se acceleration.type != NONE, ajustamos o vestedPercent para pelo menos acceleration.percent.

```
exercisableQty = 0 se expirou ou passou da janela
exercisableQty = vestedQty caso contrario
```

## 16. Exit por Enterprise Value
Quando informado:

```
equityValue = enterpriseValue - netDebt - fees
```

O equityValue calculado e usado em share price, payout e waterfall.

## Disclaimers importantes
- Este MVP nao considera impostos (ganho de capital, etc.)
- Nao calcula fair value (409A) para opcoes
- Nao considera lockup ou restricoes de venda
- Valores sao estimativas simplificadas
