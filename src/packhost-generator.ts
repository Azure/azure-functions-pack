
import * as debugLib from "debug";
import * as path from "path";

import { FileHelper } from "./utils";

const debug = debugLib("azure-functions-pack:PackhostGenerator");

export class PackhostGenerator {

    private functionsMap: Map<string, IFxFunction> = new Map<string, IFxFunction>();
    private options: IPackhostGeneratorOptions;

    constructor(options: IPackhostGeneratorOptions) {
        this.options = options;
        this.options.indexFileName = this.options.indexFileName || "index.js";
        this.options.packHostIndexFileName = this.options.packHostIndexFileName || "index.gen.js";
        this.options.outputPath = this.options.outputPath || ".funcpack";
        this.options.copyToOutput = this.options.copyToOutput || false;
        debug("Created new PackhostGenerator for project at: %s", this.options.projectRootPath);
    }

    // TODO: Should probably replace this whole class with a bunch of static methods. Don't need a class.
    public async updateProject() {
        debug("Starting update of Project");
        await this.throwIfInFunction();
        await this.load();
        await this.createOutputDirectory();
        await this.createHostFile();
        await this.updateFunctionJSONs();
        debug("Completed update of project");
    }

    private async throwIfInFunction() {
        debug("Checking if we're in a function");
        if (await FileHelper.exists(path.resolve(this.options.projectRootPath, "function.json"))) {
            throw new Error("function.json detected: run this from "
                + "the root of your Function App, not inside of a Function");
        }
    }

    private async load() {
        const functions: string[] = (await FileHelper.readdir(this.options.projectRootPath))
            // tslint:disable-next-line:arrow-parens
            .filter(async (item) =>
                (await FileHelper.stat(path.resolve(this.options.projectRootPath, item))).isDirectory());
        debug("Found these directories in project root: %s", functions.join(", "));
        for (const item of functions) {
            if (await FileHelper.exists(path.resolve(this.options.projectRootPath, item, "function.json"))) {
                const fn = await this.loadFunction(item);
                if (fn !== null) {
                    this.functionsMap.set(item, fn);
                }
            }
        }
    }

    private async loadFunction(name: string): Promise<IFxFunction> {
        let entryPoint = null;
        let scriptFile = null;
        let originalEntryPoint: string | boolean = false;
        let originalScriptFile: string | boolean = false;
        debug("Found function: %s", name);
        const fxJsonPath = path.resolve(this.options.projectRootPath, name, "function.json");
        const fxJson = await FileHelper.readFileAsJSON(fxJsonPath);

        // TODO: Have to overwite this scriptFile setting later on. Having to use temporary setting right now.
        if (fxJson._originalScriptFile) {
            debug("Found originalScriptFile setting: %s", fxJson._originalScriptFile);
            scriptFile = fxJson._originalScriptFile;
            originalScriptFile = fxJson._originalScriptFile;
        } else if (fxJson.scriptFile && fxJson.scriptFile.endsWith(".js") && !fxJson._originalScriptFile) {
            scriptFile = fxJson.scriptFile;
            originalScriptFile = fxJson.scriptFile;
        } else if (fxJson.scriptFile && !fxJson.scriptFile.endsWith(".js") && !fxJson._originalScriptFile) {
            return null;
        } else {
            let dir: string[] = await FileHelper.readdir(path.resolve(this.options.projectRootPath, name));
            dir = dir.filter((f) => f.endsWith(".js"));
            if (dir.length === 1) {
                scriptFile = dir[0];
            } else if (dir.find((v, i, o) => {
                return v === "index.js";
            })) {
                scriptFile = "index.js";
            } else {
                debug("Function %s does not have a valid start file", name, {
                    directory: dir,
                });
                return null;
                // throw new Error(`Function ${name} does not have a valid start file`);
            }
            originalScriptFile = scriptFile;
        }

        // TODO: improve the logic for choosing entry point - failure sure not all scenarios are covered here.
        // TODO: Have to overwrite this entryPoint later on. Using temporary setting for now.
        if (fxJson._originalEntryPoint) {
            debug("Found originalEntryPoint setting: %s", fxJson._originalEntryPoint);
            entryPoint = fxJson._originalEntryPoint;
            originalEntryPoint = fxJson._originalEntryPoint;
        } else if (fxJson.entryPoint && fxJson._originalEntryPoint !== false) {
            entryPoint = fxJson.entryPoint;
            originalEntryPoint = fxJson.entryPoint;
        }

        debug("Loaded function(%s) using entryPoint: %s - scriptFile: %s", name, scriptFile, entryPoint);
        return Promise.resolve({
            _originalEntryPoint: originalEntryPoint,
            _originalScriptFile: originalScriptFile,
            entryPoint,
            name,
            scriptFile,
        });
    }

