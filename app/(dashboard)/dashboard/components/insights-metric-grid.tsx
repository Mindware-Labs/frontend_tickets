"use client";

import {
  DASHBOARD_CHART_HEIGHT_CLASS,
} from "../dashboard-theme";
import type { Tone } from "../types";
import { DataRow } from "./data-row";

export function InsightsMetricGrid({
  items,
}: {
  items: { label: string; value: string; detail: string; tone: Tone }[];
}) {
  return (
    <div
      className={`grid ${DASHBOARD_CHART_HEIGHT_CLASS} grid-cols-2 grid-rows-2 gap-2`}
    >
      {items.map((item) => (
        <DataRow
          key={item.label}
          label={item.label}
          value={item.value}
          helper={item.detail}
          tone={item.tone}
          fill
        />
      ))}
    </div>
  );
}
