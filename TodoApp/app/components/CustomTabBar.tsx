import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";

interface TabItem {
    name: string;
    label: string;
    icon: string;
}

const tabs: TabItem[] = [
    { name: "/", label: "Home", icon: "🏠" },
    { name: "/profile", label: "Profile", icon: "👤" },
];

interface CustomTabBarProps {
    currentRoute: string;
    navigation: any;
}

export function CustomTabBar({ currentRoute, navigation }: CustomTabBarProps) {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.tabBar,
                { backgroundColor: colors.card, borderTopColor: colors.border },
            ]}
            accessibilityRole="tablist"
        >
            {tabs.map((tab) => {
                const isFocused = currentRoute === tab.name;
                return (
                    <Pressable
                        key={tab.name}
                        style={styles.tabItem}
                        onPress={() => navigation.navigate(tab.name)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isFocused }}
                        accessibilityLabel={tab.label}
                        accessibilityHint={`Navigate to ${tab.label} screen`}
                    >
                        <Text
                            style={[
                                styles.tabIcon,
                                { opacity: isFocused ? 1 : 0.6 },
                            ]}
                        >
                            {tab.icon}
                        </Text>
                        <Text
                            style={[
                                styles.tabLabel,
                                {
                                    color: isFocused
                                        ? colors.primary
                                        : colors.text + "99",
                                },
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: "row",
        height: 85,
        paddingBottom: 25,
        paddingTop: 10,
        borderTopWidth: 1,
    },
    tabItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    tabIcon: {
        fontSize: 22,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 4,
    },
});
