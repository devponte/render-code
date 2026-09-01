//modifed by devponte

import express from "ultimate-express";
import Config from "../Utilities/Libraries/Config.js";
import Valid from "../Utilities/Middleware/ValidateDto.js";
import {PlayerRenderRequest} from "../Utilities/Dto/Catalog.js";
import {Console} from "../Utilities/Libraries/CS.js";
import {QueueBox} from "../Utilities/Libraries/Queue.js";
import {RequestRCCBase, RequestRCCBaseXMLData} from "./BaseController.js";

const router = express.Router();
const box = new QueueBox<express.Response>(`PlayerBox`, Config.Ports.RCC.Player);

// Lua script for Avatar_R15_Action thumbnail rendering
const generateAvatarScript = (baseUrl: string, charAppearanceUrl: string, fileExtension: string, x: number, y: number): string => {
    return `
-- Avatar_R15_Action v1.1.0
baseUrl, characterAppearanceUrl, fileExtension, x, y = "${baseUrl}", "${charAppearanceUrl}", "${fileExtension}", ${x}, ${y}

pcall(function() game:GetService("ContentProvider"):SetBaseUrl(baseUrl) end)
game:GetService("ScriptContext").ScriptsDisabled = true

local player = game:GetService("Players"):CreateLocalPlayer(0)
player.CharacterAppearance = characterAppearanceUrl
player:LoadCharacterBlocking()

local poseAnimationId = "http://www.roblox.com/asset/?id=532421348"

local function getJointBetween(part0, part1)
    for _, obj in pairs(part1:GetChildren()) do
        if obj:IsA("Motor6D") and obj.Part0 == part0 then
            return obj
        end
    end
end

local function applyKeyframe(character, poseKeyframe)
    local function recurApplyPoses(parentPose, poseObject)
        if parentPose then
            local joint = getJointBetween(character[parentPose.Name], character[poseObject.Name])
            if joint and poseObject.Weight ~= 0 then
                joint.C1 = poseObject.CFrame:inverse() + joint.C1.p
            end
        end
        for _, subPose in pairs(poseObject:GetSubPoses()) do
            recurApplyPoses(poseObject, subPose)
        end
    end

    for _, poseObj in pairs(poseKeyframe:GetPoses()) do
        recurApplyPoses(nil, poseObj)
    end
end

local function applyR15Pose(character)
    local poseKeyframSequence = game:GetService("KeyframeSequenceProvider"):GetKeyframeSequence(poseAnimationId)
    local poseKeyframe = poseKeyframSequence:GetKeyframes()[1]
    applyKeyframe(character, poseKeyframe)
end

local character = player.Character
if character then
    local tool = character:FindFirstChildOfClass("Tool")
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    
    if humanoid then
        if humanoid.RigType == Enum.HumanoidRigType.R6 then
            if tool then
                character.Torso["Right Shoulder"].CurrentAngle = math.rad(90)
            end
        elseif humanoid.RigType == Enum.HumanoidRigType.R15 then
            if not tool then
                applyR15Pose(character)
            end
        end
    end
end

return game:GetService("ThumbnailGenerator"):Click(fileExtension, x, y, --[[hideSky = ]] true)
    `;
};

