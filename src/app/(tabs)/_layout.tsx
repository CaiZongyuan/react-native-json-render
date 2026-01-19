import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="dashboard">
        <Icon sf="chart.bar.fill" drawable="custom_settings_drawable" />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chatbot">
        <Icon
          sf="bubble.left.and.bubble.right.fill"
          drawable="custom_settings_drawable"
        />
        <Label>Chatbot</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
