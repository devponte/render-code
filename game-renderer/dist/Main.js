//modifed by devponte
import express from "ultimate-express";
import Config from "./Utilities/Libraries/Config.js";
import { Console } from "./Utilities/Libraries/CS.js";
import PlayerController from "./Controllers/PlayerController.js";
import ImageController from "./Controllers/ImageController.js";
import CatalogController from "./Controllers/CatalogController.js";
import PlaceController from "./Controllers/PlaceController.js";
const App = express();
const ProcessPort = Config.Ports.Process;
App.use(express.text({ limit: "250mb" }));
App.use(express.json());
App.listen(ProcessPort, () => Console.Log(`Renderer started on port &a&l${ProcessPort}`));
App.use("/player", PlayerController);
App.use("/image", ImageController);
App.use("/catalog", CatalogController);
App.use("/game", PlaceController);
// added this endpoint
App.get("/v1.1/avatar-fetch", (req, res) => {
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
        scales: { height: 1, width: 1 },
        assets: []
    };
    return res.json(avatarData);
});
App.get("/", (_, res) => {
    return res.status(200).send("PEKAPEKA OK!");
});
