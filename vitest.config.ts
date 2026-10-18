// Vitest looks for a config file in the parent directories as well. This file
// keeps the packages on the Vitest defaults when elpis is a submodule of a
// repository that has its own config. It imports nothing, since the
// repository root does not depend on vitest.
export default {}
