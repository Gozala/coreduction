"use strict";

var reducible = require("reducible/reducible")
var reduced = require("reducible/reduced")
var end = require("reducible/end")
var isError = require("reducible/is-error")
var isReduced = require("reducible/is-reduced")
var reduce = require("reducible/reduce")

// Special value indicating that no value has being aggregated.
var nil = new String("Indication of no value")

function coreduction(left, right, assemble) {
  /**
  Takes two reducibles and returns reducible of pairs, where each item from
  either input is paired with a last item from the other. This of course means
  that items from both left and right side may repeat many times. Result ends
  once either of the inputs end. Optionally `assemble` function may be passed
  as a third argument in which case it will be invoked with pairs as arguments
  to produce values of the resulting reducible.
  **/

  assemble = typeof(assemble) === "function" ? assemble : Array
  return reducible(function reduceCoupled(next, initial) {
    var result
    var state = initial
    var leftValue = nil
    var rightValue = nil

    function reducer(isLeft) {
      // create a reducer function for either left or right reducible.
      return function coreduce(value) {
        // If result is already set then either `left` or `right` reducible
        // has finished or broke and stored `reduced` state returning which
        // should signal source to stop reduction.
        if (result) return result
        // If `end` or error value is yield store result and pass value down
        // the flow so that error / end can be handled.
        if (value === end || isError(value)) {
          result = reduced(state)
          return next(value, state)
        }

        // Update last value for the associated reducible.
        if (isLeft) leftValue = value
        else rightValue = value

        // If both reducibles yielded already values couple last ones
        // and pass it down the flow.
        if (leftValue !== nil && rightValue !== nil) {
          state = next(assemble(leftValue, rightValue), state)

          // If reduction is complete store result to stop the other reducible.
          if (isReduced(state)) result = state

          return state
        }
      }
    }

    reduce(left, reducer(true))
    reduce(right, reducer(false))
  })
}

module.exports = coreduction
