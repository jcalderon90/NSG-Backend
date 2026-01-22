import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

//GENERANDO TOKEN de manera asincrona

export function CREATE__ACCCESS__TOKEN(payload) {

    return new Promise((resolve, reject) => {

        jwt.sign(
            payload,
            TOKEN_SECRET,
            {
                expiresIn: "1d"
            },
            (err, token) => {

                if (err) return reject(err);
                resolve(token);

            }
        );

    });

}

