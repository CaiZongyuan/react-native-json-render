import { Slot } from "expo-router";
import { INITIAL_DATA } from "@/src/lib/todolist/initialData";
import { DataProvider, VisibilityProvider } from "@json-render/react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Layout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0f19" }}>
      <DataProvider initialData={{ ...INITIAL_DATA, blocks: {} }}>
        <VisibilityProvider>
          <Slot />
        </VisibilityProvider>
      </DataProvider>
    </SafeAreaView>
  );
}
