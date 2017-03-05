# Azure Functions Pack

This is a tool to make it easy to package your Azure Functions Node.js Functions for optimal performance on Azure Functions.

:construction: This project is experimental; use with caution and be prepared for breaking changes :construction:

## How to run

```
npm install -g azure-functions-pack
funcpack pack ./
```

You can then test locally using the CLI tool: `func run <myfunc>`

When uploading your files, you need to include your `package.json`, but you don't need your `node_modules` directory.

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

## License

[MIT](LICENSE)