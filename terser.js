// const cmds = {
//   I: (x) => x,
//   K: (x) => (y) => x,
//   A: (f) => (x) => f(x),
//   T: (x) => (f) => f(x),
//   W: (f) => (x) => f(x)(x),
//   C: (f) => (y) => (x) => f(x)(y),
//   B: (f) => (g) => (x) => f(g(x)),
//   s: (f) => (g) => (x) => f(x)(g(x)),
//   S: (f) => (g) => (x) => f(g(x))(x),
//   $: (f) => (g) => (h) => (x) => f(g(x))(h(x)),
//   P: (f) => (g) => (x) => (y) => f(g(x))(g(y)),
//   Y: (f) => ((g) => g(g))((g) => f((x) => g(g)(x))),
//   "^": (a) => [...a].sort(),
//   v: (a) => [...a].sort().reverse(),
//   "<": (a) => [...a].reverse(),
//   "-": (v) => (f) => v.reduce(f),
//   _: (l) => [...new Array(l).keys()],
// };
console.error = (x) => {
  console.log("\x1b[1m\x1b[31m" + x + "\x1b[0m");
  throw x;
};

const tokenize = (str) => str.match(/\[|\]|\((.*?)\)|\/\d|[^\s[\]]/g);

const parse = (tokens, ast = []) => {
  const t = tokens.shift();
  return t === undefined
    ? ast //.pop()
    : t === "["
    ? (ast.push(parse(tokens, [])), parse(tokens, ast))
    : t === "]"
    ? ast
    : parse(tokens, [...ast, t]);
};

const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x);

const isAtom = (expr) => !Array.isArray(expr) || !expr.length;
const evaluate = (ast, ctx) => {
  if (ast === undefined) console.error("Invalid parameter list");
  if (ctx === undefined) console.error("Lost Context");
  else if (isAtom(ast)) {
    try {
      for (const [key, val] of ctx) {
        if (key === ast) return val;
      }
    } catch (error) {
      console.error("Unbalanced brackets");
    }
    return ast;
  } else {
    if (ast[0][0] === "(") {
      // console.log(ast);
      res = ast[0]
        .slice(1, -2)
        .split("")
        .reduceRight(
          (acc, fn) => [fn, acc],
          [ast[0].slice(-2, -1), ...ast.slice(1)]
        );
      return evaluate(res, ctx);
    }
    const func = evaluate(ast[0], ctx);
    return func instanceof Function ? func(ast.slice(1), ctx) : func;
  }
};
// [(.-<:)/0/1]
// [.[-[<[:/0/1]]]]

env = [
  ["^", ([a], ctx) => [...evaluate(a, ctx)].sort()],
  ["<", ([a], ctx) => [...evaluate(a, ctx)].reverse()],
  ["-", ([a, b], ctx) => evaluate(a, ctx).reduce(evaluate(b, ctx))],
  ["+", ([a], ctx) => [...new Array(evaluate(a, ctx)).keys()]],
  ["m", ([a, b], ctx) => evaluate(a, ctx).map(evaluate(b, ctx))],
  ["f", ([a, b], ctx) => evaluate(a, ctx).filter(evaluate(b, ctx))],
  [".", ([a, b], ctx) => [...evaluate(a, ctx), ...evaluate(b, ctx)]],
  [
    "x",
    ([a, b], ctx) => [
      evaluate(a, ctx).slice(0, evaluate(b, ctx)),
      evaluate(a, ctx).slice(evaluate(b, ctx)),
    ],
  ],
  ["I", (x, ctx) => evaluate(x, ctx)],
  ["A", ([a, b], ctx) => evaluate(a, ctx)(evaluate(b, ctx))],
  ["T", ([a, b], ctx) => evaluate(b, ctx)(evaluate(a, ctx))],
];

const terser = (code, ...vals) => {
  let i = -1;
  for (const v of vals) {
    env = [...env, [`/${++i}`, v]];
  }
  const res = parse(tokenize(code)).reduce(
    (ctx, line) => evaluate(line, ctx),
    env
  );

  return res;
};

console.log(
  terser(
    "[x[(I<+-)[f[m/0/1]/2]/1]/3]",
    [8, 4, 5, 7, 6, 3],
    (a, b) => a + b,
    (x) => x < 10,
    7
  )
);
