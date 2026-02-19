import CopilotCompletion from "../models/CopilotCompletion.js";

/**
 * Complete a daily protocol (Morning Focus, Power Check, or Next Day Planning)
 */
export const completeProtocol = async (req, res) => {
    try {
        const userId = req.user.id;
        const { protocol, metadata = {} } = req.body;

        if (!protocol) {
            return res.status(400).json({
                success: false,
                message: "protocol is required",
            });
        }

        // Validate protocol
        const validProtocols = [
            "morning_clarity",
            "power_check",
            "next_day_planning",
        ];
        if (!validProtocols.includes(protocol)) {
            return res.status(400).json({
                success: false,
                message: `Invalid protocol. Must be one of: ${validProtocols.join(
                    ", ",
                )}`,
            });
        }

        // Check if already completed today
        const isCompleted = await CopilotCompletion.isCompletedToday(
            userId,
            protocol,
        );
        if (isCompleted) {
            return res.status(409).json({
                success: false,
                message: "Protocol already completed today",
            });
        }

        // Create completion record
        const today = new Date().toISOString().split("T")[0];
        const completion = await CopilotCompletion.create({
            userId,
            protocol,
            date: today,
            metadata: {
                completionTime: metadata.completionTime || 0,
                deviceType: metadata.deviceType || "unknown",
            },
        });

        // Get updated streak for this protocol
        const streak = await CopilotCompletion.calculateStreak(
            userId,
            protocol,
        );

        return res.status(201).json({
            success: true,
            message: "Protocol completed successfully",
            completion,
            streak,
        });
    } catch (error) {
        console.error("Error completing protocol:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Toggle a daily protocol (mark if not exists, unmark if exists)
 */
export const toggleProtocol = async (req, res) => {
    try {
        const userId = req.user.id;
        const { protocol, metadata = {} } = req.body;

        if (!protocol) {
            return res.status(400).json({
                success: false,
                message: "protocol is required",
            });
        }

        // Validate protocol
        const validProtocols = [
            "morning_clarity",
            "power_check",
            "next_day_planning",
        ];
        if (!validProtocols.includes(protocol)) {
            return res.status(400).json({
                success: false,
                message: `Invalid protocol. Must be one of: ${validProtocols.join(
                    ", ",
                )}`,
            });
        }

        const today = new Date().toISOString().split("T")[0];

        // Check if exists
        const existing = await CopilotCompletion.findOne({
            userId,
            protocol,
            date: today,
        });

        if (existing) {
            // Unmark: Delete it
            await CopilotCompletion.deleteOne({ _id: existing._id });

            // Recalculate streak
            const streak = await CopilotCompletion.calculateStreak(
                userId,
                protocol,
            );

            return res.status(200).json({
                success: true,
                message: "Protocol unmarked",
                isChecked: false,
                streak,
            });
        } else {
            try {
                // Mark: Create it
                const completion = await CopilotCompletion.create({
                    userId,
                    protocol,
                    date: today,
                    metadata: {
                        completionTime: metadata.completionTime || 0,
                        deviceType: metadata.deviceType || "unknown",
                    },
                });

                // Recalculate streak
                const streak = await CopilotCompletion.calculateStreak(
                    userId,
                    protocol,
                );

                return res.status(201).json({
                    success: true,
                    message: "Protocol marked",
                    isChecked: true,
                    completion,
                    streak,
                });
            } catch (error) {
                if (error.code === 11000) {
                    // If it was created in the meantime, just return as if it was already checked
                    const streak = await CopilotCompletion.calculateStreak(
                        userId,
                        protocol,
                    );
                    return res.status(200).json({
                        success: true,
                        message: "Protocol marked (concurrent)",
                        isChecked: true,
                        streak,
                    });
                }
                throw error;
            }
        }
    } catch (error) {
        console.error("Error toggling protocol:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Get completion history for a user
 */
export const getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, protocol } = req.query;

        // Default to last 30 days if no dates provided
        const end = endDate || new Date().toISOString().split("T")[0];
        const start =
            startDate ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0];

        const completions = await CopilotCompletion.getCompletionsInRange(
            userId,
            start,
            end,
            protocol || null,
        );

        return res.status(200).json({
            success: true,
            completions,
            count: completions.length,
        });
    } catch (error) {
        console.error("Error fetching history:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Get metrics for a user (completion rates, perfect days, etc.)
 */
export const getMetrics = async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = "month" } = req.query; // 'week' or 'month'

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        if (period === "week") {
            startDate.setDate(endDate.getDate() - 7);
        } else {
            startDate.setDate(endDate.getDate() - 30);
        }

        const start = startDate.toISOString().split("T")[0];
        const end = endDate.toISOString().split("T")[0];

        // Get all completions in range
        const completions = await CopilotCompletion.getCompletionsInRange(
            userId,
            start,
            end,
        );

        // Calculate metrics
        const byProtocol = {
            morning_clarity: 0,
            power_check: 0,
            next_day_planning: 0,
        };

        const uniqueDates = new Set();
        const perfectDays = new Set();

        completions.forEach((completion) => {
            // Guard against unexpected protocol values from legacy/corrupt data
            if (byProtocol.hasOwnProperty(completion.protocol)) {
                byProtocol[completion.protocol]++;
            }
            uniqueDates.add(completion.date);
        });

        // Calculate perfect days (all 3 protocols completed)
        for (const date of uniqueDates) {
            const dayCompletions = completions.filter((c) => c.date === date);
            const protocols = new Set(dayCompletions.map((c) => c.protocol));
            if (protocols.size === 3) {
                perfectDays.add(date);
            }
        }

        // Calculate completion rate
        const totalDays = period === "week" ? 7 : 30;
        const daysWithActivity = uniqueDates.size;
        const completionRate = ((daysWithActivity / totalDays) * 100).toFixed(
            1,
        );

        return res.status(200).json({
            success: true,
            metrics: {
                totalCompletions: completions.length,
                byProtocol,
                completionRate: parseFloat(completionRate),
                activeDays: daysWithActivity,
                perfectDays: perfectDays.size,
                period,
                dateRange: { start, end },
            },
        });
    } catch (error) {
        console.error("Error calculating metrics:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Get streak information for a user
 */
export const getStreaks = async (req, res) => {
    try {
        const userId = req.user.id;

        // Calculate overall streak (any protocol)
        const overallStreak = await CopilotCompletion.calculateStreak(userId);

        // Calculate streaks by protocol
        const morningClarityStreak = await CopilotCompletion.calculateStreak(
            userId,
            "morning_clarity",
        );
        const powerCheckStreak = await CopilotCompletion.calculateStreak(
            userId,
            "power_check",
        );
        const nextDayPlanningStreak = await CopilotCompletion.calculateStreak(
            userId,
            "next_day_planning",
        );

        return res.status(200).json({
            success: true,
            streaks: {
                current: overallStreak.current,
                longest: overallStreak.longest,
                byProtocol: {
                    morning_clarity: morningClarityStreak,
                    power_check: powerCheckStreak,
                    next_day_planning: nextDayPlanningStreak,
                },
            },
        });
    } catch (error) {
        console.error("Error calculating streaks:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Get today's completions for a user
 */
export const getTodayCompletions = async (req, res) => {
    try {
        const userId = req.user.id;

        const today = new Date().toISOString().split("T")[0];
        const completions = await CopilotCompletion.find({
            userId,
            date: today,
        });

        const completed = {
            morning_clarity: false,
            power_check: false,
            next_day_planning: false,
        };

        completions.forEach((c) => {
            completed[c.protocol] = true;
        });

        return res.status(200).json({
            success: true,
            today: today,
            completed,
            completions,
        });
    } catch (error) {
        console.error("Error fetching today completions:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Get heatmap data for calendar visualization
 */
export const getHeatmapData = async (req, res) => {
    try {
        const userId = req.user.id;
        const { months = 1 } = req.query; // Number of months to fetch
        const parsedMonths = Math.max(1, Math.min(12, parseInt(months) || 1)); // Clamp 1-12

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - parsedMonths);

        const start = startDate.toISOString().split("T")[0];
        const end = endDate.toISOString().split("T")[0];

        // Get all completions
        const completions = await CopilotCompletion.getCompletionsInRange(
            userId,
            start,
            end,
        );

        // Group by date
        const heatmapData = {};
        completions.forEach((completion) => {
            if (!heatmapData[completion.date]) {
                heatmapData[completion.date] = {
                    date: completion.date,
                    count: 0,
                    protocols: [],
                };
            }
            heatmapData[completion.date].count++;
            heatmapData[completion.date].protocols.push(completion.protocol);
        });

        // Convert to array and sort by date
        const heatmapArray = Object.values(heatmapData).sort(
            (a, b) => new Date(a.date) - new Date(b.date),
        );

        return res.status(200).json({
            success: true,
            heatmap: heatmapArray,
            dateRange: { start, end },
        });
    } catch (error) {
        console.error("Error fetching heatmap data:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

const copilotController = {
    completeProtocol,
    toggleProtocol,
    getHistory,
    getMetrics,
    getStreaks,
    getTodayCompletions,
    getHeatmapData,
};

export default copilotController;
