# setup

this page contains instructions that should help you get up and running with the local development server.

## table of contents

- [setup](#server)
- [server](#running)
- [macos](#macos)
- [windows](#windows)

## setup [↑](#table-of-contents)

we need `nodejs` ~v15 to run our dev server. you can follow the [macos](#macos) or [windows](#windows) instructions for your platform to get that installed.

installing `node` also installs `npm` (the "node package manager"). if you `cd` to the project directory, you can install the "node packages" our dev server needs:

```sh
$ npm install
```

## server [↑](#table-of-contents)

in the project directory, start the dev server.

```sh
$ npm start
```

then you should be able to view [the site](http://localhost:8888).

## macos [↑](#table-of-contents)

on mac, it's easiest if you have [homebrew](https://brew.sh). if you don't, you can install it like so:

```sh
$ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

then, install node:

```sh
$ brew install node
```

now you can hop back to the shared [setup](#setup)

## windows [↑](#table-of-contents)

on windows, it's easiest if you install [chocolatey](https://chocolatey.org/install#individual). search for "powershell", right-click and select "run as administrator". the linked instructions are a little too complex to copy here. but the "individual" section have what you need.

then, still in an administrator powershell, install git:

```sh
$ choco install git
```

this will install a new shell, "git bash", that is the good one. open "git bash" and close powershell forever. now, install node:

```sh
$ choco install nodejs
```

lastly, you also need to enable `developer mode`. search for "developer settings", and it should be the first toggle. congrats, now you are a developer.

now you can hop back to the shared [setup](#setup).
