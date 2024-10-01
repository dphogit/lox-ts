# lox-ts

My own (barebone) TypeScript implementation of a Tree-Walk Interpreter for the [Lox](https://www.craftinginterpreters.com/the-lox-language.html)
programming language. This follows [Crafting Interpreters](https://www.craftinginterpreters.com/),
which originally implements this in Java.

## Usage

```shell
# Run the REPL
npm start

# Run a Lox File
npm start -- <script>
```

### Examples

I have included two demo Lox files in the `/lox` folder.

1. `fib.lox` - Demos native clock function and more simple script
2. `shapes.lox` - Demos majority of features implemented

### Tests

I also did write some unit tests as well (but got lazy towards the end as usual):

```shell
npm test
```
