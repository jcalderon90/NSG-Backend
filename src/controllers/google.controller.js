import User from "../models/user.model.js";
import axios from "axios";
import "dotenv/config";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

if (!GOOGLE_REDIRECT_URI) {
    throw new Error(
        "GOOGLE_REDIRECT_URI is not defined in environment variables",
    );
}

// 1. Generar URL de autenticación
export const getGoogleAuthUrl = (req, res) => {
    const scopes = [
        "https://www.googleapis.com/auth/calendar", // Full read/write access to calendars
        "https://www.googleapis.com/auth/calendar.events", // Specific scope for calendar events
        "https://www.googleapis.com/auth/userinfo.email",
    ];

    // Usamos el userId en el state para recuperarlo en el callback
    const state = req.user.id;

    const url =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes.join(" "))}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${state}`;

    res.json({ url });
};

// 2. Manejar el callback de Google
export const googleCallback = async (req, res) => {
    const { code, state } = req.query; // state contiene el userId

    if (!code) {
        return res.status(400).send("No se recibió el código de autorización");
    }

    try {
        // Intercambiar código por tokens
        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            {
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: GOOGLE_REDIRECT_URI,
                grant_type: "authorization_code",
            },
        );

        const tokens = tokenResponse.data;

        // Guardar tokens en el usuario
        await User.findByIdAndUpdate(state, {
            google_calendar_tokens: tokens,
        });

        // Redirigir de vuelta al frontend (URL de producción o localhost según env)
        let frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl) {
            throw new Error(
                "FRONTEND_URL is not defined in environment variables",
            );
        }
        // Eliminar slash final si existe para evitar dobles slashes
        if (frontendUrl.endsWith("/")) {
            frontendUrl = frontendUrl.slice(0, -1);
        }
        res.redirect(`${frontendUrl}/dashboard/agenda_maestra?connected=true`);
    } catch (error) {
        res.status(500).send("Error al autenticar con Google");
    }
};

// 3. Obtener eventos del calendario
export const getCalendarEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select(
            "google_calendar_tokens",
        );

        if (!user || !user.google_calendar_tokens) {
            return res
                .status(404)
                .json({ message: "Google Calendar no conectado" });
        }

        let tokens = user.google_calendar_tokens;

        // Función para refrescar el token si es necesario
        const refreshAccessToken = async () => {
            try {
                const refreshResponse = await axios.post(
                    "https://oauth2.googleapis.com/token",
                    {
                        client_id: GOOGLE_CLIENT_ID,
                        client_secret: GOOGLE_CLIENT_SECRET,
                        refresh_token: tokens.refresh_token,
                        grant_type: "refresh_token",
                    },
                );

                const newTokens = { ...tokens, ...refreshResponse.data };
                await User.findByIdAndUpdate(userId, {
                    google_calendar_tokens: newTokens,
                });
                return newTokens.access_token;
            } catch (err) {
                // Si el refresh token también es inválido o fue revocado
                if (err.response?.data?.error === "invalid_grant") {
                    console.log(
                        `[Google] Refresh token invalid for user ${userId}. Clearing tokens.`,
                    );
                    await User.findByIdAndUpdate(userId, {
                        google_calendar_tokens: null,
                    });
                }
                throw err;
            }
        };

        let accessToken = tokens.access_token;
        const now = new Date().toISOString();

        // Intentar obtener eventos
        try {
            const calendarResponse = await axios.get(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&maxResults=20&singleEvents=true&orderBy=startTime`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                },
            );

            res.json(calendarResponse.data.items);
        } catch (err) {
            if (err.response?.status === 401 && tokens.refresh_token) {
                // Token expirado, intentar refrescar
                try {
                    accessToken = await refreshAccessToken();
                    const calendarResponseUpdate = await axios.get(
                        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&maxResults=20&singleEvents=true&orderBy=startTime`,
                        {
                            headers: { Authorization: `Bearer ${accessToken}` },
                        },
                    );
                    res.json(calendarResponseUpdate.data.items);
                } catch (refreshErr) {
                    // Si falla el refresco (por ejemplo, invalid_grant)
                    if (refreshErr.response?.data?.error === "invalid_grant") {
                        return res.status(401).json({
                            message:
                                "Conexión con Google Calendar expirada o revocada. Por favor, vuelve a conectar.",
                            error: "invalid_grant",
                        });
                    }
                    throw refreshErr;
                }
            } else {
                throw err;
            }
        }
    } catch (error) {
        console.error("Error en getCalendarEvents:", error.message);
        if (error.response?.data) {
            console.error(
                "Error details:",
                JSON.stringify(error.response.data, null, 2),
            );
        }

        const statusCode = error.response?.status === 401 ? 401 : 500;
        res.status(statusCode).json({
            message: "Error al obtener eventos de Google Calendar",
            error: error.message,
            details: error.response?.data || null,
        });
    }
};

// 4. Desconectar Google Calendar
export const disconnectGoogle = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            google_calendar_tokens: null,
        });
        res.json({ success: true, message: "Google Calendar desconectado" });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al desconectar",
        });
    }
};
