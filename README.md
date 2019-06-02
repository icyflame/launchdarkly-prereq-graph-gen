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

### Example

[Dot file][2]
[Compiled image][3]

- 6 flags in LaunchDarkly
- A has a pre-requisite of `B.variation-0`
- C has a pre-requisite of `D.variation-2`
- A has a pre-requisite of `E.variation-1`
- F has a pre-requisite of `B.variation-0`

From the graph, it becomes clear that as the targetting for D is off (indicated
by the red color box), the flag C is not really targetting any users.

[1]: https://www.graphviz.org/doc/info/lang.html
[2]: ./example.dot
[3]: ./example.dot.svg
