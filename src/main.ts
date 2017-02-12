import * as program from "commander";
import * as path from "path";
import * as winston from "winston";
import { PackhostGenerator, WebpackRunner } from "./";

async function runCli() {
    const p = program
        .version("0.0.1")
        .option("-d, --debug", "Emits debug messages")
        .option("-p, --path <path>", "Path to root of Function App");
    p.parse(process.argv);

    if (program.opts().debug) {
        process.env.DEBUG = process.env.DEBUG ?
            process.env.DEBUG + ",azure-functions-pack:*" : "azure-functions-pack:*";
    }

    // Grab the route either from the option, the argument (if there is only 1)
    let pathToRoot = "";
    try {
        pathToRoot = program.opts().path ?
            path.join(process.cwd(), program.opts().path) :
            (program.args.length === 1 ? program.args[0] : process.cwd());
    } catch (error) {
        winston.error(error);
        throw new Error("Could not determine route");
    }

    // Create new generator object with settings
    const generator = new PackhostGenerator({
        projectRootPath: pathToRoot,
    });

    // Attempt to generate the project
    try {
        winston.info("Generating project files/metadata");
        await generator.updateProject();
    } catch (error) {
        winston.error(error);
        throw new Error("Could not generate project");
    }

    // Webpack
    try {
    winston.info("Webpacking project");
    await WebpackRunner.run({
        projectRootPath: pathToRoot,
    });
    } catch (error) {
        winston.error(error);
        throw new Error("Could not webpack project");
    }

    winston.info("Complete!");
    process.exit(0);
}

runCli();
