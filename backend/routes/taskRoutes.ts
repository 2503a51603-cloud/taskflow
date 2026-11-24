import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getTaskById,
  getTaskStats,
  getTasks,
  seedSampleTasks,
  syncJsonTasks,
  updateTask,
} from '../controllers/taskController.ts';
import { requireDB } from '../middleware/requireDB.ts';
import {
  validateCreateTask,
  validateObjectId,
  validateUpdateTask,
} from '../middleware/validateTask.ts';

const router = Router();

router.use(requireDB);

router.get('/stats', getTaskStats);
router.post('/seed', seedSampleTasks);
router.post('/sync-json', syncJsonTasks);
router.get('/', getTasks);
router.get('/:id', validateObjectId, getTaskById);
router.post('/', validateCreateTask, createTask);
router.put('/:id', validateObjectId, validateUpdateTask, updateTask);
router.patch('/:id', validateObjectId, validateUpdateTask, updateTask);
router.delete('/:id', validateObjectId, deleteTask);

export default router;
