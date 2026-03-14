import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export function StatsCard({ title, value, subtitle, color }: StatsCardProps) {
  const { colors } = useTheme();
  
  return (
    <View
      className="min-w-[140px] flex-1 rounded-xl border p-3 shadow-sm"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <Text
        className="text-[12px] font-semibold uppercase"
        style={{ color: colors.text + 'aa' }}
      >
        {title}
      </Text>
      <Text
        className="my-1 text-[28px] font-bold"
        style={{ color: color || colors.primary }}
      >
        {value}
      </Text>
      {subtitle ? (
        <Text
          className="text-[12px]"
          style={{ color: colors.text + '80' }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

interface StatsChartProps {
  stats: {
    todayCompleted: number;
    weekCompleted: number;
    monthCompleted: number;
    yearCompleted: number;
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  };
}

export function StatsCharts({ stats }: StatsChartProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width - 40;

  const barData = {
    labels: ['Today', 'Week', 'Month', 'Year'],
    datasets: [
      {
        data: [
          stats.todayCompleted || 0,
          stats.weekCompleted || 0,
          stats.monthCompleted || 0,
          stats.yearCompleted || 0,
        ],
      },
    ],
  };

  const pieData = [
    {
      name: 'Completed',
      population: stats.completed,
      color: colors.success,
      legendFontColor: colors.text,
    },
    {
      name: 'Pending',
      population: stats.pending,
      color: colors.warning,
      legendFontColor: colors.text,
    },
  ];

  const completionData = {
    labels: ['Completion'],
    datasets: [
      {
        data: [stats.completionRate || 0],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primary,
    labelColor: () => colors.text,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
    },
  };

  return (
    <View className="mt-2">
      <Text
        className="mt-4 mb-2 text-lg font-bold"
        style={{ color: colors.text }}
      >
        Tasks Completed
      </Text>
      <BarChart
        data={barData}
        width={screenWidth}
        height={180}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={chartConfig}
        style={{ borderRadius: 12 }}
        showValuesOnTopOfBars
      />

      <Text
        className="mt-4 mb-2 text-lg font-bold"
        style={{ color: colors.text }}
      >
        Completion Rate
      </Text>
      <View className="flex-row items-center justify-center gap-8 py-2">
        <View
          className="h-20 w-20 items-center justify-center rounded-full border-[6px]"
          style={{ borderColor: colors.primary }}
        >
          <Text
            className="text-xl font-bold"
            style={{ color: colors.primary }}
          >
            {stats.completionRate}%
          </Text>
        </View>
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <View
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: colors.success }}
            />
            <Text
              className="text-sm"
              style={{ color: colors.text }}
            >
              {stats.completed} Completed
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: colors.warning }}
            />
            <Text
              className="text-sm"
              style={{ color: colors.text }}
            >
              {stats.pending} Pending
            </Text>
          </View>
        </View>
      </View>

      {stats.total > 0 && (
        <>
          <Text
            className="mt-4 mb-2 text-lg font-bold"
            style={{ color: colors.text }}
          >
            Distribution
          </Text>
          <PieChart
            data={pieData}
            width={screenWidth}
            height={160}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </>
      )}
    </View>
  );
}

