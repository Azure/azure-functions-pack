# Azure Functions Pack

This is a tool to make it easy to package your Azure Functions Node.js Functions for optimal performance on Azure Functions.

## The problem addressed

Whenever an Azure Function App is recreated on demand (a so called "cold start") the node'js module cache for each Function will be empty. The current Functions file system is sluggish in dealing with many small file accesses so there is a significant delay as node reads all the module files. Fortunately, node caches the modules in memory so subsequent accesses are fast.

## The solution

A javascript module bundler (webpack) is used to place all the modules in a single file. The Function `functions.json` files are then modified so this bundle is used rather than the separate modules files. Magic!

:construction: This project is experimental; use with caution and be prepared for breaking changes :construction:

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

    -h, --help     output usage information
    -V, --version  output the version number
    -d, --debug    Emits debug messages
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

    -h, --help           output usage information
    -u, --uglify         Uglify the project when webpacking
    -o, --output <path>  Path for output directory
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
