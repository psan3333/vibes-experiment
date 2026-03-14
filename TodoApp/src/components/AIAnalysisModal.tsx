import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    Modal,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAI } from "../context/AIContext";
import { useTodos } from "../context/TodoContext";
import { useAIAnalysis } from "../ai/api";
import { generateYAMLData } from "../ai/yamlGenerator";
import {
    AI_PROVIDERS,
    AIProvider,
    TimePeriod,
    TIME_PERIODS,
} from "../ai/providers";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface AIAnalysisModalProps {
    visible: boolean;
    onClose: () => void;
}

export function AIAnalysisModal({ visible, onClose }: AIAnalysisModalProps) {
    const { colors } = useTheme();
    const {
        isOnline,
        isLoading: isAIContextLoading,
        providerConfig,
        selectedPeriod,
        setProviderConfig,
        setSelectedPeriod,
    } = useAI();
    const { todos } = useTodos();
    const analysisMutation = useAIAnalysis();

    const [selectedProviderId, setSelectedProviderId] = useState<string>("");
    const [apiKey, setApiKey] = useState("");
    const [customModel, setCustomModel] = useState("");
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (visible && providerConfig) {
            setSelectedProviderId(providerConfig.providerId);
            setApiKey(providerConfig.apiKey || "");
            setCustomModel(providerConfig.model || "");
        }
    }, [visible, providerConfig]);

    useEffect(() => {
        if (analysisMutation.isSuccess && analysisMutation.data) {
            setShowResults(true);
        }
    }, [analysisMutation.isSuccess, analysisMutation.data]);

    const handleClose = () => {
        setShowResults(false);
        analysisMutation.reset();
        onClose();
    };

    const handleSendData = async () => {
        if (!isOnline) {
            Alert.alert(
                "No Internet Connection",
                "You need an internet connection to use AI analysis. Please check your network and try again.",
                [{ text: "OK" }],
            );
            return;
        }

        if (!selectedProviderId) {
            Alert.alert("Error", "Please select an AI provider.");
            return;
        }

        const provider = AI_PROVIDERS.find((p) => p.id === selectedProviderId);
        if (!provider) return;

        if (provider.apiKeyRequired && !apiKey.trim()) {
            Alert.alert("Error", `Please enter your ${provider.apiKeyLabel}.`);
            return;
        }

        const config = {
            providerId: selectedProviderId,
            apiKey: provider.apiKeyRequired ? apiKey.trim() : undefined,
            model: customModel.trim() || undefined,
        };

        await setProviderConfig(config);
        await setSelectedPeriod(selectedPeriod);

        const yamlData = generateYAMLData(todos, selectedPeriod);
        analysisMutation.mutate({ config, yamlData });
    };

    const handleProviderChange = (providerId: string) => {
        setSelectedProviderId(providerId);
        const provider = AI_PROVIDERS.find((p) => p.id === providerId);
        if (provider && !provider.apiKeyRequired) {
            setApiKey("");
        }
    };

    if (!isOnline && visible) {
        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <View style={styles.overlay}>
                    <View
                        style={[
                            styles.modalContent,
                            { backgroundColor: colors.card },
                        ]}
                    >
                        <Text style={[styles.title, { color: colors.error }]}>
                            No Internet Connection
                        </Text>
                        <Text style={[styles.message, { color: colors.text }]}>
                            You need an internet connection to use AI analysis.
                            Please check your network and try again.
                        </Text>
                        <Pressable
                            style={[
                                styles.button,
                                { backgroundColor: colors.primary },
                            ]}
                            onPress={handleClose}
                        >
                            <Text style={styles.buttonText}>OK</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        );
    }

    if (showResults && analysisMutation.isSuccess && analysisMutation.data) {
        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <View style={styles.overlay}>
                    <View
                        style={[
                            styles.resultsContainer,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <View style={styles.resultsHeader}>
                            <Text
                                style={[
                                    styles.resultsTitle,
                                    { color: colors.text },
                                ]}
                            >
                                AI Analysis Results
                            </Text>
                            <Pressable
                                onPress={handleClose}
                                style={styles.closeButton}
                            >
                                <Text
                                    style={[
                                        styles.closeButtonText,
                                        { color: colors.primary },
                                    ]}
                                >
                                    Close
                                </Text>
                            </Pressable>
                        </View>
                        <ScrollView style={styles.resultsScroll}>
                            {analysisMutation.data.success &&
                            analysisMutation.data.data ? (
                                <MarkdownRenderer
                                    content={analysisMutation.data.data}
                                />
                            ) : (
                                <View style={styles.errorContainer}>
                                    <Text
                                        style={[
                                            styles.errorText,
                                            { color: colors.error },
                                        ]}
                                    >
                                        {analysisMutation.data.error ||
                                            "An error occurred"}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    }

    const selectedProvider = AI_PROVIDERS.find(
        (p) => p.id === selectedProviderId,
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <ScrollView
                    style={[
                        styles.modalContainer,
                        { backgroundColor: colors.background },
                    ]}
                    contentContainerStyle={styles.modalContentContainer}
                >
                    <View
                        style={[
                            styles.modalContent,
                            { backgroundColor: colors.card },
                        ]}
                    >
                        <Text style={[styles.title, { color: colors.text }]}>
                            AI Productivity Analysis
                        </Text>
                        <Text
                            style={[
                                styles.subtitle,
                                { color: colors.text + "aa" },
                            ]}
                        >
                            Get AI-powered insights about your task completion
                            patterns
                        </Text>

                        <Text style={[styles.label, { color: colors.text }]}>
                            Select AI Provider
                        </Text>
                        <View style={styles.providerList}>
                            {AI_PROVIDERS.map((provider) => (
                                <Pressable
                                    key={provider.id}
                                    style={[
                                        styles.providerItem,
                                        {
                                            backgroundColor:
                                                selectedProviderId ===
                                                provider.id
                                                    ? colors.primary + "20"
                                                    : colors.background,
                                            borderColor:
                                                selectedProviderId ===
                                                provider.id
                                                    ? colors.primary
                                                    : colors.border,
                                        },
                                    ]}
                                    onPress={() =>
                                        handleProviderChange(provider.id)
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.providerName,
                                            {
                                                color:
                                                    selectedProviderId ===
                                                    provider.id
                                                        ? colors.primary
                                                        : colors.text,
                                            },
                                        ]}
                                    >
                                        {provider.name}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.providerDesc,
                                            { color: colors.text + "aa" },
                                        ]}
                                    >
                                        {provider.description}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        {selectedProvider && (
                            <>
                                {selectedProvider.apiKeyRequired && (
                                    <>
                                        <Text
                                            style={[
                                                styles.label,
                                                { color: colors.text },
                                            ]}
                                        >
                                            {selectedProvider.apiKeyLabel}
                                        </Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor:
                                                        colors.background,
                                                    color: colors.text,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                            value={apiKey}
                                            onChangeText={setApiKey}
                                            placeholder={
                                                selectedProvider.apiKeyPlaceholder
                                            }
                                            placeholderTextColor={
                                                colors.text + "80"
                                            }
                                            secureTextEntry
                                        />
                                    </>
                                )}

                                {!selectedProvider.apiKeyRequired && (
                                    <View
                                        style={[
                                            styles.infoBox,
                                            {
                                                backgroundColor:
                                                    colors.primary + "10",
                                                borderColor: colors.primary,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.infoText,
                                                { color: colors.primary },
                                            ]}
                                        >
                                            {selectedProvider.name} runs
                                            locally. Make sure{" "}
                                            {selectedProvider.name} is running
                                            on your machine.
                                        </Text>
                                    </View>
                                )}

                                {selectedProvider.supportsCustomModel && (
                                    <>
                                        <Text
                                            style={[
                                                styles.label,
                                                { color: colors.text },
                                            ]}
                                        >
                                            Model (optional)
                                        </Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor:
                                                        colors.background,
                                                    color: colors.text,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                            value={customModel}
                                            onChangeText={setCustomModel}
                                            placeholder={selectedProvider.model}
                                            placeholderTextColor={
                                                colors.text + "80"
                                            }
                                        />
                                    </>
                                )}
                            </>
                        )}

                        <Text style={[styles.label, { color: colors.text }]}>
                            Analysis Period
                        </Text>
                        <View style={styles.periodList}>
                            {TIME_PERIODS.map((period) => (
                                <Pressable
                                    key={period.value}
                                    style={[
                                        styles.periodItem,
                                        {
                                            backgroundColor:
                                                selectedPeriod === period.value
                                                    ? colors.primary + "20"
                                                    : colors.background,
                                            borderColor:
                                                selectedPeriod === period.value
                                                    ? colors.primary
                                                    : colors.border,
                                        },
                                    ]}
                                    onPress={() =>
                                        setSelectedPeriod(period.value)
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.periodText,
                                            {
                                                color:
                                                    selectedPeriod ===
                                                    period.value
                                                        ? colors.primary
                                                        : colors.text,
                                            },
                                        ]}
                                    >
                                        {period.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <View style={styles.buttonRow}>
                            <Pressable
                                style={[
                                    styles.button,
                                    { backgroundColor: colors.border },
                                ]}
                                onPress={handleClose}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        { color: colors.text },
                                    ]}
                                >
                                    Cancel
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[
                                    styles.button,
                                    { backgroundColor: colors.primary },
                                    analysisMutation.isPending &&
                                        styles.buttonDisabled,
                                ]}
                                onPress={handleSendData}
                                disabled={analysisMutation.isPending}
                            >
                                {analysisMutation.isPending ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                    />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        Analyze
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "100%",
        maxHeight: "90%",
    },
    modalContentContainer: {
        padding: 16,
    },
    modalContent: {
        width: "100%",
        borderRadius: 16,
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginTop: 16,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
    },
    providerList: {
        gap: 8,
    },
    providerItem: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
    },
    providerName: {
        fontSize: 15,
        fontWeight: "600",
    },
    providerDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    periodList: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    periodItem: {
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    periodText: {
        fontSize: 13,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 24,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    infoBox: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    infoText: {
        fontSize: 13,
    },
    resultsContainer: {
        width: "95%",
        maxHeight: "90%",
        borderRadius: 16,
        overflow: "hidden",
    },
    resultsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    resultsTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    resultsScroll: {
        padding: 16,
    },
    errorContainer: {
        padding: 16,
        alignItems: "center",
    },
    errorText: {
        fontSize: 14,
        textAlign: "center",
    },
    message: {
        fontSize: 15,
        textAlign: "center",
        marginVertical: 16,
    },
});
