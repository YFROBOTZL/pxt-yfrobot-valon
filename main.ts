/**
 * YFRobot valon extension for Microbit
 * 
 * http://www.yfrobot.com/wiki/index.php?title=Valon-I
 * http://www.yfrobot.com
 * 
 * @author [email](yfrobot@qq.com)
 */

enum ValonLED {
    //% block="left"
    LEDLeft = 10,
    //% block="right"
    LEDRight = 9
}

enum ValonLEDswitch {
    //% block="on"
    TurnOn = 0x01,
    //% blockId="LEDturnOff" block="off"
    TurnOff = 0x00
}

//% color="#7BD239" weight=10 icon="\uf1b0" block="valon"
namespace valon {
    // LED pin 
    let valonLEDD1 = DigitalPin.P10;
    let valonLEDD2 = DigitalPin.P9;

    function clamp(value: number, min: number, max: number): number {
        return Math.max(Math.min(max, value), min);
    }

    /**
     * turn on/off LED
     */
    //% weight=100
    //% blockId=writeLED block="LED light |%ledn turn |%ledswitch"
    //% ledn.fieldEditor="gridpicker" ledn.fieldOptions.columns=2 
    //% ledswitch.fieldEditor="gridpicker" ledswitch.fieldOptions.columns=2
    export function writeLED(ledn: ValonLED, ledswitch: ValonLEDswitch): void {
        led.enable(false);
        if (ledn == ValonLED.LEDLeft) {
            pins.digitalWritePin(valonLEDD1, ledswitch)
        } else if (ledn == ValonLED.LEDRight) {
            pins.digitalWritePin(valonLEDD2, ledswitch)
        } else {
            return
        }
    }

}
