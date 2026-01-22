import { Router } from 'express';

//controllers
import { create_user, update_user, get_user, get_all_users, delete_user } from "../controllers/user.controller.js";

//middlewares
import { auth_required, admin_required } from '../middlewares/validate_token.js';
import { validate_schema } from "../middlewares/validator_schema.middleware.js";

//schemas
import { user_schema } from "../schemas/user.schema.js";


const user_router = Router();



user_router.post('/create', auth_required, admin_required, validate_schema(user_schema), create_user);

user_router.patch('/update/:id', auth_required, admin_required, validate_schema(user_schema), update_user);

user_router.get('/get/:id', auth_required, admin_required, get_user);

user_router.get('/get_all', auth_required, admin_required, get_all_users);

user_router.delete('/delete/:id', auth_required, admin_required, delete_user);



export default user_router;