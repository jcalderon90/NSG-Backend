import mongoose from "mongoose";

const strategy_schema = new mongoose.Schema(
    {
        user_id: {
            type: String, // Cambiado a String para compatibilidad con registros guardados como texto
            required: true
        },
        telegram_id: {
            type: Number
        },
        meta_detectada: {
            type: String
        },
        accion_1: {
            type: String
        },
        accion_2: {
            type: String
        },
        accion_3: {
            type: String
        }
    },
    {
        timestamps: true,
        collection: 'user_strategies'
    }
);

export default mongoose.model("Strategy", strategy_schema);
