import * as debugLib from "debug";
import * as path from "path";
import * as rimraf from "rimraf";

import { FileHelper } from "./utils";

const debug = debugLib("azure-functions-pack:Unpack");

export class Unpacker {
    public static async unpack(options: IUnpackerConfig) {

        return new Promise(async (resolve, reject) => {
            try {
                if (FileHelper.exists(path.resolve(options.projectRootPath, options.outputPath))) {
                    debug(`Removing funckpack output: ${options.outputPath}`);
                    await FileHelper.rimraf(path.resolve(options.projectRootPath, options.outputPath));
                } else {
                    debug(`Did not find funckpack output: ${options.outputPath}`);
                }

                debug(`Finding Functions`);
                const functionDirectories: string[] = (await FileHelper.readdir(options.projectRootPath));

                debug(`Found Functions: ${functionDirectories.join(", ")}`);

                for (const name of functionDirectories) {
                    if (!(await FileHelper.stat(path.resolve(options.projectRootPath, name))).isDirectory()) {
                        continue;
                    }
                    if (!await FileHelper.exists(path.resolve(options.projectRootPath, name, "function.json"))) {
                        continue;
                    }
                    const fxJsonPath = path.resolve(options.projectRootPath, name, "function.json");
                    const fxJson = await FileHelper.readFileAsJSON(fxJsonPath);

                    if (fxJson._originalScriptFile) {
                        debug(`Removing _originalScriptFile from ${name}'s function.json`);
                        fxJson.scriptFile = fxJson._originalScriptFile + "";
                        delete fxJson._originalScriptFile;
                    }

                    if (fxJson._originalEntryPoint || fxJson._originalEntryPoint === false) {
                        debug(`Removing _originalEntryPoint from ${name}'s function.json`);
                        fxJson.entryPoint = fxJson._originalEntryPoint;
                        if (fxJson._originalEntryPoint === false) {
                            delete fxJson.entryPoint;
                        } else {
                            fxJson.entryPoint = fxJson._originalEntryPoint;
                        }
                        delete fxJson._originalEntryPoint;
                    }

                    debug(`Overwriting ${name}'s function.json`);
                    await FileHelper.overwriteFileUtf8(fxJsonPath, JSON.stringify(fxJson, null, " "));
                    resolve();
                }
            } catch (e) {
                debug(e);
                reject(e);
            }
        });
    }
}

export interface IUnpackerConfig {
    projectRootPath: string;
    outputPath?: string;
}
