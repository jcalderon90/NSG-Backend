import mongoose from "mongoose";

const fathom_schema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // Un registro por usuario, que se irá actualizando
        },
        string_user_id: {
            type: String,
            required: true,
        },
        meetings: {
            type: Array,
            required: true,
            default: [],
        },
    },
    {
        timestamps: true,
        collection: "fathom_data", // Especificamos el nombre exacto de la colección
    }
);

export default mongoose.model("FathomData", fathom_schema);
