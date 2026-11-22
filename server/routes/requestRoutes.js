const express = require("express");
const {
    createRequest,
    getRequests,
    getRequestById,
    fulfilRequest,
    removeFulfillment,
    toggleSupport,
    toggleResolve,
    deleteRequest,
} = require("../controllers/requestController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.route("/").get(getRequests).post(protect, createRequest);

router.route("/:id").get(getRequestById).delete(protect, deleteRequest);

router.post("/:id/fulfil", protect, fulfilRequest);
router.delete("/:id/fulfil/:fid", protect, removeFulfillment);
router.put("/:id/support", protect, toggleSupport);
router.put("/:id/resolve", protect, toggleResolve);

module.exports = router;
