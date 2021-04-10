import { getPoke } from "./pokes.js"

// -- constants --
const kPlates = {
  ...initPlate({
    name: "gol",
    poke: "glider",
    colors: [
      "#64783D",
      "#6E907A",
      "#77BA35",
      "#457672",
    ]
  }),
  ...initPlate({
    name: "bar",
    poke: "square",
    data: {
      float0: 5.0,
    },
  }),
  ...initPlate({
    name: "sky",
    poke: "point",
    data: {
      float0: 8,
      float1: 0.70,
      float2: 0.98,
    },
  }),
  ...initPlate({
    name: "dot",
    poke: "circle",
  }),
  ...initPlate({
    name: "swp",
  }),
  ...initPlate({
    name: "stp",
  }),
}

// -- lifetime --
function initPlate({
  poke,
  colors,
  data,
  ...props
}) {
  const plate = {
    ...props,
    poke: getPoke(poke
      || "point"),
    colors: colors
      || [],
    data: {
      float0: 0.0,
      float1: 0.0,
      float2: 0.0,
      float3: 0.0,
      ...data,
    },
    getData(name) {
      return this.data[name]
    }
  }

  return {
    [props.name]: plate
  }
}

// -- queries --
export function getPlate(name) {
  return kPlates[name]
}
