import * as debugLib from "debug";
import * as path from "path";
import * as webpack from "webpack";
import { IPackhostGeneratorOptions } from "./";
import { FileHelper } from "./utils";

const debug = debugLib("azure-functions-pack:WebpackRunner");

export interface IWebpackRunner {
    projectRootPath: string;
    indexFileName?: string;
    outputPath?: string;
    uglify?: boolean;
    ignoredModules?: string[];
}

export class WebpackRunner {
    public static run(options: IWebpackRunner): Promise<any> {
        options.indexFileName = options.indexFileName || "index.js";
        options.outputPath = options.outputPath || ".funcpack";
        options.uglify = options.uglify || false;
        options.ignoredModules = options.ignoredModules || [];

        return new Promise(async (resolve, reject) => {
            debug("Setting up paths");
            const oldPath = path.join(options.projectRootPath, options.outputPath, options.indexFileName);
            const newPath = path.join(options.projectRootPath,
                options.outputPath, "original." + options.indexFileName);

            const outputPath = path.join(options.projectRootPath, options.outputPath, "output.js");

            const ignoredModules: { [key: string]: string } = {};

            for (const mod of options.ignoredModules) {
                ignoredModules[mod.toLowerCase()] = mod;
            }

            debug("Creating Webpack Configuration");
            const config: webpack.Configuration = {
                entry: oldPath,
                externals: ignoredModules,
                node: {
                    __dirname: false,
                    __filename: false,
                },
                output: {
                    filename: "output.js",
                    library: "index",
                    libraryTarget: "commonjs2",
                    path: path.join(options.projectRootPath, options.outputPath),
                },
                plugins: [
                    new webpack.DefinePlugin({ "global.GENTLY": false }),
                ],
                target: "node",
            };

            if (options.uglify) {
                debug("Adding uglify plugin");
                try {
                    config.plugins.push(new webpack.optimize.UglifyJsPlugin());
                } catch (e) {
                    debug(e);
                }
            }

            debug("Creating Webpack instance");
            const compiler = webpack(config);
            debug("Started webpack");
            compiler.run(async (err, stats) => {
                debug("Webpack finished");
                if (err || stats.hasErrors()) {
                    return reject(err || stats.toString({ errors: true }));
                }
                debug("\n" + stats.toString());

                debug("Saving the original the entry file: %s -> %s", oldPath, newPath);
                if (await FileHelper.exists(newPath)) {
                    await FileHelper.rimraf(newPath);
                }
                await FileHelper.rename(oldPath, newPath);

                debug("Renaming the output file");
                await FileHelper.rename(outputPath, oldPath);
                resolve();
            });
        });
    }
}
