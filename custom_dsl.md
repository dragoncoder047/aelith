<!-- markdownlint-disable no-trailing-punctuation no-emphasis-as-heading -->
# I had a pretty terrible idea!

Sorta revive the abandoned Syd DSL and make it using a bytecode VM. However change it so that the syntax resembles Lua/Ruby more (no weirdness there??)

The operator-lifting algorithm can do the heavy lifting by defining it not in terms of infix and prefix only, but in terms of general patterns.

The general parser will parse primitive tokens such as numbers, strings, symbols, separators, and groups such as paren, square, or curly blocks, but inside the blocks, it will be up to the pattern collapsing algorithm which can be added to by mods!

## Name?

"Crak", file extension `.crk`. For no good reason.
