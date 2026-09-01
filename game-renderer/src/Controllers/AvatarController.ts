//added by devponte

import express from "ultimate-express";
import Config from "../Utilities/Libraries/Config.js";
import {Console} from "../Utilities/Libraries/CS.js";

const router = express.Router();

// Avatar data endpoint - returns character appearance data that RCC can parse
// This is called by RCC when loading a player's character for rendering
router.get("/avatar-fetch", async (req, res) => {
    try {
        const userId = req.query.userId ? parseInt(req.query.userId as string) : 1;
        const placeId = req.query.placeId ? parseInt(req.query.placeId as string) : 0;
        
        Console.Debug(`Avatar fetch requested for UserId: ${userId}, PlaceId: ${placeId}`);
        
        // Return proper avatar data structure that RCC's LoadCharacterBlocking expects
        // This matches the Roblox CharacterAppearance API format
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
            scales: {
                height: 1,
                width: 1,
                head: 1,
                torso: 1,
                leftArm: 1,
                rightArm: 1,
                leftLeg: 1,
                rightLeg: 1
            },
            assets: [],
            emotes: []
        };
        
        Console.Debug(`Returning avatar data for UserId ${userId}`);
        
        // Set proper content type for JSON response
        res.setHeader('Content-Type', 'application/json');
        return res.json(avatarData);
    } catch (error: any) {
        Console.Error(`Avatar fetch error: ${error.message}`);
        return res.status(500).json({ success: false, error: error.message });
    }
});

export default router;