// -- commands --
export async function loadEl(el) {
  const res = new Promise((resolve) => {
    el.addEventListener("load", function listener() {
      el.removeEventListener("load", listener)
      resolve()
    })
  })

  return res
}

export async function loadAssets(assets) {
  // mirror the asset structure
  const memo = {}

  // flatten assets into list of [keypath, path]
  const keypaths = makeKeypaths(assets)

  // fetch all the assets
  const promises = keypaths.map(async ([keypath, path]) => {
    // fetch asset
    const res = await fetch(path)
    const val = await parseAsset(res)

    // write the val back to the correct spot in memo
    const n = keypath.length

    let obj = memo
    for (let i = 0; i < n - 1; i++) {
      const key = keypath[i]
      if (obj[key] == null) {
        obj = obj[key] = {}
      } else {
        obj = obj[key]
      }
    }

    // make sure to merge any props
    obj[keypath[n - 1]] = val

    // return val
    return val
  })

  // wait for all the promises to finish
  await Promise.all(promises)

  // and return the mirrored structure
  return memo
}

// -- c/helpers
function parseAsset(res) {
  switch (res.headers.get("Content-Type")) {
    case "image/png":
      return parseImage(res)
    default: // plain/text, shader
      return res.text()
  }
}

async function parseImage(res) {
  const blob = await res.blob()

  // build img element
  const img = new Image()
  img.src = URL.createObjectURL(blob)

  // wait for it to load; local so it should be 1-frame?
  await loadEl(img)

  return img
}

function makeKeypaths(paths) {
  const entries = []

  for (const key in paths) {
    const val = paths[key]

    if (!(val instanceof Object)) {
      entries.push([[key], val])
    } else {
      const nested = makeKeypaths(val)

      for (const entry of nested) {
        entry[0].unshift(key)
      }

      entries.push(...nested)
    }
  }

  return entries
}
