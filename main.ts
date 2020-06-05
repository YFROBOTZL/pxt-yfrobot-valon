/**
 * YFRobot valon extension for Microbit
 * 
 * http://www.yfrobot.com/wiki/index.php?title=Valon-I
 * http://www.yfrobot.com
 * 
 * @author [email](yfrobot@qq.com)
 */

enum YFVPingUnit {
    //% block="cm"
    Centimeters,
}

//% color="#31C7D5" weight=10 icon="\uf1d4"
namespace valon {

    // motor pin 
    let yfMotorLD = DigitalPin.P13;
    let yfMotorLA = AnalogPin.P14;
    let yfMotorRD = DigitalPin.P15;
    let yfMotorRA = AnalogPin.P16;



    let initialized = false
    let initializedMatrix = false
    let neoStrip: neopixel.Strip;
    let matBuf = pins.createBuffer(17);
    let distanceBuf = 0;

    // Motor
    export enum YFVMotors {
        //% blockId="yf_left_motor" block="left"
        ML = 0,
        //% blockId="yf_right_motor" block="right"
        MR = 1,
        //% blockId="yf_all_motor" block="all"
        MAll = 2
    }

    // motor dir
    export enum YFVDir {
        //% blockId="yf_CW" block="Forward"
        CW = 0x0,
        //% blockId="yf_CCW" block="Backward"
        CCW = 0x1
    }

    export enum YFVLED {
        //% blockId="yf_LEDLeft" block="left"
        LEDLeft = 10,
        //% blockId="yf_LEDRight" block="right"
        LEDRight = 9
    }

    export enum YFVLEDswitch {
        //% blockId="yf_LEDturnOn" block="ON"
        turnOn = 0x01,
        //% blockId="yf_LEDturnOff" block="OFF"
        turnOff = 0x00
    }

    // Patrol
    export enum YFVPatrol {
        //% blockId="yf_patrolLeft" block="left"
        PatrolLeft = 1,
        //% blockId="yf_patrolMiddle" block="middle"
        PatrolMiddle = 2,
        //% blockId="yf_patrolRight" block="right"
        PatrolRight = 8
    }

    export enum YFVSonarVersion {
        V1 = 0x1,
        V2 = 0x2
    }

    export enum YFVTurns {
        //% blockId="T1B4" block="1/4"
        T1B4 = 90,
        //% blockId="T1B2" block="1/2"
        T1B2 = 180,
        //% blockId="T1B0" block="1"
        T1B0 = 360,
        //% blockId="T2B0" block="2"
        T2B0 = 720,
        //% blockId="T3B0" block="3"
        T3B0 = 1080,
        //% blockId="T4B0" block="4"
        T4B0 = 1440,
        //% blockId="T5B0" block="5"
        T5B0 = 1800
    }

    export enum YFVServos {
        S1 = 0x01,
        S2 = 0x02,
        S3 = 0x03,
        S4 = 0x04,
        S5 = 0x05,
        S6 = 0x06,
        S7 = 0x07,
        S8 = 0x08
    }

