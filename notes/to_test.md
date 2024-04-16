# Things To Test / Ask

- [ ] How does the LCC treat single single-quotes and double-quotes as arguments? For example: `   .word '`
  - [ ] text single quote args
  - [ ] test double quote args
- [ ] How ought the LCC to syntax highlight single single-quotes and double-quotes as arguments? No syntax highlighting at all (if they are considered errors)?
  - [ ] inspect how single quote arg is highlighted currently
  - [ ] inspect how double quote arg is highlighted currently
  - [ ] discuss w/ team
- [ ] Can 'add' and 'sub' take hexidecimal numbers as their 3rd argument, or may they only take registers and integers?
  - [ ] test using add w/ hex arg
  - [ ] test using sub w/ hex arg
- [ ] Should lines like `badString1:    .string abc"` be syntax highlighted and given correct hover information even if they have errors in them? (e.g. w/ non-terminated/non-enclosed strings, or invalid arg types)?
  - [ ] discuss w/ team
  - [ ] On a similar note to syntax highlighting for lines w/ bad strings, currently (as of 1.1.4) the syntax highlighting for `   .word 'a;'` treats the last 2 chars as comment. This is because the .word argument expects a valid char to follow it, and 'a;' is not a valid char, therefore, there is no syntax highlighting applied to 'a;' and it gets the default comment highlighting. Is this something that we want to try and prevent from happening, or is this tolerable for now?
    - [ ] discuss w/ team