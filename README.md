# Azure Functions Pack

This is a tool to make it easy to package your Azure Functions Node.js Functions for optimal performance on Azure Functions.

:construction: This project is experimental; use with caution and be prepared for breaking changes :construction:

WARNING: This requires host version `1.0.10726.0` or higher.

## How to run

```
npm install -g christopheranderson/azure-functions-pack
funcpack
```

You can then test locally using the CLI tool: `func run <myfunc>`

## API

```
  Usage: funcpack [options]

  Options:

    -h, --help         output usage information
    -V, --version      output the version number
    -d, --debug        Emits debug messages
    -p, --path <path>  Path to root of Function App
```

You can pass the path to the root of your project via:

0. Using the `-p` command: `funcpack -p ./pathToFunctionApp`
1. Just a normal argument: `funcpack ./pathToFunctionApp`
2. Run in the same directory: `cd ./pathToFunctionApp && funcpack`

## License

[MIT](LICENSE)