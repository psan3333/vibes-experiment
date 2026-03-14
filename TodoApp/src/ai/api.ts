import { useMutation } from "@tanstack/react-query";
import { AIProviderConfig, getProviderById } from "./providers";
import { TodoYAMLData } from "./yamlGenerator";

export interface AIResponse {
    success: boolean;
    data?: string;
    error?: string;
}

const SYSTEM_PROMPT = `You are an expert productivity analyst and behavioral psychologist. Your task is to analyze user task management data and provide actionable insights.

## Instructions:

1. **Analyze the user's task data** provided below in YAML format. Look for patterns in:
   - Task completion rates over time
   - Types of tasks being created
   - Completion time patterns
   - Success/failure patterns
   - Task complexity (based on descriptions and metrics)

2. **Search the internet** for the latest productivity tools, frameworks, and methodologies that could help this user improve their task completion rates.

3. **Provide a comprehensive analysis** including:
   - Key insights about the user's productivity patterns
   - Specific recommendations for improvement
   - Suggested tools or techniques from your research
   - Actionable next steps

4. **Format your response in clear Markdown** with:
   - Clear section headers
   - Bullet points for recommendations
   - Concrete numbers and metrics from the data
   - Evidence-based suggestions

Remember: Be specific, actionable, and evidence-based in your analysis.`;

function convertToYAML(data: TodoYAMLData): string {
    let yaml = `# Task Analytics Report\n`;
    yaml += `# Period: ${data.period.label} (${data.period.startDate} to ${data.period.endDate})\n\n`;

    yaml += `summary:\n`;
    yaml += `  total_tasks: ${data.summary.totalTasks}\n`;
    yaml += `  completed_tasks: ${data.summary.completedTasks}\n`;
    yaml += `  pending_tasks: ${data.summary.pendingTasks}\n`;
    yaml += `  completion_rate: ${data.summary.completionRate}%\n`;
    if (data.summary.avgCompletionTime !== null) {
        yaml += `  avg_completion_days: ${data.summary.avgCompletionTime}\n`;
    } else {
        yaml += `  avg_completion_days: null\n`;
    }

    yaml += `\ntasks:\n`;

    for (const task of data.tasks) {
        yaml += `  - title: "${task.title.replace(/"/g, '\\"')}"\n`;
        if (task.description) {
            yaml += `    description: "${task.description.replace(/"/g, '\\"')}"\n`;
        } else {
            yaml += `    description: null\n`;
        }
        if (task.metric) {
            yaml += `    metric: "${task.metric.replace(/"/g, '\\"')}"\n`;
        } else {
            yaml += `    metric: null\n`;
        }
        yaml += `    completed: ${task.isCompleted}\n`;
        yaml += `    created_at: "${task.createdAt}"\n`;
        if (task.completedAt) {
            yaml += `    completed_at: "${task.completedAt}"\n`;
        } else {
            yaml += `    completed_at: null\n`;
        }
    }

    return yaml;
}

async function callOpenAI(
    baseUrl: string,
    apiKey: string,
    model: string,
    message: string,
): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful productivity analyst.",
                },
                { role: "user", content: message },
            ],
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        return {
            success: false,
            error: `OpenAI API error: ${response.status} - ${error}`,
        };
    }

    const data = await response.json();
    return { success: true, data: data.choices[0]?.message?.content || "" };
}

async function callAnthropic(
    baseUrl: string,
    apiKey: string,
    model: string,
    message: string,
): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model,
            max_tokens: 4096,
            messages: [{ role: "user", content: message }],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        return {
            success: false,
            error: `Anthropic API error: ${response.status} - ${error}`,
        };
    }

    const data = await response.json();
    return { success: true, data: data.content[0]?.text || "" };
}

