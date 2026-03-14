import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    RefreshControl,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useTodos } from "../context/TodoContext";
import { TodoItem } from "../components/TodoItem";
import { AddTodoModal } from "../components/AddTodoModal";
import { StatsCharts } from "../components/StatsComponents";

type FilterType = "all" | "pending" | "completed";

export function ProfileScreen() {
    const { colors } = useTheme();
    const {
        todos,
        pendingTodos,
        completedTodos,
        addTodo,
        completeTodo,
        uncompleteTodo,
        deleteTodo,
        getStats,
        refreshTodos,
    } = useTodos();
    const [filter, setFilter] = useState<FilterType>("pending");
    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const stats = getStats();

    const filteredTodos = useMemo(() => {
        switch (filter) {
            case "pending":
                return pendingTodos;
            case "completed":
                return completedTodos;
            default:
                return todos;
        }
    }, [filter, todos, pendingTodos, completedTodos]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshTodos();
        setRefreshing(false);
    };

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: colors.background }}
        >
            <ScrollView
                className="flex-1"
                contentContainerClassName="px-5 pb-24"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <View className="mb-5">
                    <Text
                        className="text-2xl font-bold"
                        style={{ color: colors.text }}
                    >
                        Profile & Stats
                    </Text>
                </View>

                <View
                    className="rounded-2xl border p-5 shadow-sm"
                    style={{
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                    }}
                >
                    <Text
                        className="mb-4 text-lg font-bold"
                        style={{ color: colors.text }}
                    >
                        Productivity Overview
                    </Text>
                    <View
                        className={`justify-around ${isLandscape ? "flex-row flex-wrap gap-5" : "flex-row"}`}
                    >
                        <View className="items-center">
                            <Text
                                className="text-3xl font-bold"
                                style={{ color: colors.primary }}
                            >
                                {stats.completionRate}%
                            </Text>
                            <Text
                                className="mt-1 text-xs"
                                style={{ color: colors.text + "aa" }}
                            >
                                Completion
                            </Text>
                        </View>
                        <View className="items-center">
                            <Text
                                className="text-3xl font-bold"
                                style={{ color: colors.success }}
                            >
                                {stats.completed}
                            </Text>
                            <Text
                                className="mt-1 text-xs"
                                style={{ color: colors.text + "aa" }}
                            >
                                Done
                            </Text>
                        </View>
                        <View className="items-center">
                            <Text
                                className="text-3xl font-bold"
                                style={{ color: colors.warning }}
                            >
                                {stats.pending}
                            </Text>
                            <Text
                                className="mt-1 text-xs"
                                style={{ color: colors.text + "aa" }}
                            >
                                Left
                            </Text>
                        </View>
                    </View>
                </View>

                <StatsCharts stats={stats} />

                <View className="mt-5">
                    <Text
                        className="mb-3 text-xl font-bold"
                        style={{ color: colors.text }}
                    >
                        My TODOs
                    </Text>
                    <View
                        className="flex-row gap-1 rounded-xl p-1"
                        style={{ backgroundColor: colors.card }}
                    >
                        <Pressable
                            className={`flex-1 items-center rounded-lg py-2.5 ${
                                filter === "pending" ? "" : ""
                            }`}
                            style={
                                filter === "pending"
                                    ? { backgroundColor: colors.primary }
                                    : undefined
                            }
                            onPress={() => setFilter("pending")}
                        >
                            <Text
                                className="text-xs font-semibold"
                                style={{
                                    color:
                                        filter === "pending"
                                            ? "#fff"
                                            : colors.text,
                                }}
                            >
                                Planned ({pendingTodos.length})
                            </Text>
                        </Pressable>
                        <Pressable
                            className="flex-1 items-center rounded-lg py-2.5"
                            style={
                                filter === "completed"
                                    ? { backgroundColor: colors.success }
                                    : undefined
                            }
                            onPress={() => setFilter("completed")}
                        >
                            <Text
                                className="text-xs font-semibold"
                                style={{
                                    color:
                                        filter === "completed"
                                            ? "#fff"
                                            : colors.text,
                                }}
                            >
                                Completed ({completedTodos.length})
                            </Text>
                        </Pressable>
                        <Pressable
                            className="flex-1 items-center rounded-lg py-2.5"
                            style={
                                filter === "all"
                                    ? { backgroundColor: colors.secondary }
                                    : undefined
                            }
                            onPress={() => setFilter("all")}
                        >
                            <Text
                                className="text-xs font-semibold"
                                style={{
                                    color:
                                        filter === "all" ? "#fff" : colors.text,
                                }}
                            >
                                All ({todos.length})
                            </Text>
                        </Pressable>
                    </View>
                </View>

                <View className="mt-4">
                    {filteredTodos.length === 0 ? (
                        <View
                            className="items-center rounded-xl border px-8 py-7"
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            }}
                        >
                            <Text
                                className="text-base"
                                style={{ color: colors.text + "aa" }}
                            >
                                {filter === "pending"
                                    ? "No planned tasks!"
                                    : filter === "completed"
                                      ? "No completed tasks yet!"
                                      : "No tasks yet!"}
                            </Text>
                        </View>
                    ) : (
                        filteredTodos.map((todo) => (
                            <TodoItem
                                key={todo.id}
                                todo={todo}
                                onComplete={completeTodo}
                                onUncomplete={uncompleteTodo}
                                onDelete={deleteTodo}
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            <Pressable
                className="absolute bottom-8 right-8 h-15 w-15 items-center justify-center rounded-full shadow-lg"
                style={{ backgroundColor: colors.primary }}
                onPress={() => setModalVisible(true)}
            >
                <Text className="mt-[-2px] text-3xl font-light text-white">
                    +
                </Text>
            </Pressable>

            <AddTodoModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onAdd={addTodo}
            />
        </SafeAreaView>
    );
}
