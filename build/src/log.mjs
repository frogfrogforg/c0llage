// -- types --
const LogLevel = {
  Error: 0,
  Info: 1,
  Debug: 2,
}

// -- constants --
const kLogLevel = LogLevel.Info

// -- impls --
function error(...messages) {
  add(LogLevel.Error, messages)
}

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
  error,
  info,
  debug,
  add,
}
