import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors } from '../lib/theme';

export type PieSlice = {
  label: string;
  value: number;
  color: string;
};

type PieChartProps = {
  slices: PieSlice[];
  size?: number;
};

export function PieChart({ slices, size = 180 }: PieChartProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <View style={[styles.emptyContainer, { width: size, height: size }]}>
        <Text style={styles.emptyText}>No data</Text>
      </View>
    );
  }

  const radius = size / 2;
  const cx = radius;
  const cy = radius;
  const strokeWidth = 0;

  let cumulativeAngle = -90;

  const arcs = slices.map((slice, i) => {
    const angle = (slice.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = startAngle + angle;
    cumulativeAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return (
      <Slice
        key={i}
        path={path}
        fill={slice.color}
        stroke={Colors.bgElevated}
        strokeWidth={strokeWidth}
      />
    );
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {arcs}
        <Circle cx={cx} cy={cy} r={radius * 0.45} fill={Colors.bgElevated} />
      </Svg>
      <View style={styles.centerLabel}>
        <Text style={styles.centerTotal}>{total.toFixed(0)}</Text>
        <Text style={styles.centerLabelText}>Total</Text>
      </View>
    </View>
  );
}

import { Svg, Path, Circle } from 'react-native-svg';

function Slice({ path, fill, stroke, strokeWidth }: { path: string; fill: string; stroke: string; strokeWidth: number }) {
  return <Path d={path} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    backgroundColor: Colors.bgElevated,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerTotal: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  centerLabelText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
