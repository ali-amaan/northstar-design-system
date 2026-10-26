// Server component: renders every package that can render on the server.
import { Ranking } from "@northstar-js/charts";
import { formatPercent } from "@northstar-js/charts/format";
import { AddIcon, iconNames } from "@northstar-js/icons";
import { WorldMap } from "@northstar-js/maps";
import * as contracts from "@northstar-js/contracts";
import * as tokens from "@northstar-js/tokens";
import { ClientBits } from "./client-bits";

export default function Page() {
  return (
    <main>
      <h1>Northstar smoke</h1>
      <p data-testid="counts">
        {iconNames.length} icons, {Object.keys(contracts).length} contract exports,{" "}
        {Object.keys(tokens).length} token exports, {formatPercent(0.42)}
      </p>
      <AddIcon />
      <Ranking items={["First", "Second", "Third"]} title="Ranking" />
      <WorldMap width={640} title="World" />
      <ClientBits />
    </main>
  );
}
