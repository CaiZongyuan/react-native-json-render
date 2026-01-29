import { INITIAL_DATA } from "@/src/lib/dashboard/initialData";
import {
  ActionProvider,
  DataProvider,
  ValidationProvider,
  VisibilityProvider,
  useData,
} from "@json-render/react";
import { Slot } from "expo-router";
import { useMemo, useRef } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DashboardData = typeof INITIAL_DATA;

// Generate random analytics data based on selected region and date
function generateRandomData(region: string, dateRange: string): DashboardData {
  const regionMultiplier =
    region === "us"
      ? 1.5
      : region === "eu"
        ? 1.2
        : region === "asia"
          ? 0.9
          : 1.0;

  const baseRevenue = 80000 + Math.random() * 80000;
  const revenue = Math.floor(baseRevenue * regionMultiplier);
  const growth = 0.05 + Math.random() * 0.2;
  const customers = Math.floor(800 + Math.random() * 800);
  const orders = Math.floor(400 + Math.random() * 400);

  const salesByRegion = [
    { label: "US", value: Math.floor(revenue * 0.36) },
    { label: "EU", value: Math.floor(revenue * 0.28) },
    { label: "Asia", value: Math.floor(revenue * 0.22) },
    { label: "Other", value: Math.floor(revenue * 0.14) },
  ];

  const statuses: Array<"completed" | "pending" | "failed"> = [
    "completed",
    "pending",
    "failed",
  ];
  const customers_list = [
    "Acme Corp",
    "Globex Inc",
    "Initech",
    "Umbrella Co",
    "Stark Ind",
    "Wayne Ent",
    "Cyberdyne",
    "Massive Dynamic",
  ];

  const recentTransactions = Array.from({ length: 4 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      id: `TXN${String(1000 + i).padStart(4, "0")}`,
      customer:
        customers_list[Math.floor(Math.random() * customers_list.length)],
      amount: Math.floor(500 + Math.random() * 5000),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      date: date.toISOString().split("T")[0],
    };
  });

  return {
    analytics: {
      revenue,
      growth,
      customers,
      orders,
      salesByRegion,
      recentTransactions,
    },
    form: {
      region,
      dateRange,
    },
  };
}

// Inner component that has access to useData()
function InnerLayout() {
  const { data, update } = useData();
  const typedData = data as DashboardData;

  // Track form data changes
  const regionRef = useRef(typedData.form?.region || "");
  const dateRangeRef = useRef(typedData.form?.dateRange || "");

  // Update refs when data changes
  regionRef.current = typedData.form?.region || "";
  dateRangeRef.current = typedData.form?.dateRange || "";

  const ACTION_HANDLERS = useMemo(
    () => ({
      refresh_data: () => {
        const region = regionRef.current || "";
        const dateRange = dateRangeRef.current || "";
        const newData = generateRandomData(region, dateRange);
        update(newData);
        Alert.alert("Refreshed", "Data has been refreshed with new values.");
      },
      apply_filter: () => {
        const region = regionRef.current || "all";
        const dateRange = dateRangeRef.current || "";
        const newData = generateRandomData(region, dateRange);
        update(newData);
        Alert.alert(
          "Applied",
          `Filters applied: ${region === "all" ? "All Regions" : region}${dateRange ? `, ${dateRange}` : ""}`,
        );
      },
      view_details: (params: Record<string, unknown>) =>
        Alert.alert("Details", JSON.stringify(params, null, 2)),
    }),
    [],
  );

  return (
    <VisibilityProvider>
      <ActionProvider handlers={ACTION_HANDLERS}>
        <ValidationProvider>
          <Slot />
        </ValidationProvider>
      </ActionProvider>
    </VisibilityProvider>
  );
}

export default function Layout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0f19" }}>
      <DataProvider initialData={INITIAL_DATA}>
        <InnerLayout />
      </DataProvider>
    </SafeAreaView>
  );
}
