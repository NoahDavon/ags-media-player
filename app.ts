import app from "ags/gtk4/app"
import style from "./style.scss"
import MediaWindow from "./widget/MediaPlayer"
import { Gtk } from "ags/gtk4"

app.start({
    css: style,
    main() {
        const media = MediaWindow() as Gtk.Window;
        app.add_window(media);
        media.present();
    },
})