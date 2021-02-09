# c0llage

live @ https://frogfrogforg.github.io/c0llage/

## how 2 haunt

`git config --local user.name "ghost"; git config --local user.email "ghost";`

(unhaunt: `git config --local user.name "<your name>"; git config --local user.email "<your email>";`)

I made some aliases for myself, which make it really nice
`git config --global alias.haunt "!git config --local user.name \"ghost\" && git config --local user.email \"ghost\""`

`git config --global alias.unhaunt "!git config --local user.name \"<your name>\" && git config --local user.email \"<your email>\""`

then you can do `git haunt` and `git unhaunt` and not have to worry about this whole stuff. And also, we could all just be eternally haunting.

## Credits:

[Natalie Lawhead's](https://alienmelon.itch.io/)'s [JUMP_SCARES_FOR_YOUR_WEBSITE.js](http://tetrageddon.com/scaresoft/)
