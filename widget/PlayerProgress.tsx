import { createBinding, createComputed, createState } from "ags"
import { Gtk } from "ags/gtk4"
import Mpris from "gi://AstalMpris"
import GLib from "gi://GLib?version=2.0"


function formatTime(s: number) {
    const min = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${min}:${sec < 10 ? "0" : ""}${sec}`
}
export default function PlayerProgress({ player }: { player: Mpris.Player }) {
    const position = createBinding(player, "position")
    const length = createBinding(player, "length")

    // That weird YT feature.
    const [showRemaining, setShowRemaining] = createState(false)
    const [seekingPosition, setSeekingPosition] = createState<false | number>(false)
    const fraction = createComputed(() => {
        const p = seekingPosition() !== false ? (seekingPosition() as number) : position()
        const l = length()
        return l > 0 ? p / l : 0
    })

    const posText = createComputed(() => formatTime(position()))

    // Toggle between total length and remaining time
    const lenText = createComputed(() => {
        const l = length()
        const p = position()
        if (l <= 0) return "0:00"
        return showRemaining() ? `-${formatTime(l - p)}` : formatTime(l)
    })

    const [dragPos, setDragPos] = createState(0);
    let seekTimeout : GLib.Source = setTimeout(() => {}, 50); 

    return (
        <box class="progress-container" orientation={Gtk.Orientation.HORIZONTAL} spacing={12}>
            <Gtk.Label class="time-text" label={posText} />

            <Gtk.ProgressBar
                class="progress-bar"
                hexpand={true}
                valign={Gtk.Align.CENTER}
                fraction={fraction}
                $={(self) => {

                    const drag = new Gtk.GestureDrag()
                    drag.connect("drag-update", (ctrl, x, y) => {
                        const width = self.get_allocated_width()
                        const l = player.get_length()
                        if (l > 0) {
                            const targetTime = l * ((dragPos() + x) / width)
                            if(seekingPosition()) setSeekingPosition(targetTime)
                        }
                    })
                    const click = new Gtk.GestureClick()
                    click.connect("pressed", (ctrl, n, x) => {
                        if(seekTimeout) clearTimeout(seekTimeout);
                        const width = self.get_allocated_width()
                        const l = player.get_length()

                        if (l > 0) {
                            const targetTime = l * (x / width)
                            setDragPos(x);
                            if(!seekingPosition())setSeekingPosition(targetTime)
                        }
                    })
                    click.connect("released", (ctrl, n, x) => {
                        const width = self.get_allocated_width()
                        const l = player.get_length()

                        if (l > 0) {
                            const targetTime = l * (x / width)
                            // In Astal, position is directly writable
                            player.position = targetTime
                            seekTimeout = setTimeout(() => {if (seekingPosition()) setSeekingPosition(false)}, 250);
                        }
                    })
                    self.add_controller(click)
                    self.add_controller(drag)
                }}
            />

            {/* The Time Flip */}
            <button
                class="time-button flat"
                css={"background-color: transparent; cursor: pointer;"}
                widthRequest={42}
                onClicked={() => setShowRemaining(!showRemaining())}
            >
                <Gtk.Label halign={Gtk.Align.END} class="time-text" label={lenText} />
            </button>
        </box>
    )
}