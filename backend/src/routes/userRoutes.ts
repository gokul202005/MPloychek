import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();
const userController = new UserController();

router.use(authenticateToken);

router.get('/', requireAdmin, userController.getUsers);
router.post('/', requireAdmin, userController.createUser);
router.get('/:id', userController.getUserById);
router.patch('/:id', userController.updateUser);
router.patch('/:id/status', requireAdmin, userController.updateUserStatus);
router.delete('/:id', requireAdmin, userController.deleteUser);

export default router;
