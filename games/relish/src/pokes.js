// -- constants --
const kPokes = {
  ...initPoke({
    name: "point",
    w: 1,
    h: 1,
    data: [
      1,
    ]
  }),
  ...initPoke({
    name: "glider",
    w: 3,
    h: 3,
    data: [
      0, 1, 0,
      0, 0, 1,
      1, 1, 1,
    ]
  }),
  ...initPoke({
    name: "square",
    w: 3,
    h: 3,
    data: [
      1, 1, 1,
      1, 1, 1,
      1, 1, 1,
    ],
  }),
  ...initPoke({
    name: "circle",
    w: 4,
    h: 4,
    data: [
      0, 1, 1, 0,
      1, 1, 1, 1,
      1, 1, 1, 1,
      0, 1, 1, 0,
    ],
  }),
}

function initPoke(props) {
  const plate = {
    ...props,
    get w2() {
      return Math.trunc(this.w / 2)
    },
    get h2() {
      return Math.trunc(this.h / 2)
    },
  }

  return {
    [props.name]: plate
  }
}

// -- queries --
export function getPoke(name) {
  return kPokes[name]
}
