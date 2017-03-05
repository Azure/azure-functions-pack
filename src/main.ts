#! /usr/bin/env node

import * as program from "commander";
import * as path from "path";
import * as winston from "winston";
import { PackhostGenerator, Unpacker, WebpackRunner } from "./";

async function runCli() {
    const p = program
        .version("0.1.0")
        .option("-d, --debug", "Emits debug messages");

    p.command("unpack <path>")
        .description("Will remove all traces of packing tool at the specified "
        + "path or the current directory if none is specified")
        .option("-o, --output <path>", "Path for output directory")
        .action(unpack);

    p.command("pack <path>")
        .description("Will pack the specified path or the current directory if none is specified")
        .option("-u, --uglify", "Uglify the project when webpacking")
        .option("-o, --output <path>", "Path for output directory")
        .action(pack);

    p.command("*", null, { noHelp: true, isDefault: true })
        .action(() => {
            p.help();
        });

    p.parse(process.argv);

    if (!process.argv.slice(2).length) {
        p.help();
    }

}

async function unpack(name: string, options: any) {
    if (options.debug) {
        process.env.DEBUG = "*";
    }

    // Grab the route either from the option, the argument (if there is only 1)
    let projectRootPath = "";
    try {
        projectRootPath = name ?
            path.resolve(process.cwd(), name) : process.cwd();
    } catch (error) {
        winston.error(error);
        throw new Error("Could not determine route");
    }

    let outputPath = ".funcpack";
    try {
        if (options.path) {
            outputPath = program.opts().path;
        }
    } catch (e) {
        winston.error(e);
        throw new Error("Could not parse the uglify option");
    }

    winston.info("Unpacking project at: " + projectRootPath);
    await Unpacker.unpack({ projectRootPath, outputPath });
    winston.info("Complete!");
}

async function pack(name: string, options: any) {
    if (options.debug) {
        process.env.DEBUG = "*";
    }

    // Grab the route either from the option, the argument (if there is only 1)
    let projectRootPath = "";
    try {
        projectRootPath = name ?
            path.join(process.cwd(), name) : process.cwd();
    } catch (error) {
        winston.error(error);
        throw new Error("Could not determine route");
    }

    let uglify = false;
    try {
        if (options.uglify) {
            uglify = true;
        }
    } catch (e) {
        winston.error(e);
        throw new Error("Could not parse the uglify option");
    }

    let outputPath = ".funcpack";
    try {
        if (options.path) {
            outputPath = program.opts().path;
        }
    } catch (e) {
        winston.error(e);
        throw new Error("Could not parse the uglify option");
    }

    // Create new generator object with settings
    const generator = new PackhostGenerator({
        projectRootPath,
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
            projectRootPath,
            uglify,
            outputPath,
        });
    } catch (error) {
        winston.error(error);
        throw new Error("Could not webpack project");
    }

    winston.info("Complete!");
    process.exit(0);
}

runCli();
