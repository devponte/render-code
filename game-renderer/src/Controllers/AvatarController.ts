//added by devponte

import express from "ultimate-express";

const router = express.Router();

// Mock avatar data endpoint
router.get("/avatar-fetch", async (req, res) => {
    const userId = req.query.userId || 1;
    
    const avatarData = {
        solve: true,
        playerAvatarType: "R6",
        bodyColors: {
            headColorId: 24,
            torsoColorId: 23,
            leftArmColorId: 23,
            rightArmColorId: 23,
            leftLegColorId: 24,
            rightLegColorId: 24
        },
        assets: []
    };
    
    return res.json(avatarData);
});

export default router;