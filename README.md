# c0llage

live @ https://nostalgic-engelbart.netlify.app/

| channel | status                                                                                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| dev     | [![Netlify Status](https://api.netlify.com/api/v1/badges/2d805f27-ae43-4430-a3a1-be770b1f47e0/deploy-status)](https://app.netlify.com/sites/hungry-engelbart/deploys)    |
| live    | [![Netlify Status](https://api.netlify.com/api/v1/badges/6860a8e5-060b-4ff4-8fbc-7643404c0d84/deploy-status)](https://app.netlify.com/sites/nostalgic-engelbart/deploys) |

## [Documentation](./docs/index.md)

## Events

  [This page](Events.md) describes how to use the event system we currently have in place.

## how 2 haunt

To start haunting:
```
git config --local user.name "ghost" && git config --local user.email "ghost"
```

To unhaunt (stop haunting):
```
git config --local user.name "<your name>" && git config --local user.email "<your email>"
```

You can make some aliases so that you can write only `git haunt` and `git unhaunt` and not have to remember the rest, which make it really nice:
```sh
git config --global alias.haunt "!git config --local user.name \"ghost\" && git config --local user.email \"ghost\""
```

```sh
git config --global alias.unhaunt "!git config --local user.name \"<your name>\" && git config --local user.email \"<your email>\""
```

And also, we could all just be eternally haunting, but if we have fixed ghost names it's easier to figure out.

TODO: is there a way to create an alias command that has parameters, so I can change my ghost name more easily?

## Credits:

[Natalie Lawhead's](https://alienmelon.itch.io/)'s [JUMP_SCARES_FOR_YOUR_WEBSITE.js](http://tetrageddon.com/scaresoft/)

[Pippin Barr's](http://www.pippinbarr.com/) [Let's Play: Ancient Greek Punishment Bitsy Demake](https://github.com/pippinbarr/lets-play-ancient-greek-punishment-bitsy-demake)

[Bitsy Hacks](https://github.com/seleb/bitsy-hacks). But more specifically this awesome tool that helps you add the hacks in a nice way: https://ayolland.itch.io/borksy

[jsnes](https://github.com/bfirsh/jsnes) browser snes emulator

[Max Bittker's broider](https://maxbittker.github.io/broider/) an very nice css border pattern making tool

[hundred rabbits' dotgrid](https://hundredrabbits.itch.io/dotgrid) a cool lightweight svg icon editor
