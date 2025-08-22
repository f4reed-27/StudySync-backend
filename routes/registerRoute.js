import express from 'express';
import { registerUser, login } from './../Controllers/RegisterController.js';

const router = express.Router();

router.post('/Register', registerUser);
router.post('/login', login);

export default router;
