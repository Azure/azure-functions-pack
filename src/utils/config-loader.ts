import {
    FileHelper,
} from "./index";

import * as path from "path";

export class ConfigLoader {
    public static async loadConfig(filename?: string): Promise<IFuncpackConfig> {
        const pathToFile = path.join(process.cwd(), (filename || "funcpack.config.json"));
        if (await FileHelper.exists(pathToFile)) {
            return await FileHelper.readFileAsJSON(pathToFile);
        }
    }
}

export interface IFuncpackConfig {
    ignoredModules?: string[];
}
