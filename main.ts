/**
 * YFRobot valon extension for Microbit
 * 
 * http://www.yfrobot.com/wiki/index.php?title=Valon-I
 * http://www.yfrobot.com
 * 
 * @author [email](yfrobot@qq.com)
 */

enum ValonPingUnit {
    //% block="cm"
    Centimeters,
}

/**
  * Pre-Defined LED colours
  */
enum ValonColors {
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

/**
 * Different modes for RGB or RGB+W NeoPixel strips
 */
enum ValonEyesMode {
    //% block="RGB (GRB format)"
    RGB = 1,
    //% block="RGB+W"
    RGBW = 2,
    //% block="RGB (RGB format)"
    RGB_RGB = 3
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
    let neoStrip: valon.Strip;
    let distanceBuf = 0;


    let kbCallback: KV[] = []

    // Motor
    export enum ValonMotors {
        //% blockId="valon_left_motor" block="left"
        ML = 0,
        //% blockId="valon_right_motor" block="right"
        MR = 1,
        //% blockId="valon_all_motor" block="all"
        MAll = 2
    }

    // motor dir
    export enum ValonDir {
        //% blockId="valon_CW" block="Forward"
        CW = 0,
        //% blockId="valon_CCW" block="Backward"
        CCW = 1
    }

    export enum ValonLED {
        //% blockId="LEDLeft" block="left"
        LEDLeft = 10,
        //% blockId="LEDRight" block="right"
        LEDRight = 9
    }

    export enum ValonLEDswitch {
        //% blockId="LEDturnOn" block="ON"
        turnOn = 0x01,
        //% blockId="LEDturnOff" block="OFF"
        turnOff = 0x00
    }

    export enum ValonRGBEYES {
        //% blockId="valon_EyesLeft" block="left"
        EyesLeft = 1,
        //% blockId="valon_EyesRight" block="right"
        EyesRight = 0,
        //% blockId="valon_EyesALL" block="all"
        MAll = 2
    }

    // Patrol
    export enum ValonPatrol {
        //% blockId="valon_patrolLeft" block="left"
        PatrolLeft = 1,
        //% blockId="valon_patrolMiddle" block="middle"
        PatrolMiddle = 2,
        //% blockId="valon_patrolRight" block="right"
        PatrolRight = 8
    }

    export enum ValonPatrol1 {
        //% blockId="valon_patrolLeft" block="left"
        PatrolLeft = 0x10,
        //% blockId="valon_patrolMiddle" block="middle"
        PatrolMiddle = 0x20,
        //% blockId="valon_patrolRight" block="right"
        PatrolRight = 0x30
    }
    export enum ValonVoltage {
        //% block="high"
        High = 0x01,
        //% block="low"
        Low = 0x00
    }

    export enum ValonTurns {
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

