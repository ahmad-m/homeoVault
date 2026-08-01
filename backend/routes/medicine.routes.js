import { Router } from 'express';
import { 
  listMedicines, 
  searchMedicines, 
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getCategories, 
  getPotencies, 
  getManufacturers, 
  importMedicines,
  quickAddMedicine
} from '../controllers/medicine.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { queryParser } from '../middleware/queryParser.middleware.js';

const router = Router();

// Apply global authentication block to all endpoints in this router
router.use(authenticate);

// GET /api/medicines - Listing catalog
router.get('/medicines', queryParser, listMedicines);

// GET /api/medicines/search - Advanced searches
router.get('/medicines/search', searchMedicines);

// GET /api/medicines/:id - Details page
router.get('/medicines/:id', getMedicineById);

// PUT /api/medicines/:id - Edit medicine
router.put('/medicines/:id', updateMedicine);

// DELETE /api/medicines/:id - Soft-delete medicine
router.delete('/medicines/:id', deleteMedicine);

// GET /api/categories - Listing filters
router.get('/categories', getCategories);

// GET /api/potencies - Listing filters
router.get('/potencies', getPotencies);

// GET /api/manufacturers - Listing filters
router.get('/manufacturers', getManufacturers);

// POST /api/import/medicines - Admin bulk catalog import
router.post('/import/medicines', authorize('Administrator'), importMedicines);

// POST /api/medicines/quick-add - Quick-add medicine from Stock In page
router.post('/medicines/quick-add', quickAddMedicine);

export default router;
