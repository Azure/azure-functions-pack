
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
        this.options.outputPath = this.options.outputPath || ".funcpack";
        debug("Created new PackhostGenerator for project at: %s", this.options.projectRootPath);
    }

    // TODO: Should probably replace this whole class with a bunch of static methods. Don't need a class.
    public async updateProject() {
        debug("Starting update of Project");
        await this.load();
        await this.createOutputDirectory();
        await this.createHostFile();
        await this.updateFunctionJSONs();
        debug("Completed update of project");
    }

    private async load() {
        const functions: string[] = (await FileHelper.readdir(this.options.projectRootPath))
            .filter(async (item) =>
                (await FileHelper.stat(path.resolve(this.options.projectRootPath, item))).isDirectory());
        debug("Found these directories in project root: %s", functions.join(", "));
        for (const item of functions) {
            if (await FileHelper.exists(path.resolve(this.options.projectRootPath, item, "function.json"))) {
                this.functionsMap.set(item, await this.loadFunction(item));
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
        if (fxJson.originalScriptFile === null) {
            debug("Found originalScriptFile setting: %s", fxJson.originalScriptFile);
            scriptFile = fxJson.originalScriptFile;
            originalScriptFile = fxJson.originalScriptFile;
        } else if (fxJson.scriptFile && !fxJson.originalScriptFile) {
            scriptFile = fxJson.scriptFile;
            originalScriptFile = fxJson.scriptFile;
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
                throw new Error(`Function {name} does not have a valid start file`);
            }
            originalScriptFile = scriptFile;
        }

         // TODO: improve the logic for choosing entry point - failure sure not all scenarios are covered here.
         // TODO: Have to overwrite this entryPoint later on. Using temporary setting for now.
        if (fxJson.originalEntryPoint) {
            debug("Found originalEntryPoint setting: %s", fxJson.originalEntryPoint);
            entryPoint = fxJson.originalEntryPoint;
            originalEntryPoint = fxJson.originalEntryPoint;
        } else if (fxJson.entryPoint && fxJson.originalEntryPoint !== false) {
            entryPoint = fxJson.entryPoint;
            originalEntryPoint = fxJson.entry;
        }

        debug("Loaded function(%s) using entryPoint: %s - scriptFile: %s", name, scriptFile, entryPoint);
        return Promise.resolve({
            name,
            scriptFile,
            entryPoint,
            originalEntryPoint,
            originalScriptFile,
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

        for (const [name, fx] of this.functionsMap) {
            const fxvar = this.safeFunctionName(fx.name);
            let exportStmt = `    "${fxvar}": require("../${fx.name}/${fx.originalScriptFile}")`;
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
            path.join(this.options.projectRootPath, this.options.outputPath, this.options.indexFileName),
            exportString);
    }

    private async updateFunctionJSONs() {
        debug("Updating Function JSONS");
        for (const [name, fx] of this.functionsMap) {
            debug("Updating function(%s)", name);
            const fxJsonPath = path.resolve(this.options.projectRootPath, name, "function.json");
            const fxvar = this.safeFunctionName(fx.name);
            const fxJson = await FileHelper.readFileAsJSON(fxJsonPath);

            // TODO: This way of keeping track of the original settings is hacky
            fxJson.originalEntryPoint = fx.originalEntryPoint;
            fxJson.originalScriptFile = fx.originalScriptFile;
            fxJson.scriptFile = `../${this.options.outputPath}/${this.options.indexFileName}`;
            fxJson.entryPoint = fxvar;
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
}

export interface IFxFunction {
    name: string;
    entryPoint: string;
    scriptFile: string;
    originalEntryPoint: string | boolean;
    originalScriptFile: string | boolean;
}