    private async createOutputDirectory() {
        const outputDirPath = path.join(this.options.projectRootPath, this.options.outputPath);
        if (await FileHelper.exists(outputDirPath)) {
            debug("Deleting previous output directory: %s", this.options.outputPath);
            await FileHelper.rimraf(outputDirPath);
        }

        debug("Creating output directory: %s", outputDirPath);
        await FileHelper.mkdir(outputDirPath);
    }

    private async createHostFile() {
        debug("Generating host file");
        const exportStrings: string[] = [];

        const outputDirPath = path.join(this.options.projectRootPath, this.options.outputPath);
        const relPath = path.relative(outputDirPath, this.options.projectRootPath);
        const rootRelPath = (path.sep === "\\") ? relPath.replace(/\\/g, "/") : relPath;

        for (const [name, fx] of this.functionsMap) {
            const fxvar = this.safeFunctionName(fx.name);
            let exportStmt = `    "${fxvar}": require("${rootRelPath}/${fx.name}/${fx._originalScriptFile}")`;
            if (fx.entryPoint) {
                exportStmt += `.${fx.entryPoint}`;
            }
            exportStrings.push(exportStmt);
        }

        let exportString =
            exportStrings.reduce((p, c, i, a) => p + c + ((i !== exportStrings.length - 1) ? ",\n" : "\n"), "");

        exportString = "module.exports = {\n" + exportString + "}";

        debug("Writing contents to host file");
        await FileHelper.writeFileUtf8(
            path.join(this.options.projectRootPath, this.options.outputPath, this.options.packHostIndexFileName),
            exportString);
    }

    private async updateFunctionJSONs() {
        debug("Updating Function JSONS");
        for (const [name, fx] of this.functionsMap) {
            debug("Updating function(%s)", name);
            let fxJsonPath = path.resolve(this.options.projectRootPath, name, "function.json");
            const fxvar = this.safeFunctionName(fx.name);
            const fxJson = await FileHelper.readFileAsJSON(fxJsonPath);

            if (this.options.copyToOutput) {
                await FileHelper.cp(
                    path.resolve(this.options.projectRootPath, name, "function.json")
                    , path.resolve(this.options.projectRootPath, this.options.outputPath, name, "function.json"));
            }

            // TODO: This way of keeping track of the original settings is hacky
            fxJson._originalEntryPoint = fx._originalEntryPoint;
            fxJson._originalScriptFile = fx._originalScriptFile;
            fxJson.scriptFile = this.options.copyToOutput ?
                `../${this.options.indexFileName}` :
                `../${this.options.outputPath}/${this.options.indexFileName}`;
            fxJson.entryPoint = fxvar;
            if (this.options.copyToOutput) {
                fxJsonPath = path.resolve(this.options.projectRootPath, this.options.outputPath, name, "function.json");
            }
            await FileHelper.overwriteFileUtf8(fxJsonPath, JSON.stringify(fxJson, null, " "));
        }
    }

    private safeFunctionName(name: string): string {
        return name.replace("-", "$dash");
    }
}

export interface IPackhostGeneratorOptions {
    projectRootPath: string;
    outputPath?: string;
    indexFileName?: string;
    copyToOutput?: boolean;
    packHostIndexFileName?: string;
}

export interface IFxFunction {
    name: string;
    entryPoint: string;
    scriptFile: string;
    _originalEntryPoint: string | boolean;
    _originalScriptFile: string | boolean;
}
