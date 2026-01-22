import nodemailer from 'nodemailer';

// Configuración del transportador de email (hardcoded para servidor de pruebas)
const createTransporter = () => {
    return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: 'iagents.nsg@gmail.com',
            pass: 'btdo rvfs yxfn izef', // App Password de Gmail
        },
    });
};

/**
 * Envía un email con el código de recuperación de contraseña
 * @param {string} to - Email del destinatario
 * @param {string} username - Nombre del usuario
 * @param {string} resetCode - Código de recuperación de 6 dígitos
 */
export const sendPasswordResetEmail = async (to, username, resetCode) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: '"NSG Platform" <iagents.nsg@gmail.com>',
            to: to,
            subject: '🔐 Código de Recuperación de Contraseña - NSG',
            html: `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            background-color: #f8fafc;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 40px auto;
                            background-color: #ffffff;
                            border-radius: 16px;
                            overflow: hidden;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .header h1 {
                            color: #ffffff;
                            margin: 0;
                            font-size: 28px;
                            font-weight: 700;
                        }
                        .content {
                            padding: 40px 30px;
                        }
                        .greeting {
                            font-size: 18px;
                            color: #1e293b;
                            margin-bottom: 20px;
                        }
                        .message {
                            font-size: 15px;
                            color: #475569;
                            line-height: 1.6;
                            margin-bottom: 30px;
                        }
                        .code-container {
                            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                            border-radius: 12px;
                            padding: 30px;
                            text-align: center;
                            margin: 30px 0;
                        }
                        .code-label {
                            color: rgba(255, 255, 255, 0.9);
                            font-size: 12px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            margin-bottom: 10px;
                        }
                        .code {
                            font-size: 42px;
                            font-weight: 900;
                            color: #ffffff;
                            letter-spacing: 8px;
                            font-family: 'Courier New', monospace;
                        }
                        .expiry {
                            background-color: #fef3c7;
                            border-left: 4px solid #f59e0b;
                            padding: 15px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }
                        .expiry p {
                            margin: 0;
                            color: #92400e;
                            font-size: 14px;
                            font-weight: 600;
                        }
                        .security-notice {
                            background-color: #f1f5f9;
                            border-radius: 8px;
                            padding: 20px;
                            margin-top: 30px;
                        }
                        .security-notice h3 {
                            color: #1e293b;
                            font-size: 14px;
                            margin: 0 0 10px 0;
                            font-weight: 700;
                        }
                        .security-notice p {
                            color: #64748b;
                            font-size: 13px;
                            margin: 5px 0;
                            line-height: 1.5;
                        }
                        .footer {
                            background-color: #f8fafc;
                            padding: 30px;
                            text-align: center;
                            border-top: 1px solid #e2e8f0;
                        }
                        .footer p {
                            color: #94a3b8;
                            font-size: 13px;
                            margin: 5px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 NSG Platform</h1>
                        </div>
                        <div class="content">
                            <p class="greeting">Hola <strong>${username}</strong>,</p>
                            <p class="message">
                                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta NSG Platform. 
                                Utiliza el siguiente código de verificación para continuar con el proceso:
                            </p>
                            
                            <div class="code-container">
                                <div class="code-label">Código de Verificación</div>
                                <div class="code">${resetCode}</div>
                            </div>

                            <div class="expiry">
                                <p>⏰ Este código expirará en <strong>15 minutos</strong></p>
                            </div>

                            <div class="security-notice">
                                <h3>🛡️ Aviso de Seguridad</h3>
                                <p>• Si no solicitaste este cambio, ignora este correo y tu contraseña permanecerá sin cambios.</p>
                                <p>• Nunca compartas este código con nadie, ni siquiera con el equipo de NSG.</p>
                                <p>• Si tienes dudas sobre la seguridad de tu cuenta, contáctanos de inmediato.</p>
                            </div>
                        </div>
                        <div class="footer">
                            <p><strong>NSG Platform</strong> - Neural Strategic Gateway</p>
                            <p>Sistema de Inteligencia Estratégica Avanzada</p>
                            <p style="margin-top: 20px; color: #cbd5e1; font-size: 11px;">
                                Este es un correo automático, por favor no respondas a este mensaje.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Hola ${username},

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta NSG Platform.

Código de Verificación: ${resetCode}

Este código expirará en 15 minutos.

AVISO DE SEGURIDAD:
- Si no solicitaste este cambio, ignora este correo.
- Nunca compartas este código con nadie.

NSG Platform - Neural Strategic Gateway
            `.trim(),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL-SERVICE] Email enviado exitosamente a ${to}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EMAIL-SERVICE] Error al enviar email:', error);
        throw error;
    }
};

export default {
    sendPasswordResetEmail,
};