    export enum ValonServos {
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
    export function writeLED(ledn: ValonLED, ledswitch: ValonLEDswitch): void {
        led.enable(false);
        if (ledn == ValonLED.LEDLeft) {
            pins.digitalWritePin(DigitalPin.P10, ledswitch)
        } else if (ledn == ValonLED.LEDRight) {
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
    export function Ultrasonic(unit: ValonPingUnit, maxCmDistance = 500): number {
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
        //     case ValonPingUnit.Centimeters: return Math.idiv(d, 58);
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
    export function motorRun(motor: ValonMotors, direction: ValonDir, speed: number): void {
        if (motor > 2 || motor <= 0)
            return

        speed = clamp(speed, 0, 255) * 255.75;  // 0~255 > 0~1023

        if (motor == ValonMotors.ML) {
            pins.digitalWritePin(valonMotorRD, direction);
            pins.analogWritePin(valonMotorLA, speed);
        } else if (motor == ValonMotors.MR) {
            pins.digitalWritePin(valonMotorRD, direction);
            pins.analogWritePin(valonMotorRA, speed);
        } else if (motor == ValonMotors.MAll) {
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
    export function motorStop(motor: ValonMotors): void {
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
    //% weight=70
    //% blockId=valon_read_Patrol block="read %patrol line tracking sensor"
    //% patrol.fieldEditor="gridpicker" patrol.fieldOptions.columns=2 
    export function readPatrol(patrol: ValonPatrol): number {
        enablePatrol(1);
        if (patrol == ValonPatrol.PatrolLeft) {
            return pins.digitalReadPin(valonPatrolLeft)
        } else if (patrol == ValonPatrol.PatrolMiddle) {
            return pins.digitalReadPin(valonPatrolMiddle)
        } else if (patrol == ValonPatrol.PatrolRight) {
            return pins.digitalReadPin(valonPatrolRight)
        } else {
            return -1
        }
    }

    /**
      * Line tracking sensor event function
      */
    //% weight=65
    //% blockId=valon_kb_event block="on|%value line tracking sensor|%vi"
    // export function ltEvent(value: ValonPatrol1, vi: ValonVoltage, a: Action) {
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
     * A NeoPixel strip
     */
    export class Strip {
        buf: Buffer;
        pin: DigitalPin;
        // TODO: encode as bytes instead of 32bit
        brightness: number;
        start: number; // start offset in LED strip
        _length: number; // number of LEDs
        _mode: ValonEyesMode;
        _matrixWidth: number; // number of leds in a matrix - if any

        /**
         * Shows all LEDs to a given color (range 0-255 for r, g, b).
         * @param rgb RGB color of the LED
         */
        //% blockId="neopixel_set_strip_color" block="%strip|show color %rgb=neopixel_colors"
        //% strip.defl=strip
        //% weight=56
        showColor(rgb: number) {
            rgb = rgb >> 0;
            this.setAllRGB(rgb);
            this.show();
        }

        /**
         * Set LED to a given color (range 0-255 for r, g, b).
         * @param eyes_n position of the NeoPixel in the strip
         * @param rgb RGB color of the LED
         */
        //% blockId="neopixel_set_pixel_color" block="%eyes|show color at %eyes_n|to %rgb=neopixel_colors"
        //% strip.defl=eyes
        //% weight=58
        setEyesColor(eyes_n: ValonRGBEYES, rgb: number): void {
            this.setPixelRGB(eyes_n , rgb >> 0);
            this.show();
        }
        /**
         * Set LED to a given color (range 0-255 for r, g, b).
         * You need to call ``show`` to make the changes visible.
         * @param pixeloffset position of the NeoPixel in the strip
         * @param rgb RGB color of the LED
         */
        //% blockId="neopixel_set_pixel_color" block="%strip|set pixel color at %pixeloffset|to %rgb=neopixel_colors"
        //% strip.defl=strip
        //% weight=57
        //% advanced=true
        setPixelColor(pixeloffset: number, rgb: number): void {
            this.setPixelRGB(pixeloffset >> 0, rgb >> 0);
        }

        /**
         * Send all the changes to the strip.
         */
        //% blockId="neopixel_show" block="%strip|show" //% strip.defl=strip
        //% weight=43

        show() {
            // only supported in beta
            // ws2812b.setBufferMode(this.pin, this._mode);
            ws2812b.sendBuffer(this.buf, this.pin);
        }

        /**
         * Turn off all LEDs.
         * You need to call ``show`` to make the changes visible.
         */
        //% blockId="neopixel_clear" block="%strip|clear"
        //% strip.defl=strip
        //% weight=42

        clear(): void {
            const stride = this._mode === ValonEyesMode.RGBW ? 4 : 3;
            this.buf.fill(0, this.start * stride, this._length * stride);
        }

        // /**
        //  * Gets the number of pixels declared on the strip
        //  */
        // //% blockId="neopixel_length" block="%strip|length" //% strip.defl=strip
        // //% weight=41 
        // //% advanced=true
        // length() {
        //     return this._length;
        // }

        /**
         * Set the brightness of the strip. This flag only applies to future operation.
         * @param brightness a measure of LED brightness in 0-255. eg: 255
         */
        //% blockId="neopixel_set_brightness" block="%strip|set brightness %brightness" 
        //% strip.defl=strip
        //% weight=45
        setBrightness(brightness: number): void {
            this.brightness = brightness & 0xff;
        }

        /**
         * Set the pin where the neopixel is connected, defaults to P11.
         */
        setPin(pin: DigitalPin): void {
            this.pin = pin;
            pins.digitalWritePin(this.pin, 11);
            // don't yield to avoid races on initialization
        }

        private setBufferRGB(offset: number, red: number, green: number, blue: number): void {
            if (this._mode === ValonEyesMode.RGB_RGB) {
                this.buf[offset + 0] = red;
                this.buf[offset + 1] = green;
            } else {
                this.buf[offset + 0] = green;
                this.buf[offset + 1] = red;
            }
            this.buf[offset + 2] = blue;
        }

        private setAllRGB(rgb: number) {
            let red = valon_unpackR(rgb);
            let green = valon_unpackG(rgb);
            let blue = valon_unpackB(rgb);

            const br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            const end = this.start + this._length;
            const stride = this._mode === ValonEyesMode.RGBW ? 4 : 3;
            for (let i = this.start; i < end; ++i) {
                this.setBufferRGB(i * stride, red, green, blue)
            }
        }
        private setPixelRGB(pixeloffset: number, rgb: number): void {
            if (pixeloffset < 0
                || pixeloffset >= this._length)
                return;

            let stride = this._mode === ValonEyesMode.RGBW ? 4 : 3;
            pixeloffset = (pixeloffset + this.start) * stride;

            let red = valon_unpackR(rgb);
            let green = valon_unpackG(rgb);
            let blue = valon_unpackB(rgb);

            let br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            this.setBufferRGB(pixeloffset, red, green, blue)
        }
    }
    /**
     * Create a new NeoPixel driver for eye's LEDs.
     * @param numleds number of leds in the eyes, eg: 2
     */
    //% blockId="neopixel_create" block="NeoPixel init %numleds|leds as %mode"
    //% weight=60  //% trackArgs=0,2
    //% blockSetVariable=eyes
    export function create(numleds: number, mode: ValonEyesMode): Strip {
        let eyes = new Strip();
        let stride = mode === ValonEyesMode.RGBW ? 4 : 3;
        eyes.buf = pins.createBuffer(numleds * stride);
        eyes.start = 0;
        eyes._length = numleds;
        eyes._mode = mode || ValonEyesMode.RGB;
        eyes._matrixWidth = 0;
        eyes.setBrightness(128)
        eyes.setPin(valonEyesPin)
        return eyes;
    }

    /**
     * Converts red, green, blue channels into a RGB color
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% weight=28
    //% blockId="neopixel_rgb" block="red %red|green %green|blue %blue"
    //% advanced=true
    export function rgb(red: number, green: number, blue: number): number {
        return valon_packRGB(red, green, blue);
    }

    /**
     * Gets the RGB value of a known color
     */
    //% weight=25 blockGap=8
    //% blockId="neopixel_colors" block="%color"
    //% advanced=true
    export function colors(color: ValonColors): number {
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
     * Converts a hue saturation luminosity value into a RGB color
     * @param h hue from 0 to 360
     * @param s saturation from 0 to 99
     * @param l luminosity from 0 to 99
     */
    //% blockId=neopixelHSL block="hue %h|saturation %s|luminosity %l"
    export function hsl(h: number, s: number, l: number): number {
        h = Math.round(h);
        s = Math.round(s);
        l = Math.round(l);

        h = h % 360;
        s = Math.clamp(0, 99, s);
        l = Math.clamp(0, 99, l);
        let c = Math.idiv((((100 - Math.abs(2 * l - 100)) * s) << 8), 10000); //chroma, [0,255]
        let h1 = Math.idiv(h, 60);//[0,6]
        let h2 = Math.idiv((h - h1 * 60) * 256, 60);//[0,255]
        let temp = Math.abs((((h1 % 2) << 8) + h2) - 256);
        let x = (c * (256 - (temp))) >> 8;//[0,255], second largest component of this color
        let r$: number;
        let g$: number;
        let b$: number;
        if (h1 == 0) {
            r$ = c; g$ = x; b$ = 0;
        } else if (h1 == 1) {
            r$ = x; g$ = c; b$ = 0;
        } else if (h1 == 2) {
            r$ = 0; g$ = c; b$ = x;
        } else if (h1 == 3) {
            r$ = 0; g$ = x; b$ = c;
        } else if (h1 == 4) {
            r$ = x; g$ = 0; b$ = c;
        } else if (h1 == 5) {
            r$ = c; g$ = 0; b$ = x;
        }
        let m = Math.idiv((Math.idiv((l * 2 << 8), 100) - c), 2);
        let r = r$ + m;
        let g = g$ + m;
        let b = b$ + m;
        return valon_packRGB(r, g, b);
    }

    export enum HueInterpolationDirection {
        Clockwise,
        CounterClockwise,
        Shortest
    }

}
