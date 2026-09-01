//modified by devponte

import {Request, Response} from "ultimate-express";
import {PlayerRenderRequest} from "../Utilities/Dto/Catalog.js";
import {RCCRequest} from "../Utilities/Libraries/Request.js";
import xml2js from "xml2js";
import {Console} from "../Utilities/Libraries/CS.js";
import Resp from "../Utilities/Libraries/Resp.js";

export const RequestRCCBase = async (
    req: Request,
    res: Response,
    luaScript: string,
    port: number,
    type: string,
    envelopeType?: number
) => {
    const request: any = req.body;

    const response: any = await RCCRequest(port, luaScript, request.jobExpiration);
    try {
        let xmlData: string;
        let result: any = (await xml2js.parseStringPromise(response, {explicitArray: false}))["SOAP-ENV:Envelope"];
        result = CleanXmlJson(result) as SOAPEnvelope2;
        xmlData = result?.Body?.BatchJobResponse?.BatchJobResult?.value;
        if (!xmlData) {
            result = result as SOAPEnvelope;
            xmlData = result.Body.BatchJobResponse.BatchJobResult[0].value;
        }
        Console.Log(`&aRendered &lsuccessfully&r&a on port &l${port}&r with UserId &l${request.userId}&r, &lAssetId ${request.assetId}&r.`);
        return Resp(res, 200, "success", true, {data: xmlData});
    } catch (e: any) {
        if (e.message.startsWith("Non-whitespace before first tag.")) {
            Console.Error(`${type} render with &c&lUserId ${request.userId}&r, &c&lAssetId ${request.assetId}&r on &c&lport ${port}&r failed with the following error message, likely due to a malformed XML provided to RCC: ${e.message}`);
        } else {
            Console.Error(`${type} render with &c&lUserId ${request.userId}&r, &c&lAssetId ${request.assetId}&r on &c&lport ${port}&r failed with the following error message: \n${e.message}`);
        }
        return Resp(res, 500, e.message);
    }
};

export const RequestRCCBaseXMLData = async (
    req: Request,
    res: Response,
    luaScript: string,
    port: number,
    type: string,
    envelopeType?: number
): Promise<any> => {
    const request: any = req.body;

    const response: any = await RCCRequest(port, luaScript, request.jobExpiration);
    try {
        let xmlData;
        let result: any = (await xml2js.parseStringPromise(response, {explicitArray: false}))["SOAP-ENV:Envelope"];
        switch (envelopeType) {
            case 2:
                result = CleanXmlJson(result) as SOAPEnvelope2;
                xmlData = result.Body.BatchJobResponse.BatchJobResult.value;
                break;
            default:
                result = result as SOAPEnvelope;
                xmlData = result.Body.BatchJobResponse.BatchJobResult[0].value;
                break;
        }
        Console.Log(`&aRendered &lsuccessfully&r&a on port &l${port}&r with ${request.userId}&r, &c&lAssetId ${request.assetId}&r.`);
        return xmlData;
    } catch (e: any) {
        if (e.message.startsWith("Non-whitespace before first tag.")) {
            Console.Error(`${type} render with &c&lUserId ${request.userId}&r, &c&lAssetId ${request.assetId}&r on &c&lport ${port}&r failed with the following error message, likely due to a malformed XML provided to RCC: ${e.message}`);
        } else {
            Console.Error(`${type} render with ${request.userId}&r, &c&lAssetId ${request.assetId}&r on &c&lport ${port}&r failed with the following error message: \n${e.message}`);
        }
        return Resp(res, 500, e.message);
    }
};

export class BaseJson {
    Mode!: string;
    Settings!: {
        Type: string;
        Arguments: any[];
    };
    Arguments!: {};
}

function CleanXmlJson(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(CleanXmlJson);
    } else if (typeof obj === "object" && obj !== null) {
        const newObj: any = {};

        for (const key in obj) {
            if (key === "$") continue;
            const cleanedKey = key.includes(":") ? key.split(":")[1] : key;
            newObj[cleanedKey] = CleanXmlJson(obj[key]);
        }
        return newObj;
    }
    return obj;
}

export class SOAPEnvelope {
    Header?: any;
    Body!: {
        BatchJobResponse: {
            BatchJobResult: Array<{ type: string; value?: string }>;
        };
    };
}

export class SOAPEnvelope2 {
    Header?: any;
    Body!: {
        BatchJobResponse: {
            BatchJobResult: {
                type: string;
                value?: string;
            };
        };
    };
}
