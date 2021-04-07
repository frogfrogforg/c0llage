// -- types --
const LogLevel = {
  Info: 1,
  Debug: 2,
}

// -- constants --
const kLogLevel = LogLevel.Info

// -- impls --
function info(...messages) {
  add(LogLevel.Info, messages)
}

function debug(...messages) {
  add(LogLevel.Debug, messages)
}

function add(level, messages) {
  if (level <= kLogLevel) {
    console.log(...messages)
  }
}

// -- exports --
export const log = {
  info,
  debug,
  add,
}
