import { Howl } from "howler";

const bgMusic = new Howl({
  src: ["./music/bgMusic.mp3"],
  loop: true,
  volume: 0.12,
  autoplay: false,
  preload: true,
  html5: true, // Use HTML5 Audio for better compatibility
});

export class Music {
  constructor() {
    this.music = bgMusic;
    this.isPlaying = false;
    this.toggleButton = document.getElementById("toggle");

    this.setUpEvents();
  }

  setUpEvents() {
    this.toggleButton.addEventListener("click", () => {
      this.toggle();
    });
  }

  toggle() {
    if (!this.isPlaying) {
      this.music.play();
      this.isPlaying = true;
      document.body.classList.add("on");
    } else {
      this.music.pause();
      this.isPlaying = false;
      document.body.classList.remove("on");
    }
  }
}
