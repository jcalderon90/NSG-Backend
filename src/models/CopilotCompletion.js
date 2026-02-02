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
copilotCompletionSchema.statics.calculateStreak = async function (
    userId,
    protocol = null,
) {
    const today = new Date();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let checkDate = new Date(today);

    // Check backwards from today
    while (true) {
        const dateStr = checkDate.toISOString().split("T")[0];
        const query = { userId, date: dateStr };

        if (protocol) {
            query.protocol = protocol;
            const completion = await this.findOne(query);
            if (completion) {
                tempStreak++;
                if (
                    checkDate.toDateString() === today.toDateString() ||
                    (today - checkDate) / (1000 * 60 * 60 * 24) <
                        currentStreak + 1
                ) {
                    currentStreak = tempStreak;
                }
            } else {
                // Gap found
                if (tempStreak > 0 && currentStreak === 0) break;
                if (
                    tempStreak === 0 &&
                    checkDate.toDateString() !== today.toDateString()
                )
                    break;
                if (tempStreak > 0) {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 0;
                }
            }
        } else {
            // Overall streak: require ALL 3 protocols
            const completionCount = await this.countDocuments(query);
            if (completionCount === 3) {
                tempStreak++;
                if (
                    checkDate.toDateString() === today.toDateString() ||
                    (today - checkDate) / (1000 * 60 * 60 * 24) <
                        currentStreak + 1
                ) {
                    currentStreak = tempStreak;
                }
            } else {
                // Gap found (not all protocols completed)
                if (tempStreak > 0 && currentStreak === 0) break;
                if (
                    tempStreak === 0 &&
                    checkDate.toDateString() !== today.toDateString()
                )
                    break;
                if (tempStreak > 0) {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 0;
                }
            }
        }

        // Move to previous day
        checkDate.setDate(checkDate.getDate() - 1);

        // Safety: don't check more than 1 year back
        if ((today - checkDate) / (1000 * 60 * 60 * 24) > 365) {
            break;
        }
    }

    longestStreak = Math.max(longestStreak, currentStreak);

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
