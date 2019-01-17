# NOTE: This repository is no longer actively maintained
This tool has been replaced with [Run From Package](https://docs.microsoft.com/en-us/azure/azure-functions/run-functions-from-deployment-package).

Azure Functions Pack was created to address significant cold start delays incurred by slow file read operations (read "The problem addressed" below). Azure Functions Pack reduces file read operation delays by condensing everything into one file. Run From Package addresses this same problem by keeping files as one payload and using a virtual file system that is much faster than the slower file system used by default. Run From Package works with function apps written in all languages and includes other benefits (such as atomicity, predictability, and faster deployment). You can read more about the benefits of Run From Package [here](https://github.com/Azure/app-service-announcements/issues/84), and you can read more about deploying with Run From Package [here](https://docs.microsoft.com/azure/azure-functions/run-functions-from-deployment-package). If you are already using [Zip deployment for Azure Functions](https://docs.microsoft.com/azure/azure-functions/deployment-zip-push), it's only a matter of adding `WEBSITE_RUN_FROM_PACKAGE = 1` to your App Settings.

# Azure Functions Pack

This is a tool to make it easy to package your Azure Functions Node.js Functions for optimal performance on Azure Functions.

## The problem addressed

Whenever an Azure Function App is recreated on demand (a so called "cold start") the node'js module cache for each Function will be empty. The current Functions file system is sluggish in dealing with many small file accesses so there is a significant delay as node reads all the module files. Fortunately, node caches the modules in memory so subsequent accesses are fast.

## The solution

A javascript module bundler (webpack) is used to place all the modules in a single file. The Function `functions.json` files are then modified so this bundle is used rather than the separate modules files. Magic!

## How to run

In the Function App directory:

```
npm install -g azure-functions-pack
funcpack pack ./
```

You can then test locally using the CLI tool: `func run <myfunc>`

When uploading your files, you need to include the single `.funcpack` directory (in the Functions App root), but you don't need your `node_modules` directory.

## Alternative when git deploying to Azure Functions

You can set the `SCM_USE_FUNCPACK` app setting to 1, and we'll install your packages and pack them whenever you git deploy. We recommend git deploying into a deployment slot and then swapping to prod to avoid downtime and resource contention. You can learn more about how to customize deployments on the [kudu wiki](https://github.com/projectkudu/kudu/wiki/Configurable-settings#automatically-run-funcpack-on-function-app-git-deployments).

## API

```
Usage: main [options] [command]


  Commands:

    unpack [options] <path>  Will remove all traces of packing tool at the specified path or the current directory if none is specified
    pack [options] <path>    Will pack the specified path or the current directory if none is specified

  Options:

    -h, --help           output usage information
    -u, --uglify         Uglify the project when webpacking
    -o, --output <path>  Path for output directory
    -c, --copyToOutput   Copy files to output directory
```

The `copyToOutput` option will copy all the important files for you to the `output` directory (aka `.funcpack`) and modify them there. This will let you publish from the `output` directory without having to touch your source code or remove your `node_modules` to save space. You can simply:

```
funcpack pack -c .
cd .funcpack
func azure functionapp publish <myapp>
``` 

### unpack

```
Usage: unpack [options] <path>

  Will remove all traces of packing tool at the specified path or the current directory if none is specified

  Options:

    -h, --help           output usage information
    -o, --output <path>  Path for output directory
```

Note: the uglify feature only supports some small amount of es6, so I recommend that if you get errors either don't uglify or drop your code down to es5. 

Uglify will minimize the sample project that's included from 27 MB to 9 MB.

### pack

```
Usage: pack [options] <path>

  Will pack the specified path or the current directory if none is specified

  Options:

    -h, --help               output usage information
    -u, --uglify             Uglify the project when webpacking
    -o, --output <path>      Path for output directory
    -c, --copyToOutput       Copy files to output directory
    -e, --editConfig <path>  Customize webpack config by applying function in this file
```

The `editConfig` option will let you specify a js file containing a function to alter the webpack configuration.

```
// $root/webpack.config.js

module.exports = function(config, webpack) {
    config.plugins.push(new webpack.DefinePlugin({ "global.GENTLY": false }));
    return config;
}
```

### funcpack.config.json

Pack will optionally take in a config file that will let you further customize the behavior. The config file must be in the directory you run the command from and named `funcpack.config.json`.

Here are all the supported options:

```
{
  "ignoredModules":["chai"]
}
```

## License

[MIT](LICENSE)