// Lua script for Closeup headshot rendering
const generateCloseupScript = (baseUrl: string, charAppearanceUrl: string, fileExtension: string, x: number, y: number): string => {
    return `
-- Closeup v1.0.3
baseUrl, characterAppearanceUrl, fileExtension, x, y = "${baseUrl}", "${charAppearanceUrl}", "${fileExtension}", ${x}, ${y}

pcall(function() game:GetService('ContentProvider'):SetBaseUrl(baseUrl) end)
game:GetService('ScriptContext').ScriptsDisabled = true

local player = game:GetService("Players"):CreateLocalPlayer(0)
player.CharacterAppearance = characterAppearanceUrl
player:LoadCharacterBlocking()

local maxDimension = 0

if player.Character then
    for _, child in pairs(player.Character:GetChildren()) do
        if child:IsA("Tool") then
            child:Destroy()
        elseif child:IsA("Accoutrement") then
            local handle = child:FindFirstChild("Handle")
            if handle then
                local size = handle.Size / 2 + handle.Position - player.Character.Head.Position
                local xy = Vector2.new(size.x, size.y)
                if xy.magnitude > maxDimension then
                    maxDimension = xy.magnitude
                end
            end
        end
    end

    local maxHatOffset = 0.5
    maxDimension = math.min(1, maxDimension / 3)

    local viewOffset = player.Character.Head.CFrame * CFrame.new(0, 0 + maxHatOffset * maxDimension, 0.1)
    local positionOffset = player.Character.Head.CFrame + (CFrame.Angles(0, -math.pi / 16, 0).lookVector.unit * 3)

    local camera = Instance.new("Camera", player.Character)
    camera.Name = "ThumbnailCamera"
    camera.CameraType = Enum.CameraType.Scriptable
    camera.CoordinateFrame = CFrame.new(positionOffset.p, viewOffset.p)
    camera.FieldOfView = 35 + (50 - 35) * maxDimension
end

return game:GetService("ThumbnailGenerator"):Click(fileExtension, x, y, --[[hideSky = ]] true)
    `;
};

router.post("/thumbnail", Valid(PlayerRenderRequest), async (req, res) => {
    const charAppUrl = \`\${Config.BaseUrl}/v1.1/avatar-fetch?placeId=0&userId=\${req.body.userId}\`;
    const luaScript = generateAvatarScript(Config.BaseUrl, charAppUrl, "PNG", 840, 840);
    
    Console.Debug(\`Queueing player thumbnail request with UserId \${req.body.userId}\`);
    return await box.Enqueue((port: number) => RequestRCCBase(
        req,
        res,
        luaScript,
        port,
        "Player thumbnail"
    ));
});

router.post("/thumbnail-3d", Valid(PlayerRenderRequest), async (req, res) => {
    const charAppUrl = \`\${Config.BaseUrl}/v1.1/avatar-fetch?placeId=0&userId=\${req.body.userId}\`;
    const luaScript = generateAvatarScript(Config.BaseUrl, charAppUrl, "OBJ", 352, 352);
    
    Console.Debug(\`Queueing 3D Player thumbnail request with UserId \${req.body.userId}\`);
    return await box.Enqueue((port: number) => RequestRCCBase(
        req,
        res,
        luaScript,
        port,
        "3D Player thumbnail"
    ));
});

router.post("/headshot", Valid(PlayerRenderRequest), async (req, res) => {
    const charAppUrl = \`\${Config.BaseUrl}/v1.1/avatar-fetch?placeId=0&userId=\${req.body.userId}\`;
    const luaScript = generateCloseupScript(Config.BaseUrl, charAppUrl, "PNG", 720, 720);
    
    Console.Debug(\`Queueing player headshot request with UserId \${req.body.userId}\`);
    return await box.Enqueue((port: number) => RequestRCCBase(
        req,
        res,
        luaScript,
        port,
        "Player headshot"
    ));
});

export default router;

export interface Thumbnail3DRCC {
    camera: {
        position: {
            x: number;
            y: number;
            z: number;
        },
        direction: {
            x: number;
            y: number;
            z: number;
        },
        fov: number
    },
    AABB: {
        min: {
            x: number;
            y: number;
            z: number;
        },
        max: {
            x: number;
            y: number;
            z: number;
        },
    },
    files: {
        "scene.obj"?: {
            content: string;
        },
        "scene.mtl"?: {
            content: string;
        },
    },
}

export interface Thumbnail3DResponse {
    camera: {
        position: {
            x: number;
            y: number;
            z: number;
        },
        direction: {
            x: number;
            y: number;
            z: number;
        },
        fov: number
    },
    aabb: {
        min: {
            x: number;
            y: number;
            z: number;
        },
        max: {
            x: number;
            y: number;
            z: number;
        },
    },
    mtl: string,
    obj: string,
    textures: string[],
}
