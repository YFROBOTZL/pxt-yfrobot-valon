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

/**
  * Pre-Defined LED colours
  */
enum YFVColors {
    //% block=red
    Red = 0xff0000,
    //% block=orange
    Orange = 0xffa500,
    //% block=yellow
    Yellow = 0xffff00,
    //% block=green
    Green = 0x00ff00,
    //% block=blue
    Blue = 0x0000ff,
    //% block=indigo
    Indigo = 0x4b0082,
    //% block=violet
    Violet = 0x8a2be2,
    //% block=purple
    Purple = 0xff00ff,
    //% block=white
    White = 0xffffff,
    //% block=black
    Black = 0x000000
}

enum state {
    state1 = 0x10,
    state2 = 0x11,
    state3 = 0x20,
    state4 = 0x21,
    state5 = 0x30,
    state6 = 0x31
}
interface KV {
    key: state;
    action: Action;
}

//% color="#31C7D5" weight=10 icon="\uf1d4"
namespace valon {

    // motor pin 
    let valonMotorLD = DigitalPin.P13;
    let valonMotorLA = AnalogPin.P14;
    let valonMotorRD = DigitalPin.P15;
    let valonMotorRA = AnalogPin.P16;
    // ultrasonic pin
    let valonUltrasonicTrig = DigitalPin.P5;
    let valonUltrasonicEcho = DigitalPin.P11;
    // patrol pin
    let valonPatrolLeft = DigitalPin.P1;
    let valonPatrolMiddle = DigitalPin.P2;
    let valonPatrolRight = DigitalPin.P8;

    //
    let valonEyesPin = DigitalPin.P11;
    let valonEyesNum = 2;
    let valonEyesMode = 1; // RGB (GRB format)

    let initialized = false
    let neoStrip: neopixel.Strip;
    let distanceBuf = 0;


    let kbCallback: KV[] = []

    // Motor
    export enum YFVMotors {
        //% blockId="valon_left_motor" block="left"
        ML = 0,
        //% blockId="valon_right_motor" block="right"
        MR = 1,
        //% blockId="valon_all_motor" block="all"
        MAll = 2
    }

    // motor dir
    export enum YFVDir {
        //% blockId="valon_CW" block="Forward"
        CW = 0,
        //% blockId="valon_CCW" block="Backward"
        CCW = 1
    }

    export enum YFVLED {
        //% blockId="LEDLeft" block="left"
        LEDLeft = 10,
        //% blockId="LEDRight" block="right"
        LEDRight = 9
    }

    export enum YFVLEDswitch {
        //% blockId="LEDturnOn" block="ON"
        turnOn = 0x01,
        //% blockId="LEDturnOff" block="OFF"
        turnOff = 0x00
    }

    export enum YFVRGBEYES {
        //% blockId="valon_EyesLeft" block="left"
        EyesLeft = 1,
        //% blockId="valon_EyesRight" block="right"
        EyesRight = 0,
        //% blockId="valon_EyesALL" block="all"
        MAll = 2
    }

    // Patrol
    export enum YFVPatrol {
        //% blockId="valon_patrolLeft" block="left"
        PatrolLeft = 1,
        //% blockId="valon_patrolMiddle" block="middle"
        PatrolMiddle = 2,
        //% blockId="valon_patrolRight" block="right"
        PatrolRight = 8
    }

    export enum YFVPatrol1 {
        //% blockId="valon_patrolLeft" block="left"
        PatrolLeft = 0x10,
        //% blockId="valon_patrolMiddle" block="middle"
        PatrolMiddle = 0x20,
        //% blockId="valon_patrolRight" block="right"
        PatrolRight = 0x30
    }
    export enum YFVVoltage {
        //% block="high"
        High = 0x01,
        //% block="low"
        Low = 0x00
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
     * Turn on/off the LEDs.
     */

