// added by devponte
/**
 * Converts a BaseJson configuration into a Lua script string that RCC can execute
 */
export const ConvertBaseJsonToLuaScript = (data) => {
    const settings = data.Settings;
    const type = settings.Type;
    const args = settings.Arguments;
    // Build the argument values string for Lua
    let argsStr = "";
    args.forEach((arg, index) => {
        if (typeof arg === 'string') {
            argsStr += `"${arg.replace(/"/g, '\\"')}", `;
        }
        else if (typeof arg === 'number') {
            argsStr += `${arg}, `;
        }
        else if (typeof arg === 'boolean') {
            argsStr += `${arg}, `;
        }
        else {
            argsStr += `nil, `;
        }
    });
    argsStr = argsStr.slice(0, -2); // Remove last comma and space
    return `
-- ${type} v1.0
-- Auto-generated Lua script from JSON template
local args = {${argsStr}}
local baseUrl, characterAppearanceUrl, fileExtension, x, y = args[1], args[2], args[3], args[4], args[5]

pcall(function() game:GetService("ContentProvider"):SetBaseUrl(baseUrl) end)
game:GetService("ScriptContext").ScriptsDisabled = true

local player = game:GetService("Players"):CreateLocalPlayer(0)
player.CharacterAppearance = characterAppearanceUrl
player:LoadCharacterBlocking()

local character = player.Character
if character then
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    local tool = character:FindFirstChildOfClass("Tool")
    
    if humanoid then
        if humanoid.RigType == Enum.HumanoidRigType.R6 then
            if tool then
                character.Torso["Right Shoulder"].CurrentAngle = math.rad(90)
            end
        end
    end
end

return game:GetService("ThumbnailGenerator"):Click(fileExtension, x, y, --[[hideSky = ]] true)
    `;
};
