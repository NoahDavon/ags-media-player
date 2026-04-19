import { Accessor, createBinding, createComputed, createState, With } from "ags"
import { Gtk, Astal, Gdk } from "ags/gtk4"
import app from "ags/gtk4/app";
import Mpris from "gi://AstalMpris"
import GObject from "gi://GObject?version=2.0";
import Pango from "gi://Pango?version=1.0"
import PlayerProgress from "./PlayerProgress";
// The Player Component
function Player({ player, cycleButton }: { player: Mpris.Player, cycleButton: GObject.Object }) {
    const title = createBinding(player, "title");
    const artist = createBinding(player, "albumArtist");
    const coverArt = createBinding(player, "cover_art");
    const artCss = createComputed(() => `
                background-image: url('file://${coverArt()}');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                border-radius: 16px;
                min-width: 500px;
                min-height: 500px;
            `)
    const playStatus = createBinding(player, "playbackStatus");
    const playIcon = createComputed(() => playStatus() === Mpris.PlaybackStatus.PLAYING
        ? "media-playback-pause-symbolic"
        : "media-playback-start-symbolic")
    console.log(artCss)
    return (
        <box
            class="player-container"
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
            orientation={Gtk.Orientation.VERTICAL}
            // CRITICAL: Stop the click from bubbling up to the shield
            $={(self) => {
                const click = new Gtk.GestureClick()
                click.connect("pressed", (ctrl) => {
                    // By connecting an empty gesture here, 
                    // we "consume" the click so it doesn't close the window
                    return false;
                })
                self.add_controller(click)
            }}
        >

            {/* 1. The Overlay Container holds the Image + Controls */}
            <Gtk.Overlay
                $={(self) => {
                    const click = new Gtk.GestureClick()

                    click.connect("pressed", (ctrl, n, x, y) => {
                        // 1. Find what exactly was clicked
                        const picked = self.pick(x, y, Gtk.PickFlags.DEFAULT)
                        if (!picked) return

                        // 2. Check if the picked widget is a Button or inside one
                        // This ensures clicking the 'icon' inside the button doesn't trigger a play/pause
                        const isControl = picked instanceof Gtk.Button ||
                            picked.get_ancestor(Gtk.Button.$gtype) ||
                            picked instanceof Gtk.ProgressBar ||
                            picked.get_ancestor(Gtk.ProgressBar.$gtype)
                        if (!isControl) {
                            console.log("Clicked cover/labels - Toggling Play/Pause")
                            player.play_pause()
                        } else {
                            console.log("Clicked a specific control - Letting button handle it")
                        }
                    })

                    self.add_controller(click)
                }}
            >
                {/* The first child is the "Base" layer (the image) */}
                <Gtk.Picture
                    class="cover"
                    css={artCss}
                    widthRequest={120}
                    heightRequest={120}
                />
                <box orientation={Gtk.Orientation.VERTICAL} class="info-container" spacing={4} valign={Gtk.Align.END} $type="overlay">
                    <Gtk.Label
                        class="title"
                        label={title}
                        halign={Gtk.Align.CENTER}
                        ellipsize={Pango.EllipsizeMode.END}
                    />
                    <Gtk.Label
                        class="artist"
                        label={artist}
                        halign={Gtk.Align.CENTER}
                        ellipsize={Pango.EllipsizeMode.END}
                    />
                    <PlayerProgress player={player} />
                    {/* 2. The Overlaid Controls */}
                    <box
                        class="controls-overlay"
                        halign={Gtk.Align.CENTER}
                        valign={Gtk.Align.END}
                        spacing={12}
                    >
                        <Gtk.Button onClicked={() => player.previous()}>
                            <image iconName="media-skip-backward-symbolic" />
                        </Gtk.Button>

                        <Gtk.Button class="play-pause" onClicked={() => { player.play_pause() }}>
                            <Gtk.Image iconName={playIcon} />
                        </Gtk.Button>

                        <Gtk.Button onClicked={() => player.next()}>
                            <image iconName="media-skip-forward-symbolic" />
                        </Gtk.Button>
                    </box>
                </box>

            </Gtk.Overlay>
            {cycleButton}
        </box>
    )
}

// The exported Popup Window
export default function MediaWindow() {
    const mpris = Mpris.get_default()
    const players = createBinding(Mpris.get_default(), "players");
    const [activeIndex, setActiveIndex] = createState(0);
    const activePlayer = createComputed(() => players()[activeIndex()])
    mpris.connect("notify::players", () => { console.log(mpris.players) });
    const CycleButton = (players().length > 1) && <button css={"border-radius-top-left: 0px; border-radius-top-right:0px;"} onClicked={() => setActiveIndex((i) => (i + 1) % players().length)}><image iconName={"object-rotate-right-symbolic"} /></button>
    return (
        <window
            name="media-popup"
            class="media-window-bg"
            margin-top={10}
            visible={false}
            anchor={Astal.WindowAnchor.TOP |
                Astal.WindowAnchor.BOTTOM |
                Astal.WindowAnchor.LEFT |
                Astal.WindowAnchor.RIGHT}
            exclusivity={Astal.Exclusivity.IGNORE}
            focusable
            keymode={Astal.Keymode.ON_DEMAND}
            $={(self) => {
                const focusCtrl = new Gtk.EventControllerFocus()

                focusCtrl.connect("leave", () => {
                    self.visible = false;
                })
                const keyCtrl = new Gtk.EventControllerKey()
                const gesture = new Gtk.GestureClick()

                keyCtrl.connect("key-pressed", (_ctrl, keyval) => {
                    console.log("key pressed")
                    // Gdk.KEY_Escape is the standard way to check
                    self.visible = false;
                    return true // Return true to consume the event (stop propagation)
                })

                self.add_controller(keyCtrl)

                self.add_controller(focusCtrl)
            }}

        >
            <box
                class="click-shield"
                hexpand={true}
                vexpand={true}
                halign={Gtk.Align.FILL}
                // Handle the click on the "empty" space
                $={(self) => {
                    const click = new Gtk.GestureClick()
                    click.connect("pressed", (_ctrl, _n, x, y) => {
                        // 1. Find the exact widget under the cursor at (x, y)
                        // Gtk.PickFlags.DEFAULT ensures it looks for visible, non-passthrough widgets
                        const picked = self.pick(x, y, Gtk.PickFlags.DEFAULT)

                        // 2. Logic check
                        // If 'picked' is the shield itself, the user clicked the empty space.
                        if (picked === self) {
                            console.log("Empty space clicked - Hiding")
                            self.get_parent()!.visible = false
                        } else {
                            // If they clicked the player, 'picked' will be the Player box or its children
                            console.log("UI Element clicked - Staying open")
                        }
                    })
                    self.add_controller(click)
                }}
            >

                <box cssName="media-window-bg" halign={Gtk.Align.CENTER} hexpand
                    valign={Gtk.Align.START} css={"max-height: 33%; max-width: 50%"} orientation={Gtk.Orientation.VERTICAL}>
                    <With value={activePlayer}>
                        {(activePlayer) => activePlayer
                            ? <Player player={activePlayer} cycleButton={CycleButton || <box />} />
                            : <label cssName="empty-state" label={"No players active"} />}
                    </With>
                </box>
            </box>
        </window>
    )
}
