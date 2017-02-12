import * as debugLib from "debug";
import * as path from "path";
import * as webpack from "webpack";
import { IPackhostGeneratorOptions } from "./";
import { FileHelper } from "./utils";

const debug = debugLib("azure-functions-pack:WebpackRunner");

export class WebpackRunner {
    public static run(options: IPackhostGeneratorOptions): Promise<any> {
        options.indexFileName = options.indexFileName || "index.js";
        options.outputPath = options.outputPath || ".funcpack";

        return new Promise(async (resolve, reject) => {

            const oldPath = path.join(options.projectRootPath, options.outputPath, options.indexFileName);
            const newPath = path.join(options.projectRootPath,
                                          options.outputPath, "original." + options.indexFileName);

            const outputPath = path.join(options.projectRootPath, options.outputPath, "output.js");

            const config: webpack.Configuration = {
                entry: oldPath,
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
                target: "node",
            };

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
