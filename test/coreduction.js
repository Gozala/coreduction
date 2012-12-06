"use strict";

var test = require("reducers/test/util/test")
var event = require("reducers/test/util/event")

var take = require("reducers/take")
var concat = require("reducers/concat")
var delay = require("reducers/delay")


var end = require("reducible/end")

var coreduction = require("../coreduction")

exports["test ignore values before both yielded"] = test(function(assert) {
  var e1 = event()
  var e2 = event()
  var e3 = event()

  var actual = concat(coreduction(e1, e2), e3)

  assert(actual, [
    ["l3", "r1"],
    ["l3", "r2"],
    ["l4", "r2"],
    ["l5", "r2"],
    ["l5", "r3"]
  ], "values paired once both strat yielding")

  e1.send("l1")
  e1.send("l2")
  e1.send("l3")
  e2.send("r1")
  e2.send("r2")
  e1.send("l4")
  e1.send("l5")
  e2.send("r3")
  e2.send(end)

  assert.ok(e2.isReduced, "right is reduced")
  assert.ok(!e1.isReduced, "left is not reduced")

  e1.send("l6")

  assert.ok(e1.isReduced, "next yield stops left")

  e3.send(end)
})

exports["test either end ends coreduction"] = test(function(assert) {
  var e1 = event()
  var e2 = event()
  var e3 = event()

  var actual = concat(coreduction(e1, e2), e3)

  assert(actual, [
    ["l3", "r1"],
    ["l3", "r2"],
    ["l4", "r2"],
    ["l5", "r2"],
    ["l5", "r3"]
  ], "either end ends coreduction")

  e1.send("l1")
  e1.send("l2")
  e1.send("l3")
  e2.send("r1")
  e2.send("r2")
  e1.send("l4")
  e1.send("l5")
  e2.send("r3")
  e1.send(end)

  assert.ok(e1.isReduced, "left is reduced")
  assert.ok(!e2.isReduced, "right is not reduced")

  e2.send("r4")

  assert.ok(e2.isReduced, "next yield stops right")

  e3.send(end)
})

exports["test stop reduction before end"] = test(function(assert) {
  var e1 = event()
  var e2 = event()
  var e3 = event()

  var pairs = take(coreduction(e1, e2), 4)
  var actual = concat(pairs, e3)

  assert(actual, [
    ["l3", "r1"],
    ["l3", "r2"],
    ["l4", "r2"],
    ["l5", "r2"],
  ], "either end ends coreduction")

  e1.send("l1")
  e1.send("l2")
  e1.send("l3")
  e2.send("r1")
  e2.send("r2")
  e1.send("l4")
  e1.send("l5")
  e2.send("r3")
  e1.send("l6")
  assert.ok(e1.isReduced, "left is reduced")
  assert.ok(e2.isReduced, "right is reduced")

  e3.send(end)
})

exports["test reducibles stop on left error"] = test(function(assert) {
  var boom = Error("Boom!!")

  var e1 = event()
  var e2 = event()

  var pairs = coreduction(e1, e2)
  var actual = delay(pairs)

  assert(actual, {
    error: boom,
    values: [
      ["l3", "r1"],
      ["l3", "r2"],
      ["l4", "r2"],
      ["l5", "r2"],
      ["l5", "r3"]
    ]
  }, "error propagate to reducer and stops reducibles")

  e1.send("l1")
  e1.send("l2")
  e1.send("l3")
  e2.send("r1")
  e2.send("r2")
  e1.send("l4")
  e1.send("l5")
  e2.send("r3")
  e1.send(boom)

  assert.ok(e1.isReduced, "left is reduced")
  assert.ok(!e2.isReduced, "right is not reduced")

  e2.send("r4")
  e1.send("l6")

  assert.ok(e2.isReduced, "next yield stops right")
})

exports["test reducibles stop on right error"] = test(function(assert) {
  var boom = Error("Boom!!")

  var e1 = event()
  var e2 = event()

  var pairs = coreduction(e1, e2)
  var actual = delay(pairs)

  assert(actual, {
    error: boom,
    values: [
      ["l3", "r1"],
      ["l3", "r2"],
      ["l4", "r2"],
      ["l5", "r2"],
      ["l5", "r3"]
    ]
  }, "error propagate to reducer and stops reducibles")

  e1.send("l1")
  e1.send("l2")
  e1.send("l3")
  e2.send("r1")
  e2.send("r2")
  e1.send("l4")
  e1.send("l5")
  e2.send("r3")
  e2.send(boom)

  assert.ok(e2.isReduced, "right is reduced")
  assert.ok(!e1.isReduced, "left is not reduced")

  e2.send("r4")
  e1.send("l6")

  assert.ok(e1.isReduced, "next yield stops left")
})

exports["test manual assembly"] = test(function(assert) {
  var e1 = event()
  var e2 = event()
  var e3 = event()

  var actual = concat(coreduction(e1, e2, function(left, right) {
    return left + " : " + right
  }), e3)

  assert(actual, [
    "l3 : r1",
    "l3 : r2",
    "l4 : r2",
    "l5 : r2",
    "l5 : r3"
  ], "values assembled via assembly function")

  e1.send("l1")
  e1.send("l2")
  e1.send("l3")
  e2.send("r1")
  e2.send("r2")
  e1.send("l4")
  e1.send("l5")
  e2.send("r3")
  e2.send(end)

  assert.ok(e2.isReduced, "right is reduced")
  assert.ok(!e1.isReduced, "left is not reduced")

  e1.send("l6")

  assert.ok(e1.isReduced, "next yield stops left")

  e3.send(end)
})
