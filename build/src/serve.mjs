import handler from "serve-handler"
import http from "http"
import { paths } from "./paths.mjs"
import { log } from "./log.mjs"

// -- constants --
const kPort = 8888

// -- commands --
export function serve() {
  return new Promise((res, _) => {
    const server = http.createServer((request, response) => {
      return handler(request, response, {
        public: paths.dist,
        symlinks: true,
      })
    })

    server.listen(kPort, () => {
      log.info(`- running on http://localhost:${kPort}`)
      res()
    })
  })
}
