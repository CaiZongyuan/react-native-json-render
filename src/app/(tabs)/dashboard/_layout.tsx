import { INITIAL_DATA } from "@/src/lib/dashboard/initialData";
import {
  ActionProvider,
  DataProvider,
  ValidationProvider,
  VisibilityProvider,
} from "@json-render/react";
import { Slot } from "expo-router";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACTION_HANDLERS = {
  refresh_data: () => Alert.alert("Action", "Refreshing data..."),
  apply_filter: () => Alert.alert("Action", "Applying filters..."),
  view_details: (params: Record<string, unknown>) =>
    Alert.alert("Details", JSON.stringify(params, null, 2)),
};

export default function Layout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0f19" }}>
      <DataProvider initialData={INITIAL_DATA}>
        <VisibilityProvider>
          <ActionProvider handlers={ACTION_HANDLERS}>
            <ValidationProvider>
              <Slot />
            </ValidationProvider>
          </ActionProvider>
        </VisibilityProvider>
      </DataProvider>
    </SafeAreaView>
  );
}
