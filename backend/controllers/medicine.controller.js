import medicineService from '../services/medicine.service.js';
import searchService from '../services/search.service.js';
import importService from '../services/import.service.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../utils/errorFormatter.js';

/**
 * Lists medicines using parsed pagination, sorting, and filters.
 * GET /api/medicines
 */
export const listMedicines = asyncHandler(async (req, res) => {
  const { filters, sort, pagination } = req.queryOptions;

  const result = await searchService.searchMedicines({
    filters,
    sort,
    page: pagination.page,
    limit: pagination.limit
  });

  return sendSuccess(res, result, 'Medicines retrieved successfully.');
});

/**
 * Searches medicines master catalog (supports autocomplete and filters).
 * GET /api/medicines/search
 */
export const searchMedicines = asyncHandler(async (req, res) => {
  const { q, category_id, manufacturer_id, form_id, potency_id, page, limit, sort, autocomplete } = req.query;

  // If autocomplete is true, run fast starting-char search
  if (autocomplete === 'true') {
    const suggestions = await searchService.autocomplete(q);
    return sendSuccess(res, suggestions, 'Autocomplete suggestions retrieved.');
  }

  const result = await searchService.searchMedicines({
    query: q,
    category_id,
    manufacturer_id,
    form_id,
    potency_id,
    page,
    limit,
    sort
  });

  // Attach search metadata
  const responseData = {
    ...result,
    recentSearches: searchService.getRecentSearches(),
    popular: await searchService.getPopularMedicines()
  };

  return sendSuccess(res, responseData, 'Search results compiled.');
});

/**
 * Fetches a single medicine details by ID.
 * GET /api/medicines/:id
 */
export const getMedicineById = asyncHandler(async (req, res) => {
  const medicineId = req.params.id;
  const userId = req.user ? req.user.id : null;
  
  const medicine = await medicineService.getMedicineById(medicineId, userId);
  return sendSuccess(res, medicine, 'Medicine details retrieved.');
});

/**
 * Updates a medicine record.
 * PUT /api/medicines/:id
 */
export const updateMedicine = asyncHandler(async (req, res) => {
  const medicineId = req.params.id;
  const userId = req.user?.id;
  const medicine = await medicineService.updateMedicine(medicineId, req.body, userId);
  return sendSuccess(res, medicine, 'Medicine updated successfully.');
});

/**
 * Soft-deletes a medicine record.
 * DELETE /api/medicines/:id
 */
export const deleteMedicine = asyncHandler(async (req, res) => {
  const medicineId = req.params.id;
  const userId = req.user?.id;
  await medicineService.deleteMedicine(medicineId, userId);
  return sendSuccess(res, null, 'Medicine removed from catalog.');
});

/**
 * GET /api/categories
 */
export const getCategories = asyncHandler(async (req, res) => {
  const list = await medicineService.getCategories();
  return sendSuccess(res, list, 'Categories list retrieved.');
});

/**
 * GET /api/potencies
 */
export const getPotencies = asyncHandler(async (req, res) => {
  const list = await medicineService.getPotencies();
  return sendSuccess(res, list, 'Potencies list retrieved.');
});

/**
 * GET /api/manufacturers
 */
export const getManufacturers = asyncHandler(async (req, res) => {
  const list = await medicineService.getManufacturers();
  return sendSuccess(res, list, 'Manufacturers list retrieved.');
});

/**
 * Quick-adds a medicine with potency mappings from the Stock In page.
 * POST /api/medicines/quick-add
 */
export const quickAddMedicine = asyncHandler(async (req, res) => {
  const { name, category_id, potency_ids } = req.body;
  const userId = req.user?.id;

  const medicine = await medicineService.quickAddMedicine({ name, category_id, potency_ids }, userId);
  return sendSuccess(res, medicine, `Medicine [${medicine.name}] added to catalog successfully.`);
});

/**
 * Imports homeopathic medicines bulk.
 * POST /api/import/medicines
 */
export const importMedicines = asyncHandler(async (req, res) => {
  const { fileContent, fileType } = req.body;
  const userId = req.user.id;

  if (!fileContent || !fileType) {
    throw new AppError('fileContent and fileType (csv|json) parameters are required in request body.', 400);
  }

  if (!['csv', 'json'].includes(fileType)) {
    throw new AppError('fileType must be either csv or json.', 400);
  }

  const result = await importService.importMedicines(fileContent, fileType, userId);
  
  if (!result.success) {
    return res.status(422).json({
      success: false,
      message: 'Bulk import validation failed. All transactions rolled back.',
      data: result.summary
    });
  }

  return sendSuccess(res, result.summary, 'Bulk import completed successfully.');
});
