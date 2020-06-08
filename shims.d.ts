// Auto-generated. Do not edit.
declare namespace valonIR {

    /**
     * button pushed.
     */
    //% blockId=ir_received_left_event
    //% block="on |%btn| button pressed" shim=valonIR::onPressEvent
    function onPressEvent(btn: RemoteButton, body: () => void): void;

    /**
     * initialises local variablesssss
     */
    //% blockId=ir_init
    //% block="connect ir receiver to %pin" shim=valonIR::initIR
    function initIR(pin: Pins): void;
}

// Auto-generated. Do not edit. Really.
