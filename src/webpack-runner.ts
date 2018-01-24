import * as debugLib from "debug";
import * as path from "path";
import * as webpack from "webpack";
import * as winston from "winston";
import { IPackhostGeneratorOptions } from "./";
import { FileHelper } from "./utils";

const debug = debugLib("azure-functions-pack:WebpackRunner");

export interface IWebpackRunner {
    projectRootPath: string;
    indexFileName?: string;
    packHostIndexFileName?: string;
    outputPath?: string;
    uglify?: boolean;
    watch?: boolean;
    ignoredModules?: string[];
    editConfig?: string;
}

export class WebpackRunner {
    public static run(options: IWebpackRunner): Promise<any> {
        options.indexFileName = options.indexFileName || "index.js";
        options.packHostIndexFileName = options.packHostIndexFileName || "index.gen.js";
        options.outputPath = options.outputPath || ".funcpack";
        options.uglify = options.uglify || false;
        options.watch = options.watch || false;
        options.ignoredModules = options.ignoredModules || [];

        return new Promise(async (resolve, reject) => {
            debug("Setting up paths");
            const indexPath = path.join(options.projectRootPath, options.outputPath, options.indexFileName);
            const packHostPath = path.join(options.projectRootPath,
                options.outputPath, options.packHostIndexFileName);

            const ignoredModules: { [key: string]: string } = {};

            for (const mod of options.ignoredModules) {
                ignoredModules[mod.toLowerCase()] = mod;
            }

            debug("Creating Webpack Configuration");
            let config: webpack.Configuration = {
                entry: packHostPath,
                externals: ignoredModules,
                node: {
                    __dirname: false,
                    __filename: false,
                },
                output: {
                    filename: options.indexFileName,
                    library: "index",
                    libraryTarget: "commonjs2",
                    path: path.join(options.projectRootPath, options.outputPath),
                },
                plugins: [],
                target: "node",
                watch: options.watch,
            };

            if (options.uglify) {
                debug("Adding uglify plugin");
                try {
                    config.plugins.push(new webpack.optimize.UglifyJsPlugin());
                } catch (e) {
                    debug(e);
                }
            }

            try {
                if (options.editConfig) {
                    const customizeFunctionPath = path.join(options.projectRootPath, options.editConfig);
                    const customizeFunction = require(customizeFunctionPath);
                    config = customizeFunction(config, webpack);
                }
            } catch (e) {
                winston.error(e);
                throw new Error("Could not apply customize function");
            }

            debug("Creating Webpack instance");
            const compiler = webpack(config);
            debug("Started webpack");

            if (options.watch) {
                compiler.watch(null, async (err, stats) => {
                    debug("Webpack recompile");
                    if (err || stats.hasErrors()) {
                        return reject(err || stats.toString({ errors: true }));
                    }
                    debug("\n" + stats.toString());
                });
            } else {
                compiler.run(async (err, stats) => {
                    debug("Webpack finished");
                    if (err || stats.hasErrors()) {
                        return reject(err || stats.toString({ errors: true }));
                    }
                    debug("\n" + stats.toString());

                    resolve();
                });
            }
        });
    }
}
