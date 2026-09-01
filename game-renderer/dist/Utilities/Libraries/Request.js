//modified by devponte
//just to fix a line with a stringify bug
import axios from "axios";
import { SOAP } from "./SOAP.js";
import Config from "./Config.js";
import { Console } from "./CS.js";
export const HttpRequest = async (method, url, data) => {
    const isBrowser = typeof window !== "undefined";
    try {
        if (isBrowser)
            throw new Error("Browser isn't supported for Requests!");
        return await axios.request({
            method,
            url: url.toString(),
            data,
            maxRedirects: 3,
        }).then(res => res.data);
    }
    catch (e) {
        if (axios.isAxiosError(e)) {
            if (e?.response?.status && e.response.status !== 502) {
                return e.response;
            }
        }
        // @ts-ignore
        throw new Error(e);
    }
};
export const RCCRequest = async (port, data, jobExpiration) => {
    try {
        const headers = {
            "Content-Type": "text/xml",
        };
        //const xml = SOAP(Config.BaseUrl, jobExpiration, JSON.stringify(data));
        const luaArgs = data.Settings.Arguments.map((arg) => {
            if (typeof arg === 'string') {
                return `"${arg.replace(/"/g, '\\"')}"`;
            }
            return arg;
        }).join(', ');
        const luaScript = `
baseUrl, characterAppearanceUrl, fileExtension, x, y = ${luaArgs}
pcall(function() game:GetService("ContentProvider"):SetBaseUrl(baseUrl) end)
game:GetService("ScriptContext").ScriptsDisabled = true
local player = game:GetService("Players"):CreateLocalPlayer(0)
player.CharacterAppearance = characterAppearanceUrl
player:LoadCharacterBlocking()
local character = player.Character
if character then
local humanoid = character:FindFirstChildOfClass("Humanoid")
if humanoid and humanoid.RigType == Enum.HumanoidRigType.R6 then
local tool = character:FindFirstChildOfClass("Tool")
if tool then character.Torso["Right Shoulder"].CurrentAngle = math.rad(90) end
end
end
return game:GetService("ThumbnailGenerator"):Click(fileExtension, x, y, true)
`;
        const xml = SOAP(Config.BaseUrl, jobExpiration, luaScript);
        const response = await axios.request({
            method: HttpMethod.POST,
            url: `${Config.RCCUrl}:${port}`,
            timeout: jobExpiration * 1000,
            data: xml,
            maxRedirects: 3,
            headers,
        });
        return response.data;
    }
    catch (e) {
        if (axios.isAxiosError(e)) {
            if (e?.response?.status && e.response.status !== 502) {
                return e.response;
            }
        }
        //throw new Error(e);
        Console.Error(`Error occurred while requesting to RCC: ${e.message}`);
        return null;
    }
};
export var HttpMethod;
(function (HttpMethod) {
    HttpMethod["POST"] = "POST";
    HttpMethod["GET"] = "GET";
    HttpMethod["PATCH"] = "PATCH";
    HttpMethod["DELETE"] = "DELETE";
    HttpMethod["PUT"] = "PUT";
})(HttpMethod || (HttpMethod = {}));
export class LuaValue {
    type;
    value;
}
export class BatchJobResultClass {
    type;
    value; // present only for LUA_TSTRING
    table;
}
export class SOAPEnvelope {
    Header;
    Body;
}
export class SOAPBodyClass {
    BatchJobResponse;
}
export class BatchJobResponseClass {
    BatchJobResult;
}
export class SOAPEnvelope2 {
    Header;
    Body;
}
