


export const validate_schema = (schema) => (req, res, next) => {

    try {

        schema.parse(req.body);
        next();

    }
    catch (error) {

        return res.status(400).json({
            message: error.errors[0].message,
            errors: error.errors.map(err => err.message)
        });

    }

};