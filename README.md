# LaunchDarkly Pre-requisites Graph Generator

> Generates a [DOT][1] file which can be built to an image depicting the
> pre-requisite relationship in your LaunchDarkly setup

### Commands

**Note:** There might be some flags that start with a digit `[0-9]`. DOT doesn't
compile if there are nodes with identifiers starting with a digit. The script
will prefix `flag_` to make sure that they are valid identifiers.

```sh
LD_API_KEY=$LD_API_KEY node index.js;
# For incomplete flag configurations
sed -ie "/->  \[/d" test.dot;
dot -Tsvg -O test.dot;
```

[1]: https://www.graphviz.org/doc/info/lang.html