    //% weight=100
    //% blockId=valon_writeLED block="LEDlight |%ledn turn |%ledswitch"
    //% ledn.fieldEditor="gridpicker" ledn.fieldOptions.columns=2 
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
        // send pulse
        pins.setPull(valonUltrasonicTrig, PinPullMode.PullNone);
        pins.digitalWritePin(valonUltrasonicTrig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(valonUltrasonicTrig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(valonUltrasonicTrig, 0);

        // read pulse
        // d = pins.pulseIn(valonUltrasonicEcho, PulseValue.High, maxCmDistance * 58);  // 8 / 340 = 
        d = pins.pulseIn(valonUltrasonicEcho, PulseValue.High, 25000);
        let ret = d;
        // filter timeout spikes
        if (ret == 0 && distanceBuf != 0) {
            ret = distanceBuf;
        }
        distanceBuf = d;

        return Math.floor(ret * 9 / 6 / 58);
        // switch (unit) {
        //     case YFVPingUnit.Centimeters: return Math.idiv(d, 58);
        //     default: return d;
        // }

    }

    /**
      * drive the motor in direction at speed
      * @param motor motor left/right/all
      * @param direction direction to turn
      * @param speed speed of motors (0 to 255). eg: 120
      */
    //% blockId=valon_motor_run block="Motor|%motor dir|%direction speed|%speed"
    //% weight=85
    //% speed.min=0 speed.max=255
    //% motor.fieldEditor="gridpicker" motor.fieldOptions.columns=2
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    export function motorRun(motor: YFVMotors, direction: YFVDir, speed: number): void {
        if (motor > 2 || motor <= 0)
            return

        speed = clamp(speed, 0, 255) * 255.75;  // 0~255 > 0~1023

        if (motor == YFVMotors.ML) {
            pins.digitalWritePin(valonMotorRD, direction);
            pins.analogWritePin(valonMotorLA, speed);
        } else if (motor == YFVMotors.MR) {
            pins.digitalWritePin(valonMotorRD, direction);
            pins.analogWritePin(valonMotorRA, speed);
        } else if (motor == YFVMotors.MAll) {
            pins.digitalWritePin(valonMotorRD, direction);
            pins.analogWritePin(valonMotorRA, speed);
            pins.digitalWritePin(valonMotorLD, direction);
            pins.analogWritePin(valonMotorLA, speed);
        }
    }

    /**
     * stop the motor
     */
    //% blockId=valon_stop_motor block="Motor |%motor Stop"
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
    //% blockId=valon_read_Patrol block="read %patrol line tracking sensor"
    //% patrol.fieldEditor="gridpicker" patrol.fieldOptions.columns=2 
    export function readPatrol(patrol: YFVPatrol): number {
        enablePatrol(1);
        if (patrol == YFVPatrol.PatrolLeft) {
            return pins.digitalReadPin(valonPatrolLeft)
        } else if (patrol == YFVPatrol.PatrolMiddle) {
            return pins.digitalReadPin(valonPatrolMiddle)
        } else if (patrol == YFVPatrol.PatrolRight) {
            return pins.digitalReadPin(valonPatrolRight)
        } else {
            return -1
        }
    }

    /**
      * Line tracking sensor event function
      */
    //% weight=2
    //% blockId=valon_kb_event block="on|%value line tracking sensor|%vi"
    // export function ltEvent(value: YFVPatrol1, vi: YFVVoltage, a: Action) {
    //     let state = value + vi;
    //     serial.writeNumber(state)
    //     let item: KV = { key: state, action: a };
    //     kbCallback.push(item);
    // }
    // let x: number
    // let i: number = 1;
    // function patorlState(): number {
    //     switch (i) {
    //         case 1: x = pins.digitalReadPin(DigitalPin.P1) == 0 ? 0x10 : 0; break;
    //         case 2: x = pins.digitalReadPin(DigitalPin.P1) == 1 ? 0x11 : 0; break;
    //         case 3: x = pins.digitalReadPin(DigitalPin.P2) == 0 ? 0x20 : 0; break;
    //         case 4: x = pins.digitalReadPin(DigitalPin.P2) == 1 ? 0x21 : 0; break;
    //         case 5: x = pins.digitalReadPin(DigitalPin.P8) == 0 ? 0x30 : 0; break;
    //         default: x = pins.digitalReadPin(DigitalPin.P8) == 1 ? 0x31 : 0; break;
    //     }
    //     i += 1;
    //     if (i == 5) i = 1;

    //     return x;
    // }

    // basic.forever(() => {
    //     if (kbCallback != null) {
    //         let sta = patorlState();
    //         if (sta != 0) {
    //             for (let item of kbCallback) {
    //                 if (item.key == sta) {
    //                     item.action();
    //                 }
    //             }
    //         }
    //     }
    //     basic.pause(50);
    // })

    /**
     * Show RGB eyes mounted on valon
     */
    //% blockId="valon_showColor" block="Eyes |%eyes show color|%color"
    //% weight=5
    //% eyes.fieldEditor="gridpicker" eyes.fieldOptions.columns=2
    //% color.fieldEditor="gridpicker" color.fieldOptions.columns=4
    export function valon_showColor(eyes: YFVRGBEYES, color: YFVColors): neopixel.Strip {
        if (!neoStrip) {
            neoStrip = neopixel.create(valonEyesPin, valonEyesNum, valonEyesMode)
        }
        return neoStrip;
    }

    /**
     * Set the brightness of the eyes.(0~255)
     * @param brightness a measure of LED brightness in 0-255. eg:255
     */
    //% blockId="valon_set_brightness" block="set brightness %brightness" blockGap=8
    //% weight=4
    export function setBrightness(brightness: number): void {
        brightness = brightness & 0xff;
    }

    /**
     * Converts red, green, blue channels into a RGB color
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% weight=1
    //% blockId="neopixel_rgb" block="red %red|green %green|blue %blue"
    //% advanced=true
    export function valon_convertTorgb(red: number, green: number, blue: number): number {
        return valon_packRGB(red, green, blue);
    }

    /**
     * Gets the RGB value of a known color
     */
    //% weight=2 blockGap=8
    //% blockId="neopixel_colors" block="%color"
    //% advanced=true
    export function colors(color: YFVColors): number {
        return color;
    }

    function valon_packRGB(a: number, b: number, c: number): number {
        return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF);
    }
    function valon_unpackR(rgb: number): number {
        let r = (rgb >> 16) & 0xFF;
        return r;
    }
    function valon_unpackG(rgb: number): number {
        let g = (rgb >> 8) & 0xFF;
        return g;
    }
    function valon_unpackB(rgb: number): number {
        let b = (rgb) & 0xFF;
        return b;
    }

    /**
     * Init RGB eyes mounted on valon
     */
    //% blockId="valon_rgb" block="RGB"
    //% weight=5
    export function rgb(): neopixel.Strip {
        if (!neoStrip) {
            neoStrip = neopixel.create(DigitalPin.P11, 2, NeoPixelMode.RGB)
        }
        return neoStrip;
    }

}
