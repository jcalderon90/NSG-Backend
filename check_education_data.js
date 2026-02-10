import mongoose from "mongoose";
import "dotenv/config";

const EducationContentSchema = new mongoose.Schema(
    {},
    { strict: false, collection: "education_content" },
);
const EducationGeneratedContentSchema = new mongoose.Schema(
    {},
    { strict: false, collection: "education_content_generated" },
);

const EducationContent = mongoose.model(
    "EducationContentTemp",
    EducationContentSchema,
);
const EducationGeneratedContent = mongoose.model(
    "EducationGeneratedContentTemp",
    EducationGeneratedContentSchema,
);

async function checkData() {
    try {
        const uri =
            process.env.MONGODB_URI ||
            "mongodb+srv://iagentsnsg_db_user:Nc0lLH0zK6LEFJQP@cluster0.pgbmwuy.mongodb.net/Database?appName=Cluster0";
        await mongoose.connect(uri);
        console.log("✅ Conectado a MongoDB");

        console.log("\n--- Buscando recursos en education_content ---");
        const contents = await EducationContent.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();

        if (contents.length === 0) {
            console.log("❌ No se encontraron registros en education_content");
        } else {
            for (const content of contents) {
                console.log(`\nID Recurso: ${content._id}`);
                console.log(`Título: ${content.data?.title || "Sin título"}`);
                console.log(
                    `Completado: ${content.question_process?.completed}`,
                );

                // Buscar en la tabla de generados
                const generated = await EducationGeneratedContent.findOne({
                    resource_id: content._id.toString(),
                }).lean();
                if (generated) {
                    console.log(
                        `✅ Registro generado ENCONTRADO para este recurso`,
                    );
                    console.log(
                        `Título Generado: ${generated.question_process_generated?.title}`,
                    );
                    console.log(
                        `Insights: ${generated.question_process_generated?.key_insights?.length || 0}`,
                    );
                } else {
                    console.log(
                        `❌ No hay registro en education_content_generated para este ID`,
                    );
                }
            }
        }

        // Búsqueda directa en generados
        console.log(
            "\n--- Ultimos registros en education_content_generated ---",
        );
        const allGenerated = await EducationGeneratedContent.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
        allGenerated.forEach((g) => {
            console.log(
                `ID Generado: ${g._id} | resource_id: ${g.resource_id} | Título: ${g.question_process_generated?.title}`,
            );
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkData();
