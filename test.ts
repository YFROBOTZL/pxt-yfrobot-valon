// tests go here; this will not be compiled when this package is used as a library
basic.forever(function () {
    valon.motorRun(ValonMotors.MAll, ValonDir.CW, 120)
    basic.pause(1000)
    valon.motorRun(ValonMotors.MAll, ValonDir.CCW, 120)
    basic.pause(1000)
})