async function callGoogleAI(
    baseUrl: string,
    apiKey: string,
    model: string,
    message: string,
): Promise<AIResponse> {
    const response = await fetch(
        `${baseUrl}/models/${model}:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: message }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                },
            }),
        },
    );

    if (!response.ok) {
        const error = await response.text();
        return {
            success: false,
            error: `Google AI API error: ${response.status} - ${error}`,
        };
    }

    const data = await response.json();
    return {
        success: true,
        data: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
    };
}

async function callXAI(
    baseUrl: string,
    apiKey: string,
    model: string,
    message: string,
): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful productivity analyst.",
                },
                { role: "user", content: message },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        return {
            success: false,
            error: `xAI API error: ${response.status} - ${error}`,
        };
    }

    const data = await response.json();
    return { success: true, data: data.choices[0]?.message?.content || "" };
}

async function callMistral(
    baseUrl: string,
    apiKey: string,
    model: string,
    message: string,
): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful productivity analyst.",
                },
                { role: "user", content: message },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        return {
            success: false,
            error: `Mistral API error: ${response.status} - ${error}`,
        };
    }

    const data = await response.json();
    return { success: true, data: data.choices[0]?.message?.content || "" };
}

async function callCohere(
    baseUrl: string,
    apiKey: string,
    model: string,
    message: string,
): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            message,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        return {
            success: false,
            error: `Cohere API error: ${response.status} - ${error}`,
        };
    }

    const data = await response.json();
    return { success: true, data: data.text || "" };
}

async function callAI21(
    baseUrl: string,
    apiKey: string,
    model: string,
    message: string,
): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful productivity analyst.",
                },
                { role: "user", content: message },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        return {
            success: false,
            error: `AI21 API error: ${response.status} - ${error}`,
        };
    }

    const data = await response.json();
    return { success: true, data: data.choices[0]?.message?.content || "" };
}

async function callDeepSeek(
    baseUrl: string,
    apiKey: string,
    model: string,
    message: string,
): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful productivity analyst.",
                },
                { role: "user", content: message },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        return {
            success: false,
            error: `DeepSeek API error: ${response.status} - ${error}`,
        };
    }

    const data = await response.json();
    return { success: true, data: data.choices[0]?.message?.content || "" };
}

async function callPerplexity(
    baseUrl: string,
    apiKey: string,
    model: string,
    message: string,
): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful productivity analyst.",
                },
                { role: "user", content: message },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        return {
            success: false,
            error: `Perplexity API error: ${response.status} - ${error}`,
        };
    }

    const data = await response.json();
    return { success: true, data: data.choices[0]?.message?.content || "" };
}

async function callTogether(
    baseUrl: string,
    apiKey: string,
    model: string,
    message: string,
): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful productivity analyst.",
                },
                { role: "user", content: message },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        return {
            success: false,
            error: `Together AI API error: ${response.status} - ${error}`,
        };
    }

    const data = await response.json();
    return { success: true, data: data.choices[0]?.message?.content || "" };
}

async function callOllamaLike(
    baseUrl: string,
    model: string,
    message: string,
): Promise<AIResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful productivity analyst.",
                },
                { role: "user", content: message },
            ],
            stream: false,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        return {
            success: false,
            error: `Local AI error: ${response.status} - ${error}`,
        };
    }

    const data = await response.json();
    return { success: true, data: data.message?.content || "" };
}

async function sendToAIRequest(
    config: AIProviderConfig,
    yamlData: TodoYAMLData,
): Promise<AIResponse> {
    const provider = getProviderById(config.providerId);

    if (!provider) {
        return { success: false, error: "Unknown AI provider" };
    }

    const yamlText = convertToYAML(yamlData);

    const userMessage = `# Productivity Analysis Request

${SYSTEM_PROMPT}

## User Task Data (YAML):

${yamlText}

---

Please analyze the above data and provide your insights following the instructions.`;

    const model = config.model || provider.model || "default";

    switch (config.providerId) {
        case "openai":
            return await callOpenAI(
                provider.baseUrl,
                config.apiKey || "",
                model,
                userMessage,
            );
        case "anthropic":
            return await callAnthropic(
                provider.baseUrl,
                config.apiKey || "",
                model,
                userMessage,
            );
        case "google":
            return await callGoogleAI(
                provider.baseUrl,
                config.apiKey || "",
                model,
                userMessage,
            );
        case "xai":
            return await callXAI(
                provider.baseUrl,
                config.apiKey || "",
                model,
                userMessage,
            );
        case "mistral":
            return await callMistral(
                provider.baseUrl,
                config.apiKey || "",
                model,
                userMessage,
            );
        case "cohere":
            return await callCohere(
                provider.baseUrl,
                config.apiKey || "",
                model,
                userMessage,
            );
        case "ai21":
            return await callAI21(
                provider.baseUrl,
                config.apiKey || "",
                model,
                userMessage,
            );
        case "deepseek":
            return await callDeepSeek(
                provider.baseUrl,
                config.apiKey || "",
                model,
                userMessage,
            );
        case "perplexity":
            return await callPerplexity(
                provider.baseUrl,
                config.apiKey || "",
                model,
                userMessage,
            );
        case "together":
            return await callTogether(
                provider.baseUrl,
                config.apiKey || "",
                model,
                userMessage,
            );
        case "ollama":
        case "lmstudio":
            return await callOllamaLike(provider.baseUrl, model, userMessage);
        default:
            return { success: false, error: "Unsupported provider" };
    }
}

export function useAIAnalysis() {
    return useMutation({
        mutationFn: ({
            config,
            yamlData,
        }: {
            config: AIProviderConfig;
            yamlData: TodoYAMLData;
        }) => sendToAIRequest(config, yamlData),
    });
}
