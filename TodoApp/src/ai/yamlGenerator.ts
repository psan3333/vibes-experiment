import { Todo } from "../db/schema";
import { TimePeriod, TIME_PERIODS } from "./providers";

export interface TodoYAMLData {
    period: {
        type: TimePeriod;
        label: string;
        startDate: string;
        endDate: string;
    };
    summary: {
        totalTasks: number;
        completedTasks: number;
        pendingTasks: number;
        completionRate: number;
        avgCompletionTime: number | null;
    };
    tasks: TodoYAMLTask[];
}

export interface TodoYAMLTask {
    title: string;
    description: string | null;
    metric: string | null;
    isCompleted: boolean;
    createdAt: string;
    completedAt: string | null;
}

function escapeYAMLString(str: string): string {
    if (/[\n\r\t\\"]|^[&*!|>'"%@]/.test(str) || str.trim() !== str) {
        return '"' + str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t') + '"';
    }
    return '"' + str.replace(/"/g, '\\"') + '"';
}

function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

function calculateAvgCompletionTime(todos: Todo[]): number | null {
    const completedWithDates = todos.filter(
        (t) => t.isCompleted && t.completedAt && t.createdAt,
    );

    if (completedWithDates.length === 0) return null;

    const totalMs = completedWithDates.reduce((acc, todo) => {
        const created = new Date(todo.createdAt).getTime();
        const completed = new Date(todo.completedAt!).getTime();
        return acc + (completed - created);
    }, 0);

    return (
        Math.round(
            (totalMs / completedWithDates.length / (1000 * 60 * 60 * 24)) * 10,
        ) / 10
    );
}

export function generateYAMLData(
    todos: Todo[],
    period: TimePeriod,
): TodoYAMLData {
    const periodInfo = TIME_PERIODS.find((p) => p.value === period);
    const now = new Date();
    let startDate: Date;

    if (period === "all" || !periodInfo || periodInfo.days === 0) {
        startDate = new Date(0);
    } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - periodInfo.days);
    }

    const filteredTodos = todos.filter((todo) => {
        const createdAt = new Date(todo.createdAt);
        return createdAt >= startDate;
    });

    const completedTasks = filteredTodos.filter((t) => t.isCompleted);
    const pendingTasks = filteredTodos.filter((t) => !t.isCompleted);

    const yamlTasks: TodoYAMLTask[] = filteredTodos.map((todo) => ({
        title: todo.title,
        description: todo.description,
        metric: todo.metric,
        isCompleted: todo.isCompleted ?? false,
        createdAt: formatDate(new Date(todo.createdAt)),
        completedAt: todo.completedAt
            ? formatDate(new Date(todo.completedAt))
            : null,
    }));

    return {
        period: {
            type: period,
            label: periodInfo?.label || "All time",
            startDate: formatDate(startDate),
            endDate: formatDate(now),
        },
        summary: {
            totalTasks: filteredTodos.length,
            completedTasks: completedTasks.length,
            pendingTasks: pendingTasks.length,
            completionRate:
                filteredTodos.length > 0
                    ? Math.round(
                          (completedTasks.length / filteredTodos.length) * 100,
                      )
                    : 0,
            avgCompletionTime: calculateAvgCompletionTime(filteredTodos),
        },
        tasks: yamlTasks,
    };
}

export function convertToYAML(data: TodoYAMLData): string {
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
        yaml += `  - title: ${escapeYAMLString(task.title)}\n`;
        if (task.description) {
            yaml += `    description: ${escapeYAMLString(task.description)}\n`;
        } else {
            yaml += `    description: null\n`;
        }
        if (task.metric) {
            yaml += `    metric: ${escapeYAMLString(task.metric)}\n`;
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
