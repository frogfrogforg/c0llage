// -- types --
const LogLevel = {
  Info: 1,
  Debug: 2,
}

// -- constants --
const kLogLevel = LogLevel.Info

// -- impls --
export const log = {
  info(...messages) {
    this.add(LogLevel.Info, messages)
  },
  debug(...messages) {
    this.add(LogLevel.Debug, messages)
  },
  // -- i/helpers
  add(level, messages) {
    if (level <= kLogLevel) {
      console.log(...messages)
    }
  },
}