    function i2cwrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2ccmd(addr: number, value: number) {
        let buf = pins.createBuffer(1)
        buf[0] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cread(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function clamp(value: number, min: number, max: number): number {
        return Math.max(Math.min(max, value), min);
    }


    /**
     * Init RGB pixels mounted on valon
     */
    //% blockId="valon_rgb" block="RGB"
    //% weight=5
    export function rgb(): neopixel.Strip {
        if (!neoStrip) {
            neoStrip = neopixel.create(DigitalPin.P11, 2, NeoPixelMode.RGB)
        }
        return neoStrip;
    }

    /**
     * Turn on/off the LEDs.
     */

    //% weight=100
    //% blockId=yfv_writeLED block="LEDlight|%ledn|turn|%ledswitch"
    //% led.fieldEditor="gridpicker" led.fieldOptions.columns=2 
    //% ledswitch.fieldEditor="gridpicker" ledswitch.fieldOptions.columns=2
    export function writeLED(ledn: YFVLED, ledswitch: YFVLEDswitch): void {
        led.enable(false);
        if (ledn == YFVLED.LEDLeft) {
            pins.digitalWritePin(DigitalPin.P10, ledswitch)
        } else if (ledn == YFVLED.LEDRight) {
            pins.digitalWritePin(DigitalPin.P9, ledswitch)
        } else {
            return
        }
    }

    /**
     * Read ultrasonic sensor.
     */
    //% blockId=valon_ultrasonic_sensor block="read ultrasonic sensor |%unit "
    //% weight=95
    export function Ultrasonic(unit: YFVPingUnit, maxCmDistance = 500): number {
        let d
        pins.digitalWritePin(DigitalPin.P1, 0);
        if (pins.digitalReadPin(DigitalPin.P2) == 0) {
            pins.digitalWritePin(DigitalPin.P1, 1);
            pins.digitalWritePin(DigitalPin.P1, 0);
            d = pins.pulseIn(DigitalPin.P2, PulseValue.High, maxCmDistance * 58);
        } else {
            pins.digitalWritePin(DigitalPin.P1, 0);
            pins.digitalWritePin(DigitalPin.P1, 1);
            d = pins.pulseIn(DigitalPin.P2, PulseValue.Low, maxCmDistance * 58);
        }
        let x = d / 39;
        if (x <= 0 || x > 500) {
            return 0;
        }
        switch (unit) {
            case YFVPingUnit.Centimeters: return Math.round(x);
            default: return Math.idiv(d, 2.54);
        }

    }

    /**
      * drive the motor in direction at speed
      * @param motor motor left/right/all
      * @param direction direction to turn
      * @param speed speed of motors (0 to 255). eg: 120
      */
    //% blockId=yfv_set_motor block="Motor|%motor|dir|%dir|speed|%speed"
    //% weight=85
    //% dir.min=0 dir.max=1
    //% speed.min=0 speed.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=2
    export function motorRun(motor: YFVMotors, direction: YFVDir, speed: number): void {
        if (motor > 2 || motor <= 0)
            return

        speed = clamp(speed, 0, 255) * 255.75;  // 0~255 > 0~1023

        if (motor == YFVMotors.ML) {
            pins.digitalWritePin(yfMotorRD, direction);
            pins.analogWritePin(yfMotorLA, speed);
        } else if (motor == YFVMotors.MR) {
            pins.digitalWritePin(yfMotorRD, direction);
            pins.analogWritePin(yfMotorRA, speed);
        } else if (motor == YFVMotors.MAll) {
            pins.digitalWritePin(yfMotorRD, direction);
            pins.analogWritePin(yfMotorRA, speed);
            pins.digitalWritePin(yfMotorLD, direction);
            pins.analogWritePin(yfMotorLA, speed);
        }
    }
    /**
     * stop the motor
     */
    //% blockId=yfv_stop_motor block="Motor Stop|%motor|"
    //% weight=80
    export function motorStop(motor: YFVMotors): void {
        motorRun(motor, 0, 0);
    }

    /**
      * enable line tracking sensor.
      */
    function enablePatrol(enable: number): void {
        pins.digitalWritePin(DigitalPin.P12, enable);
    }

    /**
      * Read line tracking sensor.
      */
    //% weight=20
    //% blockId=yfv_read_Patrol block="read %patrol| line tracking sensor"
    //% patrol.fieldEditor="gridpicker" patrol.fieldOptions.columns=2 
    export function readPatrol(patrol: YFVPatrol): number {
        enablePatrol(1);
        if (patrol == YFVPatrol.PatrolLeft) {
            return pins.digitalReadPin(DigitalPin.P1)
        } else if (patrol == YFVPatrol.PatrolMiddle) {
            return pins.digitalReadPin(DigitalPin.P2)
        } else if (patrol == YFVPatrol.PatrolRight) {
            return pins.digitalReadPin(DigitalPin.P8)
        } else {
            return -1
        }
    }

    //% blockId=valon_rgbultrasonic block="Ultrasonic|pin %pin"
    //% weight=10
    export function rgbUltrasonic(pin: DigitalPin): number {
        pins.setPull(pin, PinPullMode.PullNone);
        pins.digitalWritePin(pin, 0);
        control.waitMicros(2);
        pins.digitalWritePin(pin, 1);
        control.waitMicros(10);
        pins.digitalWritePin(pin, 0);

        // read pulse
        let d = pins.pulseIn(pin, PulseValue.High, 25000);
        let ret = d;
        // filter timeout spikes
        if (ret == 0 && distanceBuf != 0) {
            ret = distanceBuf;
        }
        distanceBuf = d;

        return Math.floor(ret * 9 / 6 / 58);
    }

    //% blockId=valon_holeultrasonicver block="Ultrasonic|pin %pin|version %v"
    //% weight=10
    export function holeUltrasonic(pin: DigitalPin): number {

        // send pulse
        pins.setPull(pin, PinPullMode.PullDown);
        pins.digitalWritePin(pin, 0);
        control.waitMicros(2);
        pins.digitalWritePin(pin, 1);
        control.waitMicros(10);
        pins.digitalWritePin(pin, 0);

        // read pulse
        let d = pins.pulseIn(pin, PulseValue.High, 25000);
        let ret = d;
        // filter timeout spikes
        if (ret == 0 && distanceBuf != 0) {
            ret = distanceBuf;
        }

        distanceBuf = d;

        return Math.floor(ret / 40 + (ret / 800));
    }



}
