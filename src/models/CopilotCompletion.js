import mongoose from "mongoose";

const copilotCompletionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        protocol: {
            type: String,
            required: true,
            enum: ["morning_clarity", "power_check", "next_day_planning"],
            index: true,
        },
        completedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        date: {
            type: String,
            required: true,
            index: true,
            // Format: 'YYYY-MM-DD' for easy querying
        },
        metadata: {
            completionTime: {
                type: Number,
                default: 0,
                // Time in milliseconds that took to complete
            },
            deviceType: {
                type: String,
                enum: ["mobile", "desktop", "unknown"],
                default: "unknown",
            },
        },
    },
    {
        timestamps: true,
    },
);

// Compound index for efficient queries
copilotCompletionSchema.index(
    { userId: 1, date: 1, protocol: 1 },
    { unique: true },
);
copilotCompletionSchema.index({ userId: 1, completedAt: -1 });

// Static method to check if protocol was completed today
copilotCompletionSchema.statics.isCompletedToday = async function (
    userId,
    protocol,
) {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const completion = await this.findOne({ userId, protocol, date: today });
    return !!completion;
};

// Static method to get completions for a date range
copilotCompletionSchema.statics.getCompletionsInRange = async function (
    userId,
    startDate,
    endDate,
    protocol = null,
) {
    const query = {
        userId,
        date: {
            $gte: startDate,
            $lte: endDate,
        },
    };

    if (protocol) {
        query.protocol = protocol;
    }

    return await this.find(query).sort({ completedAt: -1 });
};

// Static method to calculate current streak
// Optimized: single aggregation query instead of N+1 per-day queries
copilotCompletionSchema.statics.calculateStreak = async function (
    userId,
    protocol = null,
) {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Calculate the date 365 days ago as a safety limit
    const yearAgo = new Date(today);
    yearAgo.setDate(yearAgo.getDate() - 365);
    const yearAgoStr = yearAgo.toISOString().split("T")[0];

    // Build the match stage based on whether we're checking a specific protocol or all
    const matchStage = {
        userId,
        date: { $gte: yearAgoStr, $lte: todayStr },
    };
    if (protocol) {
        matchStage.protocol = protocol;
    }

    // Single aggregation: group by date and count distinct protocols per day
    const dailyCounts = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: "$date",
                protocolCount: { $addToSet: "$protocol" },
            },
        },
        {
            $project: {
                date: "$_id",
                count: { $size: "$protocolCount" },
                _id: 0,
            },
        },
        { $sort: { date: -1 } },
    ]);

    // Build a Set of "qualifying" dates for O(1) lookup
    // For a specific protocol: any day with that protocol counts
    // For overall: only days with all 3 protocols count
    const qualifyingDates = new Set();
    for (const day of dailyCounts) {
        if (protocol) {
            // If filtering by protocol, any match counts (count >= 1)
            qualifyingDates.add(day.date);
        } else {
            // Overall streak: require all 3 protocols
            if (day.count >= 3) {
                qualifyingDates.add(day.date);
            }
        }
    }

    // Calculate current streak walking backwards from today
    let currentStreak = 0;
    let checkDate = new Date(today);

    // If today doesn't qualify, start checking from yesterday
    if (!qualifyingDates.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
        const dateStr = checkDate.toISOString().split("T")[0];

        if (dateStr < yearAgoStr) break; // Safety limit

        if (qualifyingDates.has(dateStr)) {
            currentStreak++;
        } else {
            break; // Gap found, streak ends
        }

        checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate longest streak from all qualifying dates (sorted descending)
    const sortedDates = Array.from(qualifyingDates).sort();
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
            tempStreak = 1;
        } else {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const diffDays = Math.round(
                (currDate - prevDate) / (1000 * 60 * 60 * 24),
            );

            if (diffDays === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {
        current: currentStreak,
        longest: longestStreak,
    };
};

const CopilotCompletion = mongoose.model(
    "CopilotCompletion",
    copilotCompletionSchema,
);

export default CopilotCompletion;
