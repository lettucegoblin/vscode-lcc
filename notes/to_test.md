# Things To Test / Ask

- [ ] How does the LCC treat single single-quotes and double-quotes as arguments?
- [ ] How ought the LCC to syntax highlight single single-quotes and double-quotes as arguments?
- [ ] Can 'add' and 'sub' take hexidecimal numbers as their 3rd argument, or may they only take registers and integers?
- [ ] Should lines like `badString1:    .string abc"` be syntax highlighted and given correct hover information even if they have errors in them? (e.g. w/ non-terminated/non-enclosed strings, or invalid arg types)?