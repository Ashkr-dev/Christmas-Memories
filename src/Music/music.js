import { Howl } from "howler";

const bgMusic = new Howl({
  src: ["./music/christmas_bgMusic.mp3"],
  loop: true,
  volume: 0.15,
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

// //============
// // Music Toggle
// //============
// const bgMusic = new Howl({
//   src: ["./music/christmas_bgMusic.mp3"],
//   loop: true,
//   volume: 0.2,
//   autoplay: false,
//   preload: true,
//   html5: true, // Use HTML5 Audio for better compatibility
// });

// const toggleButton = document.getElementById("toggle");
// let toggleState = false;
// toggleButton.addEventListener("click", () => {
//   toggleState = !toggleState;
//   if (toggleState) {
//     document.body.classList.add("on");
//     bgMusic.play();
//   } else {
//     document.body.classList.remove("on");
//     bgMusic.pause();
//   }
// });
