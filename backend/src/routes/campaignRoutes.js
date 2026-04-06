const express = require("express");
const validate = require("../middleware/validationMiddleware");
const catchAsync = require("../middleware/catchAsync");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  campaignValidation,
  campaignIdValidation,
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  campaignStats,
} = require("../controllers/campaignController");

const router = express.Router();

// router.get("/", catchAsync(getCampaigns));
router.get("/", (req, res) => {
  res.json([{ title: "Working ✅" }]);
});
router.get("/admin/stats/summary", protect, authorize("admin"), catchAsync(campaignStats));
router.get("/:id", campaignIdValidation, validate, catchAsync(getCampaignById));

router.post(
  "/",
  protect,
  authorize("admin"),
  campaignValidation,
  validate,
  catchAsync(createCampaign)
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  campaignIdValidation,
  campaignValidation,
  validate,
  catchAsync(updateCampaign)
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  campaignIdValidation,
  validate,
  catchAsync(deleteCampaign)
);

module.exports = router;
