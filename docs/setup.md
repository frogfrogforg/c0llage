# setup

this page contains instructions to help you get up and running with the local development server.

## table of contents

- [install](#server)
- [server](#running)
- [macos](#macos)
- [windows](#windows)

## install [↑](#table-of-contents)

we need `nodejs` (13.x or better, i think) to run our dev server. the instructions for your platform, either [macos](#macos) or [windows](#windows) should help you get it installed.

installing `node` also installs `npm` (the "node package manager"). if you `cd` to the project directory, you can install the "node packages" our dev server needs:

```sh
$ npm install
```

you *should* only need to do this once.

## server [↑](#table-of-contents)

once installed, in the project directory you can start the dev server like so:

```sh
$ npm start
```

you should then be able to view the site [here](http://localhost:8888).

### gotchas
there server has at least one bug. if you rename or delete a file, it will probably crash. if you start it again it should be fine.

## macos [↑](#table-of-contents)

on mac, installation is easier if you have [homebrew](https://brew.sh). if you don't, you can install it like so:

```sh
$ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

then, use homebrew to install node:

```sh
$ brew install node
```

now hop back to the shared [install instructions](#install)

## windows [↑](#table-of-contents)

on windows, installation is easier if you have [chocolatey](https://chocolatey.org/install#individual). the instructions are a little too complex to copy here. but the "individual" section has what you need. you'll need to run them in an administrator powershell. search for "powershell", right-click the icon, and select "run as administrator".

then, still in an administrator powershell, use choco to install git:

```sh
$ choco install git
```

this command installs a *new* shell, "git bash", more powerful than powershell. open "git bash" and close powershell forever. now in git bash, use choco to install node:

```sh
$ choco install nodejs
```

**lastly**, you also need to enable `developer mode`. search for "developer settings"; it should be the first toggle on that settings screen. congratulations, developer!

now hop back to the shared [install instructions](#install).
