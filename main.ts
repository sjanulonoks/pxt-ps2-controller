 namespace ps2controller {

    //% block="ps2 to spi mapping: mosi$ps2-cmd_spi-mosi miso%ps2-data_spi-miso sck%ps2-clock_spi-sck cs%ps2-att_spi-ss"
    //% ps2-cmd_spi-mosi.defl=DigitalPin.P15
    //% ps2-data_spi-miso.defl=DigitalPin.P14
    //% ps2-clock_spi-sck.defl=DigitalPin.P13
    //% ps2-att_spi-ss.defl=DigitalPin.P12

    export function SPI_init(ps2-att_spi-ss:DigitalPin,ps2-cmd_spi-mosi:DigitalPin,ps2-data_spi-miso:DigitalPin,ps2-clock_spi-sck:DigitalPin) {
        //ps2controller.SPI_init(DigitalPin.P12,DigitalPin.P8, DigitalPin.P14, DigitalPin.P13)
            // http://blog.nearfuturelaboratory.com/2008/06/19/playstation2-logic-analysis/
            // https://makecode.microbit.org/reference/pins/spi-pins
            // https://forum.makecode.com/t/ps2-controller-extension/1409
            // http://www.techmonkeybusiness.com/using-a-playstation-2-controller-with-your-arduino-project.html

            chipSelect = ps2-att_spi-ss;
            pins.digitalWritePin(chipSelect, 1)
            pins.spiPins(ps2-cmd_spi-mosi, ps2-data_spi-miso, ps2-clock_spi-sck);
            pins.spiFormat(8, 3);
            pins.spiFrequency(250000);
       }

    let pad = pins.createBuffer(6)
    let connected = false

    /*
    // Unused at the moment
    const config_cmd_enter = hex
        `014300010000000000`
    const config_cmd_exit = hex
        `014300005a5a5a5a5a`
    const config_enable_analog = hex
        `014400010300000000`
    const config_enable_vibration = hex
        `014d000001ffffffff`
    */
    const poll_cmd = hex
        `014200000000000000`

    function send_command(transmit: Buffer): Buffer {
        // deal with bit-order
        transmit = reverse.rbuffer(transmit)

        let receive = pins.createBuffer(transmit.length);

        pins.digitalWritePin(chipSelect, 0);
        // send actual command
        for (let i = 0; i < transmit.length; i++) {
            receive[i] = pins.spiWrite(transmit[i]);
        }
        pins.digitalWritePin(chipSelect, 1)

        // deal with bit-order
        receive = reverse.rbuffer(receive)

        return receive
     }
  
    export enum PS2Button {
        //% block="Left"
        Left,
        //% block="Down"
        Down,
        //% block="Right"
        Right,
        //% block="Up"
        Up,
        //% block="Start"
        Start,
        //% block="Analog_Left"
        Analog_Left,
        //% block="Analog_Right"
        Analog_Right,
        //% block="Select"
        Select,
        //% block="Square"
        Square,
        //% block="Cross"
        Cross,
        //% block="Circle"
        Circle,
        //% block="Triangle"
        Triangle,
        //% block="R1"
        R1,
        //% block="L1"
        L1,
        //% block="R2"
        R2,
        //% block="L2"
        L2,
        Buttons,
        RX,
        RY,
        LX,
        LY,
     };

     //% block="button $b is pressed"
     export function button_pressed(b: PS2Button): number {
        if(!connected) return 0x00

        switch (b) {
            case PS2Button.Left:
                return pad[0] & 0x80 ? 0 : 1;
            case PS2Button.Down:
                return pad[0] & 0x40 ? 0 : 1;
            case PS2Button.Right:
                return pad[0] & 0x20 ? 0 : 1;
            case PS2Button.Up:
                return pad[0] & 0x10 ? 0 : 1;
            case PS2Button.Start:
                return pad[0] & 0x08 ? 0 : 1;
            case PS2Button.Analog_Left:
                return pad[0] & 0x04 ? 0 : 1;
            case PS2Button.Analog_Right:
                return pad[0] & 0x02 ? 0 : 1;
            case PS2Button.Select:
                return pad[0] & 0x01 ? 0 : 1;
            case PS2Button.Square:
                return pad[1] & 0x80 ? 0 : 1;
            case PS2Button.Cross:
                return pad[1] & 0x40 ? 0 : 1;
            case PS2Button.Circle:
                return pad[1] & 0x20 ? 0 : 1;
            case PS2Button.Triangle:
                return pad[1] & 0x10 ? 0 : 1;
            case PS2Button.R1:
                return pad[1] & 0x08 ? 0 : 1;
            case PS2Button.L1:
                return pad[1] & 0x04 ? 0 : 1;
            case PS2Button.R2:
                return pad[1] & 0x02 ? 0 : 1;
            case PS2Button.L2:
                return pad[1] & 0x01 ? 0 : 1;
            case PS2Button.Buttons:
                return ~((pad[1] << 8) | pad[0]) & 0xffff;
            case PS2Button.RX:
                return pad[2] - 0x80;
            case PS2Button.RY:
                return pad[3] - 0x80;
            case PS2Button.LX:
                return pad[4] - 0x80;
            case PS2Button.LY:
                return pad[5] - 0x80;
        }
        return 0;
    }

    function poll(): boolean {
        let buf = send_command(poll_cmd)
        if (buf[2] != 0x5a) {
            return false;
        }

        for (let i = 0; i < 6; i++) {
            pad[i] = buf[3 + i];
        }

        connected = true

        return true
    }


    basic.forever(function () {
        poll();
    })

 }
