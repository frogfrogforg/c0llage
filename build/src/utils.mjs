import { promises as fs } from "fs"

// -- queries --
export async function read(path) {
  return await fs.readFile(path, {
    encoding: "utf-8",
  })
}
